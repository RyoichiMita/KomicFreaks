#!/usr/bin/env python3
"""
Skills Guard — Security scanner for agent-created and imported skills.

Ported from Hermes Agent's skills_guard.py for the Antigravity Kit.
Uses regex-based static analysis to detect known-bad patterns:
- Data exfiltration (env vars, credentials)
- Prompt injection (role hijack, instruction override)
- Destructive commands (rm -rf, system overwrites)
- Persistence mechanisms (cron, shell RC mods)
- Network threats (reverse shells, tunnels)
- Obfuscation (eval, exec, base64 decode pipes)
- Supply chain risks (curl|bash, unpinned deps)

Usage:
    python .agent/skills/skills-guard/scripts/skills_guard.py <skill_path>
    python .agent/skills/skills-guard/scripts/skills_guard.py .agent/skills/  # scan all skills
"""

import re
import sys
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Tuple, Optional


# ── Data structures ──────────────────────────────────

@dataclass
class Finding:
    pattern_id: str
    severity: str       # critical | high | medium | low
    category: str
    file: str
    line: int
    match: str
    description: str


@dataclass
class ScanResult:
    skill_name: str
    source: str
    verdict: str        # safe | caution | dangerous
    findings: List[Finding] = field(default_factory=list)
    scanned_at: str = ""
    summary: str = ""


# ── Threat Patterns ──────────────────────────────────

