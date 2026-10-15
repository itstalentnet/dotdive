import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { buildIndex } from "../core/indexer.js";
import { registerTools } from "../core/tools.js";
import { registerResources } from "../core/resources.js";
import { type Config, loadConfig } from "../config.js";
import { loadTokens, validateToken } from "../auth/tokens.js";

export async function createHttpServer(config: Config = loadConfig()): Promise<ReturnType<typeof createServer>> {
  const index = await buildIndex(config.docsRoot, []);
  const tokens = await loadTokens(config.tokensFile);
  if (tokens.size === 0) {
    throw new Error("HTTP mode requires at least one scoped bearer token");
  }
  for (const tokenData of tokens.values()) {
    if (tokenData.allowedProjects.some((project) => !index.has(project))) {
      throw new Error("token store contains a project scope that is not indexed");
    }
  }
  const rateWindows = new Map<string, { startedAt: number; count: number }>();

  const httpServer = createServer(async (req, res) => {
    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    if ((requestUrl.pathname === "/healthz" || requestUrl.pathname === "/readyz") && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }
    if (requestUrl.pathname === "/healthz" || requestUrl.pathname === "/readyz") {
      res.writeHead(405, { Allow: "GET" }).end();
      return;
    }
    if (requestUrl.pathname !== "/mcp") {
      res.writeHead(404).end();
      return;
    }
    if (req.method !== "POST") {
      res.writeHead(405, { Allow: "POST" }).end();
      return;
    }

    const authHeader = req.headers.authorization;
    const match = /^Bearer\s+(.+)$/i.exec(authHeader ?? "");
    if (!match) {
      res.writeHead(401, { "Content-Type": "application/json", "WWW-Authenticate": "Bearer" });
      res.end(JSON.stringify({ error: "Missing bearer token" }));
      return;
    }

    const tokenData = await validateToken(match[1], config.tokensFile);
    if (!tokenData || tokenData.allowedProjects.some((project) => !index.has(project))) {
      res.writeHead(401, { "Content-Type": "application/json", "WWW-Authenticate": "Bearer" });
      res.end(JSON.stringify({ error: "Invalid token or project scope" }));
      return;
    }

    const now = Date.now();
    const tokenKey = createHash("sha256").update(match[1]).digest("hex");
    const rateWindow = rateWindows.get(tokenKey);
    if (!rateWindow || now - rateWindow.startedAt >= 60_000) {
      rateWindows.set(tokenKey, { startedAt: now, count: 1 });
    } else if (rateWindow.count >= config.httpRateLimit) {
      res.writeHead(429, {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((60_000 - (now - rateWindow.startedAt)) / 1000)),
      });
      res.end(JSON.stringify({ error: "Rate limit exceeded" }));
      return;
    } else {
      rateWindow.count++;
    }

    const sessionServer = new McpServer({
      name: "dotdive-mcp",
      version: "0.1.0",
    });

    registerTools(sessionServer, { index, allowedProjects: tokenData.allowedProjects });
    registerResources(sessionServer, { index, allowedProjects: tokenData.allowedProjects });

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    try {
      await sessionServer.connect(transport);
      res.once("close", () => {
        void transport.close();
        void sessionServer.close();
      });
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("[dotdive-mcp] MCP request failed:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    }
  });

  httpServer.requestTimeout = 30_000;
  httpServer.headersTimeout = 10_000;
  return httpServer;
}