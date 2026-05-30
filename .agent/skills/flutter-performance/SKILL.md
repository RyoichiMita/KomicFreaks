---
name: flutter-performance
description: Flutter performance optimization patterns. DevTools profiling, widget rebuild prevention, image optimization, frame timing, and 60fps guarantee strategies.
allowed-tools: Read, Glob, Grep, Bash
---

# Flutter Performance Optimization

> **Philosophy:** 60fps is NOT negotiable. Smooth is premium. Jank is unacceptable.
> **Core Principle:** Measure first, optimize second. Profile-driven optimization only.

---

## 🔧 Runtime Scripts

**Execute these for validation (don't read, just run):**

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/flutter_profiler.py` | Performance analysis | `python scripts/flutter_profiler.py <project_path>` |
| `scripts/rebuild_analyzer.py` | Widget rebuild detection | `python scripts/rebuild_analyzer.py <project_path>` |

---

## 🔴 MANDATORY: Read Reference Files Before Working!

**⛔ DO NOT optimize until you read the relevant files:**

### Universal (Always Read)

| File | Content | Status |
|------|---------|--------|
| **[performance-fundamentals.md](performance-fundamentals.md)** | **⚠️ 60fps target, frame timing, janky scroll detection** | **⬜ CRITICAL FIRST** |
| **[widget-rebuilds.md](widget-rebuilds.md)** | **const constructors, keys, shouldRebuild patterns** | **⬜ CRITICAL** |
| **[devtools-profiling.md](devtools-profiling.md)** | **Timeline view, CPU profiler, memory inspection** | **⬜ CRITICAL** |
| **[image-optimization.md](image-optimization.md)** | **Caching, preloading, format selection, memory** | **⬜ CRITICAL** |
| [state-optimization.md](state-optimization.md) | Provider vs Riverpod vs BLoC performance | ⬜ Read |
| [list-performance.md](list-performance.md) | ListView.builder, itemExtent, repaintBoundary | ⬜ Read |
| [animation-performance.md](animation-performance.md) | GPU-accelerated transforms, avoid layout shifts | ⬜ Read |

> 🧠 **performance-fundamentals.md is PRIORITY!** This teaches measurement-driven optimization.

---

## ⚠️ CRITICAL: PERFORMANCE TARGETS

### Frame Budget

| Target | Time Budget | User Perception |
|--------|-------------|-----------------|
| **60fps** | 16.67ms/frame | Smooth (MINIMUM) |
| **120fps** | 8.33ms/frame | Premium (ProMotion devices) |
| **Jank** | >16.67ms | Stuttering, unprofessional |

> 🔴 **Rule:** If a frame takes >16.67ms, users notice. Multiple janky frames = poor app.

### Performance Budgets

| Operation | Target | Maximum |
|-----------|--------|---------|
| **Widget build** | <1ms | <5ms |
| **Image decode** | Async (background) | Never on main thread |
| **List scroll** | 60fps sustained | No dropped frames |
| **Navigation transition** | 60fps | 300-350ms duration |
| **App startup (cold)** | <2s to first frame | <3s acceptable |

---

## 🚫 FLUTTER PERFORMANCE ANTI-PATTERNS (MANDATORY AVOID)

> **These are critical mistakes that destroy performance!**

### Widget Rebuild Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Skip const constructors** | Widget rebuilds unnecessarily | `const` EVERYWHERE possible |
| **setState() at root** | Entire tree rebuilds | Targeted setState, lift state down |
| **Inline function in build** | New function every frame | Extract to method OR const |
| **Skip Keys in lists** | Flutter rebuilds from scratch | Unique, stable Keys |
| **Rebuild entire screen** | Wasteful, causes jank | ValueListenableBuilder, Consumer |

### List/Scroll Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Column with many children** | Renders ALL items in memory | ListView.builder (lazy loading) |
| **Skip itemExtent** | Flutter measures height async | Provide if items same height |
| **No RepaintBoundary** | Entire list repaints | Wrap complex items |
| **Heavy computation in itemBuilder** | Freezes scroll | Precompute, cache results |

### Image/Asset Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Load full-res images** | OOM crash, slow decode | Resize server-side OR cached_network_image |
| **Skip precacheImage** | First display lags | Precache critical images |
| **Sync image loading** | Main thread blocked | Async decoding ALWAYS |
| **No memory cache** | Re-decode every rebuild | Use cacheWidth/cacheHeight |

### Animation Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Animate size/layout** | Forces expensive layout pass | Animate transform/opacity ONLY |
| **Skip RepaintBoundary** | Repaints cascade to parent | Isolate animated widgets |
| **Heavy build in AnimatedBuilder** | Rebuilds every frame (60 times/sec) | Keep builder minimal |

---

## 🧠 const Constructor Mastery

### Why const Matters

```dart
// ❌ WRONG: Widget rebuilds every frame
class MyScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('Static title'), // ← Rebuilds unnecessarily
        _buildDynamicContent(),
      ],
    );
  }
}

