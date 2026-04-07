<p align="center">
  <h1 align="center">agent-recall-mcp</h1>
  <p align="center"><strong>Give your AI agent a brain that survives every session.</strong></p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/agent-recall-mcp"><img src="https://img.shields.io/npm/v/agent-recall-mcp?style=flat-square&color=5D34F2" alt="npm"></a>
  <a href="https://github.com/NovadaLabs/AgentRecall/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/MCP-12_tools-orange?style=flat-square" alt="MCP Tools">
  <img src="https://img.shields.io/badge/node-%3E%3D18-green?style=flat-square" alt="Node">
  <img src="https://img.shields.io/badge/cloud-zero-blue?style=flat-square" alt="Zero Cloud">
</p>

<p align="center">
  MCP server for persistent agent memory — session journals, structured JSON state,<br>
  Think-Execute-Reflect quality loops, cache-aware cold start, and alignment detection.<br>
  Works with <strong>Claude Code, Cursor, VS Code Copilot, Windsurf, Claude Desktop</strong>, and any MCP client.
</p>

<p align="center"><strong>Zero cloud. Zero telemetry. All data stays on your machine.</strong></p>

---

## Why AgentRecall?

| Problem | How AgentRecall Solves It |
|---------|--------------------------|
| Agent forgets everything between sessions | Three-layer memory persists state across sessions |
| Agent repeats the same mistakes | Failures section + feedback promotion catches patterns |
| Agent says "done" when it's not | Think-Execute-Reflect loop with quality scoring |
| Cold start takes too long (28 journal files) | Cache-aware cold start: hot/warm/cold in <1 second |
| Human has to explain context every time | JSON state layer transfers context agent-to-agent |
| No one knows what the agent actually did | Structured counts: "built 11 pages, 35 tabs" not "went well" |

---

## Quick Start

### Claude Code

```bash
claude mcp add agent-recall -- npx -y agent-recall-mcp
```

### Cursor

`.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "agent-recall": {
      "command": "npx",
      "args": ["-y", "agent-recall-mcp"]
    }
  }
}
```

### VS Code / Windsurf / Claude Desktop

Same pattern — add `npx -y agent-recall-mcp` as an MCP server command.

---

## 12 Tools

### Session Memory (6 tools)

| Tool | What it does |
|------|-------------|
| `journal_read` | Read entry by date or `"latest"`. Filter by section. |
| `journal_write` | Append to or replace today's journal. |
| `journal_capture` | Lightweight Q&A capture — one question + answer, tagged. |
| `journal_list` | List recent entries (date, title, momentum). |
| `journal_search` | Full-text search across all entries. |
| `journal_projects` | List all tracked projects on this machine. |

### v3 Architecture (3 tools) — NEW in v2.1.1

| Tool | What it does |
|------|-------------|
| `journal_state` | **Layer 1 JSON state** — read/write structured session data. Agent-to-agent handoffs use JSON (milliseconds, no prose parsing). |
| `journal_cold_start` | **Cache-aware cold start** — HOT (today+yesterday, full state), WARM (2-7 days, brief only), COLD (older, count only). Loads 3 files instead of 28. |
| `journal_archive` | **Archive old entries** — moves entries older than N days to `archive/` with one-line summaries. Keeps journal/ clean. |

### Alignment & Synthesis (3 tools)

| Tool | What it does |
|------|-------------|
| `alignment_check` | Record understanding, confidence, assumptions, and human corrections. |
| `nudge` | Surface contradictions between current input and prior decisions. |
| `context_synthesize` | Cross-session synthesis — goal evolution, decision history, patterns. |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Session                             │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ L1: Working   │  │ L2: Journal  │  │ L3: Synthesis    │  │
│  │ Memory        │  │ (daily)      │  │ (cross-session)  │  │
│  │ ~50 tokens    │  │ ~800 tokens  │  │ ~200 tokens      │  │
│  │               │  │              │  │                  │  │
│  │ journal_      │  │ journal_     │  │ context_         │  │
│  │ capture       │  │ write/read   │  │ synthesize       │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │ synthesized      │ synthesized        │            │
│         └────────►─────────┘────────►───────────┘            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ v3: JSON State Layer (agent-to-agent, no prose)      │   │
│  │ journal_state → .state.json alongside .md            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ v3: Cache Layer (hot/warm/cold)                      │   │
│  │ journal_cold_start → loads 3 files, not 28           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Cache-Aware Cold Start (v3)

```
┌─ HOT (0-1 day) ─────────────────────────────────┐
│ Full JSON state + brief from markdown            │
│ → Everything the next agent needs                │
└──────────────────────────────────────────────────┘
         ↓
┌─ WARM (2-7 days) ────────────────────────────────┐
│ Brief summary only (first 2KB of journal)        │
│ → "What happened this week" context              │
└──────────────────────────────────────────────────┘
         ↓
┌─ COLD (7+ days) ─────────────────────────────────┐
│ Count only. Use journal_read for full content.   │
│ Use journal_archive to move to archive/ folder.  │
└──────────────────────────────────────────────────┘
```

---

## JSON State (v3) — Agent-to-Agent Format

