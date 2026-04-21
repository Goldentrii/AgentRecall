---
description: "AgentRecall batch save — reads all VS Code session transcripts, saves this session, auto-rescues all other active sessions into AgentRecall."
---

# /arsaveall — AgentRecall Save All

One command to end a multi-session work day cleanly. Reads every VS Code Claude Code session transcript from disk, saves this session first, then auto-rescues all other sessions that haven't been journaled yet.

## When to Use

- Closing VS Code after a multi-tab work session
- After running parallel agents across multiple projects simultaneously
- End-of-day memory sync across everything you worked on

## What This Does

1. **Save this session** — `session_end` for the current tab (journal + awareness + palace)
2. **Scan all transcripts** — reads `~/.claude/projects/-Users-{user}/*.jsonl` from today
3. **Auto-rescue un-journaled sessions** — for each project not yet in AgentRecall, synthesize summary from transcript + save
4. **Report** — show exactly what was saved, what was skipped, what failed

## Process

### Step 1: Save this session (same as /arsave)

1. Read today's capture log if it exists: `~/.agent-recall/projects/<slug>/journal/<today>-log.md`
2. Record any corrections from this session via `check()`
3. Call `session_end` with summary + insights + trajectory
4. Verify: spot-check with `recall(query="<today's key decision>")`

### Step 2: Run the transcript scanner

```bash
node ~/Projects/AgentRecall/packages/cli/dist/index.js saveall
```

This single command:
- Lists all today's `.jsonl` files from `~/.claude/projects/-Users-{user}/`
- Identifies the project for each session from file path patterns in tool calls
- Checks if each project already has a journal entry for today
- For un-journaled projects: synthesizes summary from transcript head+tail → calls `session_end`
- Skips projects already journaled

### Step 3: Output the save card

Render one card for this session (same format as `/arsave`), then a multi-session summary card below it.

**This session card** (same as /arsave Step 5 — include session counter and correction blocks if applicable):
```
──────────────────────────────────────────────────────────────
  AgentRecall  ✓ Saved    <project-slug>   <YYYY-MM-DD>   #<N>
──────────────────────────────────────────────────────────────
  Journal       ~/.agent-recall/projects/<slug>/journal/
                └─ <YYYY-MM-DD>.md                    [written]

  Awareness     ~/.agent-recall/awareness.md
                └─ <N> insights added  (<M> total)

  Palace        ~/.agent-recall/projects/<slug>/palace/
                └─ rooms/ + palace-index.json         [updated]
──────────────────────────────────────────────────────────────
```

**All sessions card** (after CLI scan completes):
```
──────────────────────────────────────────────────────────────
  AgentRecall  ✓ Save All                       <YYYY-MM-DD>
──────────────────────────────────────────────────────────────
  ✓  <project-1>    ~/.agent-recall/projects/<project-1>/
                    journal/<YYYY-MM-DD>.md         [rescued]

  ✓  <project-2>    ~/.agent-recall/projects/<project-2>/
                    journal/<YYYY-MM-DD>.md         [rescued]

  ~  <project-3>    already journaled              [skipped]

  ✗  <project-4>    transcript parse failed         [failed]

──────────────────────────────────────────────────────────────
  <N> rescued   <M> skipped   <K> failed
  ~/.agent-recall/insights-index.json               [updated]
  ~/.agent-recall/awareness.md                      [updated]
──────────────────────────────────────────────────────────────
```

Rules for the all-sessions card:
- One entry per project detected from transcript scan
- Use `✓` rescued, `~` skipped, `✗` failed
- Show actual project path indented below each entry
- Bottom section always shows totals + global files updated

## Diagnostic: List sessions without saving

```bash
node ~/Projects/AgentRecall/packages/cli/dist/index.js sessions
```

Shows all today's sessions with project slug + first user message — useful to verify detection before saving.

## Dry run

```bash
node ~/Projects/AgentRecall/packages/cli/dist/index.js saveall --dry-run
```

Shows what would be saved without writing anything.

## Important Rules

- **Save this session FIRST** (Step 1) before running the CLI. If the CLI crashes, at least this session is safe.
- **The CLI handles dedup automatically.** Projects already journaled are skipped — no double-saves.
- **Auto-rescued summaries are minimal.** They capture task + last exchanges. For rich memory, do a full `/arsave` in that session before closing.
- **One /arsaveall per close.** Don't re-run unless a new session was opened after the last run.
- **Call check() before significant actions.** If you're about to do something irreversible, call `check()` first to surface watch_for patterns.
