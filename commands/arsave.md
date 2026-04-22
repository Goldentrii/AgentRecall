---
description: "AgentRecall full save — journal + palace + awareness + insights in one shot."
---

# /arsave — AgentRecall Full Save (v3.3.20)

One command to save everything. No long prompts needed.

## When to Use

**Default: USE IT.** Most projects are long-term. Memory compounds — insights saved today prevent repeated mistakes and rebuild costs across future sessions.

**Skip /arsave only when** the session was truly throwaway:
- Pure Q&A with no decisions made
- Trivial one-off task that won't be revisited
- Nothing non-obvious happened worth recalling

## What This Does

Runs the complete AgentRecall end-of-session flow:

1. **Gather** — review what happened this session
2. **Save** — one `session_end` call writes journal + awareness + consolidation
3. **Verify** — check that key content was promoted
4. **Git** — push to GitHub if user has configured it

## Process

### Step 1: Gather session context

**Start with machine-captured facts, not memory.** At long context windows your memory of early decisions is compressed and unreliable. Ground truth comes first:

1. **Read today's capture log** — `~/.agent-recall/projects/<slug>/journal/YYYY-MM-DD-log.md` (if it exists). This file contains incremental Q&A captures logged during the session. Pull out the key facts from it.

2. **Check git diff** — if in a git repo, run `git diff --stat HEAD` or `git log --oneline -5` to see what files actually changed.

3. **Supplement with memory** — now recall what happened that isn't in the log: decisions made in conversation, things we discussed but didn't act on, blockers identified, next steps.

Combine all three into a 2-3 sentence summary. The log anchors you; memory fills the gaps.

### Step 1b: Capture intention on first save

Check whether this project already has an intention recorded:

```bash
grep -l "Intention:" ~/.agent-recall/projects/<slug>/palace/identity.md 2>/dev/null
```

**If NOT found** (this is the first save for this project, or intention was never captured):

Look at the earliest user messages in this conversation — where the user explained what they're trying to do, why they're starting this project, what problem they're solving, or what their goal is. Extract one clear sentence that captures the core WHY.

Write it to the identity file:

```bash
mkdir -p ~/.agent-recall/projects/<slug>/palace
# prepend to identity.md (or create it)
echo "**Intention:** <extracted intention sentence>" | cat - ~/.agent-recall/projects/<slug>/palace/identity.md 2>/dev/null > /tmp/identity-tmp.md && mv /tmp/identity-tmp.md ~/.agent-recall/projects/<slug>/palace/identity.md
```

Rules for extraction:
- One sentence, max ~20 words
- Capture the WHY and WHAT, not the HOW (e.g. "Build a pixel-perfect replica of novada.com as a deployable Next.js site")
- If no clear intention is detectable from the conversation (e.g. pure Q&A, no project context), skip — don't fabricate

**If already found**: skip this step entirely.

### Step 2: Record corrections

If the human corrected your understanding during this session — "no not that", "I meant X not Y", "wrong priority" — record each significant correction:

```
check({
  goal: "<what you originally understood>",
  confidence: "high",
  human_correction: "<what the human actually wanted>",
  delta: "<the gap — e.g. 'assumed technical priority, human meant business priority'>"
})
```

This feeds the predictive warning system. Future agents on this project will get `watch_for` warnings like: "You tend to misinterpret X — corrected N times."

If no corrections happened this session, skip this step.

### Step 3: Save everything in one call

Call `session_end` with:

```
session_end({
  summary: "<2-3 sentence session summary>",
  insights: [
    {
      title: "<one-line insight>",
      evidence: "<what happened that confirmed this>",
      applies_when: ["keyword1", "keyword2"],
      severity: "critical" | "important" | "minor"
    }
    // 1-3 insights max
  ],
  trajectory: "<where is the work heading — one line>"
})
```

This single call:
- Writes the daily journal entry
- Updates awareness with new insights (merge or add)
- Consolidates decisions/goals/blockers into palace rooms
- Archives demoted insights (not deleted — moved to awareness-archive.json)

### Step 4: Verify promotion

After `session_end`, verify that content actually made it to the right places:

1. Call `recall(query="<key decision from today>")` — confirm it appears in palace results
2. Check the session_end response: `insights_processed` should match what you sent

