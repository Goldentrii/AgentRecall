import * as fs from "node:fs";
import * as path from "node:path";
import { resolveProject } from "../storage/project.js";
import { palaceDir } from "../storage/paths.js";
import { ensurePalaceInitialized, listRooms, recordAccess } from "../palace/rooms.js";

export interface PalaceSearchInput {
  query: string;
  room?: string;
  project?: string;
}

export interface PalaceSearchResult {
  project: string;
  query: string;
  results: Array<{ room: string; file: string; salience: number; excerpt: string; line: number }>;
  total_matches: number;
}

export async function palaceSearch(input: PalaceSearchInput): Promise<PalaceSearchResult> {
  const slug = await resolveProject(input.project);
  ensurePalaceInitialized(slug);

  const rooms = listRooms(slug);
  const pd = palaceDir(slug);
  const queryLower = input.query.toLowerCase();
  const results: PalaceSearchResult["results"] = [];

  const targetRooms = input.room ? rooms.filter((r) => r.slug === input.room) : rooms;

  for (const roomMeta of targetRooms) {
    const roomPath = path.join(pd, "rooms", roomMeta.slug);
    if (!fs.existsSync(roomPath)) continue;

    const files = fs.readdirSync(roomPath).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const filePath = path.join(roomPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(queryLower)) {
          const line = lines[i];
          const matchIdx = line.toLowerCase().indexOf(queryLower);
          const start = Math.max(0, matchIdx - 40);
          const end = Math.min(line.length, matchIdx + input.query.length + 40);
          let excerpt = line.slice(start, end).trim();
          if (start > 0) excerpt = "..." + excerpt;
          if (end < line.length) excerpt = excerpt + "...";
          results.push({ room: roomMeta.slug, file: file.replace(".md", ""), salience: roomMeta.salience, excerpt, line: i + 1 });
        }
      }
    }

    if (results.some((r) => r.room === roomMeta.slug)) {
      recordAccess(slug, roomMeta.slug);
    }
  }

  results.sort((a, b) => b.salience - a.salience || a.line - b.line);
  const limited = results.slice(0, 20);

  return { project: slug, query: input.query, results: limited, total_matches: results.length };
}
