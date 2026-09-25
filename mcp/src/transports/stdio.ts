import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildIndex } from "../core/indexer.js";
import { registerTools } from "../core/tools.js";
import { registerResources } from "../core/resources.js";
import { loadConfig, getAllowedProjects } from "../config.js";

export async function createStdioServer(): Promise<McpServer> {
  const config = loadConfig();
  const allowedProjects = getAllowedProjects();

  const index = await buildIndex(config.docsRoot, allowedProjects);

  const server = new McpServer({
    name: "dotdive-mcp",
    version: "0.1.0",
  });

  registerTools(server, { index, allowedProjects });
  registerResources(server, { index, allowedProjects });

  return server;
}

export async function runStdio(): Promise<void> {
  const server = await createStdioServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}