---
name: checkpoint-manager
description: Transparent filesystem rollback system using shadow git repos. Auto-snapshots before file mutations. Use /rollback to undo changes. Zero leakage into project git history.
allowed-tools: Read, Write, Edit, Terminal
version: 1.0
priority: HIGH
---

# Checkpoint Manager — Filesystem Rollback System

> **Inspired by Hermes Agent's CheckpointManager** — shadow git repos for transparent undo.

---

## 🧠 Core Concept

Before ANY file-mutating operation (write, edit, delete), the agent should create a **checkpoint** — a transparent snapshot of the working directory using a shadow git repo. This gives every session an **undo button** with zero user overhead.

---

## 🏗️ Architecture

```
~/.agent/checkpoints/{sha256(abs_dir)[:16]}/    ← shadow git repo
    HEAD, refs/, objects/                        ← standard git internals
    WORKDIR_PATH                                ← original directory path
    info/exclude                                ← default excludes
```

**Key design:** Uses `GIT_DIR` + `GIT_WORK_TREE` environment variables so **no git state leaks** into the user's project directory.

---

## 📸 When to Checkpoint

| Trigger | Action |
|---------|--------|
| Before writing a new file | `checkpoint create` |
| Before editing an existing file | `checkpoint create` |
| Before deleting a file | `checkpoint create` |
| Before bulk operations (migration, refactor) | `checkpoint create` |
| Before rollback (undo the undo) | `checkpoint create` (automatic) |

### Deduplication Rule

**Maximum one checkpoint per directory per conversation turn.** If a checkpoint was already taken for this directory in the current turn, skip silently.

---

## 🔧 Commands

### Create Checkpoint (Automatic)

The agent should run this before file mutations. Uses the script at `.agent/skills/checkpoint-manager/scripts/checkpoint.sh`:

```bash
# Auto-checkpoint before file write
.agent/skills/checkpoint-manager/scripts/checkpoint.sh create "/path/to/project" "pre-edit: updating router.dart"
```

### List Checkpoints

```bash
.agent/skills/checkpoint-manager/scripts/checkpoint.sh list "/path/to/project"
```

Output:
```
📸 Checkpoints for /path/to/project:
  1. a3f2c1d  2026-05-03 14:30  pre-edit: updating router.dart  (3 files, +45/-12)
  2. b7e4a2f  2026-05-03 14:15  pre-edit: adding new screen      (1 file, +120/-0)
  3. c9d1b3e  2026-05-03 13:50  pre-refactor: job model          (5 files, +89/-67)
```

### Diff Against Checkpoint

```bash
.agent/skills/checkpoint-manager/scripts/checkpoint.sh diff "/path/to/project" <commit_hash>
```

### Rollback to Checkpoint

```bash
.agent/skills/checkpoint-manager/scripts/checkpoint.sh restore "/path/to/project" <commit_hash> [optional_file_path]
```

### User-Facing Commands

| Command | What it does |
|---------|-------------|
| `/rollback` | List available checkpoints |
| `/rollback <N>` | Restore to checkpoint N |
| `/rollback diff <N>` | Preview changes since checkpoint N |
| `/rollback <N> <file>` | Restore a single file from checkpoint N |

---

## 🛡️ Safety Rules

| Rule | Implementation |
|------|----------------|
| **Never modify user's `.git/`** | Shadow repo is completely separate |
| **Pre-rollback snapshot** | Always checkpoint before restoring (undo the undo) |
| **Validate commit hashes** | Reject anything starting with `-` or non-hex chars |
| **Path containment** | Reject absolute paths and `../` traversal in restore targets |
| **Skip broad directories** | Never checkpoint `/`, `$HOME`, or paths with >50,000 files |
| **Git isolation** | `GIT_CONFIG_GLOBAL=/dev/null` prevents user's git config from interfering |

---

## 📁 Default Excludes

The shadow repo ignores these patterns (stored in `info/exclude`):

```
node_modules/
dist/
build/
.env
.env.*
__pycache__/
*.pyc
.DS_Store
*.log
.cache/
.next/
.venv/
venv/
.git/
.dart_tool/
.flutter-plugins
.packages
ios/Pods/
android/.gradle/
```

---

## ⚙️ Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `max_snapshots` | 50 | Max checkpoints per directory |
| `checkpoint_base` | `~/.agent/checkpoints/` | Where shadow repos live |
| `git_timeout` | 30s | Max time for git operations |
| `max_files` | 50,000 | Skip directories larger than this |

---

## 🔄 Auto-Pruning

Shadow repos accumulate over time. Auto-pruning runs periodically:

| Criterion | Action |
|-----------|--------|
| **Orphan:** `WORKDIR_PATH` no longer exists on disk | Delete shadow repo |
| **Stale:** No activity in 7+ days | Delete shadow repo |
| **Max interval:** Run at most once per 24 hours | Prevent excessive scanning |
