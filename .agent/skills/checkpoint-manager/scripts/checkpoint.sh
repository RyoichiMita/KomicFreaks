#!/usr/bin/env bash
# Checkpoint Manager — Shadow Git Repo Operations
# Inspired by Hermes Agent's CheckpointManager
#
# Usage:
#   checkpoint.sh create  <workdir> <reason>
#   checkpoint.sh list    <workdir>
#   checkpoint.sh diff    <workdir> <commit_hash>
#   checkpoint.sh restore <workdir> <commit_hash> [file_path]
#   checkpoint.sh prune   [retention_days]

set -euo pipefail

# Configuration
CHECKPOINT_BASE="${HOME}/.agent/checkpoints"
MAX_FILES=50000

# Default excludes for shadow repos
DEFAULT_EXCLUDES=(
    "node_modules/"
    "dist/"
    "build/"
    ".env"
    ".env.*"
    ".env.local"
    "__pycache__/"
    "*.pyc"
    "*.pyo"
    ".DS_Store"
    "*.log"
    ".cache/"
    ".next/"
    ".nuxt/"
    ".venv/"
    "venv/"
    ".git/"
    ".dart_tool/"
    ".flutter-plugins"
    ".packages"
    "ios/Pods/"
    "android/.gradle/"
    "coverage/"
    ".pytest_cache/"
)

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

_shadow_path() {
    local abs_dir
    abs_dir="$(cd "$1" && pwd -P)"
    local dir_hash
    dir_hash="$(echo -n "$abs_dir" | shasum -a 256 | cut -c1-16)"
    echo "${CHECKPOINT_BASE}/${dir_hash}"
}

_git_cmd() {
    local shadow_repo="$1"
    local work_tree="$2"
    shift 2

    GIT_DIR="$shadow_repo" \
    GIT_WORK_TREE="$work_tree" \
    GIT_CONFIG_GLOBAL=/dev/null \
    GIT_CONFIG_SYSTEM=/dev/null \
    GIT_CONFIG_NOSYSTEM=1 \
    git "$@" 2>/dev/null
}

_init_shadow() {
    local shadow_repo="$1"
    local work_tree="$2"

    if [[ -f "${shadow_repo}/HEAD" ]]; then
        return 0
    fi

    mkdir -p "$shadow_repo"
    _git_cmd "$shadow_repo" "$work_tree" init --quiet

    _git_cmd "$shadow_repo" "$work_tree" config user.email "checkpoint@local"
    _git_cmd "$shadow_repo" "$work_tree" config user.name "Checkpoint Manager"
    _git_cmd "$shadow_repo" "$work_tree" config commit.gpgsign false
    _git_cmd "$shadow_repo" "$work_tree" config tag.gpgSign false

    # Write excludes
    local info_dir="${shadow_repo}/info"
    mkdir -p "$info_dir"
    printf '%s\n' "${DEFAULT_EXCLUDES[@]}" > "${info_dir}/exclude"

    # Store original workdir path
    echo "$work_tree" > "${shadow_repo}/WORKDIR_PATH"
}

_validate_commit_hash() {
    local hash="$1"
    if [[ -z "$hash" ]]; then
        echo "ERROR: Empty commit hash" >&2
        return 1
    fi
    if [[ "$hash" == -* ]]; then
        echo "ERROR: Invalid commit hash (must not start with '-'): $hash" >&2
        return 1
    fi
    if ! [[ "$hash" =~ ^[0-9a-fA-F]{4,64}$ ]]; then
        echo "ERROR: Invalid commit hash (expected hex): $hash" >&2
        return 1
    fi
    return 0
}

_file_count() {
    local dir="$1"
    find "$dir" -type f 2>/dev/null | head -n "$((MAX_FILES + 1))" | wc -l | tr -d ' '
}

# ─────────────────────────────────────────────
# Commands
# ─────────────────────────────────────────────

