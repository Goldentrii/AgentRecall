import { describe, it } from "node:test";
import assert from "node:assert/strict";

const { computeSalience, ARCHIVE_THRESHOLD, AUTO_ARCHIVE_THRESHOLD, CATEGORY_DECAY, URGENCY_WEIGHTS } = await import("../dist/palace/salience.js");

describe("Salience scoring v2", () => {
  it("high importance + recent + active + connected + urgent = near 1.0", () => {
    const score = computeSalience({
      importance: "high",
      lastUpdated: new Date().toISOString(),
      accessCount: 20,
      connectionCount: 10,
      urgency: "today",
    });
    assert.ok(score > 0.9, `Expected >0.9, got ${score}`);
    assert.ok(score <= 1.0);
  });

  it("low importance + old + unused + isolated = low score", () => {
    const oldDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const score = computeSalience({
      importance: "low",
      lastUpdated: oldDate,
      accessCount: 0,
      connectionCount: 0,
    });
    assert.ok(score < 0.15, `Expected <0.15, got ${score}`);
  });

  it("importance alone contributes less than in v1 (max 0.10)", () => {
    const highImp = computeSalience({
      importance: "high",
      lastUpdated: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      accessCount: 0,
      connectionCount: 0,
    });
    const lowImp = computeSalience({
      importance: "low",
      lastUpdated: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      accessCount: 0,
      connectionCount: 0,
    });
    const impDelta = highImp - lowImp;
    assert.ok(impDelta < 0.08, `Importance delta should be small, got ${impDelta}`);
  });

  it("urgency=today boosts score significantly", () => {
    const base = computeSalience({
      importance: "medium",
      lastUpdated: new Date().toISOString(),
      accessCount: 5,
      connectionCount: 2,
    });
    const urgent = computeSalience({
      importance: "medium",
      lastUpdated: new Date().toISOString(),
      accessCount: 5,
      connectionCount: 2,
      urgency: "today",
    });
    assert.ok(urgent > base, "Urgency=today should boost score");
    assert.ok(urgent - base > 0.1, `Urgency boost should be >0.1, got ${urgent - base}`);
  });

  it("recency decays over time", () => {
    const today = computeSalience({
      importance: "medium",
      lastUpdated: new Date().toISOString(),
      accessCount: 5,
      connectionCount: 2,
    });
    const weekAgo = computeSalience({
      importance: "medium",
      lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      accessCount: 5,
      connectionCount: 2,
    });
    assert.ok(today > weekAgo, "Today should score higher than a week ago");
  });

  it("architecture category decays slower than blockers", () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const arch = computeSalience({
      importance: "medium",
      lastUpdated: thirtyDaysAgo,
      accessCount: 5,
      connectionCount: 2,
      category: "architecture",
    });
    const blocker = computeSalience({
      importance: "medium",
      lastUpdated: thirtyDaysAgo,
      accessCount: 5,
      connectionCount: 2,
      category: "blocker",
    });
    assert.ok(arch > blocker, `Architecture (${arch}) should score higher than blocker (${blocker}) after 30 days`);
  });

  it("goal category barely decays", () => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const goal = computeSalience({
      importance: "high",
      lastUpdated: ninetyDaysAgo,
      accessCount: 10,
      connectionCount: 5,
      category: "goal",
    });
    assert.ok(goal > 0.4, `Goal after 90 days should still be >0.4, got ${goal}`);
  });

  it("pinned items always return 1.0", () => {
    const score = computeSalience({
      importance: "low",
      lastUpdated: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      accessCount: 0,
      connectionCount: 0,
      pin: { pinned: true, reason: "ultimate goal" },
    });
    assert.equal(score, 1.0);
  });

  it("unpinned items calculate normally", () => {
    const score = computeSalience({
      importance: "medium",
      lastUpdated: new Date().toISOString(),
      accessCount: 0,
      connectionCount: 0,
      pin: { pinned: false },
    });
    assert.ok(score < 1.0);
    assert.ok(score > 0);
  });

  it("backward compatible — no urgency/category/pin still works", () => {
    const score = computeSalience({
      importance: "medium",
      lastUpdated: new Date().toISOString(),
      accessCount: 0,
      connectionCount: 0,
    });
    assert.ok(score > 0);
    assert.ok(score < 1.0);
  });

  it("ARCHIVE_THRESHOLD is 0.15", () => {
    assert.equal(ARCHIVE_THRESHOLD, 0.15);
  });

  it("AUTO_ARCHIVE_THRESHOLD is 0.05", () => {
    assert.equal(AUTO_ARCHIVE_THRESHOLD, 0.05);
  });

  it("CATEGORY_DECAY has expected rates", () => {
    assert.equal(CATEGORY_DECAY.goal, 0.99);
    assert.equal(CATEGORY_DECAY.blocker, 0.90);
    assert.ok(CATEGORY_DECAY.architecture > CATEGORY_DECAY.blocker);
  });

  it("URGENCY_WEIGHTS has expected values", () => {
    assert.equal(URGENCY_WEIGHTS.today, 1.0);
    assert.equal(URGENCY_WEIGHTS.none, 0.0);
  });
});
