---
name: offline-first-architecture
description: Offline-first patterns for mobile apps. Local database strategies (Hive, Isar, Drift), sync with Supabase/Firebase, conflict resolution, and connectivity monitoring for resilient mobile experiences.
allowed-tools: Read, Glob, Grep, Bash
---

# Offline-First Architecture

> **Philosophy:** Network is unreliable. Battery dies. Train tunnels exist. Offline is NORMAL, not edge case.
> **Core Principle:** Local-first, sync later. User should never see "No internet connection" as blocker.

---

## 🔴 MANDATORY: Read Reference Files Before Working!

**⛔ DO NOT build offline features until you read the relevant files:**

### Universal (Always Read)

| File | Content | Status |
|------|---------|--------|
| **[offline-principles.md](offline-principles.md)** | **⚠️ Local-first mindset, sync strategies** | **⬜ CRITICAL FIRST** |
| **[local-database-selection.md](local-database-selection.md)** | **Hive vs Isar vs Drift comparison** | **⬜ CRITICAL** |
| **[sync-patterns.md](sync-patterns.md)** | **Conflict resolution, last-write-wins, CRDT** | **⬜ CRITICAL** |
| **[connectivity-monitoring.md](connectivity-monitoring.md)** | **Network status, retry logic, queue management** | **⬜ CRITICAL** |
| [hive-patterns.md](hive-patterns.md) | Hive setup, adapters, best practices | ⬜ Read |
| [isar-patterns.md](isar-patterns.md) | Isar queries, indexes, performance | ⬜ Read |
| [supabase-sync.md](supabase-sync.md) | Realtime subscriptions, offline queue | ⬜ Read |

> 🧠 **offline-principles.md is PRIORITY!** This shifts mindset from "online with offline fallback" to "offline-first."

---

## ⚠️ CRITICAL: OFFLINE-FIRST PHILOSOPHY

### Mental Model Shift

```
❌ WRONG: Online-first thinking
User opens app
  ├── Check internet ❌
  │   ├── Online → Fetch from API ✓
  │   └── Offline → Show error "No connection" ❌
  └── User blocked

✅ CORRECT: Offline-first thinking
User opens app
  ├── Load from local DB immediately ✓ (instant!)
  ├── Display cached data
  │
  ├── (Background) Sync with server if online
  │   ├── Success → Update local DB, refresh UI
  │   └── Failure → Queue for later, user unaffected
  └── User never blocked
```

### Benefits

| Aspect | Offline-First Advantage |
|--------|------------------------|
| **Speed** | Instant load (no network latency) |
| **Reliability** | Works in airplane, subway, poor signal |
| **Battery** | Fewer network calls = longer battery |
| **UX** | No "No internet" blockers, feels native |
| **Cost** | Reduced API calls, bandwidth |

---

## 🚫 OFFLINE ANTI-PATTERNS (MANDATORY AVOID)

### Architecture Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Block UI on network call** | User waits, app feels slow | Show cached, sync background |
| **No local cache** | Offline = broken app | Cache EVERYTHING user needs |
| **Naive last-write-wins** | Data loss in conflicts | Timestamp + conflict UI |
| **Forget pending writes** | User edits lost on app close | Persistent write queue |
| **Sync on every action** | Battery drain, slow | Batch sync, debounce |

### Data Integrity Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Trust client time** | User changes clock, conflicts | Server timestamp is truth |
| **Delete immediately** | Can't sync deletion | Soft delete, mark as deleted |
| **No idempotency** | Duplicate writes on retry | Unique request IDs |
| **No version tracking** | Can't detect conflicts | Version field in schema |

### UX Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Silent sync failures** | User thinks data saved | Show "Pending sync" badge |
| **No retry mechanism** | Edits lost forever | Auto-retry with backoff |
| **Confusing conflict resolution** | User doesn't understand | Clear "Your version, Server version" |

---

## 🗄️ Local Database Selection

### Quick Decision Matrix