If gaps found, use `remember` to manually save the missing content:
```
remember({
  content: "<the missing decision/insight>",
  context: "architecture decision"  // hints the router
})
```

### Step 5: Output the save card

Render the following card. Replace all `<placeholders>` with real values from the session_end response and the actual project slug. Count the project's journal files to get the session number (`ls ~/.agent-recall/projects/<slug>/journal/*.md 2>/dev/null | wc -l`).

```
──────────────────────────────────────────────────────────────
  AgentRecall  ✓ Saved    <project-slug>   <YYYY-MM-DD>   #<N>
──────────────────────────────────────────────────────────────
  Intention     palace/identity.md
                └─ "<captured intention>"           [captured]   ← only if written this save

  Journal       ~/.agent-recall/projects/<slug>/journal/
                └─ <YYYY-MM-DD>.md                    [written]

  Awareness     ~/.agent-recall/awareness.md
                └─ <N> insights added  (<M> total)

  Palace        ~/.agent-recall/projects/<slug>/palace/
                ├─ rooms/<room1>.md                   [updated]
                ├─ rooms/<room2>.md                   [updated]
                └─ palace-index.json                 [reindexed]

  Insights      ~/.agent-recall/insights-index.json
                └─ cross-project index updated
──────────────────────────────────────────────────────────────
```

Omit the `Intention` line entirely if intention was already captured in a prior session (not written this save).

If any corrections were recorded this session via `check()`, append a distinct correction block **below** the card:

```
⚠  Correction saved  [<P0 or P1>]
   ~/.agent-recall/projects/<slug>/palace/corrections.json
   Rule: "<the rule that was stored>"
```

Use a separate block per correction. P0 (never/always/don't) gets `[P0]`, everything else `[P1]`.

Rules for the card:
- `#<N>` = total journal `.md` files in this project after this save
- Omit Palace section if no rooms were touched
- If palace rooms are unknown, show `palace/rooms/` without room names
- Use `[skipped]` for rooms checked but unchanged

## Two Modes

**Checkpoint save** (mid-session)
- Use when: afraid of losing state, reached a significant node, before a risky operation
- Multiple checkpoints in one day merge into the same journal file (like game save points)
- Lighter: summary of what was just completed, no full insight processing needed
- Say "checkpoint" at the start: `"Checkpoint: just completed X, next is Y"`

**End-of-session save** (standard)
- Use at the end of a work session
- Full flow: gather + corrections + session_end + verify
- This is the default when you run /arsave

## Palace Rules

The palace is a brain palace — **selective by design**. It only holds what's worth remembering long-term.

**Store in palace:**
- Decisions that would be hard to re-derive (architecture choices, API behavior, gotchas)
- Goals and sub-goals: `Intention → Goal → Sub-goal → Milestone`
- Patterns that repeat across sessions
- Corrections (things you got wrong that cost time)

**Do NOT store in palace:**
- One-off or temporary work (a drawing for one day, a quick lookup)
- Full meeting notes or process transcripts
- Intermediate steps that led nowhere
- Things already in the codebase or docs

**Meeting notes rule:** When a meeting or conversation is worth remembering, reduce it to: original intention + final goal + key milestones only. The palace stores the goal hierarchy, not the minutes.

**Dormancy:** Items that haven't been accessed in a long time automatically lose weight (salience drops). They're not deleted — they become dormant. They can resurface when triggered by a semantic match. This is intentional: the palace stays lean at the surface, deep in the background.

## Important Rules

- **Be honest in the journal.** If something broke, write it. If nothing got done, say so.
- **Verify, don't trust.** Step 3 exists because consolidation can be superficial. Check the result.
- **Insights should be reusable.** "Fixed a bug" is not an insight. "API returns null when session expires — always null-check auth responses" is an insight.
- **Don't over-save.** 1-3 insights per session is plenty. Quality over quantity.
- **Match the user's language.** If the session was in Chinese, write in Chinese.
- **Checkpoint saves allowed.** Multiple saves per day merge into one journal entry. Don't refuse a save just because one already happened today.
- **Use `remember` for manual fixes.** If session_end missed something, use `remember` to route it to the right store.
