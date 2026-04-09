import * as fs from "node:fs";
import * as path from "node:path";
import { resolveProject } from "../storage/project.js";
import { journalDirs, palaceDir } from "../storage/paths.js";
import { ensurePalaceInitialized, listRooms } from "../palace/rooms.js";

export interface JournalSearchInput {
  query: string;
  project?: string;
  section?: string;
  include_palace?: boolean;
}

export interface JournalSearchResult {
  results: Array<{ date: string; section: string; excerpt: string; line: number }>;
}

export async function journalSearch(input: JournalSearchInput): Promise<JournalSearchResult> {
  const slug = await resolveProject(input.project);
  const dirs = journalDirs(slug);
  const queryLower = input.query.toLowerCase();

  const results: JournalSearchResult["results"] = [];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      let currentSection = "top";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("## ")) {
          currentSection = line.slice(3).trim().toLowerCase().replace(/\s+/g, "_");
        }
        if (input.section && currentSection !== input.section.toLowerCase()) continue;
        if (line.toLowerCase().includes(queryLower)) {
          const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
          const date = dateMatch ? dateMatch[1] : file;
          const matchIdx = line.toLowerCase().indexOf(queryLower);
          const start = Math.max(0, matchIdx - 40);
          const end = Math.min(line.length, matchIdx + input.query.length + 40);
          let excerpt = line.slice(start, end).trim();
          if (start > 0) excerpt = "..." + excerpt;
          if (end < line.length) excerpt = excerpt + "...";
          results.push({ date, section: currentSection, excerpt, line: i + 1 });
        }
      }
    }
  }

  if (input.include_palace) {
    try {
      ensurePalaceInitialized(slug);
      const pd = palaceDir(slug);
      const rooms = listRooms(slug);

      for (const room of rooms) {
        const roomPath = path.join(pd, "rooms", room.slug);
        if (!fs.existsSync(roomPath)) continue;
        const files = fs.readdirSync(roomPath).filter((f) => f.endsWith(".md"));

        for (const file of files) {
          const filePath = path.join(roomPath, file);
          const content = fs.readFileSync(filePath, "utf-8");
          const lines = content.split("\n");

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(queryLower)) {
              const matchIdx = lines[i].toLowerCase().indexOf(queryLower);
              const start = Math.max(0, matchIdx - 40);
              const end = Math.min(lines[i].length, matchIdx + input.query.length + 40);
              let excerpt = lines[i].slice(start, end).trim();
              if (start > 0) excerpt = "..." + excerpt;
              if (end < lines[i].length) excerpt = excerpt + "...";
              results.push({ date: `palace:${room.slug}`, section: file.replace(".md", ""), excerpt, line: i + 1 });
            }
          }
        }
      }
    } catch {
      // Palace search is optional
    }
  }

  results.sort((a, b) => b.date.localeCompare(a.date));
  return { results };
}
