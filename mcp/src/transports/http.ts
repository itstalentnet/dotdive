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
    if ((requestUrl.pathname === "/healthz" || requestUrl.pathname === "/readyz") && (req.method === "GET" || req.method === "HEAD")) {
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      if (req.method === "HEAD") { res.end(); return; }
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }
    if (requestUrl.pathname === "/healthz" || requestUrl.pathname === "/readyz") {
      res.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }

    // Favicon & Logo static assets (for ChatGPT / Claude / browsers)
    if (
      (requestUrl.pathname === "/favicon.ico" ||
        requestUrl.pathname === "/favicon.svg" ||
        requestUrl.pathname === "/logo.svg" ||
        requestUrl.pathname === "/apple-touch-icon.png") &&
      (req.method === "GET" || req.method === "HEAD")
    ) {
      res.writeHead(200, {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      });
      if (req.method === "HEAD") { res.end(); return; }
      res.end(BRAND_SVG_ICON);
      return;
    }

    // Root status & landing page
    if ((requestUrl.pathname === "/" || requestUrl.pathname === "/index.html") && (req.method === "GET" || req.method === "HEAD")) {
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      });
      if (req.method === "HEAD") { res.end(); return; }
      res.end(LANDING_PAGE_HTML);
      return;
    }

    // OAuth 2.0 / OpenID Connect metadata discovery
    if (
      (requestUrl.pathname === "/.well-known/oauth-authorization-server" ||
        requestUrl.pathname === "/.well-known/openid-configuration") &&
      (req.method === "GET" || req.method === "HEAD")
    ) {
      const issuer = config.publicUrl ?? `http://${req.headers.host ?? `${config.httpHost}:${config.httpPort}`}`;
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      });
      if (req.method === "HEAD") { res.end(); return; }
      res.end(
        JSON.stringify({
          issuer,
          client_name: "Lemmo Documentation Engine",
          logo_uri: `${issuer}/logo.svg`,
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
      name: "lemmo-documentation-engine",
      version: "1.0.0",
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

const BRAND_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="128" fill="#0B0C0E"/>
  <g>
    <path d="M143.836 311.343C174.673 311.343 199.671 336.341 199.671 367.178C199.671 398.015 174.673 423.014 143.836 423.014C112.998 423.014 88 398.015 88 367.178C88 336.341 112.998 311.343 143.836 311.343Z" fill="#D1FE17"/>
    <path d="M367.178 311.343C398.015 311.343 423.014 336.341 423.014 367.178C423.014 398.015 398.015 423.014 367.178 423.014C336.341 423.014 311.343 398.015 311.343 367.178C311.343 336.341 336.341 311.343 367.178 311.343Z" fill="#D1FE17"/>
    <path d="M255.507 88C286.344 88 311.343 112.998 311.343 143.836C311.343 174.673 286.344 199.671 255.507 199.671C224.67 199.671 199.671 174.673 199.671 143.836C199.671 112.998 224.67 88 255.507 88Z" fill="#D1FE17"/>
  </g>
</svg>`;

const LANDING_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lemmo Documentation Engine (MCP)</title>
  <link rel="icon" type="image/svg+xml" href="/logo.svg">
  <link rel="apple-touch-icon" href="/logo.svg">
  <meta property="og:title" content="Lemmo Documentation Engine (MCP)">
  <meta property="og:description" content="Official Model Context Protocol server for Lemmo architecture and documentation.">
  <meta property="og:image" content="/logo.svg">
  <style>
    :root {
      --bg: #0b0c0e;
      --card-bg: #14171a;
      --border: #22272e;
      --lime: #d1fe17;
      --text: #f0f3f6;
      --text-muted: #8b949e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      max-width: 580px;
      width: 100%;
      padding: 36px 32px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.4);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .logo {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: #000;
      border: 1px solid var(--border);
    }
    .title-group h1 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      padding: 3px 10px;
      border-radius: 20px;
      background: rgba(209, 254, 23, 0.12);
      color: var(--lime);
      font-size: 12px;
      font-weight: 600;
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--lime);
      box-shadow: 0 0 8px var(--lime);
    }
    p.desc {
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .endpoints {
      background: #0d0f12;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
      font-size: 13px;
    }
    .endpoint-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .endpoint-row:last-child { border-bottom: none; }
    .method {
      font-weight: 700;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #21262d;
      color: #58a6ff;
    }
    .path { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #c9d1d9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <img src="/logo.svg" alt="Lemmo Logo" class="logo">
      <div class="title-group">
        <h1>Lemmo Documentation Engine</h1>
        <div class="badge"><span class="badge-dot"></span> Active & Operational</div>
      </div>
    </div>
    <p class="desc">Official Model Context Protocol (MCP) server providing live semantic search, document reading, and authorized authoring for Lemmo Architecture SSOT.</p>
    <div class="endpoints">
      <div class="endpoint-row"><span class="path">/mcp</span><span class="method">POST (Streamable HTTP)</span></div>
      <div class="endpoint-row"><span class="path">/oauth/token</span><span class="method">POST (RFC 6749)</span></div>
      <div class="endpoint-row"><span class="path">/oauth/authorize</span><span class="method">GET (Interactive / Redirect)</span></div>
      <div class="endpoint-row"><span class="path">/readyz</span><span class="method">GET (Health Check)</span></div>
    </div>
  </div>
</body>
</html>`;