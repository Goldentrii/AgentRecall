import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { projectStatus } from "agent-recall-core";

export function register(server: McpServer): void {
  server.registerTool("project_status", {
    title: "Project Status",
    description: "Get the current operational status of a project — last trajectory, active blockers, next steps, and palace room freshness. Use this when starting work on a long-running project to orient quickly without reading multiple sources.",
    inputSchema: {
      project: z.string().default("auto"),
    },
  }, async ({ project }) => {
    const result = await projectStatus({ project });
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  });
}
