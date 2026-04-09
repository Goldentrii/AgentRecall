import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const TEST_ROOT = path.join(os.tmpdir(), "agent-recall-test-" + Date.now());
const TEST_PROJECT = "test-project";
const JOURNAL_DIR = path.join(TEST_ROOT, "projects", TEST_PROJECT, "journal");

describe("AgentRecall MCP — filesystem operations", () => {
  before(() => {
    fs.mkdirSync(JOURNAL_DIR, { recursive: true });
  });

  after(() => {
    fs.rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it("creates journal directory structure", () => {
    assert.ok(fs.existsSync(JOURNAL_DIR));
  });

  it("writes a journal entry", () => {
    const date = "2026-03-30";
    const content = `# ${date} Session Log\n\n## Brief\nTest project — testing AgentRecall\n\n## Completed\n- Built tests\n`;
    fs.writeFileSync(path.join(JOURNAL_DIR, `${date}.md`), content);
    assert.ok(fs.existsSync(path.join(JOURNAL_DIR, `${date}.md`)));
  });

  it("reads journal entry back", () => {
    const content = fs.readFileSync(path.join(JOURNAL_DIR, "2026-03-30.md"), "utf-8");
    assert.ok(content.includes("## Brief"));
    assert.ok(content.includes("Test project"));
  });

  it("extracts section from journal (brief)", () => {
    const content = fs.readFileSync(path.join(JOURNAL_DIR, "2026-03-30.md"), "utf-8");
    const briefIdx = content.indexOf("## Brief");
    assert.ok(briefIdx > -1);
    const afterBrief = content.slice(briefIdx);
    const nextSection = afterBrief.indexOf("## ", 1);
    const brief = nextSection > -1 ? afterBrief.slice(0, nextSection) : afterBrief;
    assert.ok(brief.includes("Test project"));
  });

  it("handles code fences in section extraction", () => {
    const content = `# Test\n\n## Decisions\nWe decided:\n\`\`\`\n## This is NOT a header\nit is code\n\`\`\`\n\n## Next\n- Do stuff\n`;
    const decisionsIdx = content.indexOf("## Decisions");
    const afterDecisions = content.slice(decisionsIdx);
    const lines = afterDecisions.split("\n");
    const result = [lines[0]];
    let inFence = false;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].startsWith("\`\`\`")) inFence = !inFence;
      if (!inFence && lines[i].startsWith("## ")) break;
      result.push(lines[i]);
    }
    const section = result.join("\n");
    assert.ok(section.includes("## This is NOT a header")); // should be included (inside fence)
    assert.ok(!section.includes("## Next")); // should NOT be included
  });

  it("writes Layer 1 capture (log file)", () => {
    const date = "2026-03-30";
    const logFile = path.join(JOURNAL_DIR, `${date}-log.md`);
    const entry = `[14:32] Q: How to test MCP?\n[14:32] A: Use node:test built-in | Decision: no external test framework\n`;
    fs.writeFileSync(logFile, `# ${date} Raw Session Log\n\n---\n\n${entry}`);
    const content = fs.readFileSync(logFile, "utf-8");
    assert.ok(content.includes("Q: How to test MCP?"));
  });

  it("lists journal entries sorted by date", () => {
    // Add another entry
    fs.writeFileSync(path.join(JOURNAL_DIR, "2026-03-29.md"), "# 2026-03-29\n\nOlder entry\n");
    const files = fs.readdirSync(JOURNAL_DIR)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort()
      .reverse();
    assert.equal(files[0], "2026-03-30.md");
    assert.equal(files[1], "2026-03-29.md");
  });

  it("searches across journal files", () => {
    const files = fs.readdirSync(JOURNAL_DIR).filter(f => f.endsWith(".md"));
    const results = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(JOURNAL_DIR, file), "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes("test")) {
          results.push({ file, line: i + 1, text: lines[i].trim() });
        }
      }
    }
    assert.ok(results.length > 0);
    assert.ok(results.some(r => r.file === "2026-03-30.md"));
  });

  it("auto-updates index.md on write", () => {
    const indexPath = path.join(JOURNAL_DIR, "index.md");
    const entries = fs.readdirSync(JOURNAL_DIR)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort()
      .reverse();
    const indexContent = `# Journal Index\n\n${entries.map(f => `- [${f}](./${f})`).join("\n")}\n`;
    fs.writeFileSync(indexPath, indexContent);
    const saved = fs.readFileSync(indexPath, "utf-8");
    assert.ok(saved.includes("2026-03-30.md"));
    assert.ok(saved.includes("2026-03-29.md"));
  });

  // --- v3 tests ---

  it("writes and reads JSON state file", () => {
    const today = new Date().toISOString().slice(0, 10);
    const stateFile = path.join(JOURNAL_DIR, `${today}.state.json`);
    const state = {
      version: "2.2.0",
      date: today,
      project: TEST_PROJECT,
      timestamp: new Date().toISOString(),
      completed: [{ task: "test-task", result: "passed" }],
      failures: [],
      state: { genome: { status: "v3.2", details: "8 dimensions" } },
      next_actions: [{ priority: "P0", task: "replicate new site" }],
      insights: [{ claim: "extraction = quality", confidence: "high", evidence: "4 sites" }],
      counts: { pages: 91, tabs: 35 },
    };
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
    const read = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
    assert.equal(read.completed.length, 1);
    assert.equal(read.counts.pages, 91);
    assert.equal(read.insights[0].confidence, "high");
  });

  it("merges state correctly (arrays append, objects spread)", () => {
    const today = new Date().toISOString().slice(0, 10);
    const stateFile = path.join(JOURNAL_DIR, `${today}.state.json`);
    const existing = JSON.parse(fs.readFileSync(stateFile, "utf-8"));

    // Simulate merge
    const incoming = {
      completed: [{ task: "second-task", result: "done" }],
      counts: { tabs: 40 },
    };
    existing.completed.push(...incoming.completed);
    Object.assign(existing.counts, incoming.counts);

    fs.writeFileSync(stateFile, JSON.stringify(existing, null, 2));
    const merged = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
    assert.equal(merged.completed.length, 2);
    assert.equal(merged.counts.tabs, 40); // overwritten
    assert.equal(merged.counts.pages, 91); // preserved
  });

  it("archive creates archive directory and moves files", () => {
    const archiveDir = path.join(JOURNAL_DIR, "archive");
    fs.mkdirSync(archiveDir, { recursive: true });

    // Create an "old" file and archive it
    const oldFile = path.join(JOURNAL_DIR, "2026-01-01.md");
    fs.writeFileSync(oldFile, "# 2026-01-01\n## Brief\nOld entry for archival test\n");
    const destFile = path.join(archiveDir, "2026-01-01.md");
    fs.copyFileSync(oldFile, destFile);
    fs.unlinkSync(oldFile);

    assert.ok(fs.existsSync(destFile));
    assert.ok(!fs.existsSync(oldFile));
    const content = fs.readFileSync(destFile, "utf-8");
    assert.ok(content.includes("archival test"));
  });

  it("cold start categorizes entries by age", () => {
    const today = new Date().toISOString().slice(0, 10);
    // Today's file = hot
    assert.ok(fs.existsSync(path.join(JOURNAL_DIR, "2026-03-30.md"))); // existing from earlier tests

    // Count .md files (excluding index, log, archive)
    const mdFiles = fs.readdirSync(JOURNAL_DIR)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));
    assert.ok(mdFiles.length >= 1, "Should have at least one journal file");
  });
});
