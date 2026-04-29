// packages/core/test/config.test.mjs
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { setRoot, resetRoot } from "agent-recall-core";

describe("Supabase config", () => {
  let tmpDir;
  let origEnv;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar-config-"));
    origEnv = { ...process.env };
    setRoot(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    // Restore env
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("AGENT_RECALL_")) delete process.env[key];
    }
    Object.assign(process.env, origEnv);
    resetRoot();
  });

  it("returns null when no config exists", async () => {
    const { readSupabaseConfig } = await import("agent-recall-core");
    const config = readSupabaseConfig();
    assert.equal(config, null);
  });

  it("reads config from config.json", async () => {
    const { readSupabaseConfig } = await import("agent-recall-core");
    fs.writeFileSync(path.join(tmpDir, "config.json"), JSON.stringify({
      supabase_url: "https://test.supabase.co",
      supabase_anon_key: "eyJ-test",
      embedding_provider: "openai",
      embedding_api_key: "sk-test",
      sync_enabled: true,
    }));
    const config = readSupabaseConfig();
    assert.equal(config.supabase_url, "https://test.supabase.co");
    assert.equal(config.sync_enabled, true);
  });

  it("env vars override config.json", async () => {
    const { readSupabaseConfig } = await import("agent-recall-core");
    fs.writeFileSync(path.join(tmpDir, "config.json"), JSON.stringify({
      supabase_url: "https://file.supabase.co",
      supabase_anon_key: "file-key",
      embedding_provider: "openai",
      embedding_api_key: "sk-file",
      sync_enabled: true,
    }));
    process.env.AGENT_RECALL_SUPABASE_URL = "https://env.supabase.co";
    process.env.AGENT_RECALL_SUPABASE_KEY = "env-key";
    const config = readSupabaseConfig();
    assert.equal(config.supabase_url, "https://env.supabase.co");
    assert.equal(config.supabase_anon_key, "env-key");
  });

  it("returns null when sync_enabled is false", async () => {
    const { readSupabaseConfig } = await import("agent-recall-core");
    fs.writeFileSync(path.join(tmpDir, "config.json"), JSON.stringify({
      supabase_url: "https://test.supabase.co",
      supabase_anon_key: "key",
      embedding_provider: "openai",
      embedding_api_key: "sk-test",
      sync_enabled: false,
    }));
    const config = readSupabaseConfig();
    assert.equal(config, null);
  });
});
