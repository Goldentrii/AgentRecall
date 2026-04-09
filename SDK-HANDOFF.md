# AgentRecall SDK — Handoff for Executing Agent

> Read this ENTIRE file before writing any code. Then read the full execution plan.

## Your Mission

Transform AgentRecall from a single `mcp-server/` package into a monorepo with 4 packages:
- `@agent-recall/core` — shared business logic (palace, awareness, journal, storage)
- `agent-recall-mcp` — thin MCP wrappers calling core (existing users must not break)
- `agent-recall` — SDK with `AgentRecall` class for programmatic use
- `@agent-recall/cli` — `ar` command for terminal use

## Files to Read First

Before touching ANY code, read these files to understand the codebase:

### Must-read (architecture understanding)
1. `docs/sdk-execution-plan.md` — **THE PLAN. Read every line.** Contains monorepo structure, API design, phase breakdown, file paths, trade-off decisions.
2. `mcp-server/src/types.ts` — All interfaces + `JOURNAL_ROOT` constant (must refactor to `getRoot()`)
3. `mcp-server/src/index.ts` — MCP entrypoint, 22 tool registrations, CLI flags
4. `mcp-server/tsconfig.json` — Current compiler options
5. `mcp-server/package.json` — Current dependencies, scripts, version

### Must-read (core logic you're extracting)
6. `mcp-server/src/palace/rooms.ts` — Room CRUD, ensurePalaceInitialized
7. `mcp-server/src/palace/awareness.ts` — 200-line compounding system, addInsight merge logic
8. `mcp-server/src/palace/fan-out.ts` — Wikilink cross-reference auto-update
9. `mcp-server/src/palace/salience.ts` — Scoring formula
10. `mcp-server/src/palace/graph.ts` — Edge management
11. `mcp-server/src/storage/paths.ts` — Directory resolution (JOURNAL_ROOT usage)
12. `mcp-server/src/storage/fs-utils.ts` — readJsonSafe, writeJsonAtomic, ensureDir
13. `mcp-server/src/helpers/journal-files.ts` — listJournalFiles, updateIndex

### Must-read (tool files you're splitting)
14. `mcp-server/src/tools/journal-rollup.ts` — NEW in v3.4, has exported helper functions
15. `mcp-server/src/tools/journal-cold-start.ts` — NEW in v3.4, palace-first cold start
16. `mcp-server/src/tools/context-synthesize.ts` — Complex, reads journals + writes to palace
17. `mcp-server/src/tools/palace-write.ts` — Fan-out + salience recalculation

### Must-read (test patterns)
18. `mcp-server/test/rooms.test.mjs` — Shows how tests set `process.env.AGENT_RECALL_ROOT` to temp dirs
19. `mcp-server/test/awareness.test.mjs` — Shows merge threshold behavior

## Critical Technical Details

### ESM Imports
This is an ESM project (`"type": "module"`). ALL imports must have `.js` extensions:
```typescript
// CORRECT
import { readJsonSafe } from "../storage/fs-utils.js";
// WRONG — will fail at runtime
import { readJsonSafe } from "../storage/fs-utils";
```

### JOURNAL_ROOT Refactor (Most Dangerous Step)
`mcp-server/src/types.ts` has:
```typescript
export const JOURNAL_ROOT = process.env.AGENT_RECALL_ROOT || path.join(os.homedir(), ".agent-recall");
```
This is evaluated at module load time. The SDK needs to configure root at runtime. Change to:
```typescript
let _root: string | null = null;
export function setRoot(root: string): void { _root = root; }
export function getRoot(): string {
  return _root ?? process.env.AGENT_RECALL_ROOT ?? path.join(os.homedir(), ".agent-recall");
}
```
Then find-and-replace ALL references to `JOURNAL_ROOT` with `getRoot()` across all files. There are ~15 call sites. Missing one = silent bug (writes to wrong directory).

### Zod Import Pattern
Tool files use `import * as z from "zod/v4"` (not `from "zod"`). The `/v4` subpath is important.

### Test Pattern
All tests use `node:test` (built-in Node test runner), NOT vitest or jest:
```javascript
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
```
Tests set `process.env.AGENT_RECALL_ROOT` in `before()` and clean up temp dirs in `after()`.

### npm Workspaces
Root `package.json` needs:
```json
{
  "private": true,
  "workspaces": ["packages/*"]
}
```
Run commands with `-w` flag: `npm run build -w packages/core`

### TypeScript Project References
Each package's `tsconfig.json` should extend the base:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

## Phase Execution Order

Execute STRICTLY in order. Commit after each phase. Run tests at every checkpoint.

| Phase | Gate (must pass before moving on) |
|-------|----------------------------------|
| 1. Monorepo + core extraction | `npm test -w packages/core` — all 65 tests pass |
| 2. Extract tool logic | `npm test -w packages/core` — 65 + ~30 new tests pass |
| 3. Rebuild MCP server | `node packages/mcp-server/dist/index.js --list-tools` shows 22 tools |
| 4. Build SDK | `npm test -w packages/sdk` — all SDK tests pass |
| 5. Build CLI | `npm test -w packages/cli` — all CLI tests pass |
| 6. Integration + publish | `npm run build && npm run test` at root — everything green |

## What NOT to Do

- Do NOT change any business logic. This is a restructure, not a feature change.
- Do NOT add new dependencies.
- Do NOT skip reading the plan doc — it has exact file paths and interface signatures.
- Do NOT publish to npm until Phase 6 (all tests must pass first).
- Do NOT delete the old `mcp-server/` directory until Phase 3 is verified.
- Do NOT change function signatures in core — only move files and update imports.

## Verification Commands

```bash
# Phase 1
cd /Users/tongwu/Projects/AgentRecall
npm run build -w packages/core && npm test -w packages/core

# Phase 3
node packages/mcp-server/dist/index.js --list-tools

# Phase 4
npm test -w packages/sdk

# Full
npm run build && npm run test
```

## Contact

- GitHub: github.com/Goldentrii/AgentRecall
- Feedback: tong.wu@novada.com
