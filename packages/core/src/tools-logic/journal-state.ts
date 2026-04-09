import * as fs from "node:fs";
import * as path from "node:path";
import { resolveProject } from "../storage/project.js";
import { journalDir } from "../storage/paths.js";
import { ensureDir, todayISO } from "../storage/fs-utils.js";
import { VERSION } from "../types.js";
import type { SessionState } from "../types.js";

export function stateFilePath(project: string, date: string): string {
  return path.join(journalDir(project), `${date}.state.json`);
}

export function readState(project: string, date: string): SessionState | null {
  const fp = stateFilePath(project, date);
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch {
    return null;
  }
}

export interface JournalStateInput {
  action: "read" | "write";
  data?: string;
  date?: string;
  project?: string;
}

export type JournalStateResult =
  | SessionState
  | { empty: true; date: string; project: string }
  | { success: true; date: string; entries: { completed: number; failures: number; insights: number } }
  | { error: string };

export async function journalState(input: JournalStateInput): Promise<JournalStateResult> {
  const slug = await resolveProject(input.project);
  let targetDate = input.date ?? "latest";

  if (targetDate === "latest") {
    const dir = journalDir(slug);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith(".state.json")).sort().reverse();
      targetDate = files.length > 0 ? files[0].replace(".state.json", "") : todayISO();
    } else {
      targetDate = todayISO();
    }
  }

  if (input.action === "read") {
    const state = readState(slug, targetDate);
    return state ?? { empty: true, date: targetDate, project: slug };
  }

  const existing = readState(slug, todayISO()) ?? {
    version: VERSION,
    date: todayISO(),
    project: slug,
    timestamp: new Date().toISOString(),
    completed: [],
    failures: [],
    state: {},
    next_actions: [],
    insights: [],
    counts: {},
  };

  if (input.data) {
    try {
      const incoming = JSON.parse(input.data);
      if (incoming.completed) existing.completed.push(...incoming.completed);
      if (incoming.failures) existing.failures.push(...incoming.failures);
      if (incoming.next_actions) existing.next_actions = incoming.next_actions;
      if (incoming.insights) existing.insights.push(...incoming.insights);
      if (incoming.state) Object.assign(existing.state, incoming.state);
      if (incoming.counts) Object.assign(existing.counts, incoming.counts);
      existing.timestamp = new Date().toISOString();
    } catch (e) {
      return { error: `Invalid JSON: ${e}` };
    }
  }

  const fp = stateFilePath(slug, todayISO());
  ensureDir(path.dirname(fp));
  fs.writeFileSync(fp, JSON.stringify(existing, null, 2), "utf-8");

  return {
    success: true,
    date: todayISO(),
    entries: { completed: existing.completed.length, failures: existing.failures.length, insights: existing.insights.length },
  };
}
