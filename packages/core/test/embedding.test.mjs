// packages/core/test/embedding.test.mjs
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Embedding provider", () => {
  it("OpenAI provider has correct dimensions", async () => {
    const { OpenAIEmbedding } = await import("agent-recall-core");
    const provider = new OpenAIEmbedding("sk-test");
    assert.equal(provider.dimensions, 1536);
    assert.equal(provider.model, "text-embedding-3-small");
  });

  it("Voyage provider has correct dimensions", async () => {
    const { VoyageEmbedding } = await import("agent-recall-core");
    const provider = new VoyageEmbedding("pa-test");
    assert.equal(provider.dimensions, 1536);
    assert.equal(provider.nativeDimensions, 512);
  });

  it("zeroPad pads short vectors to target length", async () => {
    const { zeroPad } = await import("agent-recall-core");
    const short = [1.0, 2.0, 3.0];
    const padded = zeroPad(short, 6);
    assert.deepEqual(padded, [1.0, 2.0, 3.0, 0, 0, 0]);
  });

  it("zeroPad returns original if already correct length", async () => {
    const { zeroPad } = await import("agent-recall-core");
    const exact = [1.0, 2.0, 3.0];
    const padded = zeroPad(exact, 3);
    assert.deepEqual(padded, [1.0, 2.0, 3.0]);
  });

  it("createEmbeddingProvider returns correct type", async () => {
    const { createEmbeddingProvider, OpenAIEmbedding, VoyageEmbedding } = await import("agent-recall-core");
    const oai = createEmbeddingProvider("openai", "sk-test");
    const voy = createEmbeddingProvider("voyage", "pa-test");
    assert.ok(oai instanceof OpenAIEmbedding);
    assert.ok(voy instanceof VoyageEmbedding);
  });
});
