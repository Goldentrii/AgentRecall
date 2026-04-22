---
description: "AgentRecall project context loader — load full context for a specific project once you know what you're working on."
---

# /arstart — AgentRecall Project Context Loader

Load deep context for a specific project: identity, palace rooms, corrections, and task-relevant recall — in two MCP calls.

> **Starting a fresh session and don't know what to work on?**
> Run `/arstatus` first — it shows all projects and pending work across everything.
> Come back here once you've picked a project.

## Token-Efficient Cold Start (skip /arstatus when you already know the project)

For a returning agent that already knows the project slug, you can bootstrap with just two reads — no MCP calls, no /arstatus scan needed:

```bash
# Layer 1: Claude AutoMemory (user profile + project pointers)
cat ~/.claude/projects/-Users-tongwu/memory/MEMORY.md

# Layer 2: AgentRecall palace identity (project intention + goals)
cat ~/.agent-recall/projects/<slug>/palace/identity.md
```

These two files together answer: **who the user is + what this project is trying to achieve**. That's enough context to begin working.

Then call `session_start` + `recall` as normal to load the full palace.

## Journal Naming System

AgentRecall journal files follow a naming pattern that acts as a searchable index:

```
YYYY-MM-DD.md                                    ← manual save
YYYY-MM-DD--arsave--<lines>L--<keywords>.md      ← auto-saved (arsave/arsaveall)
```

Examples:
```
2026-04-21--arsave--6L--tool-config-brief-session-website.md
2026-04-17--arsave--12L--auth-bug-session-end.md
```

**Use this to find past sessions by topic without /arstatus:**

```bash
# Find all sessions mentioning "tool" across all projects
ls ~/.agent-recall/projects/*/journal/ | grep "tool"

# Find sessions about "auth" in a specific project
ls ~/.agent-recall/projects/novada-site/journal/ | grep "auth"

# Get the latest journal for a project
ls ~/.agent-recall/projects/<slug>/journal/*.md | grep -v log | sort -r | head -1
```

This naming system is the lightweight discovery layer — use it before reaching for /arstatus.

## When to Use

Use /arstart once you know which project you're working on:
- You ran `/arstatus` and picked a project
- You already know what you're working on (returning to an ongoing task)
- An orchestrator dispatched you with a specific project brief

**Skip /arstart when:**
- Pure Q&A with no project context needed
- Trivial one-off task with no decisions worth recalling

## What This Does

Runs AgentRecall session-start in **two MCP calls**:
1. `session_start` — identity + insights + rooms + cross-project matches + recent journal + watch_for
2. `recall` with today's task — surfaces relevant past knowledge (fixes, decisions, patterns)

## Process

### Step 1: Identify the task

Check if the user already stated what we're working on in this conversation.

- **If yes**: Use it directly. Do NOT ask "what are we working on?" — that's friction.
- **If no context yet**: Ask once, briefly: "What are we working on today?"

### Step 2: Load full context

Call `session_start(project="auto")`.

This returns:
- **identity** — who the user is, what the project is about
- **insights** — top awareness insights ranked by confirmation count
- **active_rooms** — top 3 palace rooms by salience
- **cross_project** — insights from other projects matching this context
- **recent** — today/yesterday journal briefs + older count
- **watch_for** — past correction patterns to avoid repeating

### Step 3: Recall past knowledge for today's task

Call `recall(query="<today's task or topic>")`.

This hits the knowledge store for documented fixes, past decisions, and patterns relevant to what we're about to do. Return up to 3 hits if relevant.

This is the step that surfaces: "last time we touched this module, X broke" or "this API returns null on session expiry — always null-check" — things not in the awareness insights but stored as knowledge entries.

### Step 4: Show cold-start card

Render the following card. Replace all `<placeholders>` with real values from `session_start` and `recall`. Count the project's journal files to get the session number (`ls ~/.agent-recall/projects/<slug>/journal/*.md 2>/dev/null | wc -l`).

```
──────────────────────────────────────────────────────────────
  AgentRecall  ✓ Loaded    <project-slug>   <YYYY-MM-DD>   #<N>
──────────────────────────────────────────────────────────────
  Identity      ~/.agent-recall/projects/<slug>/palace/
                └─ identity.md                       [~50 tokens]

  Palace        ~/.agent-recall/projects/<slug>/palace/rooms/
                ├─ <room1>.md                           [loaded]
                └─ <room2>.md                           [loaded]

  Awareness     ~/.agent-recall/awareness.md
                └─ <N> insights · <M> cross-project matches

  Last session  <YYYY-MM-DD> — <one-line summary>
  Next          <top priority from journal>

  ⚠ watch_for  "<correction pattern>"          corrected <N>×
                "<correction pattern>"          corrected <N>×
──────────────────────────────────────────────────────────────
```

Rules for the card:
- `#<N>` = total journal `.md` files in this project (proxy for session count)
- Show only palace rooms returned by `session_start` (top 2-3 by salience)
- Omit `⚠ watch_for` section entirely if no corrections exist
- Omit `Last session` / `Next` if no journal entries exist yet
- After the card, if `recall` returned relevant hits, show them as a compact list below:

```
Relevant from memory:
  • <knowledge hit 1>
  • <knowledge hit 2>
```

Skip this list entirely if recall returned nothing relevant.

### Step 5: Ready to work

Say: "Ready. What's first?" and let the user drive.

If the user already stated the task in Step 1, skip this line and just get to work.

## Important Rules

- **Run /arstatus first if unsure.** If you don't know which project to load, run /arstatus to see the full status board, then come back here.
- **Be fast.** Two tool calls: session_start + recall. Don't add extra calls unless recall returned 0.
- **Don't lecture.** Show the card, offer insights, then get out of the way.
- **Sparse data is fine.** New project with no palace, no journal — say so briefly and proceed.
- **hook-start already ran.** At session start, a quick preview was auto-loaded. /arstart completes it with cross-project data, rooms, and task-specific recall. Don't re-explain what the hook already showed.
- **Call check() before significant actions.** If you're about to do something irreversible (publish to npm, push to git, delete files, deploy), call `check(goal="<what you're about to do>", confidence="high")` first.
- **One load per session.** If already ran, say so and offer to re-run if the project changed.
- **Use `remember` for manual fixes.** If session_start returned sparse data on a project you know has content, use `remember` to re-surface it.
