import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "node:http";
import { buildIndex } from "../core/indexer.js";
import { registerTools } from "../core/tools.js";
import { registerResources } from "../core/resources.js";
import { loadConfig } from "../config.js";
import { validateToken, getAllowedProjectsForToken } from "../auth/tokens.js";

export async function createHttpServer(): Promise<ReturnType<typeof createServer>> {
  const config = loadConfig();
  const index = await buildIndex(config.docsRoot, []);

  const httpServer = createServer(async (req, res) => {
    const authHeader = req.headers.authorization;
    let allowedProjects: string[] = [];

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const tokenData = await validateToken(token, config.tokensFile);
      if (tokenData) {
        allowedProjects = tokenData.allowedProjects;
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid token" }));
        return;
      }
    } else {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing authorization header" }));
      return;
    }

    // SEC-19: Instantiate McpServer per session to prevent duplicate tool registration errors
    const sessionServer = new McpServer({
      name: "dotdive-mcp",
      version: "0.1.0",
    });

    registerTools(sessionServer, { index, allowedProjects });
    registerResources(sessionServer, { index, allowedProjects });

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });

    await sessionServer.connect(transport);
    await transport.handleRequest(req, res);
  });

  return httpServer;
}