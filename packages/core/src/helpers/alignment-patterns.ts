/**
 * Shared alignment pattern detection — used by both check.ts and session-start.ts.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { getRoot } from "../types.js";
import { extractKeywords } from "./auto-name.js";

export interface AlignmentRecord {
  date: string;
  goal: string;
  confidence: string;
  assumptions: string[];
  corrections?: string[];
  delta?: string;
}

export interface WatchForPattern {
  pattern: string;
  frequency: number;
  suggestion: string;
}

export function readAlignmentLog(project: string): AlignmentRecord[] {
  const p = path.join(getRoot(), "projects", project, "alignment-log.json");
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return []; }
}

export function extractWatchPatterns(records: AlignmentRecord[], limit: number = 3): WatchForPattern[] {
  const correctionCounts = new Map<string, { count: number; examples: string[] }>();

  for (const past of records) {
    const corrections = [...(past.corrections ?? [])];
    if (past.delta) corrections.push(past.delta);
    for (const c of corrections) {
      const cKeywords = extractKeywords(c, 2);
      const key = cKeywords.join("-") || "general";
      const entry = correctionCounts.get(key) ?? { count: 0, examples: [] };
      entry.count++;
      if (entry.examples.length < 2) entry.examples.push(c.slice(0, 80));
      correctionCounts.set(key, entry);
    }
  }

  const patterns: WatchForPattern[] = [];
  for (const [, { count, examples }] of correctionCounts) {
    if (count >= 2) {
      // Use the actual correction text as the pattern, not the keyword key
      // The keyword key is only for grouping — not meaningful to display
      const displayText = examples[0].slice(0, 80);
      patterns.push({
        pattern: displayText,
        frequency: count,
        suggestion: `Corrected ${count} times — review your approach before proceeding`,
      });
    }
  }

  return patterns.sort((a, b) => b.frequency - a.frequency).slice(0, limit);
}