THREAT_PATTERNS = [
    # Exfiltration: shell commands leaking secrets
    (r'curl\s+[^\n]*\$\{?\w*(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|API)',
     "env_exfil_curl", "critical", "exfiltration",
     "curl command interpolating secret environment variable"),
    (r'wget\s+[^\n]*\$\{?\w*(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|API)',
     "env_exfil_wget", "critical", "exfiltration",
     "wget command interpolating secret environment variable"),
    (r'cat\s+[^\n]*(\.env|credentials|\.netrc|\.pgpass|\.npmrc|\.pypirc)',
     "read_secrets_file", "critical", "exfiltration",
     "reads known secrets file"),
    (r'printenv|env\s*\|',
     "dump_all_env", "high", "exfiltration",
     "dumps all environment variables"),
    (r'os\.environ\b',
     "python_os_environ", "high", "exfiltration",
     "accesses os.environ (potential env dump)"),
    (r'\$HOME/\.ssh|~/\.ssh',
     "ssh_dir_access", "high", "exfiltration",
     "references user SSH directory"),
    (r'\$HOME/\.aws|~/\.aws',
     "aws_dir_access", "high", "exfiltration",
     "references user AWS credentials directory"),

    # Prompt injection
    (r'ignore\s+(?:\w+\s+)*(previous|all|above|prior)\s+instructions',
     "prompt_injection_ignore", "critical", "injection",
     "prompt injection: ignore previous instructions"),
    (r'you\s+are\s+(?:\w+\s+)*now\s+',
     "role_hijack", "high", "injection",
     "attempts to override the agent's role"),
    (r'do\s+not\s+(?:\w+\s+)*tell\s+(?:\w+\s+)*the\s+user',
     "deception_hide", "critical", "injection",
     "instructs agent to hide information from user"),
    (r'system\s+prompt\s+override',
     "sys_prompt_override", "critical", "injection",
     "attempts to override the system prompt"),
    (r'disregard\s+(?:\w+\s+)*(your|all|any)\s+(?:\w+\s+)*(instructions|rules|guidelines)',
     "disregard_rules", "critical", "injection",
     "instructs agent to disregard its rules"),
    (r'\bDAN\s+mode\b|Do\s+Anything\s+Now',
     "jailbreak_dan", "critical", "injection",
     "DAN (Do Anything Now) jailbreak attempt"),
    (r'<!--[^>]*(?:ignore|override|system|secret|hidden)[^>]*-->',
     "html_comment_injection", "high", "injection",
     "hidden instructions in HTML comments"),

    # Destructive operations
    (r'rm\s+-rf\s+/',
     "destructive_root_rm", "critical", "destructive",
     "recursive delete from root"),
    (r'rm\s+(-[^\s]*)?r.*\$HOME|\brmdir\s+.*\$HOME',
     "destructive_home_rm", "critical", "destructive",
     "recursive delete targeting home directory"),
    (r'chmod\s+777',
     "insecure_perms", "medium", "destructive",
     "sets world-writable permissions"),
    (r'>\s*/etc/',
     "system_overwrite", "critical", "destructive",
     "overwrites system configuration file"),
    (r'\bmkfs\b',
     "format_filesystem", "critical", "destructive",
     "formats a filesystem"),

    # Persistence
    (r'\bcrontab\b',
     "persistence_cron", "medium", "persistence",
     "modifies cron jobs"),
    (r'\.(bashrc|zshrc|profile|bash_profile)\b',
     "shell_rc_mod", "medium", "persistence",
     "references shell startup file"),
    (r'authorized_keys',
     "ssh_backdoor", "critical", "persistence",
     "modifies SSH authorized keys"),
    (r'launchctl\s+load|LaunchAgents|LaunchDaemons',
     "macos_launchd", "medium", "persistence",
     "macOS launch agent/daemon persistence"),
    (r'/etc/sudoers|visudo',
     "sudoers_mod", "critical", "persistence",
     "modifies sudoers (privilege escalation)"),
    (r'AGENTS\.md|CLAUDE\.md|\.cursorrules|\.clinerules',
     "agent_config_mod", "critical", "persistence",
     "references agent config files (could persist malicious instructions)"),

    # Network threats
    (r'\bnc\s+-[lp]|ncat\s+-[lp]|\bsocat\b',
     "reverse_shell", "critical", "network",
     "potential reverse shell listener"),
    (r'\bngrok\b|\blocaltunnel\b|\bserveo\b|\bcloudflared\b',
     "tunnel_service", "high", "network",
     "uses tunneling service for external access"),
    (r'/bin/(ba)?sh\s+-i\s+.*>/dev/tcp/',
     "bash_reverse_shell", "critical", "network",
     "bash interactive reverse shell via /dev/tcp"),
    (r'webhook\.site|requestbin\.com|pipedream\.net',
     "exfil_service", "high", "network",
     "references known data exfiltration service"),

    # Obfuscation
    (r'base64\s+(-d|--decode)\s*\|',
     "base64_decode_pipe", "high", "obfuscation",
     "base64 decodes and pipes to execution"),
    (r'\beval\s*\(\s*["\']',
     "eval_string", "high", "obfuscation",
     "eval() with string argument"),
    (r'\bexec\s*\(\s*["\']',
     "exec_string", "high", "obfuscation",
     "exec() with string argument"),
    (r'echo\s+[^\n]*\|\s*(bash|sh|python|perl|ruby|node)',
     "echo_pipe_exec", "critical", "obfuscation",
     "echo piped to interpreter for execution"),

    # Supply chain
    (r'curl\s+[^\n]*\|\s*(ba)?sh',
     "curl_pipe_shell", "critical", "supply_chain",
     "curl piped to shell (download-and-execute)"),
    (r'wget\s+[^\n]*-O\s*-\s*\|\s*(ba)?sh',
     "wget_pipe_shell", "critical", "supply_chain",
     "wget piped to shell (download-and-execute)"),
    (r'pip\s+install\s+(?!-r\s)(?!.*==)',
     "unpinned_pip_install", "medium", "supply_chain",
     "pip install without version pinning"),
    (r'npm\s+install\s+(?!.*@\d)',
     "unpinned_npm_install", "medium", "supply_chain",
     "npm install without version pinning"),

    # Path traversal
    (r'\.\./\.\./\.\.',
     "path_traversal_deep", "high", "traversal",
     "deep relative path traversal (3+ levels up)"),
    (r'/etc/passwd|/etc/shadow',
     "system_passwd_access", "critical", "traversal",
     "references system password files"),

    # Hardcoded secrets
    (r'(?:api[_-]?key|token|secret|password)\s*[=:]\s*["\'][A-Za-z0-9+/=_-]{20,}',
     "hardcoded_secret", "critical", "credential_exposure",
     "possible hardcoded API key, token, or secret"),
    (r'-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----',
     "embedded_private_key", "critical", "credential_exposure",
     "embedded private key"),
    (r'ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{80,}',
     "github_token_leaked", "critical", "credential_exposure",
     "GitHub personal access token in skill content"),
    (r'sk-[A-Za-z0-9]{20,}',
     "openai_key_leaked", "critical", "credential_exposure",
     "possible OpenAI API key in skill content"),
    (r'AKIA[0-9A-Z]{16}',
     "aws_access_key_leaked", "critical", "credential_exposure",
     "AWS access key ID in skill content"),

    # Privilege escalation
    (r'\bsudo\b',
     "sudo_usage", "high", "privilege_escalation",
     "uses sudo (privilege escalation)"),
    (r'chmod\s+[u+]?s',
     "suid_bit", "critical", "privilege_escalation",
     "sets SUID/SGID bit on a file"),
]

