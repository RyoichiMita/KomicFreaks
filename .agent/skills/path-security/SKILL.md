---
name: path-security
description: Path validation to prevent directory traversal, symlink attacks, and file access outside allowed boundaries.
version: 1.0
priority: CRITICAL
---

# Path Security

> Ported from Hermes Agent — validates all user-supplied file paths.

## Validation Rules

### 1. Containment Check
```python
def validate_within_dir(path, root):
    resolved = path.resolve()
    resolved.relative_to(root.resolve())  # raises ValueError if outside
```

### 2. Traversal Detection
```python
def has_traversal(path_str):
    return ".." in Path(path_str).parts
```

### 3. Shell Path Validation
```bash
if [[ "$file_path" == /* ]]; then echo "ERROR: must be relative"; fi
resolved="$(realpath -m "$file_path")"
case "$resolved" in "$work_dir"/*) ;; *) echo "ERROR: escapes workdir" ;; esac
```

## When to Validate

| Operation | Required |
|-----------|----------|
| File write/edit | Containment + traversal |
| File read | Containment |
| File delete | Containment + traversal + confirm |
| Checkpoint restore | Relative paths only |
| Skill creation | Within `.agent/skills/` |