```json
{
  "version": "2.1.1",
  "date": "2026-04-07",
  "project": "my-project",
  "completed": [
    { "task": "built dashboard", "result": "11 pages, 35 tabs" }
  ],
  "failures": [
    { "task": "extraction", "what_went_wrong": "missed sub-tabs", "root_cause": "context fatigue", "fixed": true }
  ],
  "state": {
    "genome": { "status": "v3.2", "details": "8 dimensions" }
  },
  "next_actions": [
    { "priority": "P0", "task": "verify against real site" }
  ],
  "insights": [
    { "claim": "extraction quality = replication quality", "confidence": "high", "evidence": "4 sites tested" }
  ],
  "counts": { "pages": 91, "tabs": 35, "api_routes": 3 }
}
```

The next agent reads this in milliseconds. No prose parsing. No ambiguity.

---

## Storage

```
~/.agent-recall/
└── projects/
    └── {project}/
        └── journal/
            ├── index.md                  ← auto-generated
            ├── 2026-04-07.md             ← L2: daily journal (markdown)
            ├── 2026-04-07.state.json     ← v3: structured state (JSON)
            ├── 2026-04-07-log.md         ← L1: raw Q&A capture
            ├── 2026-04-07-alignment.md   ← alignment checks
            └── archive/                  ← v3: cold storage
                ├── index.md              ← one-line summaries
                └── 2026-03-25.md         ← archived entries
```

---

## Think-Execute-Reflect Loop

Every session follows a structured quality cycle:

```
🧠 THINK    → Was the approach right? Was research done?
⚡ EXECUTE  → What happened vs what was planned? (use COUNTS, not feelings)
🔍 REFLECT  → 5-dimension quality score + Intelligent Distance gap analysis
🔄 FEEDBACK → Loop (needs iteration) or Exit (quality sufficient)
```

**New in v2.1.1:** The Execute section requires COUNTS:
> "Built 11 pages, 35 tabs, verified 82/91 routes return 200" — not "went well"

**New in v2.1.1:** Failures section records what was ATTEMPTED and FAILED:
> Not just successes. Failures are more valuable for learning.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_RECALL_ROOT` | `~/.agent-recall` | Storage root directory |
| `AGENT_RECALL_PROJECT` | (auto-detect) | Override project slug |

---

## CLI

```bash
npx agent-recall-mcp              # Start MCP server (stdio)
npx agent-recall-mcp --help       # Show help
npx agent-recall-mcp --list-tools # List all 12 tools as JSON
```

---

## Feedback & Contributing

Built by [tongwu](https://github.com/Goldentrii) at [NovadaLabs](https://github.com/NovadaLabs).

**We'd love your feedback.** If you're using AgentRecall, tell us what works and what doesn't:

- Email: tongwu0824@gmail.com
- GitHub Issues: [NovadaLabs/AgentRecall](https://github.com/NovadaLabs/AgentRecall/issues)

---

## License

MIT

---

---

# agent-recall-mcp（中文文档）

> 给你的 AI 智能体一个跨会话记忆的大脑。

MCP 服务器 — 双层会话记忆 + v3 JSON 状态层 + 缓存感知冷启动 + Think-Execute-Reflect 质量循环。兼容所有 MCP 客户端。

**零云端。零遥测。所有数据保存在本地。**

---

## 快速开始

```bash
# Claude Code
claude mcp add agent-recall -- npx -y agent-recall-mcp

# Cursor: .cursor/mcp.json
{ "mcpServers": { "agent-recall": { "command": "npx", "args": ["-y", "agent-recall-mcp"] } } }
```

---

## 12 个工具

### 会话记忆（6 个）

| 工具 | 功能 |
|------|------|
| `journal_read` | 按日期读取日志，支持章节过滤 |
| `journal_write` | 追加或替换今日日志 |
| `journal_capture` | 轻量问答捕获 |
| `journal_list` | 列出最近日志 |
| `journal_search` | 全文搜索 |
| `journal_projects` | 列出所有项目 |

### v3 架构（3 个）— v2.1.1 新增

| 工具 | 功能 |
|------|------|
| `journal_state` | **JSON 状态层** — 结构化读写，agent 间毫秒级交接 |
| `journal_cold_start` | **缓存感知冷启动** — 热/温/冷三级，加载 3 个文件而非 28 个 |
| `journal_archive` | **归档旧条目** — 移至 archive/，保留单行摘要 |

### 对齐 & 合成（3 个）

| 工具 | 功能 |
|------|------|
| `alignment_check` | 记录理解度、置信度、人类纠正 |
| `nudge` | 检测矛盾，主动提问 |
| `context_synthesize` | 跨会话合成：目标演变、决策历史、模式检测 |

---

## 核心理念

**记忆解决遗忘，AgentRecall 解决误解。**

人类和 AI 之间的理解差距是结构性的 — 人类说话前后矛盾、碎片化、含糊不清；AI 则以完美的自信构建错误的东西。AgentRecall 通过对齐检测、矛盾提醒和跨会话合成来弥合这个「智能距离」。

---

## 许可证

MIT — [tongwu](https://github.com/Goldentrii) @ [NovadaLabs](https://github.com/NovadaLabs)

反馈邮箱：tongwu0824@gmail.com
