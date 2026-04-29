// packages/core/test/sync.test.mjs
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Sync utilities", () => {
  it("contentHash produces consistent SHA-256", async () => {
    const { contentHash } = await import("agent-recall-core");
    const hash1 = contentHash("hello world");
    const hash2 = contentHash("hello world");
    const hash3 = contentHash("different");
    assert.equal(hash1, hash2);
    assert.notEqual(hash1, hash3);
    assert.equal(hash1.length, 64);
  });

  it("parseMemoryFile extracts frontmatter and body", async () => {
    const { parseMemoryFile } = await import("agent-recall-core");
    const content = `---
type: journal
project: test
date: 2026-04-29
tags: ["journal", "test"]
---
# 2026-04-29 — test

## Brief
Did some work today.

## Next
Continue tomorrow.`;

    const parsed = parseMemoryFile(content);
    assert.equal(parsed.title, "2026-04-29 — test");
    assert.ok(parsed.body.includes("Did some work today"));
    assert.equal(parsed.metadata.type, "journal");
  });

  it("parseMemoryFile handles files without frontmatter", async () => {
    const { parseMemoryFile } = await import("agent-recall-core");
    const content = `# Simple Note\n\nSome content here.`;
    const parsed = parseMemoryFile(content);
    assert.equal(parsed.title, "Simple Note");
    assert.ok(parsed.body.includes("Some content here"));
  });

  it("deriveSlug creates stable slug from file path", async () => {
    const { deriveSlug } = await import("agent-recall-core");
    const slug1 = deriveSlug("/home/user/.agent-recall/projects/myproj/journal/2026-04-29.md");
    const slug2 = deriveSlug("/home/user/.agent-recall/projects/myproj/journal/2026-04-29.md");
    assert.equal(slug1, slug2);
    assert.ok(slug1.includes("2026-04-29"));
  });

  it("deriveSlug handles palace paths", async () => {
    const { deriveSlug } = await import("agent-recall-core");
    const slug = deriveSlug("/home/user/.agent-recall/projects/myproj/palace/rooms/goals/active.md");
    assert.ok(slug.includes("palace"));
    assert.ok(slug.includes("goals"));
  });
});
