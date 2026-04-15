---
description: "Batch save — summarize all today's sessions into one consolidated journal entry. Use when multiple sessions ran in parallel."
---

# /arsaveall — Batch Session Save

Summarize all of today's sessions into one consolidated journal + palace + awareness update. Use this instead of running `/arsave` in each window separately.

## When to Use

- You ran 3-7 Claude Code sessions in parallel
- Each session did different work on the same or different projects
- You want ONE consolidated save instead of saving each separately

## What This Does

1. **Scan** — find all of today's session journals and capture logs across all projects
2. **Summarize** — merge them into one consolidated journal entry per project
3. **Palace** — consolidate key decisions from all sessions into palace rooms
4. **Awareness** — extract insights across all sessions (deduplicated)
5. **Verify** — check that consolidation actually landed

## Process

### Step 1: Scan today's sessions

For each project in `~/.agent-recall/projects/`:
- Find all `YYYY-MM-DD*.md` and `YYYY-MM-DD*-log.md` files for today
- Count sessions per project
- Read the content of each

Report to user:
```
Found N sessions across M projects today:
  - project-a: 3 sessions (journal + 2 capture logs)
  - project-b: 2 sessions (journal + 1 capture log)
  - project-c: 1 session (capture log only)
```

### Step 2: Summarize per project

For each project with 2+ session files today:

Call `session_end` with a merged summary that includes:
- **Completed** — union of all work done across sessions
- **Decisions** — all decisions made (deduplicated)
- **Blockers** — current blockers (take the latest state)
- **Next** — merged next steps
- **Insights** — extract 1-3 insights from the combined sessions

For projects with only 1 session file, check if it already has a proper journal entry. If it's just a capture log, promote it to a journal summary.

### Step 3: Consolidate to palace

Call `context_synthesize(consolidate=true)` once per project to promote decisions and goals to palace rooms.

### Step 4: Update awareness

Call `awareness_update` with insights gathered across ALL projects (not per-project). This gives cross-project visibility.

### Step 5: Verify

Same as `/arsave` Step 5 — check that palace rooms and awareness actually contain today's content.

### Step 6: Report

```
✅ Batch save complete:
  - project-a: 3 sessions → 1 consolidated journal
  - project-b: 2 sessions → 1 consolidated journal
  - project-c: 1 session (already saved)
  - Awareness: N insights added
  - Palace: M rooms updated
```

## Important Rules

- **Don't duplicate.** If a session already has a proper `/arsave` journal, don't re-save it. Only consolidate sessions that were capture-only or not yet summarized.
- **Merge, don't overwrite.** If `YYYY-MM-DD.md` already exists with content from an earlier `/arsave`, append the new sessions as additional sections — don't replace.
- **Cross-project insights.** The awareness update should look across ALL projects for patterns, not just within one.
- **Do NOT push to git.** Local-first. Only push if user explicitly asks.
