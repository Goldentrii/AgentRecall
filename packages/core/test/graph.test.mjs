import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const TEST_ROOT = path.join(os.tmpdir(), "ar-graph-test-" + Date.now());
const PALACE = path.join(TEST_ROOT, "projects", "test-proj", "palace");

describe("Palace graph — module integration", () => {
  let graph;

  before(async () => {
    process.env.AGENT_RECALL_ROOT = TEST_ROOT;
    fs.mkdirSync(PALACE, { recursive: true });
    graph = await import("../dist/palace/graph.js");
  });

  after(() => {
    delete process.env.AGENT_RECALL_ROOT;
    fs.rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it("readGraph returns empty edges for non-existent graph", () => {
    const g = graph.readGraph(PALACE);
    assert.deepEqual(g, { edges: [] });
  });

  it("addEdge creates a new edge", () => {
    graph.addEdge(PALACE, "goals/active", "architecture/decisions", "references");
    const g = graph.readGraph(PALACE);
    assert.equal(g.edges.length, 1);
    assert.equal(g.edges[0].from, "goals/active");
    assert.equal(g.edges[0].to, "architecture/decisions");
  });

  it("addEdge does not duplicate", () => {
    graph.addEdge(PALACE, "goals/active", "architecture/decisions", "references");
    const g = graph.readGraph(PALACE);
    assert.equal(g.edges.length, 1); // still 1
  });

  it("addEdge allows different types for same from/to", () => {
    graph.addEdge(PALACE, "goals/active", "architecture/decisions", "depends-on");
    const g = graph.readGraph(PALACE);
    assert.equal(g.edges.length, 2);
  });

  it("getConnectionCount counts edges for a room", () => {
    const count = graph.getConnectionCount(PALACE, "goals");
    assert.ok(count >= 2, `Expected >=2, got ${count}`);
  });

  it("getConnectedRooms returns connected room slugs", () => {
    const connected = graph.getConnectedRooms(PALACE, "goals");
    assert.ok(connected.includes("architecture"));
  });

  it("removeEdgesFor removes all edges involving a target", () => {
    graph.addEdge(PALACE, "blockers/current", "goals/active", "blocks");
    graph.removeEdgesFor(PALACE, "goals/active");
    const g = graph.readGraph(PALACE);
    const remaining = g.edges.filter(
      (e) => e.from === "goals/active" || e.to === "goals/active"
    );
    assert.equal(remaining.length, 0);
  });
});
