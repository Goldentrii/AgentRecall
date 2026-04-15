---
description: "AgentRecall full save — journal + palace + awareness + insights + verification. End-of-session brain dump."
---

# /arsave — AgentRecall Full Save (v3.4)

One command to save everything. No long prompts needed.

## What This Does

Runs the complete AgentRecall end-of-session flow:

1. **Journal** — write today's daily journal entry (10-section format)
2. **Palace** — consolidate key decisions, goals, blockers into palace rooms
3. **Awareness** — extract 1-3 insights from this session into the compounding system
4. **Verify** — check that promotion actually happened (don't trust the consolidation blindly)
5. **Compact** — auto-trigger weekly roll-up if old journals are piling up

## Process

### Step 1: Gather session context

Before writing anything, review:
- What was discussed, built, decided, and failed this session
- What files were modified (`git diff --stat` if in a git repo)
- Current blockers and next steps
- Any insights or patterns worth remembering

### Step 2: Write the daily journal

Call `journal_write` with a complete session entry. Use the user's language (Chinese if they spoke Chinese, English if English).

Include these sections at minimum:
- **Brief** (cold-start table: project / last done / next step / momentum)
- **Completed** (what got done, with specifics)
- **Blockers** (honest — what's stuck)
- **Next** (prioritized next actions)
- **Decisions** (what was decided and WHY)

If a section is empty, write "None" — don't skip it.

### Step 3: Consolidate to palace

Call `context_synthesize(consolidate=true)` to promote journal content into palace rooms:
- Decisions → architecture room
- Goals/brief → goals/evolution
- Blockers → blockers room

### Step 4: Update awareness

Call `awareness_update` with:
- **insights**: 1-3 key learnings from this session. Each insight should have:
  - `title`: one-line summary
  - `evidence`: what happened that confirmed this
  - `applies_when`: keywords for when this insight is relevant to future tasks
  - `source`: project name + today's date
  - `severity`: critical / important / minor
- **trajectory** (optional): where is the work heading?
- **blind_spots** (optional): what might matter but hasn't been explored?

### Step 5: Verify promotion (NEW in v3.4)

After consolidation, verify that content actually made it to palace rooms. Don't trust that Step 3 worked — check:

1. **Decisions check**: Call `palace_read(room="architecture")`. If today's decisions are NOT present, extract them from the journal and call `palace_write(room="architecture", ...)` directly.

2. **Blockers check**: Call `palace_read(room="blockers")`. If current blockers are NOT reflected, update the room.

3. **Awareness check**: Call `awareness_update` result. If 0 insights were added and the session was productive, go back and extract at least 1.

Report the verification result:
```
✅ Promotion verified:
  - architecture: 2 decisions promoted
  - blockers: up to date
  - awareness: 1 insight added (total: 7)
```

Or if gaps found:
```
⚠️ Promotion gap detected — fixing:
  - architecture: decisions missing → extracted and written
  - blockers: stale → updated
  - awareness: 0 insights → extracted 1
```

### Step 6: Auto-compact journals (NEW in v3.4)

Call `journal_rollup(dry_run=true)` to check if old journals should be condensed.

If the dry run shows weeks that can be rolled up:
- Tell the user: "Found N weeks of old journals that can be condensed into weekly summaries."
- Ask: "Roll up? [yes/no]"
- If yes, call `journal_rollup(dry_run=false)`

### Step 7: Confirm

Show the user a summary:
```
✅ Journal: written (YYYY-MM-DD.md)
✅ Palace: consolidated (N rooms updated)
✅ Awareness: N insights added (M total)
✅ Promotion: verified (or gaps fixed)
✅ Compact: N weeks rolled up (or "no old journals to compact")
```

> **Note:** Do NOT offer to push to GitHub. All data is local-first. Only push if the user explicitly asks.

## Important Rules

- **Be honest in the journal.** If something broke, write it. If nothing got done, say so.
- **Verify, don't trust.** Step 5 exists because agents skip consolidation or do it superficially. Check the result.
- **Insights should be reusable.** "Fixed a bug" is not an insight. "API returns null when session expires — always null-check auth responses" is an insight.
- **Don't over-save.** 1-3 insights per session is plenty. Quality over quantity.
- **Match the user's language.** If the session was in Chinese, write in Chinese.
- **One save per session.** If already saved, say so and offer to update instead.
