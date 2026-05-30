---
trigger: /save-skill
description: Manually trigger skill creation from the current session. Captures a reusable procedure as a new SKILL.md.
---

# /save-skill — Manual Skill Creation

> Capture a reusable procedure from the current session as a new skill.

---

## Usage

```
/save-skill                      → Agent evaluates and creates skill from current session
/save-skill <name>               → Create skill with specified name
/save-skill <name> <description> → Create skill with name and description
```

---

## Workflow

### Step 1: Gather Context

Review the current conversation and identify:
1. **What was the task?** — summarize in one sentence
2. **What procedure was followed?** — step-by-step
3. **What decisions were made and why?**
4. **What mistakes were avoided?**
5. **Is this reusable?** — would this help in a different project?

### Step 2: Generate Skill Name

If not provided by user, generate a kebab-case name:
- Must be descriptive and unique
- Max 64 characters
- Examples: `supabase-rls-debugging`, `flutter-web-deployment`, `nextjs-api-routes`

### Step 3: Create Skill

Create the skill at `.agent/skills/{name}/SKILL.md` using this template:

```markdown
---
name: {name}
description: {One line, max 120 chars}
allowed-tools: {Relevant tools}
version: 1.0
auto-generated: true
source-task: {Brief task description}
created-at: {ISO date}
---

# {Skill Name}

> {Summary}

## When to Use
{Trigger conditions}

## Procedure
{Step-by-step}

## Key Decisions
{Important choices and rationale}

## Anti-Patterns
{What NOT to do}

## Verification
{How to confirm success}
```

### Step 4: Confirm

```markdown
📝 **Skill Created:** `{name}`
> {description}

Location: `.agent/skills/{name}/SKILL.md`
This skill will be available in future sessions.
```

---

## Rules

1. **No secrets** — never include API keys, passwords, or tokens in skills
2. **Project-agnostic** — no hardcoded paths or project-specific references
3. **One skill per invocation** — keep focused
4. **Always set `auto-generated: true`** — distinguishes from hand-crafted skills