| Database | Best For | Pros | Cons |
|----------|----------|------|------|
| **Hive** | Simple key-value, settings | Easy, fast, lightweight | No complex queries |
| **Isar** | Complex queries, large datasets | Fast queries, indexes, relationships | Larger binary |
| **Drift (SQLite)** | SQL familiarity, migrations | Full SQL, mature | More boilerplate |
| **SharedPreferences** | Simple settings ONLY | Built-in | Bad for structured data |

### Recommendation for An-Nakhlah Hub

```dart
// ✅ RECOMMENDED: Hybrid approach
// - Isar for lessons, transcripts, progress (complex queries)
// - Hive for user preferences, cache metadata
// - Supabase for server sync

Why Isar for your app:
1. Fast full-text search on transcripts
2. Relationships (lessons → sub-lessons → transcripts)
3. Efficient queries (get lessons by year, filter by status)
4. Index on taught_at for dashboard "Continue Learning"
```

---

## 🧩 Sync Architecture Pattern

### Repository Pattern with Offline Support

```dart
// ✅ CORRECT: Repository abstracts local + remote
abstract class ILessonRepository {
  // Read: Always local-first
  Future<List<Lesson>> getLessons();
  Future<Lesson?> getLessonById(String id);
  
  // Write: Local immediately, sync later
  Future<void> createLesson(Lesson lesson);
  Future<void> updateLesson(Lesson lesson);
  Future<void> deleteLesson(String id); // Soft delete
  
  // Sync management
  Future<void> syncPendingChanges();
  Stream<SyncStatus> get syncStatusStream;
}

class OfflineLessonRepository implements ILessonRepository {
  final IsarDatabase _local; // Local storage
  final SupabaseClient _remote; // Remote API
  final ConnectivityMonitor _connectivity;
  final SyncQueue _syncQueue;

  @override
  Future<List<Lesson>> getLessons() async {
    // 1. Return local data immediately (FAST!)
    final localLessons = await _local.lessons.findAll();
    
    // 2. Trigger background sync if online (user unaffected)
    _triggerBackgroundSync();
    
    return localLessons;
  }

  @override
  Future<void> createLesson(Lesson lesson) async {
    // 1. Save to local DB immediately (user sees instant result)
    await _local.writeTxn(() async {
      await _local.lessons.put(lesson);
    });
    
    // 2. Queue for server sync
    await _syncQueue.enqueue(SyncAction.create(lesson));
    
    // 3. Try sync now if online (best effort)
    if (await _connectivity.isOnline) {
      _syncQueue.processNext();
    }
  }

  Future<void> _triggerBackgroundSync() async {
    if (!await _connectivity.isOnline) return;
    
    try {
      final serverLessons = await _remote.from('lessons').select();
      
      // Merge logic: server timestamp wins
      await _local.writeTxn(() async {
        for (final serverLesson in serverLessons) {
          final localLesson = await _local.lessons.get(serverLesson['id']);
          
          if (localLesson == null) {
            // New from server → insert
            await _local.lessons.put(Lesson.fromJson(serverLesson));
          } else if (serverLesson['updated_at'] > localLesson.updatedAt) {
            // Server newer → update
            await _local.lessons.put(Lesson.fromJson(serverLesson));
          }
          // Else: local newer or same → keep local
        }
      });
    } catch (e) {
      // Sync failed, retry later (user unaffected)
      debugPrint('Background sync failed: $e');
    }
  }
}
```

---

## 🔄 Sync Queue Implementation

### Persistent Queue for Write Operations