# File extensions to scan
SCANNABLE_EXTENSIONS = {
    '.md', '.txt', '.py', '.sh', '.bash', '.js', '.ts', '.rb',
    '.yaml', '.yml', '.json', '.toml', '.cfg', '.ini', '.conf',
    '.html', '.css', '.xml',
}

# Binary extensions that should NOT be in a skill
SUSPICIOUS_BINARY_EXTENSIONS = {
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat', '.com',
    '.msi', '.dmg', '.app', '.deb', '.rpm',
}

# Invisible unicode chars used for injection
INVISIBLE_CHARS = {
    '\u200b', '\u200c', '\u200d', '\u2060', '\u2062',
    '\u2063', '\u2064', '\ufeff', '\u202a', '\u202b',
    '\u202c', '\u202d', '\u202e', '\u2066', '\u2067',
    '\u2068', '\u2069',
}

MAX_FILE_COUNT = 50
MAX_TOTAL_SIZE_KB = 1024
MAX_SINGLE_FILE_KB = 256


# ── Scanning ─────────────────────────────────────────

def scan_file(file_path: Path, rel_path: str = "") -> List[Finding]:
    if not rel_path:
        rel_path = file_path.name

    if file_path.suffix.lower() not in SCANNABLE_EXTENSIONS and file_path.name != "SKILL.md":
        return []

    try:
        content = file_path.read_text(encoding='utf-8')
    except (UnicodeDecodeError, OSError):
        return []

    findings = []
    lines = content.split('\n')
    seen = set()

    for pattern, pid, severity, category, description in THREAT_PATTERNS:
        for i, line in enumerate(lines, start=1):
            if (pid, i) in seen:
                continue
            if re.search(pattern, line, re.IGNORECASE):
                seen.add((pid, i))
                matched = line.strip()[:120]
                findings.append(Finding(pid, severity, category, rel_path, i, matched, description))

    # Invisible unicode detection
    for i, line in enumerate(lines, start=1):
        for char in INVISIBLE_CHARS:
            if char in line:
                findings.append(Finding(
                    "invisible_unicode", "high", "injection", rel_path, i,
                    f"U+{ord(char):04X}", "invisible unicode character (possible injection)"
                ))
                break

    return findings


def scan_skill(skill_path: Path) -> ScanResult:
    skill_name = skill_path.name
    all_findings: List[Finding] = []

    if skill_path.is_dir():
        all_findings.extend(_check_structure(skill_path))
        for f in skill_path.rglob("*"):
            if f.is_file():
                rel = str(f.relative_to(skill_path))
                all_findings.extend(scan_file(f, rel))
    elif skill_path.is_file():
        all_findings.extend(scan_file(skill_path, skill_path.name))

    verdict = _determine_verdict(all_findings)
    summary = _build_summary(skill_name, verdict, all_findings)

    return ScanResult(
        skill_name=skill_name,
        source="local",
        verdict=verdict,
        findings=all_findings,
        scanned_at=datetime.now(timezone.utc).isoformat(),
        summary=summary,
    )


def _check_structure(skill_dir: Path) -> List[Finding]:
    findings = []
    file_count = 0
    total_size = 0

    for f in skill_dir.rglob("*"):
        if not f.is_file() and not f.is_symlink():
            continue
        rel = str(f.relative_to(skill_dir))
        file_count += 1

        if f.is_symlink():
            try:
                resolved = f.resolve()
                if not str(resolved).startswith(str(skill_dir.resolve())):
                    findings.append(Finding("symlink_escape", "critical", "traversal",
                                            rel, 0, f"-> {resolved}", "symlink escapes skill directory"))
            except OSError:
                findings.append(Finding("broken_symlink", "medium", "traversal",
                                        rel, 0, "broken", "broken or circular symlink"))
            continue

        try:
            size = f.stat().st_size
            total_size += size
        except OSError:
            continue

        if size > MAX_SINGLE_FILE_KB * 1024:
            findings.append(Finding("oversized_file", "medium", "structural",
                                    rel, 0, f"{size // 1024}KB", f"file is {size // 1024}KB (limit: {MAX_SINGLE_FILE_KB}KB)"))

        ext = f.suffix.lower()
        if ext in SUSPICIOUS_BINARY_EXTENSIONS:
            findings.append(Finding("binary_file", "critical", "structural",
                                    rel, 0, f"binary: {ext}", f"binary file ({ext}) should not be in a skill"))

    if file_count > MAX_FILE_COUNT:
        findings.append(Finding("too_many_files", "medium", "structural",
                                "(directory)", 0, f"{file_count}", f"skill has {file_count} files (limit: {MAX_FILE_COUNT})"))

    if total_size > MAX_TOTAL_SIZE_KB * 1024:
        findings.append(Finding("oversized_skill", "high", "structural",
                                "(directory)", 0, f"{total_size // 1024}KB", f"total {total_size // 1024}KB (limit: {MAX_TOTAL_SIZE_KB}KB)"))

    return findings


