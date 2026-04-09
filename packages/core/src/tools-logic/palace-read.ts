import * as fs from "node:fs";
import * as path from "node:path";
import { resolveProject } from "../storage/project.js";
import { palaceDir } from "../storage/paths.js";
import { ensurePalaceInitialized, getRoomMeta, listRooms, recordAccess } from "../palace/rooms.js";

export interface PalaceReadInput {
  room?: string;
  topic?: string;
  project?: string;
}

export interface PalaceReadResult {
  project: string;
  rooms?: Array<{ slug: string; name: string; description: string; salience: number; connections: string[]; tags: string[] }>;
  room?: string;
  topic?: string;
  salience?: number;
  connections?: string[];
  content?: string;
  error?: string;
}

export async function palaceRead(input: PalaceReadInput): Promise<PalaceReadResult> {
  const slug = await resolveProject(input.project);
  ensurePalaceInitialized(slug);

  if (!input.room) {
    const rooms = listRooms(slug);
    return {
      project: slug,
      rooms: rooms.map((r) => ({
        slug: r.slug,
        name: r.name,
        description: r.description,
        salience: r.salience,
        connections: r.connections,
        tags: r.tags,
      })),
    };
  }

  const meta = getRoomMeta(slug, input.room);
  if (!meta) {
    return { project: slug, error: `Room '${input.room}' not found in project '${slug}'` };
  }

  recordAccess(slug, input.room);

  const pd = palaceDir(slug);
  const targetFile = input.topic
    ? path.join(pd, "rooms", input.room, `${input.topic}.md`)
    : path.join(pd, "rooms", input.room, "README.md");

  if (!fs.existsSync(targetFile)) {
    return { project: slug, error: `File not found: ${input.topic ? input.topic + '.md' : 'README.md'} in room '${input.room}'` };
  }

  const content = fs.readFileSync(targetFile, "utf-8");

  return {
    project: slug,
    room: input.room,
    topic: input.topic ?? "README",
    salience: meta.salience,
    connections: meta.connections,
    content,
  };
}
