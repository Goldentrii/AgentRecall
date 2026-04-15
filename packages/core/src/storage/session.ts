/**
 * Session identity — unique per process to prevent multi-window write conflicts.
 *
 * When multiple Claude Code sessions run /arsave simultaneously,
 * each writes to its own journal file: YYYY-MM-DD-{sessionId}.md
 * instead of fighting over a shared YYYY-MM-DD.md.
 */

import * as crypto from "node:crypto";

/** 6-char hex ID, unique per process. Generated once on import. */
const SESSION_ID = crypto.randomBytes(3).toString("hex");

/** Track which files this session has claimed (owns). */
const ownedFiles = new Set<string>();

/** Get the current process session ID. */
export function getSessionId(): string {
  return SESSION_ID;
}

/**
 * Generate a session-scoped journal filename.
 *
 * - First session of the day: writes to YYYY-MM-DD.md (backward compat)
 * - Concurrent sessions: write to YYYY-MM-DD-{sessionId}.md
 *
 * Once a file is claimed by this session, subsequent calls return the same name.
 */
export function journalFileName(date: string, baseExists: boolean): string {
  const baseKey = `journal:${date}`;

  // If this session already claimed a file for this date, reuse it
  if (ownedFiles.has(`${baseKey}:base`)) return `${date}.md`;
  if (ownedFiles.has(`${baseKey}:session`)) return `${date}-${SESSION_ID}.md`;

  if (!baseExists) {
    ownedFiles.add(`${baseKey}:base`);
    return `${date}.md`;
  }
  ownedFiles.add(`${baseKey}:session`);
  return `${date}-${SESSION_ID}.md`;
}

/**
 * Generate a session-scoped log filename for captures.
 */
export function captureLogFileName(date: string, baseExists: boolean): string {
  const baseKey = `capture:${date}`;

  if (ownedFiles.has(`${baseKey}:base`)) return `${date}-log.md`;
  if (ownedFiles.has(`${baseKey}:session`)) return `${date}-${SESSION_ID}-log.md`;

  if (!baseExists) {
    ownedFiles.add(`${baseKey}:base`);
    return `${date}-log.md`;
  }
  ownedFiles.add(`${baseKey}:session`);
  return `${date}-${SESSION_ID}-log.md`;
}

/** Reset owned files (for testing only). */
export function resetOwnedFiles(): void {
  ownedFiles.clear();
}