cmd_create() {
    local work_dir="$1"
    local reason="${2:-auto}"

    # Normalize path
    work_dir="$(cd "$work_dir" && pwd -P)"

    # Safety: skip broad directories
    if [[ "$work_dir" == "/" ]] || [[ "$work_dir" == "$HOME" ]]; then
        echo "SKIP: Directory too broad ($work_dir)" >&2
        return 0
    fi

    # Safety: skip huge directories
    local count
    count="$(_file_count "$work_dir")"
    if (( count > MAX_FILES )); then
        echo "SKIP: Too many files ($count > $MAX_FILES)" >&2
        return 0
    fi

    local shadow
    shadow="$(_shadow_path "$work_dir")"
    _init_shadow "$shadow" "$work_dir"

    # Stage everything
    _git_cmd "$shadow" "$work_dir" add -A || {
        echo "ERROR: git add failed" >&2
        return 1
    }

    # Check if there's anything to commit
    if _git_cmd "$shadow" "$work_dir" diff --cached --quiet 2>/dev/null; then
        echo "SKIP: No changes to checkpoint"
        return 0
    fi

    # Commit
    _git_cmd "$shadow" "$work_dir" commit -m "$reason" --allow-empty-message --no-gpg-sign --quiet || {
        echo "ERROR: git commit failed" >&2
        return 1
    }

    local short_hash
    short_hash="$(_git_cmd "$shadow" "$work_dir" rev-parse --short HEAD)"
    echo "📸 Checkpoint created: $short_hash — $reason"
}

cmd_list() {
    local work_dir="$1"
    work_dir="$(cd "$work_dir" && pwd -P)"

    local shadow
    shadow="$(_shadow_path "$work_dir")"

    if [[ ! -f "${shadow}/HEAD" ]]; then
        echo "No checkpoints found for $work_dir"
        return 0
    fi

    echo "📸 Checkpoints for $work_dir:"
    echo ""

    local i=1
    while IFS='|' read -r hash short_hash timestamp reason; do
        # Get diffstat
        local stat=""
        local stat_output
        stat_output="$(_git_cmd "$shadow" "$work_dir" diff --shortstat "${hash}~1" "$hash" 2>/dev/null)" || true
        if [[ -n "$stat_output" ]]; then
            stat="  ($stat_output)"
        fi

        # Format timestamp
        local formatted_time
        formatted_time="$(echo "$timestamp" | cut -c1-16 | tr 'T' ' ')"

        echo "  $i. $short_hash  $formatted_time  $reason${stat}"
        i=$((i + 1))
    done < <(_git_cmd "$shadow" "$work_dir" log --format='%H|%h|%aI|%s' -n 50)

    echo ""
    echo "  Commands:"
    echo "  /rollback <N>           restore to checkpoint N"
    echo "  /rollback diff <N>      preview changes since checkpoint N"
    echo "  /rollback <N> <file>    restore a single file from checkpoint N"
}

cmd_diff() {
    local work_dir="$1"
    local commit_hash="$2"
    work_dir="$(cd "$work_dir" && pwd -P)"

    _validate_commit_hash "$commit_hash" || return 1

    local shadow
    shadow="$(_shadow_path "$work_dir")"

    if [[ ! -f "${shadow}/HEAD" ]]; then
        echo "ERROR: No checkpoints exist for $work_dir" >&2
        return 1
    fi

    # Verify commit exists
    _git_cmd "$shadow" "$work_dir" cat-file -t "$commit_hash" >/dev/null || {
        echo "ERROR: Checkpoint '$commit_hash' not found" >&2
        return 1
    }

    # Stage current state
    _git_cmd "$shadow" "$work_dir" add -A

    # Show diff
    echo "📊 Changes since checkpoint $commit_hash:"
    echo ""
    _git_cmd "$shadow" "$work_dir" diff --stat "$commit_hash" --cached
    echo ""
    _git_cmd "$shadow" "$work_dir" diff "$commit_hash" --cached --no-color

    # Unstage
    _git_cmd "$shadow" "$work_dir" reset HEAD --quiet 2>/dev/null || true
}

