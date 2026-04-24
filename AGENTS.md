# AgentRecall — Codex Agent Instructions

AgentRecall gives you persistent memory across sessions via 6 MCP tools.

**Semi-manual mode: only use these tools when the user explicitly asks. Do not load memory automatically at session start.**

---

## Tools

| Tool | When to call |
|------|-------------|
| `session_start` | User says: "load my context", "what was I working on", "load memory for X" |
| `session_end` | User says: "save this session", "save to memory", "wrap up" |
| `recall` | User says: "recall X", "what do I know about X", "any past notes on X" |
| `remember` | User says: "remember this", "save this decision", "note this down" |
| `check` | User says: "check this against memory", or before irreversible actions (deploy, publish, delete) |
| `digest` | User says: "summarize my project", "give me a quick brief on X" |

---

## Trigger Phrases → Actions

**Load context:**
> "load my context" / "what was I working on" / "load AgentRecall for [project]"
→ Call `session_start(project="[slug or auto]")`
→ Show: project intention, last session summary, top insights, watch_for corrections

**Save session:**
> "save this session" / "save to memory" / "wrap up"
→ Call `session_end(summary="...", insights=[...], trajectory="...")`
→ Confirm: "Saved to ~/.agent-recall/projects/[slug]/journal/[date].md"

**Recall specific knowledge:**
> "recall [topic]" / "what do I know about [X]" / "any past notes on [X]"
→ Call `recall(query="[topic]")`
→ Show results inline

**Save a decision manually:**
> "remember this" / "save this decision" / "note: [X]"
→ Call `remember(content="[X]")`

**Checkpoint (mid-session):**
> "checkpoint" / "quick save"
→ Call `session_end` with a lightweight summary: "Checkpoint: just completed X, next is Y"

---

## Token Cost Guide

| Action | Approx tokens | When |
|--------|--------------|------|
| `session_start` | ~800–1200 | Once per session, only if needed |
| `recall` | ~200–400 | On demand |
| `remember` | ~100 | On demand |
| `session_end` | ~400–600 | Once at end |
| `check` | ~150 | Before risky actions |

**Skip `session_start` entirely** for short, self-contained sessions with no prior context needed.

---

## MCP Tool → CLI Equivalent

If you don't have MCP available, use the `ar` CLI instead:

| MCP Tool | CLI Command | Notes |
|----------|-------------|-------|
| `session_start` | `ar cold-start` | Loads context for current project |
| `remember` | `ar write "<content>"` | Freeform journal entry. `ar capture "<question>" "<answer>"` for Q&A format |
| `recall` | `ar recall "<query>"` | Search palace + journal. Alias: `ar insight "<query>"` |
| `session_end` | `ar saveall` | Batch-saves all today's sessions; or `ar write "<summary>"` for manual entry |
| `check` | *(no CLI equivalent)* | MCP only — correction tracking via hook-correction hook |
| `digest` | `ar digest recall "<query>"` | Also: `ar digest store`, `ar digest list`. MCP preferred for atomic store+retrieve |

> Note: `ar remember` does not exist. Use `ar write` for freeform notes or `ar capture` for Q&A pairs.

---

## Project Slugs

Projects live at `~/.agent-recall/projects/<slug>/`. Common slugs:
- Run `session_start(project="auto")` to let AgentRecall detect from context
- Or use the explicit slug: `session_start(project="novada-site")`

---

## Notes for the Agent

- Never call `session_start` or `session_end` without the user asking
- For `session_end`, extract 1–3 non-obvious insights from the conversation — not "fixed a bug" but "API returns null on session expiry — always null-check"
- If the user says "save" without context, confirm: "Save to AgentRecall? Which project?"
- Palace is selective — only store decisions, patterns, goal hierarchy. Not full transcripts.
