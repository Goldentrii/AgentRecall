/**
 * Palace-first cold start.
 *
 * v3.4 change: loads palace context FIRST (curated, compressed),
 * journal entries SECOND (raw, temporal). This reduces cold-start
 * token cost from ~800 to ~200 for typical sessions.
 *
 * Return structure:
 *   palace_context: identity + awareness summary + top 3 rooms (~200 tokens)
 *   hot: today/yesterday journals (full state + brief)
 *   warm: 2-7 day journals (count only — details are in palace)
 *   cold: older journals (count only)
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import * as fs from "node:fs";
import * as path from "node:path";
import { resolveProject } from "../storage/project.js";
import { listJournalFiles } from "../helpers/journal-files.js";
import { extractSection } from "../helpers/sections.js";
import { todayISO } from "../storage/fs-utils.js";
import { readState } from "./journal-state.js";
import { palaceDir } from "../storage/paths.js";
import { ensurePalaceInitialized, listRooms } from "../palace/rooms.js";
import { readAwareness, readAwarenessState } from "../palace/awareness.js";
import type { SessionState } from "../types.js";

export function register(server: McpServer): void {
  server.registerTool("journal_cold_start", {
    title: "Cold Start Brief (Palace-First)",
    description:
      "Returns a palace-first cold-start package. " +
      "Loads curated palace context (~200 tokens) FIRST, then recent journals. " +
      "HOT: today + yesterday (full state + brief). " +
      "WARM: 2-7 days (count only — content already promoted to palace). " +
      "COLD: older (count only). " +
      "Designed for minimal context consumption on session start.",
    inputSchema: {
      project: z.string().default("auto"),
    },
  }, async ({ project }) => {
    const slug = await resolveProject(project);
    const entries = listJournalFiles(slug);
    const _today = todayISO();

    // ── Palace context (curated, compressed) ────────────────────────

    let palaceContext: {
      identity: string | null;
      awareness_summary: string | null;
      top_rooms: Array<{ slug: string; name: string; salience: number; description: string }>;
      insight_count: number;
    } = {
      identity: null,
      awareness_summary: null,
      top_rooms: [],
      insight_count: 0,
    };

    try {
      ensurePalaceInitialized(slug);
      const pd = palaceDir(slug);

      // Identity (~50 tokens)
      const identityPath = path.join(pd, "identity.md");
      if (fs.existsSync(identityPath)) {
        palaceContext.identity = fs.readFileSync(identityPath, "utf-8").slice(0, 500);
      }

      // Awareness summary (~100 tokens — first 15 lines)
      const awarenessContent = readAwareness();
      if (awarenessContent) {
        palaceContext.awareness_summary = awarenessContent.split("\n").slice(0, 15).join("\n");
      }

      // Top 3 rooms by salience (~50 tokens)
      const rooms = listRooms(slug);
      palaceContext.top_rooms = rooms.slice(0, 3).map(r => ({
        slug: r.slug,
        name: r.name,
        salience: Math.round(r.salience * 100) / 100,
        description: r.description,
      }));

      // Insight count
      const state = readAwarenessState();
      if (state) {
        palaceContext.insight_count = state.topInsights.length;
      }
    } catch {
      // Palace not initialized — that's fine, journal-only cold start
    }

    // ── Journal entries (raw, temporal) ──────────────────────────────

    const hot: Array<{ date: string; state: SessionState | null; brief: string | null }> = [];
    let warmCount = 0;
    let coldCount = 0;

    for (const entry of entries) {
      const ageMs = Date.now() - new Date(entry.date).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      if (ageDays <= 1.5) {
        // HOT: full state + brief (today/yesterday only)
        const state = readState(slug, entry.date);
        const fullPath = path.join(entry.dir, entry.file);
        const stats = fs.statSync(fullPath);
        const content = stats.size > 5120
          ? fs.readFileSync(fullPath, "utf-8").slice(0, 5120) + "\n...(truncated, use journal_read for full)"
          : fs.readFileSync(fullPath, "utf-8");
        hot.push({
          date: entry.date,
          state,
          brief: extractSection(content, "brief"),
        });
      } else if (ageDays <= 7) {
        // WARM: count only — content should already be in palace rooms
        warmCount++;
      } else {
        // COLD: count only
        coldCount++;
      }
    }

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          project: slug,
          palace_context: palaceContext,
          cache: {
            hot: { count: hot.length, entries: hot },
            warm: { count: warmCount },
            cold: { count: coldCount },
          },
          total_entries: entries.length,
          tip: "Palace context is your curated starting point. HOT entries have today's raw state. Use journal_read for older entries.",
        }),
      }],
    };
  });
}