cmd_restore() {
    local work_dir="$1"
    local commit_hash="$2"
    local file_path="${3:-}"
    work_dir="$(cd "$work_dir" && pwd -P)"

    _validate_commit_hash "$commit_hash" || return 1

    # Validate file path if provided
    if [[ -n "$file_path" ]]; then
        if [[ "$file_path" == /* ]]; then
            echo "ERROR: File path must be relative" >&2
            return 1
        fi
        local resolved
        resolved="$(cd "$work_dir" && realpath -m "$file_path")"
        case "$resolved" in
            "$work_dir"/*) ;; # OK — within workdir
            *)
                echo "ERROR: File path escapes working directory" >&2
                return 1
                ;;
        esac
    fi

    local shadow
    shadow="$(_shadow_path "$work_dir")"

    if [[ ! -f "${shadow}/HEAD" ]]; then
        echo "ERROR: No checkpoints exist for $work_dir" >&2
        return 1
    fi

    # Verify commit exists
    _git_cmd "$shadow" "$work_dir" cat-file -t "$commit_hash" >/dev/null || {
        echo "ERROR: Checkpoint '$commit_hash' not found" >&2
        return 1
    }

    # Pre-rollback safety: snapshot current state
    cmd_create "$work_dir" "pre-rollback snapshot (restoring to ${commit_hash:0:8})"

    # Restore
    local restore_target="${file_path:-.}"
    _git_cmd "$shadow" "$work_dir" checkout "$commit_hash" -- "$restore_target" || {
        echo "ERROR: Restore failed" >&2
        return 1
    }

    local reason
    reason="$(_git_cmd "$shadow" "$work_dir" log --format='%s' -1 "$commit_hash")" || reason="unknown"

    echo "✅ Restored to checkpoint ${commit_hash:0:8}"
    echo "   Reason: $reason"
    echo "   Directory: $work_dir"
    if [[ -n "$file_path" ]]; then
        echo "   File: $file_path"
    fi
    echo ""
    echo "   💡 A pre-rollback snapshot was created. Use /rollback to undo this restore."
}

cmd_prune() {
    local retention_days="${1:-7}"
    local cutoff_ts
    cutoff_ts="$(date -v-${retention_days}d +%s 2>/dev/null || date -d "${retention_days} days ago" +%s)"

    local scanned=0 deleted=0

    if [[ ! -d "$CHECKPOINT_BASE" ]]; then
        echo "No checkpoint directory found"
        return 0
    fi

    for shadow_dir in "$CHECKPOINT_BASE"/*/; do
        [[ -d "$shadow_dir" ]] || continue
        [[ -f "${shadow_dir}HEAD" ]] || continue
        scanned=$((scanned + 1))

        # Check if workdir still exists
        if [[ -f "${shadow_dir}WORKDIR_PATH" ]]; then
            local workdir
            workdir="$(cat "${shadow_dir}WORKDIR_PATH")"
            if [[ ! -d "$workdir" ]]; then
                rm -rf "$shadow_dir"
                deleted=$((deleted + 1))
                continue
            fi
        fi

        # Check staleness
        local newest_mtime
        newest_mtime="$(find "$shadow_dir" -type f -exec stat -f '%m' {} + 2>/dev/null | sort -rn | head -1)" || continue
        if [[ -n "$newest_mtime" ]] && (( newest_mtime < cutoff_ts )); then
            rm -rf "$shadow_dir"
            deleted=$((deleted + 1))
        fi
    done

    echo "🧹 Pruned $deleted/$scanned checkpoint repos (retention: ${retention_days} days)"
}

# ─────────────────────────────────────────────
# Main dispatcher
# ─────────────────────────────────────────────

main() {
    local action="${1:-help}"
    shift || true

    case "$action" in
        create)  cmd_create "$@" ;;
        list)    cmd_list "$@" ;;
        diff)    cmd_diff "$@" ;;
        restore) cmd_restore "$@" ;;
        prune)   cmd_prune "$@" ;;
        *)
            echo "Usage: checkpoint.sh <create|list|diff|restore|prune> [args...]"
            echo ""
            echo "Commands:"
            echo "  create  <workdir> <reason>                  Create a checkpoint"
            echo "  list    <workdir>                            List checkpoints"
            echo "  diff    <workdir> <commit_hash>             Show diff from checkpoint"
            echo "  restore <workdir> <commit_hash> [file]      Restore to checkpoint"
            echo "  prune   [retention_days]                     Clean stale checkpoints"
            ;;
    esac
}

main "$@"