```dart
// ✅ CORRECT: Survives app restarts
@collection
class SyncQueueItem {
  Id id = Isar.autoIncrement;
  
  @enumerated
  late SyncActionType type; // create, update, delete
  
  late String entityType; // 'lesson', 'transcript', etc.
  late String entityId;
  
  late String jsonData; // Serialized entity
  
  late DateTime createdAt;
  late int retryCount;
  
  @enumerated
  late SyncStatus status; // pending, syncing, failed, success
}

enum SyncActionType { create, update, delete }
enum SyncStatus { pending, syncing, failed, success }

class SyncQueue {
  final IsarDatabase _db;
  final SupabaseClient _supabase;
  final ConnectivityMonitor _connectivity;
  
  // Process queue with exponential backoff
  Future<void> processNext() async {
    if (!await _connectivity.isOnline) return;
    
    final pending = await _db.syncQueueItems
        .filter()
        .statusEqualTo(SyncStatus.pending)
        .sortByCreatedAt()
        .findFirst();
    
    if (pending == null) return; // Queue empty
    
    try {
      // Mark as syncing
      await _db.writeTxn(() async {
        pending.status = SyncStatus.syncing;
        await _db.syncQueueItems.put(pending);
      });
      
      // Execute sync based on type
      switch (pending.type) {
        case SyncActionType.create:
          await _supabase.from(pending.entityType).insert(
            jsonDecode(pending.jsonData),
          );
          break;
        case SyncActionType.update:
          await _supabase.from(pending.entityType).update(
            jsonDecode(pending.jsonData),
          ).eq('id', pending.entityId);
          break;
        case SyncActionType.delete:
          await _supabase.from(pending.entityType).delete()
              .eq('id', pending.entityId);
          break;
      }
      
      // Success → Remove from queue
      await _db.writeTxn(() async {
        await _db.syncQueueItems.delete(pending.id);
      });
      
      // Process next item
      processNext();
      
    } catch (e) {
      // Failed → Mark for retry
      await _db.writeTxn(() async {
        pending.status = SyncStatus.failed;
        pending.retryCount++;
        await _db.syncQueueItems.put(pending);
      });
      
      // Exponential backoff
      final delaySeconds = min(pow(2, pending.retryCount).toInt(), 300);
      Future.delayed(Duration(seconds: delaySeconds), processNext);
    }
  }
  
  // Enqueue new action
  Future<void> enqueue(SyncQueueItem item) async {
    await _db.writeTxn(() async {
      await _db.syncQueueItems.put(item);
    });
  }
}
```

---

## 🌐 Connectivity Monitoring

### Network Status Awareness

```dart
// ✅ CORRECT: Monitor connectivity changes
class ConnectivityMonitor {
  final Connectivity _connectivity = Connectivity();
  final _statusController = StreamController<ConnectivityStatus>.broadcast();
  
  Stream<ConnectivityStatus> get statusStream => _statusController.stream;
  
  ConnectivityMonitor() {
    _connectivity.onConnectivityChanged.listen((result) {
      _statusController.add(_mapResult(result));
    });
  }
  
  Future<bool> get isOnline async {
    final result = await _connectivity.checkConnectivity();
    return result != ConnectivityResult.none;
  }
  
  ConnectivityStatus _mapResult(ConnectivityResult result) {
    switch (result) {
      case ConnectivityResult.wifi:
        return ConnectivityStatus.wifi;
      case ConnectivityResult.mobile:
        return ConnectivityStatus.mobile;
      case ConnectivityResult.none:
      default:
        return ConnectivityStatus.offline;
    }
  }
  
  void dispose() {
    _statusController.close();
  }
}

enum ConnectivityStatus { wifi, mobile, offline }
```

### UI Connectivity Indicator

```dart
// ✅ CORRECT: Show sync status to user
class SyncStatusBadge extends StatelessWidget {
  const SyncStatusBadge({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<SyncStatus>(
      stream: context.read<SyncQueue>().syncStatusStream,
      builder: (context, snapshot) {
        if (!snapshot.hasData) return SizedBox();
        
        final status = snapshot.data!;
        
        return Container(
          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: _getColor(status),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(_getIcon(status), size: 16, color: Colors.white),
              SizedBox(width: 4),
              Text(
                _getText(status),
                style: TextStyle(color: Colors.white, fontSize: 12),
              ),
            ],
          ),
        );
      },
    );
  }
  
  Color _getColor(SyncStatus status) {
    switch (status) {
      case SyncStatus.synced:
        return Colors.green;
      case SyncStatus.syncing:
        return Colors.orange;
      case SyncStatus.offline:
        return Colors.grey;
      case SyncStatus.error:
        return Colors.red;
    }
  }
  
  IconData _getIcon(SyncStatus status) {
    switch (status) {
      case SyncStatus.synced:
        return Icons.cloud_done;
      case SyncStatus.syncing:
        return Icons.cloud_upload;
      case SyncStatus.offline:
        return Icons.cloud_off;
      case SyncStatus.error:
        return Icons.error;
    }
  }
  
  String _getText(SyncStatus status) {
    switch (status) {
      case SyncStatus.synced:
        return 'Synced';
      case SyncStatus.syncing:
        return 'Syncing...';
      case SyncStatus.offline:
        return 'Offline';
      case SyncStatus.error:
        return 'Sync failed';
    }
  }
}
```

