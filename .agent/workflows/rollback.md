---
trigger: /rollback
description: Filesystem rollback using checkpoint manager. List, diff, and restore checkpoints.
---

# /rollback — Checkpoint Rollback

> Restore files to a previous state using shadow git checkpoints.

---

## Usage

```
/rollback                    → List available checkpoints
/rollback <N>                → Restore to checkpoint N
/rollback diff <N>           → Preview changes since checkpoint N
/rollback <N> <file>         → Restore a single file from checkpoint N
```

---

## Workflow

### Step 1: Determine Action

Parse the user's command to determine the action:

| Input | Action |
|-------|--------|
| `/rollback` (no args) | List checkpoints |
| `/rollback 3` | Restore to checkpoint #3 |
| `/rollback diff 3` | Show diff from checkpoint #3 |
| `/rollback 3 lib/router.dart` | Restore single file from checkpoint #3 |

### Step 2: Detect Working Directory

Determine the project root from the user's current context:
1. Check the user's active file → walk up to find project root (`.git/`, `pubspec.yaml`, `package.json`)
2. Default to the workspace root

### Step 3: Execute

```bash
# List
bash .agent/skills/checkpoint-manager/scripts/checkpoint.sh list "<workdir>"

# Diff (get commit hash from list output first)
bash .agent/skills/checkpoint-manager/scripts/checkpoint.sh diff "<workdir>" "<commit_hash>"

# Restore
bash .agent/skills/checkpoint-manager/scripts/checkpoint.sh restore "<workdir>" "<commit_hash>" ["<file>"]
```

### Step 4: Report

After restore, confirm what was changed:
```markdown
✅ **Rolled back to checkpoint #{N}**
- Restored: {reason}
- Files affected: {count}
- A pre-rollback snapshot was saved automatically
```

---

## Rules

1. **Always list before restoring** — never guess checkpoint numbers
2. **Confirm destructive actions** — ask before full-directory restores
3. **Single-file restores are safe** — proceed without confirmation
4. **Pre-rollback snapshots are automatic** — the script handles this
