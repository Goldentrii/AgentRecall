---
description: "AgentRecall bootstrap — discover and import existing projects from your machine into AgentRecall."
---

# /arbootstrap — AgentRecall Bootstrap

Import existing projects from your machine into AgentRecall. Solves the cold-start problem: new install, empty `/arstatus`, but you already have git repos and Claude memory everywhere.

## When to Use

- First time installing AgentRecall
- `/arstatus` shows an empty board
- You've been working on projects without AR and want to backfill

## Process

### Step 1: Scan

Call `bootstrap_scan()` via MCP. This is read-only — no writes.

```
bootstrap_scan()
```

This returns:
- All git repos found in `~/Projects/`, `~/work/`, `~/code/`, `~/dev/`, `~/src/`, `~/repos/`, `~/github/`
- Claude AutoMemory files from `~/.claude/projects/`
- CLAUDE.md files in project roots
- Which projects are already in AgentRecall (skipped on import)

### Step 2: Show the scan card

Render a card for the human:

```
──────────────────────────────────────────────────────────────
  AgentRecall  Bootstrap Scan          YYYY-MM-DD
──────────────────────────────────────────────────────────────

  Found on your machine:
      N git repos
      N Claude memory files
      N CLAUDE.md files

  Projects:
      N new (not yet in AgentRecall)
      N already imported

  Scan time: Nms
──────────────────────────────────────────────────────────────
```

Then list the top 10 new projects:
```
  New projects found:
   1  project-slug           Language       YYYY-MM-DD   git+claude-memory
   2  another-project        TypeScript     YYYY-MM-DD   git
   ...
```

### Step 3: Ask the human

Present options:
- **Import all** — import every new project
- **Select** — human picks which projects to import (by number or slug)
- **Skip** — don't import anything

### Step 4: Import

If the human confirms, call `bootstrap_import` with the scan results.

For "import all":
```
bootstrap_import({
  scan_result: "<JSON from bootstrap_scan>",
})
```

For selective import:
```
bootstrap_import({
  scan_result: "<JSON from bootstrap_scan>",
  project_slugs: ["project-a", "project-b"]
})
```

### Step 5: Show results

```
──────────────────────────────────────────────────────────────
  AgentRecall  Bootstrap Complete      YYYY-MM-DD
──────────────────────────────────────────────────────────────

  N projects created
  N items imported
  N items skipped
  N errors

  Run /arstatus to see your projects.
──────────────────────────────────────────────────────────────
```

## What Gets Imported Per Project

- **identity** — palace identity.md from project name + description + language
- **memory** — Claude AutoMemory .md files from `~/.claude/projects/` → palace knowledge room
- **architecture** — CLAUDE.md content → palace architecture room
- **trajectory** — recent git log → initial journal entry

## Safety

- Scan is read-only — never writes anywhere
- Import only writes to `~/.agent-recall/` — never modifies your source files
- Skips `.env`, credentials, `.pem`, `.key` — never reads secrets
- Projects already in AgentRecall are skipped (no double-import)

## CLI Equivalent

If MCP tools aren't available, use the `ar` CLI:
```bash
ar bootstrap                    # scan and show results
ar bootstrap --dry-run          # preview what would be imported
ar bootstrap --import           # import all new projects
ar bootstrap --import --project my-app  # import one project
```

## Important Rules

- **Scan first, import second.** Always show the scan results and get human consent before importing.
- **Don't import silently.** The human must see what will be imported and confirm.
- **One bootstrap per install.** If already ran, say so and offer to re-scan for new projects.
