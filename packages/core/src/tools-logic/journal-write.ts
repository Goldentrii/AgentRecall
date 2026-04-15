import * as fs from "node:fs";
import * as path from "node:path";
import { resolveProject } from "../storage/project.js";
import { journalDir, palaceDir } from "../storage/paths.js";
import { ensureDir, todayISO } from "../storage/fs-utils.js";
import { appendToSection } from "../helpers/sections.js";
import { updateIndex } from "../helpers/journal-files.js";
import { ensurePalaceInitialized, roomExists, createRoom } from "../palace/rooms.js";
import { fanOut } from "../palace/fan-out.js";
import { generateFrontmatter } from "../palace/obsidian.js";
import { updatePalaceIndex } from "../palace/index-manager.js";
import { journalFileName } from "../storage/session.js";

export interface JournalWriteInput {
  content: string;
  section?: string | null;
  palace_room?: string;
  project?: string;
}

export interface JournalWriteResult {
  success: boolean;
  date: string;
  file: string;
  palace: { room: string; topic: string; fan_out: string[] } | null;
}

export async function journalWrite(input: JournalWriteInput): Promise<JournalWriteResult> {
  const slug = await resolveProject(input.project);
  const date = todayISO();
  const dir = journalDir(slug);
  ensureDir(dir);

  // Session-safe filename: if another session already wrote today's journal,
  // this session gets its own file (YYYY-MM-DD-{sessionId}.md) to avoid conflicts.
  const basePath = path.join(dir, `${date}.md`);
  const fileName = journalFileName(date, fs.existsSync(basePath));
  const filePath = path.join(dir, fileName);

  let existing = "";
  if (fs.existsSync(filePath)) {
    existing = fs.readFileSync(filePath, "utf-8");
  } else if (!input.section || input.section !== "replace_all") {
    // Obsidian-compatible frontmatter for new journal entries
    const fm = generateFrontmatter({
      type: "journal",
      project: slug,
      date,
      tags: ["journal", slug],
      created: new Date().toISOString(),
    });
    existing = `${fm}# ${date} — ${slug}\n`;
  }

  const sectionArg = input.section ?? null;
  const updated = appendToSection(existing, input.content, sectionArg);
  fs.writeFileSync(filePath, updated, "utf-8");
  updateIndex(slug);

  let palaceResult: JournalWriteResult["palace"] = null;
  if (input.palace_room) {
    ensurePalaceInitialized(slug);
    if (!roomExists(slug, input.palace_room)) {
      createRoom(slug, input.palace_room, input.palace_room.charAt(0).toUpperCase() + input.palace_room.slice(1), "Auto-created from journal_write", []);
    }

    const pd = palaceDir(slug);
    const topicFile = input.section && input.section !== "replace_all" ? input.section : "journal";
    const targetPath = path.join(pd, "rooms", input.palace_room, `${topicFile}.md`);
    ensureDir(path.dirname(targetPath));

    const timestamp = new Date().toISOString();
    const entry = `\n### ${date} (from journal)\n\n${input.content}\n`;

    if (fs.existsSync(targetPath)) {
      fs.appendFileSync(targetPath, entry, "utf-8");
    } else {
      const fm = generateFrontmatter({ room: input.palace_room, topic: topicFile, created: timestamp, source: "journal_write" });
      fs.writeFileSync(targetPath, `${fm}# ${input.palace_room} / ${topicFile}\n${entry}`, "utf-8");
    }

    const fanOutResult = fanOut(slug, input.palace_room, topicFile, input.content, [], "medium");
    updatePalaceIndex(slug);

    palaceResult = { room: input.palace_room, topic: topicFile, fan_out: fanOutResult.updatedRooms };
  }

  return { success: true, date, file: filePath, palace: palaceResult };
}
