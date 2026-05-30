---
name: self-generating-skills
description: Autonomous skill creation system. After complex tasks (5+ tool calls), the agent evaluates whether the procedure is worth capturing as a reusable SKILL.md. Skills self-improve when better approaches are found.
allowed-tools: Read, Write, Edit, Glob, Grep
version: 1.0
priority: HIGH
---

# Self-Generating Skills System

> **Inspired by Hermes Agent's Curator** — adapted for the Antigravity Kit architecture.

---

## 🧠 Core Concept

After completing complex work, the agent should evaluate whether the procedure is **reusable** and worth saving as a new skill. This creates a **closed learning loop** where the agent's capability grows through use.

---

## 🔍 Auto-Nudge Trigger

**After ANY task completion that meets these criteria, evaluate for skill creation:**

| Criterion | Threshold |
|-----------|-----------|
| Tool calls in session | ≥ 5 calls |
| Files modified | ≥ 3 files |
| Multi-step debugging | ≥ 3 investigation steps |
| Novel pattern discovered | Agent used approach not in existing skills |
| User explicitly asks | "save this as a skill", "remember this" |

### Decision Matrix

| Situation | Action |
|-----------|--------|
| One-off fix (typo, config tweak) | ❌ SKIP — not reusable |
| Project-specific hack | ❌ SKIP — too narrow |
| Reusable pattern (could apply to other projects) | ✅ CREATE skill |
| Improvement to existing approach | ✅ EDIT existing skill |
| User corrects workflow | ✅ UPDATE skill with correction |

---

## 📝 Skill Creation Protocol

### Step 1: Evaluate (Silent — do NOT ask unless uncertain)

```
Ask yourself:
1. Would this procedure help in a DIFFERENT project?
2. Did I learn something not captured in existing skills?
3. Would a future session benefit from this knowledge?

If YES to any → proceed to Step 2
If NO to all → skip silently
```

### Step 2: Generate Skill Content

**Create a new skill following this structure:**

```markdown
---
name: {kebab-case-name}
description: {One line, max 120 chars. Must be specific and actionable.}
allowed-tools: {Relevant tools}
version: 1.0
auto-generated: true
source-task: {Brief description of the task that created this skill}
---

# {Skill Name}

> {One-sentence summary of what this skill captures}

## When to Use
{Specific trigger conditions — when should the agent load this skill?}

## Procedure
{Step-by-step procedure that was proven to work}

## Key Decisions
{Important choices made and WHY — not just what}

## Anti-Patterns
{What NOT to do — mistakes discovered during the task}

## Verification
{How to confirm the procedure worked correctly}
```

### Step 3: Save Location

**Auto-generated skills go to:** `.agent/skills/{skill-name}/SKILL.md`

### Step 4: Notify User

```markdown
📝 **Skill Created:** `{skill-name}`
> {description}

This skill was auto-generated from the task we just completed.
It will be available for future sessions matching similar requests.
```

---

## 🔄 Self-Improvement Protocol

### When to Update an Existing Skill

| Trigger | Action |
|---------|--------|
| Agent finds a better approach during a task | EDIT the skill's Procedure section |
| User corrects the agent's workflow | ADD the correction to Anti-Patterns + update Procedure |
| Skill fails or produces poor results | ADD failure case to Anti-Patterns |
| Multiple narrow skills overlap | CONSOLIDATE into one umbrella skill |

### Update Format

When updating, preserve the existing content and **append** the improvement:

```markdown
## Procedure Updates

### v1.1 — {date}
- **Changed:** {what changed}
- **Reason:** {why it's better}
- **Old approach:** {what was replaced}
```

---

## 🛡️ Safety Rules

| Rule | Reason |
|------|--------|
| **Never create skills with secrets/credentials** | Security — no API keys, passwords, tokens |
| **Never create skills that bypass security checks** | Integrity — respect existing security skills |
| **Never auto-delete skills** | Safety — only the user or curator can remove |
| **Always use `auto-generated: true` in frontmatter** | Traceability — distinguishes from manual skills |
| **Max 1 skill per task** | Quality — prevent skill spam |
| **Skills must be project-agnostic** | Reusability — no hardcoded paths or project names |

---

## 📋 Progressive Disclosure

**Skills are loaded using progressive disclosure to minimize context bloat:**

1. **System prompt** gets ONLY: `name` + `description` (~30 tokens per skill)
2. **Full SKILL.md** is loaded only when the agent determines relevance
3. **references/ and scripts/** are loaded only when explicitly needed

This keeps the token budget lean while maintaining full capability.

---

## 🏷️ Skill Categories for Organization

| Category | When to use |
|----------|-------------|
| `debugging/` | Debugging patterns and troubleshooting procedures |
| `integration/` | Third-party service integrations |
| `deployment/` | Build, deploy, and CI/CD patterns |
| `data/` | Data migration, transformation, cleanup |
| `workflow/` | Development workflow optimizations |
| `platform/` | Platform-specific patterns (Supabase, Firebase, etc.) |

---

## Example: Auto-Generated Skill

After debugging a Supabase RLS issue across 3 tables with 7 tool calls:

```markdown
---
name: supabase-rls-debugging
description: Systematic approach to diagnosing and fixing Supabase Row Level Security policy failures. Use when queries return empty results unexpectedly.
allowed-tools: Read, Write, Edit, Grep
version: 1.0
auto-generated: true
source-task: Fixed RLS policies blocking admin portal access to student records
---

# Supabase RLS Debugging

> Diagnose and fix RLS policy issues using a systematic elimination approach.

## When to Use
- Queries return empty results when data exists
- PostgREST returns 0 rows despite visible data in SQL editor
- New table has no policies and returns nothing via API

## Procedure
1. Check if RLS is enabled: `SELECT relrowsecurity FROM pg_class WHERE relname = '{table}'`
2. List existing policies: `SELECT * FROM pg_policies WHERE tablename = '{table}'`
3. Test as the affected role: `SET ROLE authenticated; SELECT * FROM {table};`
4. Check JWT claims: `SELECT auth.uid(), auth.jwt()`
5. Verify policy references correct columns (common: using `id` instead of `user_id`)
6. For admin bypass: Use `SECURITY DEFINER` functions, NOT disabling RLS

## Anti-Patterns
- ❌ Disabling RLS to "fix" the issue — this is a security hole
- ❌ Using `TO public` instead of `TO authenticated` — exposes to anon
- ❌ Forgetting `WITH CHECK` on INSERT/UPDATE policies
```
