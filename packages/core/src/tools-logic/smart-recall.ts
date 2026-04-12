/**
 * smart_recall — unified cross-store search.
 *
 * Searches palace, journal, and insights in one call.
 * Returns ranked results with source attribution.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { palaceSearch } from "./palace-search.js";
import { journalSearch } from "./journal-search.js";
import { recallInsight } from "./recall-insight.js";
import { getRoot } from "../types.js";
import { ensureDir } from "../storage/fs-utils.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecallFeedback {
  id?: string;
  title?: string;
  useful: boolean;
}

export interface SmartRecallInput {
  query: string;
  project?: string;
  limit?: number;
  feedback?: RecallFeedback[];
}

export interface SmartRecallResultItem {
  id: string;
  source: "palace" | "journal" | "insight";
  title: string;
  excerpt: string;
  score: number;
  room?: string;
  date?: string;
  severity?: string;
}

/** Simple stable hash for feedback matching. */
function stableId(source: string, title: string): string {
  let hash = 0;
  const str = `${source}:${title}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

export interface SmartRecallResult {
  query: string;
  results: SmartRecallResultItem[];
  total_searched: number;
  sources_queried: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Calculate keyword overlap between query and text. */
function keywordExactness(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (queryWords.length === 0) return 0;
  const textLower = text.toLowerCase();
  const matches = queryWords.filter((w) => textLower.includes(w));
  return matches.length / queryWords.length;
}

/** Days between a date string and now. */
function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 365; // fallback: old
  return Math.max(0, (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface FeedbackEntry { query: string; id?: string; title: string; useful: boolean; date: string }

function feedbackLogPath(): string {
  return path.join(getRoot(), "feedback-log.json");
}

function readFeedbackLog(): FeedbackEntry[] {
  const p = feedbackLogPath();
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return []; }
}

/** Process relevance feedback — store and adjust salience signals. */
function processFeedback(feedback: RecallFeedback[], query: string): void {
  ensureDir(path.dirname(feedbackLogPath()));

  const log = readFeedbackLog();
  const date = new Date().toISOString().slice(0, 10);
  for (const f of feedback) {
    log.push({ query, id: f.id, title: f.title ?? "", useful: f.useful, date });
  }

  // Keep last 200 entries
  fs.writeFileSync(feedbackLogPath(), JSON.stringify(log.slice(-200), null, 2), "utf-8");
}

export async function smartRecall(input: SmartRecallInput): Promise<SmartRecallResult> {
  // Process relevance feedback if provided
  if (input.feedback && input.feedback.length > 0) {
    processFeedback(input.feedback, input.query);
  }

  const limit = input.limit ?? 10;
  const allResults: SmartRecallResultItem[] = [];
  let totalSearched = 0;
  const sourcesQueried: string[] = [];

  // 1. Palace search
  try {
    const palaceResults = await palaceSearch({ query: input.query, project: input.project });
    sourcesQueried.push("palace");
    totalSearched += palaceResults.total_matches;

    for (const r of palaceResults.results) {
      const title = `${r.room}/${r.file}`;
      allResults.push({
        id: stableId("palace", title),
        source: "palace",
        title,
        excerpt: r.excerpt,
        score: 0, // computed below
        room: r.room,
      });
      // Compute score: salience as relevance, keyword match, recency unknown (use salience as proxy)
      const relevance = r.salience;
      const exactness = keywordExactness(input.query, r.excerpt);
      const recency = r.salience; // palace salience already incorporates recency
      allResults[allResults.length - 1].score =
        relevance * 0.50 + exactness * 0.30 + recency * 0.20;
    }
  } catch {
    // Palace may not be initialized
  }

  // 2. Journal search
  try {
    const journalResults = await journalSearch({
      query: input.query,
      project: input.project,
      include_palace: false,
    });
    sourcesQueried.push("journal");
    totalSearched += journalResults.results.length;

    for (const r of journalResults.results) {
      const days = daysSince(r.date);
      const recency = Math.pow(0.95, days);
      const exactness = keywordExactness(input.query, r.excerpt);
      const title = `${r.date} / ${r.section}`;

      allResults.push({
        id: stableId("journal", title),
        source: "journal",
        title,
        excerpt: r.excerpt,
        score: recency * 0.60 + exactness * 0.40,
        date: r.date,
      });
    }
  } catch {
    // Journal may not exist
  }

  // 3. Insight recall
  try {
    const insightResults = await recallInsight({
      context: input.query,
      limit: limit,
      include_awareness: false,
    });
    sourcesQueried.push("insight");
    totalSearched += insightResults.total_in_index;

    // Normalize relevance scores
    const maxRelevance = Math.max(
      1,
      ...insightResults.matching_insights.map((i) => i.relevance)
    );

    for (const i of insightResults.matching_insights) {
      const relevance = i.relevance / maxRelevance;
      const exactness = keywordExactness(input.query, i.title);
      // Insights don't have dates, use confirmation count as a recency proxy
      const recency = Math.min(1.0, Math.log2(i.confirmed + 1) / 3);

      allResults.push({
        id: stableId("insight", i.title),
        source: "insight",
        title: i.title,
        excerpt: `[${i.severity}] ${i.applies_when.join(", ")}`,
        score: relevance * 0.50 + exactness * 0.30 + recency * 0.20,
        severity: i.severity,
      });
    }
  } catch {
    // Insights may be empty
  }

  // 4.5 Apply feedback adjustments — query-aware, ID-first matching
  const feedbackLog = readFeedbackLog();
  if (feedbackLog.length > 0) {
    // Pre-filter: only feedback from similar queries
    const queryWords = input.query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const relevantFeedback = feedbackLog.filter((f) => {
      if (!f.query) return true; // legacy entries without query always apply
      const fWords = f.query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const overlap = queryWords.filter((w) => fWords.includes(w)).length;
      return overlap > 0;
    });

    for (const r of allResults) {
      const match = (f: FeedbackEntry) =>
        (f.id && f.id === r.id) || (f.title && f.title === r.title);
      const positives = relevantFeedback.filter((f) => match(f) && f.useful).length;
      const negatives = relevantFeedback.filter((f) => match(f) && !f.useful).length;
      r.score += (positives * 0.03) - (negatives * 0.05);
      r.score = Math.max(0, Math.min(1, r.score));
    }
  }

  // 5. Deduplicate: if same excerpt appears in palace and journal, keep palace
  const seen = new Set<string>();
  const deduped: SmartRecallResultItem[] = [];
  for (const r of allResults) {
    const key = r.excerpt.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }

  // 5. Sort by score descending, return top N
  deduped.sort((a, b) => b.score - a.score);

  return {
    query: input.query,
    results: deduped.slice(0, limit),
    total_searched: totalSearched,
    sources_queried: sourcesQueried,
  };
}