def _determine_verdict(findings: List[Finding]) -> str:
    if not findings:
        return "safe"
    if any(f.severity == "critical" for f in findings):
        return "dangerous"
    if any(f.severity == "high" for f in findings):
        return "caution"
    return "caution"


def _build_summary(name: str, verdict: str, findings: List[Finding]) -> str:
    if not findings:
        return f"{name}: clean scan, no threats detected"
    categories = set(f.category for f in findings)
    return f"{name}: {verdict} — {len(findings)} finding(s) in {', '.join(sorted(categories))}"


# ── CLI ──────────────────────────────────────────────

SEVERITY_COLORS = {
    "critical": "\033[91m",  # red
    "high": "\033[93m",      # yellow
    "medium": "\033[96m",    # cyan
    "low": "\033[37m",       # white
}
RESET = "\033[0m"
BOLD = "\033[1m"

SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def format_report(result: ScanResult) -> str:
    lines = []
    verdict_map = {"safe": "✅ SAFE", "caution": "⚠️ CAUTION", "dangerous": "🚨 DANGEROUS"}
    verdict_display = verdict_map.get(result.verdict, result.verdict.upper())

    lines.append(f"{BOLD}{'─' * 60}{RESET}")
    lines.append(f"{BOLD}Skill:{RESET} {result.skill_name}  {BOLD}Verdict:{RESET} {verdict_display}")

    if result.findings:
        sorted_findings = sorted(result.findings, key=lambda f: SEVERITY_ORDER.get(f.severity, 4))
        lines.append(f"\n{BOLD}Findings ({len(result.findings)}):{RESET}")
        for f in sorted_findings:
            color = SEVERITY_COLORS.get(f.severity, "")
            sev = f.severity.upper().ljust(8)
            cat = f.category.ljust(14)
            loc = f"{f.file}:{f.line}".ljust(30) if f.line else f.file.ljust(30)
            lines.append(f"  {color}{sev}{RESET} {cat} {loc} {f.description}")
    else:
        lines.append(f"\n  No threats detected ✅")

    return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print("Usage: python skills_guard.py <skill_path|skills_dir>")
        print("\nExamples:")
        print("  python skills_guard.py .agent/skills/my-skill/       # scan one skill")
        print("  python skills_guard.py .agent/skills/                 # scan all skills")
        sys.exit(1)

    target = Path(sys.argv[1])
    if not target.exists():
        print(f"ERROR: {target} does not exist")
        sys.exit(1)

    # Determine if scanning a single skill or a skills directory
    skills_to_scan = []
    if (target / "SKILL.md").exists():
        skills_to_scan.append(target)
    elif target.is_dir():
        for child in sorted(target.iterdir()):
            if child.is_dir() and (child / "SKILL.md").exists():
                skills_to_scan.append(child)
    else:
        skills_to_scan.append(target)

    if not skills_to_scan:
        print("No skills found to scan.")
        sys.exit(0)

    total_findings = 0
    dangerous_count = 0
    caution_count = 0

    for skill_path in skills_to_scan:
        result = scan_skill(skill_path)
        print(format_report(result))

        total_findings += len(result.findings)
        if result.verdict == "dangerous":
            dangerous_count += 1
        elif result.verdict == "caution":
            caution_count += 1

    # Summary
    print(f"\n{BOLD}{'═' * 60}{RESET}")
    print(f"{BOLD}Summary:{RESET} {len(skills_to_scan)} skills scanned")
    print(f"  ✅ Safe: {len(skills_to_scan) - dangerous_count - caution_count}")
    print(f"  ⚠️  Caution: {caution_count}")
    print(f"  🚨 Dangerous: {dangerous_count}")
    print(f"  📊 Total findings: {total_findings}")

    if dangerous_count > 0:
        sys.exit(2)
    elif caution_count > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
