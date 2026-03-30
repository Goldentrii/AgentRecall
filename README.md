# Project Journal — AI Session Memory with Quality Loops

> **Give your AI agent a brain that survives every session.**
> Built on the **Intelligent Distance** principle — not making AI more human, but designing protocols that minimize information loss between human and AI intelligence.

[![Version](https://img.shields.io/badge/version-2.0.0-blue?style=flat-square)](https://github.com/Goldentrii/Project-Journal)
[![License](https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Claude_Code-orange?style=flat-square)](https://claude.ai/code)
[![MCP](https://img.shields.io/badge/MCP-Server-5B2D8E?style=flat-square)](#mcp-server)
[![Language](https://img.shields.io/badge/language-EN_%7C_%E4%B8%AD%E6%96%87-blueviolet?style=flat-square)](#)
[![Author](https://img.shields.io/badge/author-Tongwu-crimson?style=flat-square)](https://github.com/Goldentrii)

---

## The Problem

Every time you start a new AI session:
- **"Where were we?"** — 5 minutes re-explaining the project
- **"Why did we choose X?"** — the decision rationale is lost forever
- **"What was that bug?"** — buried in a previous conversation you can't access

**The real cost:** Re-explaining a project = 2,000–5,000 tokens per session. A journal entry = 800 tokens, once.

## The Solution

```
Session 1: Build feature → "save" → journal generated (800 tokens)
Session 2: "Read the latest journal" → agent resumes in 2 seconds
Session 3: Same → full decision history intact, blockers tracked
...
Session N: Complete memory — every decision with WHY, quality tracked
```

---

## Quick Start

### Option 1: Skill (Claude Code)

```bash
mkdir -p ~/.claude/skills/project-journal
curl -o ~/.claude/skills/project-journal/SKILL.md https://raw.githubusercontent.com/Goldentrii/Project-Journal/main/SKILL.md
```

Then say **"save"** at the end of any session. Say **"read the latest journal"** to resume.

### Option 2: MCP Server (any agent — Cursor, VS Code, Windsurf, Claude Desktop)

```bash
# Claude Code
claude mcp add project-journal -- npx -y project-journal-mcp

# Cursor — add to .cursor/mcp.json
{
  "mcpServers": {
    "project-journal": {
      "command": "npx",
      "args": ["-y", "project-journal-mcp"]
    }
  }
}

# VS Code — add to .vscode/mcp.json
{
  "servers": {
    "project-journal": {
      "command": "npx",
      "args": ["-y", "project-journal-mcp"]
    }
  }
}
```

---

## How It Works

### Two-Layer Memory System

| | Layer 1: Quick Capture | Layer 2: Daily Journal |
|---|---|---|
| **When** | Per turn (auto or manual) | On "save" |
| **What** | Q&A pairs, file edits, errors | 10-section structured report |
| **Cost** | ~50 tokens/entry | ~800 tokens total |
| **Format** | Append-only log | Full journal with quality loop |

### Cold-Start Brief

Every journal starts with a 5-row table — **any agent reads this and knows everything in 2 seconds:**

```markdown
| 🧠 Project | TaskFlow — Todo + Pomodoro app (React Native) |
|---------|---------------------------------------------------|
| 🗺️ Big pic | MVP 60% complete. iOS cert blocking TestFlight. |
| 📋 Last    | Notification flow + Android background fix       |
| 🔴 Next    | Renew Apple Developer certificate                |
| ⚡ Momentum | 🟢 Accelerating — closed 2 bugs                  |
```

---

## v2.0 — Think-Execute-Reflect Quality Loop

Section 7 is now a **structured quality cycle**, not a flat list:

```
🧠 THINK ──→ ⚡ EXECUTE ──→ 🔍 REFLECT ──→ 🔄 FEEDBACK
   │                                              │
   └──────────── LOOP (if quality < threshold) ───┘
                     │
              EXIT (if quality passes)
```

| Phase | What It Does |
|-------|-------------|
| 🧠 **Think** | Was the goal SMART? Research done? Plan existed? Risks identified? |
| ⚡ **Execute** | Planned vs actual — where's the gap? |
| 🔍 **Reflect** | 5-dimension self-score (1-5) + external review + Intelligent Distance gap |
| 🔄 **Feedback** | **EXIT** or **LOOP**. Memory promotion? SOP updates? |

**If everything was perfect**, Reflect is one line: *"No gap. Goal achieved."*

### Self-Score Example

```markdown
| Dimension              | Score | Evidence                                |
|------------------------|-------|-----------------------------------------|
| Research before build  | 4/5   | Checked 2 competitors, missed 1         |
| Plan quality           | 5/5   | 16-step plan, followed exactly          |
| Execution alignment    | 4/5   | Drifted on CSS, self-corrected          |
| Verification           | 3/5   | No pixel diff before publish            |
| Code quality           | 4/5   | Typed interfaces, some `any` remaining  |
```

---

## v2.0 — Memory Lifecycle

Memories are living documents with a full lifecycle:

| Feature | How It Works |
|---------|-------------|
| **Auto-promotion** | Journal insight appears 3+ times → becomes permanent memory |
| **Confidence** | Each memory: `high` / `medium` / `low` |
| **Verification** | >14 days unverified → flagged on resume |
| **Cross-references** | `related: [other-memories.md]` creates a knowledge graph |
| **Deprecation** | Outdated → marked deprecated, removed from index, kept for history |

---

## Journal Sections (10 total)

| # | Section | What It Captures |
|---|---------|-----------------|
| 1 | **Key Q&A** | Meaningful decisions from today |
| 2 | **Completed Work** | What was built + file paths + WHY |
| 3 | **Project Status** | Module-by-module ✅/❌/🚧 |
| 4 | **Known Issues** | Blockers by priority 🔴/🟡/🟢 |
| 5 | **Next Session Todo** | What to do next + repetition tracking ⏱ |
| 6 | **Decision Record** | WHY each decision was made + reversal conditions |
| 7 | **Quality Loop** | Think → Execute → Reflect → Feedback (v2.0) |
| 8 | **Files & Commands** | Quick reference paths and bash commands |
| 9 | **Agent Observations** | What the AI noticed that the human didn't |
| 10 | **Cross-Project** | Insights to promote to global memory |

---

## MCP Server

6 tools for reading, writing, and searching journals from any MCP-compatible agent:

| Tool | Description |
|------|-------------|
| `journal_read` | Read entry by date or "latest". Filter by section (brief, decisions, blockers...) |
| `journal_write` | Write or update journal content by section |
| `journal_capture` | Lightweight one-liner Q&A capture (Layer 1) |
| `journal_list` | List recent entries for a project |
| `journal_search` | Full-text search across all journal history |
| `journal_projects` | List all tracked projects on this machine |

```bash
# Cold-start (minimal tokens)
journal_read(date="latest", section="brief")

# Quick capture during work
journal_capture(question="Why Neon over Supabase?", answer="Serverless Postgres + branching")

# Find a past decision
journal_search(query="database choice")
```

See [MCP Adapter Spec](docs/mcp-adapter-spec.md) for full tool schemas.

---

## The Intelligent Distance Principle

The design philosophy behind this skill.

**The gap between human and AI intelligence is structural and permanent.** Humans are born (embodied experience). AI is trained (statistical patterns). These produce fundamentally different ways of understanding reality.

**The fix isn't "communicate better." It's design protocols that eliminate interpretation.**

This skill implements Intelligent Distance in three ways:

1. **Format** — One file for both human scanning (emoji, headers) and agent parsing (YAML summary, fixed anchors)
2. **Behavior** — Section 9 is where the agent records the invisible gap between what was said and what was meant
3. **Quality loop** — Section 7 forces the agent to measure its own accuracy before claiming "done"

### The "Just Ask" Rule

Humans are inconsistent, forget multi-step details, and communicate in scattered bursts. When the agent is confused: **ask.** A 5-second clarifying question beats 30 minutes of wrong work.

---

## Supported Agents

| Agent | Skill | MCP |
|-------|:-----:|:---:|
| Claude Code | ✅ | ✅ |
| Cursor | ⚡ | ✅ |
| VS Code Copilot | — | ✅ |
| Windsurf | ⚡ | ✅ |
| Claude Desktop | — | ✅ |
| OpenClaw | ✅ | ✅ |
| Any MCP agent | — | ✅ |

---

## Real Results

Validated over **20+ sessions** across production projects:

- Cold-start: **5 minutes → 2 seconds**
- Decision history: **0% retained → 100%**
- Cross-session context: agents pick up exactly where they left off
- Quality loop caught **4 code review gaps** that would have shipped

---

## Contributing

This skill improves through use and feedback:

1. **Install & use** for a week → [report what works and what's missing](https://github.com/Goldentrii/Project-Journal/issues)
2. **Suggest improvements** to the quality loop or memory lifecycle
3. **Share (anonymized) journal examples** to help improve the format
4. **Build adapters** for new agents

---

## License

MIT

*Concept & Design: [Tongwu](https://github.com/Goldentrii)*
*The structural gap between human and AI intelligence is permanent. Design protocols around it, don't try to close it.*
