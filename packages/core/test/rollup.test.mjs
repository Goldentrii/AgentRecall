import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const TEST_ROOT = path.join(os.tmpdir(), "ar-rollup-test-" + Date.now());

describe("Journal rollup — module integration", () => {
  let rollup;

  before(async () => {
    process.env.AGENT_RECALL_ROOT = TEST_ROOT;
    rollup = await import("../dist/helpers/rollup.js");

    // Create a set of daily journal entries spanning 3 weeks
    const journalDir = path.join(TEST_ROOT, "projects", "test-proj", "journal");
    fs.mkdirSync(journalDir, { recursive: true });

    // Week 1: 3 entries, 21 days ago (should be rolled up)
    for (const day of ["01", "02", "03"]) {
      const date = `2026-03-${day}`;
      fs.writeFileSync(
        path.join(journalDir, `${date}.md`),
        `# ${date} Session Log\n\n## Brief\nTest brief for ${date}\n\n## Completed\n- Task A for ${date}\n\n## Decisions\n- Decision X on ${date}\n\n## Blockers\n- Blocker Y\n\n## Next\n- Next step Z\n`,
      );
    }

    // Week 2: 2 entries, 14 days ago (should be rolled up)
    for (const day of ["08", "09"]) {
      const date = `2026-03-${day}`;
      fs.writeFileSync(
        path.join(journalDir, `${date}.md`),
        `# ${date} Session Log\n\n## Brief\nWeek 2 brief ${date}\n\n## Completed\n- Done ${date}\n`,
      );
    }

    // This week: 1 entry, recent (should NOT be rolled up)
    const today = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(
      path.join(journalDir, `${today}.md`),
      `# ${today} Session Log\n\n## Brief\nToday's work\n`,
    );
  });

  after(() => {
    delete process.env.AGENT_RECALL_ROOT;
    fs.rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it("isoWeek computes correct week number", () => {
    // 2026-01-01 is Thursday → W01
    const w1 = rollup.isoWeek("2026-01-01");
    assert.equal(w1.year, 2026);
    assert.equal(w1.week, 1);
  });

  it("weekKey formats correctly", () => {
    const key = rollup.weekKey("2026-03-01");
    assert.ok(key.startsWith("2026-W"));
    assert.ok(/^\d{4}-W\d{2}$/.test(key));
  });

  it("groupByWeek groups entries correctly", () => {
    const entries = [
      { date: "2026-03-01", file: "2026-03-01.md", dir: "/tmp" },
      { date: "2026-03-02", file: "2026-03-02.md", dir: "/tmp" },
      { date: "2026-03-08", file: "2026-03-08.md", dir: "/tmp" },
    ];
    const groups = rollup.groupByWeek(entries);
    assert.ok(groups.size >= 2, "Should have at least 2 week groups");
  });

  it("groupByWeek sorts entries within each week by date ascending", () => {
    const entries = [
      { date: "2026-03-03", file: "2026-03-03.md", dir: "/tmp" },
      { date: "2026-03-01", file: "2026-03-01.md", dir: "/tmp" },
      { date: "2026-03-02", file: "2026-03-02.md", dir: "/tmp" },
    ];
    const groups = rollup.groupByWeek(entries);
    for (const [, group] of groups) {
      for (let i = 1; i < group.length; i++) {
        assert.ok(group[i].date >= group[i - 1].date, "Entries should be ascending");
      }
    }
  });

  it("synthesizeWeek produces a valid summary", () => {
    const journalDir = path.join(TEST_ROOT, "projects", "test-proj", "journal");
    const entries = [
      { date: "2026-03-01", file: "2026-03-01.md", dir: journalDir },
      { date: "2026-03-02", file: "2026-03-02.md", dir: journalDir },
      { date: "2026-03-03", file: "2026-03-03.md", dir: journalDir },
    ];
    const wk = rollup.weekKey("2026-03-01");
    const summary = rollup.synthesizeWeek(wk, entries);

    assert.ok(summary.includes("Weekly Summary"));
    assert.ok(summary.includes("## Briefs"));
    assert.ok(summary.includes("## Completed"));
    assert.ok(summary.includes("## Decisions"));
    assert.ok(summary.includes("## Blockers"));
    assert.ok(summary.includes("2026-03-01"));
    assert.ok(summary.includes("Condensed from 3 daily entries"));
  });
});