---

## ⚔️ Conflict Resolution Strategies

### Strategy Selection

| Strategy | Use Case | Pros | Cons |
|----------|----------|------|------|
| **Last-Write-Wins** | User settings, non-critical | Simple | Data loss possible |
| **Server-Wins** | Content delivery, read-mostly | Safe, simple | User edits lost |
| **Client-Wins** | User-generated content | Preserves user work | Server changes lost |
| **Manual Resolution** | Critical data | User decides | Requires UI |
| **CRDT** | Collaborative editing | Automatic merge | Complex |

### Last-Write-Wins Implementation

```dart
// ✅ CORRECT: Timestamp-based conflict resolution
class ConflictResolver {
  Future<Lesson> resolveLesson(Lesson local, Lesson remote) async {
    // Compare server timestamps (trust server time)
    if (remote.updatedAt.isAfter(local.updatedAt)) {
      // Server is newer → use remote
      return remote;
    } else if (local.updatedAt.isAfter(remote.updatedAt)) {
      // Local is newer → keep local, push to server
      await _pushToServer(local);
      return local;
    } else {
      // Same timestamp → no conflict
      return local;
    }
  }
  
  Future<void> _pushToServer(Lesson lesson) async {
    await supabase.from('lessons').upsert(lesson.toJson());
  }
}
```

---

## 📝 CHECKPOINT (MANDATORY Before Offline Work)

```
🧠 OFFLINE CHECKPOINT:

Data Type:        [ User-generated / Cached content / Settings ]
Sync Strategy:    [ Last-write-wins / Manual / CRDT ]
Local Database:   [ Hive / Isar / Drift ]

3 Offline Principles I Will Apply:
1. _______________
2. _______________
3. _______________

Anti-Patterns I Will Avoid:
1. _______________
2. _______________
```

**Example:**
```
🧠 OFFLINE CHECKPOINT:

Data Type:        User-generated (lessons, notes, progress)
Sync Strategy:    Last-write-wins with server timestamp
Local Database:   Isar (complex queries, relationships)

3 Offline Principles I Will Apply:
1. Load from local DB immediately, sync background
2. Persist write queue (survives app close)
3. Show sync status badge (user awareness)

Anti-Patterns I Will Avoid:
1. Block UI on network → Show cached immediately
2. Delete without soft delete → Mark deleted, sync later
3. Silent sync failures → Show "Pending sync" indicator
```

---

## 📚 Reference Files

| File | When to Use |
|------|-------------|
| [offline-principles.md](offline-principles.md) | **FIRST! Mindset shift, local-first thinking** |
| [local-database-selection.md](local-database-selection.md) | Choosing Hive vs Isar vs Drift |
| [sync-patterns.md](sync-patterns.md) | Conflict resolution, merge strategies |
| [connectivity-monitoring.md](connectivity-monitoring.md) | Network status, retry logic |
| [hive-patterns.md](hive-patterns.md) | Hive setup, adapters, TypeAdapter |
| [isar-patterns.md](isar-patterns.md) | Isar queries, indexes, performance |
| [supabase-sync.md](supabase-sync.md) | Realtime sync, Supabase patterns |

---

> **Remember:** Mobile users are ALWAYS offline eventually (tunnel, airplane, battery saver). Offline-first is NOT an edge case—it's the only way to build resilient mobile apps. Network is an enhancement, not a requirement.
