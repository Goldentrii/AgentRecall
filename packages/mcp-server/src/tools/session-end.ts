import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { sessionEnd } from "agent-recall-core";

export function register(server: McpServer): void {
  server.registerTool("session_end", {
    title: "End Session",
    description: "Save session summary, insights, and trajectory. Writes journal, updates awareness, consolidates to palace.",
    inputSchema: {
      summary: z.string().describe("What happened this session (1-3 sentences)."),
      insights: z.array(z.object({
        title: z.string(),
        evidence: z.string(),
        applies_when: z.array(z.string()),
        severity: z.enum(["critical", "important", "minor"]).default("important"),
      })).optional().describe("Insights learned this session."),
      trajectory: z.string().optional().describe("Where is the work heading next."),
      project: z.string().default("auto"),
    },
  }, async ({ summary, insights, trajectory, project }) => {
    const result = await sessionEnd({ summary, insights, trajectory, project, saveType: "arsave" });
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  });
}
