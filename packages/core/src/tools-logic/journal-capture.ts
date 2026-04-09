import * as fs from "node:fs";
import * as path from "node:path";
import { resolveProject } from "../storage/project.js";
import { journalDir } from "../storage/paths.js";
import { ensureDir, todayISO } from "../storage/fs-utils.js";
import { countLogEntries } from "../helpers/journal-files.js";
import { ensurePalaceInitialized, roomExists, createRoom } from "../palace/rooms.js";
import { palaceDir } from "../storage/paths.js";
import { fanOut } from "../palace/fan-out.js";
import { updatePalaceIndex } from "../palace/index-manager.js";

export interface JournalCaptureInput {
  question: string;
  answer: string;
  tags?: string[];
  palace_room?: string;
  project?: string;
}

export interface JournalCaptureResult {
  success: boolean;
  entry_number: number;
  palace: { room: string } | null;
}

export async function journalCapture(input: JournalCaptureInput): Promise<JournalCaptureResult> {
  const slug = await resolveProject(input.project);
  const date = todayISO();
  const dir = journalDir(slug);
  ensureDir(dir);

  const logPath = path.join(dir, `${date}-log.md`);
  const entryNum = countLogEntries(logPath) + 1;
  const tagStr = input.tags && input.tags.length > 0 ? ` [${input.tags.join(", ")}]` : "";
  const timestamp = new Date().toISOString().slice(11, 19);

  let entry = `### Q${entryNum} (${timestamp})${tagStr}\n\n`;
  entry += `**Q:** ${input.question}\n\n`;
  entry += `**A:** ${input.answer}\n\n`;

  if (!fs.existsSync(logPath)) {
    const header = `# ${date} — ${slug} — Session Log\n\n`;
    fs.writeFileSync(logPath, header + entry, "utf-8");
  } else {
    fs.appendFileSync(logPath, entry, "utf-8");
  }

  let palaceResult: JournalCaptureResult["palace"] = null;
  if (input.palace_room) {
    try {
      ensurePalaceInitialized(slug);
      if (!roomExists(slug, input.palace_room)) {
        createRoom(slug, input.palace_room, input.palace_room.charAt(0).toUpperCase() + input.palace_room.slice(1), "Auto-created from capture", []);
      }

      const pd = palaceDir(slug);
      const targetPath = path.join(pd, "rooms", input.palace_room, "captures.md");
      ensureDir(path.dirname(targetPath));

      const captureEntry = `\n### Q${entryNum} (${date})\n**Q:** ${input.question}\n**A:** ${input.answer}\n`;
      if (fs.existsSync(targetPath)) {
        fs.appendFileSync(targetPath, captureEntry, "utf-8");
      } else {
        fs.writeFileSync(targetPath, `# ${input.palace_room} / captures\n${captureEntry}`, "utf-8");
      }

      fanOut(slug, input.palace_room, "captures", `${input.question} ${input.answer}`, [], "medium");
      updatePalaceIndex(slug);
      palaceResult = { room: input.palace_room };
    } catch {
      // Palace integration is optional
    }
  }

  return { success: true, entry_number: entryNum, palace: palaceResult };
}