// ✅ CORRECT: Static widgets never rebuild
class MyScreen extends StatelessWidget {
  const MyScreen({super.key}); // ← const constructor

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Text('Static title'), // ← Flutter SKIPS this widget
        _buildDynamicContent(),
      ],
    );
  }
}
```

### const Everywhere Possible

```dart
// ✅ BEST PRACTICE: Aggressive const usage
class ProfileCard extends StatelessWidget {
  const ProfileCard({
    super.key,
    required this.name,
    required this.avatar,
  });

  final String name;
  final String avatar;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          // Static decoration = const
          const SizedBox(height: 16),
          const Icon(Icons.person, size: 24),
          
          // Dynamic content = NOT const
          Text(name),
          
          // Static padding = const
          const Padding(
            padding: EdgeInsets.all(8.0),
            child: Divider(), // ← const all the way down
          ),
        ],
      ),
    );
  }
}
```

---

## 📊 DevTools Profiling Workflow

### Step-by-Step Performance Investigation

```
1. REPRODUCE the jank
   ├── Run in Profile mode: `flutter run --profile`
   └── Trigger slow operation (e.g., scroll, navigation)

2. OPEN DevTools
   ├── Command: `flutter devtools`
   └── Navigate to Performance tab

3. RECORD timeline
   ├── Press Record
   ├── Reproduce jank
   └── Press Stop

4. ANALYZE frames
   ├── Look for RED bars (>16.67ms)
   ├── Identify BUILD vs PAINT vs LAYOUT
   └── Find expensive widgets

5. OPTIMIZE targeted
   ├── Add const where possible
   ├── Use RepaintBoundary for expensive widgets
   ├── Cache computed values
   └── Verify fix in DevTools
```

### Reading the Timeline

```
Frame Analysis:
┌─────────────────────────────────────┐
│ BUILD   ████████ 8ms   ← Widget tree construction
│ LAYOUT  ███ 3ms        ← Size/position calculation
│ PAINT   ██████ 6ms     ← Drawing commands
├─────────────────────────────────────┤
│ TOTAL: 17ms ❌         ← Jank! Over budget
└─────────────────────────────────────┘

Optimize in order:
1. BUILD (biggest impact usually)
2. PAINT (isolate with RepaintBoundary)
3. LAYOUT (avoid animating size)
```

---

## 🖼️ Image Optimization Strategies

### Network Images

```dart
// ❌ WRONG: Full-res image, no caching
Image.network('https://example.com/huge-image.jpg')

// ✅ CORRECT: Cached, resized, optimized
CachedNetworkImage(
  imageUrl: 'https://example.com/huge-image.jpg',
  memCacheWidth: 400, // Decode at 400px width (saves memory)
  placeholder: (context, url) => const CircularProgressIndicator(),
  errorWidget: (context, url, error) => const Icon(Icons.error),
)

// ✅ BETTER: Server-side resize (ideal)
CachedNetworkImage(
  imageUrl: 'https://example.com/image.jpg?w=400&h=300', // Server resizes
  memCacheWidth: 400,
  placeholderFadeInDuration: Duration(milliseconds: 300),
)
```

### Precaching Critical Images

```dart
// ✅ CORRECT: Precache splash/logo before showing screen
class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  bool _imagesLoaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _precacheImages();
  }

  Future<void> _precacheImages() async {
    await Future.wait([
      precacheImage(AssetImage('assets/logo.png'), context),
      precacheImage(AssetImage('assets/background.jpg'), context),
    ]);
    setState(() => _imagesLoaded = true);
  }

  @override
  Widget build(BuildContext context) {
    if (!_imagesLoaded) {
      return const CircularProgressIndicator();
    }
    return MainScreen();
  }
}
```

---

## 📜 ListView Performance

### Basic Optimization

```dart
// ❌ WRONG: Column renders ALL items
Column(
  children: items.map((item) => ItemCard(item)).toList(),
)

// ✅ CORRECT: ListView.builder lazy loads
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) {
    return ItemCard(items[index]);
  },
)

// ✅ BETTER: itemExtent for same-height items
ListView.builder(
  itemCount: items.length,
  itemExtent: 80.0, // Flutter skips height measurement
  itemBuilder: (context, index) {
    return ItemCard(items[index]);
  },
)
```

### Advanced Optimization

```dart
// ✅ BEST: All optimizations combined
class OptimizedList extends StatelessWidget {
  const OptimizedList({super.key, required this.items});

  final List<Item> items;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: items.length,
      itemExtent: 80.0, // Fixed height = fast scroll
      cacheExtent: 200.0, // Preload 200px off-screen
      itemBuilder: (context, index) {
        final item = items[index];
        return RepaintBoundary( // Isolates painting
          child: ItemCard(
            key: ValueKey(item.id), // Stable key
            item: item,
          ),
        );
      },
    );
  }
}

class ItemCard extends StatelessWidget {
  const ItemCard({super.key, required this.item});

