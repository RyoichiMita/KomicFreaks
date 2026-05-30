---
name: skills-guard
description: Security scanner for agent-created and imported skills. Detects exfiltration, prompt injection, destructive commands, persistence, and supply chain attacks using regex-based static analysis.
allowed-tools: Read, Terminal
version: 1.0
priority: HIGH
---

# Skills Guard — Security Scanner for Skills

> **Ported from Hermes Agent's skills_guard.py** — regex-based static analysis for skill safety.

---

## 🧠 Core Concept

Every skill that is auto-generated or imported should pass through a security scan before being trusted. The scanner detects known-bad patterns across 10 threat categories.

---

## 🔍 Threat Categories

| Category | Examples | Severity |
|----------|----------|----------|
| **Exfiltration** | `curl` with env vars, reading `.env`, `os.environ` | Critical/High |
| **Injection** | "ignore previous instructions", role hijack, hidden HTML | Critical/High |
| **Destructive** | `rm -rf /`, `mkfs`, system config overwrite | Critical |
| **Persistence** | crontab, shell RC mods, SSH authorized_keys, LaunchAgents | Medium-Critical |
| **Network** | Reverse shells, tunneling services, hardcoded IPs | Critical/High |
| **Obfuscation** | `eval()`, `exec()`, base64 decode pipes, echo|bash | High-Critical |
| **Supply Chain** | curl|bash, unpinned pip/npm install, git clone at runtime | Medium-Critical |
| **Traversal** | `../../..`, `/etc/passwd`, symlink escapes | Medium-Critical |
| **Credential Exposure** | Hardcoded API keys, private keys, GitHub tokens | Critical |
| **Privilege Escalation** | `sudo`, setuid, NOPASSWD | High-Critical |

---

## 🔧 Usage

### Scan a single skill
```bash
python .agent/skills/skills-guard/scripts/skills_guard.py .agent/skills/my-skill/
```

### Scan all skills
```bash
python .agent/skills/skills-guard/scripts/skills_guard.py .agent/skills/
```

### Verdicts

| Verdict | Meaning | Action |
|---------|---------|--------|
| ✅ **SAFE** | No threats detected | Allow |
| ⚠️ **CAUTION** | High-severity findings | Review before use |
| 🚨 **DANGEROUS** | Critical-severity findings | Block — fix first |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All safe |
| 1 | Caution findings |
| 2 | Dangerous findings |

---

## 🛡️ When to Scan

| Trigger | Action |
|---------|--------|
| Self-generating skills creates a skill | Auto-scan the new skill |
| User imports a skill from external source | Scan before allowing |
| Skill Curator modifies skills | Scan after modification |
| Periodic audit | `python skills_guard.py .agent/skills/` |
| Before deployment / git push | Scan all skills as part of checklist |

---

## 📊 Structural Checks

Beyond pattern matching, the scanner also checks:

| Check | Limit | Severity |
|-------|-------|----------|
| File count per skill | 50 files max | Medium |
| Total skill size | 1MB max | High |
| Individual file size | 256KB max | Medium |
| Binary files | None allowed | Critical |
| Symlink escape | Must stay within skill dir | Critical |
