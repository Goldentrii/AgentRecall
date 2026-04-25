/**
 * Cross-project insights index.
 *
 * A single JSON file mapping insights to situations.
 * When an agent starts a task, it can query: "what insights apply here?"
 * The system matches the current context against `applies_when` keywords.
 *
 * Global scope: ~/.agent-recall/insights-index.json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { getRoot } from "../types.js";
import { ensureDir } from "../storage/fs-utils.js";

export interface IndexedInsight {
  id: string;
  title: string;
  source: string;           // where it came from (project, date)
  applies_when: string[];   // keywords for matching
  skill_tags?: string[];    // skill patterns: "caching", "rate-limiting", "monorepo", "api-design"
  projects?: string[];      // which projects contributed to this insight
  file?: string;            // optional path to full feedback file
  severity: "critical" | "important" | "minor";
  confirmed_count: number;
  last_confirmed: string;
}

export interface InsightsIndex {
  version: string;
  updated: string;
  insights: IndexedInsight[];
}

function indexPath(): string {
  return path.join(getRoot(), "insights-index.json");
}

export function readInsightsIndex(): InsightsIndex {
  const p = indexPath();
  if (!fs.existsSync(p)) {
    return { version: "1.0.0", updated: new Date().toISOString(), insights: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return { version: "1.0.0", updated: new Date().toISOString(), insights: [] };
  }
}

export function writeInsightsIndex(index: InsightsIndex): void {
  const p = indexPath();
  ensureDir(path.dirname(p));
  index.updated = new Date().toISOString();
  fs.writeFileSync(p, JSON.stringify(index, null, 2), "utf-8");
}

/**
 * Add or update an insight in the index.
 */
export function addIndexedInsight(insight: Omit<IndexedInsight, "id" | "confirmed_count" | "last_confirmed">): IndexedInsight {
  const index = readInsightsIndex();
  const now = new Date().toISOString();

  // Check for existing by title similarity
  const existing = index.insights.find((i) => {
    const existingWords = i.title.toLowerCase().split(/\s+/);
    const newWords = insight.title.toLowerCase().split(/\s+/);
    const overlap = newWords.filter((w) => existingWords.includes(w) && w.length > 3).length;
    return overlap / Math.max(existingWords.length, newWords.length) > 0.5;
  });

  if (existing) {
    existing.confirmed_count++;
    existing.last_confirmed = now;
    // Merge applies_when
    for (const aw of insight.applies_when) {
      if (!existing.applies_when.includes(aw)) {
        existing.applies_when.push(aw);
      }
    }
    // Merge projects
    if (insight.projects) {
      existing.projects = [
        ...(existing.projects ?? []),
        ...insight.projects.filter((p) => !existing.projects?.includes(p)),
      ];
    }
    writeInsightsIndex(index);
    return existing;
  }

  const newInsight: IndexedInsight = {
    id: `idx-${Date.now()}`,
    ...insight,
    confirmed_count: 1,
    last_confirmed: now,
  };

  index.insights.push(newInsight);
  writeInsightsIndex(index);
  return newInsight;
}

/**
 * Recall insights relevant to a given context.
 *
 * Matching layers (v2):
 *   1. applies_when keywords (existing)
 *   2. skill_tags (new — matches skill patterns like "caching", "api-design")
 *   3. project correlation (new — insights from similar projects score higher)
 *
 * Relevance = (keyword_matches + skill_matches × 1.5) × severity × log2(confirmations + 1)
 * Skill matches weighted 1.5x because they indicate transferable knowledge.
 */
export function recallInsights(
  context: string,
  limit: number = 5,
  currentProject?: string
): Array<IndexedInsight & { relevance: number }> {
  const index = readInsightsIndex();
  if (index.insights.length === 0) return [];

  const contextWords = context.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const severityWeight: Record<string, number> = { critical: 3, important: 2, minor: 1 };

  const scored = index.insights.map((insight) => {
    // Layer 1: applies_when keyword matching
    let keywordMatches = 0;
    for (const keyword of insight.applies_when) {
      const kwWords = keyword.toLowerCase().split(/\s+/);
      for (const kw of kwWords) {
        if (contextWords.some((cw) => cw.includes(kw) || kw.includes(cw))) {
          keywordMatches++;
        }
      }
    }

    // Layer 2: skill_tags matching (weighted 1.5x — transferable knowledge is more valuable)
    let skillMatches = 0;
    if (insight.skill_tags) {
      for (const tag of insight.skill_tags) {
        const tagWords = tag.toLowerCase().split(/[\s\-_]+/);
        for (const tw of tagWords) {
          if (tw.length > 2 && contextWords.some((cw) => cw.includes(tw) || tw.includes(cw))) {
            skillMatches++;
          }
        }
      }
    }

    // Layer 3: project correlation boost (insights from projects the user works on get a small boost)
    let projectBoost = 1.0;
    if (currentProject && insight.projects?.length) {
      if (insight.projects.includes(currentProject)) {
        projectBoost = 1.2; // 20% boost for same-project insights
      } else if (insight.projects.length > 1) {
        projectBoost = 1.1; // 10% boost for multi-project insights (proven transferable)
      }
    }

    const totalMatches = keywordMatches + (skillMatches * 1.5);
    const relevance =
      totalMatches *
      (severityWeight[insight.severity] || 1) *
      Math.log2(insight.confirmed_count + 1) *
      projectBoost;

    return { ...insight, relevance };
  });

  return scored
    .filter((s) => s.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}
