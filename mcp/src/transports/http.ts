import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { buildIndex } from "../core/indexer.js";
import { registerTools } from "../core/tools.js";
import { registerResources } from "../core/resources.js";
import { type Config, loadConfig } from "../config.js";
import { loadAuthStore, validateToken } from "../auth/tokens.js";
import { handleOAuthAuthorize, handleOAuthToken } from "../auth/oauth.js";

export async function createHttpServer(config: Config = loadConfig()): Promise<ReturnType<typeof createServer>> {
  const index = await buildIndex(config.docsRoot, []);
  const authStore = await loadAuthStore(config.tokensFile);
  const effectiveOAuthSecret = config.oauthSecret || randomBytes(32).toString("hex");

  if (authStore.tokens.size === 0 && authStore.clients.size === 0) {
    throw new Error("HTTP mode requires at least one scoped bearer token or OAuth client");
  }

  const allProjects = Array.from(index.keys());

  for (const tokenData of authStore.tokens.values()) {
    if (tokenData.allowedProjects.includes("*")) {
      tokenData.allowedProjects = allProjects;
    } else if (tokenData.allowedProjects.some((project) => !index.has(project))) {
      throw new Error("token store contains a project scope that is not indexed");
    }
  }

  for (const client of authStore.clients.values()) {
    if (client.allowedProjects.includes("*")) {
      client.allowedProjects = allProjects;
    } else if (client.allowedProjects.some((project) => !index.has(project))) {
      throw new Error("token store contains an OAuth client project scope that is not indexed");
    }
  }

  const rateWindows = new Map<string, { startedAt: number; count: number }>();

  const httpServer = createServer(async (req, res) => {
    const requestUrl = new URL(req.url ?? "/", "http://localhost");

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
        "Access-Control-Max-Age": "86400",
      });
      res.end();
      return;
    }

    // Health endpoints
    if ((requestUrl.pathname === "/healthz" || requestUrl.pathname === "/readyz") && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }
    if (requestUrl.pathname === "/healthz" || requestUrl.pathname === "/readyz") {
      res.writeHead(405, { Allow: "GET" }).end();
      return;
    }

    // OAuth 2.0 / OpenID Connect metadata discovery
    if (
      (requestUrl.pathname === "/.well-known/oauth-authorization-server" ||
        requestUrl.pathname === "/.well-known/openid-configuration") &&
      req.method === "GET"
    ) {
      const issuer = config.publicUrl ?? `http://${req.headers.host ?? `${config.httpHost}:${config.httpPort}`}`;
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(
        JSON.stringify({
          issuer,
          authorization_endpoint: `${issuer}/oauth/authorize`,
          token_endpoint: `${issuer}/oauth/token`,
          token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
          grant_types_supported: ["client_credentials", "authorization_code"],
          response_types_supported: ["code"],
          service_documentation: "https://dotdive.ir",
        })
      );
      return;
    }

    // OAuth 2.0 Authorize endpoint
    if (requestUrl.pathname === "/oauth/authorize") {
      if (req.method !== "GET") {
        res.writeHead(405, { Allow: "GET", "Access-Control-Allow-Origin": "*" }).end();
        return;
      }
      await handleOAuthAuthorize(req, res, requestUrl, config);
      return;
    }

    // OAuth 2.0 Token endpoint
    if (requestUrl.pathname === "/oauth/token") {
      if (req.method !== "POST") {
        res.writeHead(405, { Allow: "POST", "Access-Control-Allow-Origin": "*" }).end();
        return;
      }
      await handleOAuthToken(req, res, config, effectiveOAuthSecret);
      return;
    }

    // MCP endpoint
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
      res.writeHead(401, {
        "Content-Type": "application/json",
        "WWW-Authenticate": "Bearer",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ error: "Missing bearer token" }));
      return;
    }

    const tokenData = await validateToken(match[1], config.tokensFile, effectiveOAuthSecret);
    let resolvedProjects = tokenData?.allowedProjects ?? [];
    if (resolvedProjects.includes("*")) {
      resolvedProjects = allProjects;
    }
    if (!tokenData || resolvedProjects.some((project) => !index.has(project))) {
      res.writeHead(401, {
        "Content-Type": "application/json",
        "WWW-Authenticate": "Bearer",
        "Access-Control-Allow-Origin": "*",
      });
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
        "Access-Control-Allow-Origin": "*",
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

    registerTools(sessionServer, {
      index,
      allowedProjects: resolvedProjects,
      docsRoot: config.docsRoot,
      canWrite: tokenData.canWrite ?? false,
    });
    registerResources(sessionServer, { index, allowedProjects: resolvedProjects });

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
        res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    }
  });

  httpServer.requestTimeout = 30_000;
  httpServer.headersTimeout = 10_000;
  return httpServer;
}