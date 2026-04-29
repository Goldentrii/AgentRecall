# Upgrade Guide: v3.3.0

## What's New

### Semantic Recall — Supabase pgvector Backend (optional)

Default keyword recall is unchanged. Configure Supabase to upgrade to cosine similarity on real embeddings.

```bash
ar setup supabase          # interactive wizard
ar setup supabase --migrate  # apply pgvector migration
ar setup supabase --backfill # re-embed all local memories
```

Supports OpenAI `text-embedding-3-small` (1536 dims) and Voyage `voyage-3-lite` (512 dims, zero-padded to 1536). Local files remain the source of truth — Supabase is a derived read index.

Graceful degradation: if Supabase is unreachable, `recall()` falls back to local keyword search silently.

### 10 MCP Tools (was 6)

Four new tools added to the MCP server:

| Tool | What it does |
|------|-------------|
| `project_board` | Status board across all projects (equivalent to `/arstatus`) |
| `project_status` | Deep status for a single project |
| `bootstrap_scan` | Scan machine for existing git repos, Claude AutoMemory, CLAUDE.md files |
| `bootstrap_import` | Import discovered projects into AgentRecall |

### Palace Decisions Room

A new `decisions` room is now included in the default palace: `DEFAULT_PALACE_ROOMS`. Tracks decision trails with prior/posterior tracking, evidence chains, and outcomes. Bayesian-inspired audit trail for major decisions.

Projects created before v3.3.0 will have the `decisions` room auto-created on next palace initialization.

### Awareness Cap Updated

Awareness insight cap increased from 15 to 20. Existing awareness files are unaffected.

## Migration

No breaking changes. All existing data, palace rooms, journals, and awareness files are compatible with v3.3.0.

If you use the Supabase backend, run `ar setup supabase --backfill` to embed existing memories.

## Package Versions

All packages updated to `3.3.0`:
- `agent-recall-mcp@3.3.0`
- `agent-recall-sdk@3.3.0`
- `agent-recall-cli@3.3.0`
- `agent-recall-core@3.3.0`
