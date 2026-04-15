/**
 * Journal file listing, reading, and index maintenance.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { journalDir, journalDirs } from "../storage/paths.js";
import { ensureDir } from "../storage/fs-utils.js";
import type { JournalEntry } from "../types.js";

/**
 * List all .md journal files across all directories for a project.
 * Returns sorted array with most recent first.
 */
export function listJournalFiles(project: string): JournalEntry[] {
  const dirs = journalDirs(project);
  const entries: JournalEntry[] = [];
  const seen = new Set<string>();

  // First pass: look for YYYY-MM-DD.md and YYYY-MM-DD-{sessionId}.md journal entries
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      // Match: YYYY-MM-DD.md or YYYY-MM-DD-{sessionId}.md (but not -log.md variants)
      const match = file.match(/^(\d{4}-\d{2}-\d{2})(?:-[a-f0-9]{6})?\.md$/);
      if (match && !seen.has(file)) {
        seen.add(file);
        entries.push({ date: match[1], file, dir });
      }
    }
  }

  // Second pass: include YYYY-MM-DD-log.md and YYYY-MM-DD-{sessionId}-log.md capture files
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const match = file.match(/^(\d{4}-\d{2}-\d{2})(?:-[a-f0-9]{6})?-log\.md$/);
      if (match && !seen.has(file)) {
        seen.add(file);
        entries.push({ date: match[1], file, dir });
      }
    }
  }

  entries.sort((a, b) => b.date.localeCompare(a.date));
  return entries;
}

/**
 * Read a journal file. Checks primary dir first, then legacy.
 */
export function readJournalFile(project: string, date: string): string | null {
  const dirs = journalDirs(project);
  const primaryDir = journalDir(project);
  const allDirs = [primaryDir, ...dirs.filter((d) => d !== primaryDir)];

  // Try exact date file first, then session-scoped variants, then -log variants
  for (const dir of allDirs) {
    if (!fs.existsSync(dir)) continue;

    // Exact match
    const exact = path.join(dir, `${date}.md`);
    if (fs.existsSync(exact)) return fs.readFileSync(exact, "utf-8");

    // Session-scoped variants: YYYY-MM-DD-{sessionId}.md — merge all for this date
    const files = fs.readdirSync(dir);
    const sessionFiles = files.filter(f => f.match(new RegExp(`^${date}-[a-f0-9]{6}\\.md$`)));
    if (sessionFiles.length > 0) {
      // Return all session journals for this date, merged
      const parts = sessionFiles.map(f => fs.readFileSync(path.join(dir, f), "utf-8"));
      return parts.join("\n\n---\n\n");
    }

    // Fall back to log file
    const logFile = path.join(dir, `${date}-log.md`);
    if (fs.existsSync(logFile)) return fs.readFileSync(logFile, "utf-8");

    // Session-scoped log variants
    const sessionLogs = files.filter(f => f.match(new RegExp(`^${date}-[a-f0-9]{6}-log\\.md$`)));
    if (sessionLogs.length > 0) {
      const parts = sessionLogs.map(f => fs.readFileSync(path.join(dir, f), "utf-8"));
      return parts.join("\n\n---\n\n");
    }
  }
  return null;
}

/**
 * Extract title from journal file content.
 */
export function extractTitle(content: string): string {
  const match = content.match(/^# (.+)$/m);
  return match ? match[1].trim() : "(untitled)";
}

/**
 * Extract momentum indicator from journal content.
 */
export function extractMomentum(content: string): string {
  const patterns = [/[🟢🟡🔴⚪]\s*\S+/];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) return match[0];
  }
  return "";
}

/**
 * Count entries in a log file (for journal_capture entry numbering).
 */
export function countLogEntries(logPath: string): number {
  if (!fs.existsSync(logPath)) return 0;
  const content = fs.readFileSync(logPath, "utf-8");
  const matches = content.match(/^### Q\d+/gm);
  return matches ? matches.length : 0;
}

/**
 * Update the index.md for a project.
 */
export function updateIndex(project: string): void {
  const dir = journalDir(project);
  ensureDir(dir);
  const indexPath = path.join(dir, "index.md");

  const entries = listJournalFiles(project);

  let index = `# ${project} — Journal Index\n\n`;
  index += `> Auto-generated. ${entries.length} entries.\n\n`;
  index += `| Date | Title | Momentum |\n`;
  index += `|------|-------|----------|\n`;

  for (const entry of entries) {
    const content = fs.readFileSync(
      path.join(entry.dir, entry.file),
      "utf-8"
    );
    const title = extractTitle(content);
    const momentum = extractMomentum(content);
    index += `| ${entry.date} | ${title} | ${momentum} |\n`;
  }

  fs.writeFileSync(indexPath, index, "utf-8");

  // Also write index.jsonl — one JSON object per entry for fast machine scanning
  updateJsonlIndex(project, entries);
}

/**
 * Write index.jsonl alongside index.md.
 * Agents can scan this in ~100 tokens to find the right entry to read,
 * instead of parsing the markdown table.
 */
function updateJsonlIndex(project: string, entries: JournalEntry[]): void {
  const dir = journalDir(project);
  const jsonlPath = path.join(dir, "index.jsonl");

  const lines: string[] = [];
  for (const entry of entries) {
    const content = fs.readFileSync(
      path.join(entry.dir, entry.file),
      "utf-8"
    );
    const title = extractTitle(content);
    const momentum = extractMomentum(content);
    // Extract first non-heading, non-empty line as summary
    let summary = "";
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("---") && !trimmed.startsWith(">")) {
        summary = trimmed.slice(0, 120);
        break;
      }
    }
    lines.push(JSON.stringify({ date: entry.date, title, summary, momentum }));
  }

  fs.writeFileSync(jsonlPath, lines.join("\n") + "\n", "utf-8");
}
