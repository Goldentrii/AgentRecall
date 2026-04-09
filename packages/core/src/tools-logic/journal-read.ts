import { resolveProject } from "../storage/project.js";
import { listJournalFiles, readJournalFile } from "../helpers/journal-files.js";
import { extractSection } from "../helpers/sections.js";

export interface JournalReadInput {
  date?: string;
  project?: string;
  section?: string;
}

export interface JournalReadResult {
  content: string;
  date: string;
  project: string;
  error?: string;
}

export async function journalRead(input: JournalReadInput): Promise<JournalReadResult> {
  const slug = await resolveProject(input.project);
  let targetDate = input.date ?? "latest";

  if (targetDate === "latest") {
    const entries = listJournalFiles(slug);
    if (entries.length === 0) {
      return { content: "", date: "", project: slug, error: `No journal entries found for project '${slug}'` };
    }
    targetDate = entries[0].date;
  }

  const fileContent = readJournalFile(slug, targetDate);
  if (!fileContent) {
    return { content: "", date: targetDate, project: slug, error: `No journal entry found for ${targetDate} in project '${slug}'` };
  }

  const section = input.section ?? "all";
  const extracted = extractSection(fileContent, section);
  return { content: extracted || "", date: targetDate, project: slug };
}
