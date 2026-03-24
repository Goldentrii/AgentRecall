# project-journal MCP Adapter — Interface Specification

> **Status**: Design Draft v0.1 · Author: Goldentrii · Date: 2026-03-24
>
> This document defines the MCP server interface that will make project-journal
> natively available to any MCP-compatible coding agent (Cursor, Windsurf, GitHub Copilot, etc.)
> without requiring SKILL.md installation.

---

## Overview

The project-journal MCP server exposes journal read/write operations as MCP tools.
An IDE agent connects once; from then on, it can capture session notes and resume
from previous context using standard MCP calls — no manual skill installation needed.

```
IDE Agent (Cursor/Windsurf/etc.)
    │
    ▼
MCP Client (built into IDE)
    │
    ▼  stdio / HTTP transport
MCP Server: project-journal-mcp
    │
    ▼
~/.project-journal/
    ├── config.json
    └── projects/
        └── {project-slug}/
            └── journal/
                ├── index.md
                └── YYYY-MM-DD.md
```

---

## MCP Server Identity

```json
{
  "name": "project-journal",
  "version": "1.0.0",
  "description": "Two-layer AI session memory — read, write, and navigate project journals",
  "transport": ["stdio", "http"]
}
```

---

## Tools

### 1. `journal_read`

Read a journal entry. Returns the full file content for agent cold-start.

**Input schema**:
```json
{
  "type": "object",
  "properties": {
    "date": {
      "type": "string",
      "description": "ISO date string YYYY-MM-DD. Defaults to today. Use 'latest' for most recent entry.",
      "default": "latest"
    },
    "project": {
      "type": "string",
      "description": "Project slug (directory name under ~/.project-journal/projects/). Defaults to current git repo name.",
      "default": "auto"
    },
    "section": {
      "type": "string",
      "enum": ["all", "brief", "qa", "completed", "status", "blockers", "next", "decisions", "reflection", "files", "observations"],
      "description": "Which section to return. 'brief' returns only the cold-start summary (3 sentences + momentum). 'all' returns full file.",
      "default": "all"
    }
  }
}
```

**Output**: `{ "content": "<markdown string>", "date": "YYYY-MM-DD", "project": "<slug>" }`

**Usage pattern**:
```
# Fast cold-start (minimal tokens):
journal_read(section="brief")

# Full context resume:
journal_read(date="latest", section="all")

# Check what's blocked:
journal_read(section="blockers")
```

---

### 2. `journal_write`