  final Item item;

  @override
  Widget build(BuildContext context) {
    // Complex item with const optimizations
    return Card(
      child: Row(
        children: [
          const SizedBox(width: 16), // const
          Text(item.title), // Dynamic
          const Spacer(), // const
          Text(item.subtitle), // Dynamic
        ],
      ),
    );
  }
}
```

---

## 🎨 Animation Performance

### GPU-Accelerated Properties

```dart
// ✅ FAST: GPU-accelerated (animates on compositor thread)
AnimatedContainer(
  duration: Duration(milliseconds: 300),
  transform: Matrix4.translationValues(100, 0, 0), // ← GPU
  opacity: 0.5, // ← GPU
)

// ❌ SLOW: CPU-bound (requires layout pass every frame)
AnimatedContainer(
  duration: Duration(milliseconds: 300),
  width: 200, // ← CPU layout
  height: 100, // ← CPU layout
  margin: EdgeInsets.all(20), // ← CPU layout
)
```

### RepaintBoundary for Animations

```dart
// ✅ CORRECT: Isolate animated widget
class AnimatedCard extends StatelessWidget {
  const AnimatedCard({super.key});

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: 1),
        duration: Duration(seconds: 2),
        builder: (context, value, child) {
          return Opacity(
            opacity: value,
            child: child,
          );
        },
        child: const ExpensiveWidget(), // Won't repaint parent
      ),
    );
  }
}
```

---

## 🧪 Performance Testing Checklist

### Before Release

- [ ] **Profile mode tested** (`flutter run --profile`)
- [ ] **No red frames in DevTools** (sustained 60fps)
- [ ] **Scroll performance verified** (long lists, fast fling)
- [ ] **Memory leaks checked** (DevTools Memory tab)
- [ ] **Image memory monitored** (<100MB typical, <200MB max)
- [ ] **Startup time measured** (<2s cold start)
- [ ] **const constructors added** (check with performance overlay)
- [ ] **Heavy computations moved off main thread** (compute/isolates)

### DevTools Overlay

```dart
// Enable in debug builds
MaterialApp(
  showPerformanceOverlay: true, // Shows GPU/CPU graphs
  debugShowCheckedModeBanner: false,
)
```

---

## 📝 CHECKPOINT (MANDATORY Before Performance Work)

> **Before optimizing, you MUST complete this checkpoint:**

```
🧠 PERFORMANCE CHECKPOINT:

Current Issue: [ Janky scroll / Slow navigation / High memory ]
Measured FPS:  [ ____ fps (target: 60fps) ]
Profiled in:   [ Profile mode / DevTools Timeline ]

3 Performance Principles I Will Apply:
1. _______________
2. _______________
3. _______________

Anti-Patterns I Will Avoid:
1. _______________
2. _______________
```

**Example:**
```
🧠 PERFORMANCE CHECKPOINT:

Current Issue: Lesson list scroll drops to 45fps
Measured FPS:  45fps (target: 60fps)
Profiled in:   DevTools Timeline shows heavy BUILD phase

3 Performance Principles I Will Apply:
1. Add const constructors to LessonCard static elements
2. Use ListView.builder with itemExtent (cards are 120px tall)
3. Add RepaintBoundary around lesson card images

Anti-Patterns I Will Avoid:
1. Column for lists → ListView.builder
2. Skip const → Aggressive const usage
3. Guess optimization → Profile-driven only
```

---

## 🔧 Quick Performance Wins

### 1. Add const Everywhere

```bash
# Find widgets that could be const
grep -r "Widget build" lib/ | grep -v "const"
```

### 2. Use ListView.builder for Any List

```dart
// If you see Column + map, convert to ListView.builder
Column(children: items.map(...).toList()) → ListView.builder
```

### 3. Precache Route Images

```dart
// Before navigation
await precacheImage(AssetImage('assets/bg.jpg'), context);
Navigator.push(...);
```

### 4. Isolate Heavy Computation

```dart
// Move off main thread
final result = await compute(_expensiveFunction, data);
```

---

## 📚 Reference Files

For deeper guidance on specific areas:

| File | When to Use |
|------|-------------|
| [performance-fundamentals.md](performance-fundamentals.md) | **FIRST! Frame budget, measurement, targets** |
| [widget-rebuilds.md](widget-rebuilds.md) | Understanding const, keys, rebuild triggers |
| [devtools-profiling.md](devtools-profiling.md) | Step-by-step profiling, reading timelines |
| [image-optimization.md](image-optimization.md) | Caching, preloading, memory management |
| [list-performance.md](list-performance.md) | ListView optimizations, infinite scroll |
| [animation-performance.md](animation-performance.md) | GPU acceleration, RepaintBoundary |
| [state-optimization.md](state-optimization.md) | Provider vs Riverpod performance |

---

> **Remember:** Premature optimization is the root of all evil. BUT in mobile, 60fps is NOT optional. Measure first, optimize second, verify third. DevTools is your best friend.
