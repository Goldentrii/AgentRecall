import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Salience is pure math — no filesystem, can import directly
const { computeSalience, ARCHIVE_THRESHOLD, AUTO_ARCHIVE_THRESHOLD } = await import("../dist/palace/salience.js");

describe("Salience scoring", () => {
  it("high importance + recent + active + connected = near 1.0", () => {
    const score = computeSalience({
      importance: "high",
      lastUpdated: new Date().toISOString(), // today
      accessCount: 20,
      connectionCount: 10,
    });
    assert.ok(score > 0.9, `Expected >0.9, got ${score}`);
    assert.ok(score <= 1.0);
  });

  it("low importance + old + unused + isolated = low score", () => {
    const oldDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days ago
    const score = computeSalience({
      importance: "low",
      lastUpdated: oldDate,
      accessCount: 0,
      connectionCount: 0,
    });
    assert.ok(score < 0.2, `Expected <0.2, got ${score}`);
  });

  it("medium importance today = around 0.54", () => {
    const score = computeSalience({
      importance: "medium",
      lastUpdated: new Date().toISOString(),
      accessCount: 0,
      connectionCount: 0,
    });
    // 0.6*0.4 + ~1.0*0.3 + 0*0.2 + 0*0.1 = 0.24 + 0.3 = 0.54
    assert.ok(score > 0.5 && score < 0.6, `Expected ~0.54, got ${score}`);
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
    const monthAgo = computeSalience({
      importance: "medium",
      lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      accessCount: 5,
      connectionCount: 2,
    });
    assert.ok(today > weekAgo, "Today should score higher than a week ago");
    assert.ok(weekAgo > monthAgo, "A week ago should score higher than a month ago");
  });

  it("access count is capped at 20", () => {
    const at20 = computeSalience({
      importance: "medium",
      lastUpdated: new Date().toISOString(),
      accessCount: 20,
      connectionCount: 0,
    });
    const at100 = computeSalience({
      importance: "medium",
      lastUpdated: new Date().toISOString(),
      accessCount: 100,
      connectionCount: 0,
    });
    assert.equal(at20, at100); // both capped at min(1.0, count/20)
  });

  it("connection count is capped at 10", () => {
    const at10 = computeSalience({
      importance: "medium",
      lastUpdated: new Date().toISOString(),
      accessCount: 0,
      connectionCount: 10,
    });
    const at50 = computeSalience({
      importance: "medium",
      lastUpdated: new Date().toISOString(),
      accessCount: 0,
      connectionCount: 50,
    });
    assert.equal(at10, at50); // both capped
  });

  it("ARCHIVE_THRESHOLD is 0.15", () => {
    assert.equal(ARCHIVE_THRESHOLD, 0.15);
  });

  it("AUTO_ARCHIVE_THRESHOLD is 0.05", () => {
    assert.equal(AUTO_ARCHIVE_THRESHOLD, 0.05);
  });
});