Append content to the current journal entry (creates today's file if absent).

**Input schema**:
```json
{
  "type": "object",
  "required": ["content"],
  "properties": {
    "content": {
      "type": "string",
      "description": "Markdown content to append. For Layer 1 captures: Q&A pair. For Layer 2: full 9-section journal."
    },
    "section": {
      "type": "string",
      "enum": ["qa", "completed", "blockers", "next", "decisions", "observations", "replace_all"],
      "description": "Target section. If omitted, appends to end of file. 'replace_all' overwrites entire file (use for full Layer 2 journal generation).",
      "default": null
    },
    "project": {
      "type": "string",
      "default": "auto"
    }
  }
}
```

**Output**: `{ "success": true, "date": "YYYY-MM-DD", "file": "<absolute path>" }`

---

### 3. `journal_capture`

Layer 1: lightweight Q&A capture. Optimized for single-turn logging without loading the full journal.

**Input schema**:
```json
{
  "type": "object",
  "required": ["question", "answer"],
  "properties": {
    "question": {
      "type": "string",
      "description": "The human's question or request (summarized, 1 sentence)"
    },
    "answer": {
      "type": "string",
      "description": "The agent's key answer or decision (summarized, 1-2 sentences)"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Optional tags for this entry (e.g. ['decision', 'bug-fix', 'architecture'])"
    },
    "project": {
      "type": "string",
      "default": "auto"
    }
  }
}
```

**Output**: `{ "success": true, "entry_number": 12 }`

**Storage**: Appends to `journal/YYYY-MM-DD-log.md` (raw turn-by-turn log, separate from the daily journal).

---

### 4. `journal_list`

List available journal entries for a project.

**Input schema**:
```json
{
  "type": "object",
  "properties": {
    "project": {
      "type": "string",
      "default": "auto"
    },
    "limit": {
      "type": "integer",
      "description": "Return the N most recent entries. 0 = all.",
      "default": 10
    }
  }
}
```

**Output**:
```json
{
  "project": "taskflow",
  "entries": [
    { "date": "2026-03-24", "title": "README 重构 + MCP roadmap", "momentum": "🟢 加速" },
    { "date": "2026-03-20", "title": "Initial architecture", "momentum": "🟡 稳定" }
  ]
}
```

---

### 5. `journal_projects`

List all projects tracked by project-journal on this machine.

**Input schema**: `{}` (no parameters)

**Output**:
```json
{
  "projects": [
    { "slug": "taskflow", "last_entry": "2026-03-24", "entry_count": 12 },
    { "slug": "novada-web", "last_entry": "2026-03-22", "entry_count": 8 }
  ],
  "journal_root": "~/.project-journal"
}
```

---

### 6. `journal_search`

Full-text search across all journal entries for a project.

**Input schema**:
```json
{
  "type": "object",
  "required": ["query"],
  "properties": {
    "query": {
      "type": "string",
      "description": "Search term (plain text, case-insensitive)"
    },
    "project": {
      "type": "string",
      "default": "auto"
    },
    "section": {
      "type": "string",
      "description": "Limit search to a specific section type",
      "default": null
    }
  }
}
```

**Output**:
```json
{
  "results": [
    {
      "date": "2026-03-20",
      "section": "decisions",
      "excerpt": "...decided to use Neon for database, Clerk for auth...",
      "line": 47
    }
  ]
}
```

---

## Resources

The MCP server also exposes the journal index as a **Resource**, so agents can browse it
without calling a tool:

```
resource://project-journal/{project-slug}/index
resource://project-journal/{project-slug}/{YYYY-MM-DD}
```

---

## Transport Configuration

### stdio (recommended for local dev)

```json
// .cursor/mcp.json or equivalent IDE config
{
  "mcpServers": {
    "project-journal": {
      "command": "npx",
      "args": ["project-journal-mcp"]
    }
  }
}
```

### HTTP (for remote / team use)

```
GET  /mcp/tools          → list tools
POST /mcp/call/{tool}    → invoke tool
GET  /mcp/resources      → list resources
GET  /mcp/resources/{id} → read resource
```

Authentication: Bearer token (personal, stored in `~/.project-journal/config.json`).

---

## Project Auto-Detection

When `project = "auto"`, the server resolves the current project by:

1. Reading `process.env.PROJECT_JOURNAL_PROJECT` if set
2. Walking up from `process.cwd()` to find `.git/` directory → use repo name
3. Walking up to find `package.json` or `pyproject.toml` → use `name` field
4. Falling back to the basename of `process.cwd()`

---

## File Layout on Disk

```
~/.project-journal/           (or $PROJECT_JOURNAL_ROOT)
├── config.json               ← server config, default project, auth tokens
└── projects/
    └── {slug}/
        └── journal/
            ├── index.md              ← master index (human-readable)
            ├── YYYY-MM-DD.md         ← Layer 2: full 9-section daily journal
            └── YYYY-MM-DD-log.md     ← Layer 1: raw turn-by-turn capture
```

---

## Backward Compatibility

For users who already have journals at `~/.claude/skills/project-journal/journal/`,
the server reads both locations and merges the index transparently.
New writes go to `~/.project-journal/` by default.

Migration tool: `npx project-journal-mcp migrate` — copies existing journals to new layout.

---

## Implementation Notes

- **Language**: TypeScript (Node.js) — matches MCP SDK ecosystem
- **MCP SDK**: `@modelcontextprotocol/sdk` (official)
- **Package name**: `project-journal-mcp`
- **npm publish**: `@goldentrii/project-journal-mcp` or unscoped `project-journal-mcp`
- **Minimal dependencies**: only `@modelcontextprotocol/sdk` + Node stdlib
- **Zero cloud**: all data stays local by default; no telemetry

---

## Open Questions (to decide before implementation)

| # | Question | Options | Notes |
|---|----------|---------|-------|
| 1 | Package name on npm | `project-journal-mcp` vs `@goldentrii/project-journal-mcp` | Unscoped is discoverable |
| 2 | Storage root | `~/.project-journal` vs `~/.config/project-journal` | XDG compliance vs simplicity |
| 3 | Layer 1 log format | Append to `.md` vs SQLite for search | SQLite enables `journal_search` efficiently |
| 4 | Multi-user / team | Local-only first, then optional sync? | Out of scope v1 |
| 5 | Prompts | Expose MCP Prompts for cold-start templates? | Nice to have — reusable "resume session" prompt |
