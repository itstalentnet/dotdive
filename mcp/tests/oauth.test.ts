import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Config } from "../src/config.js";
import { createHttpServer } from "../src/transports/http.js";
import { signJwt, verifyJwt } from "../src/auth/oauth.js";

describe("OAuth 2.0 functionality", () => {
  let tempDir: string;
  let tokensFile: string;
  let httpServer: Awaited<ReturnType<typeof createHttpServer>>;
  let serverBaseUrl: string;
  const oauthSecret = "test-oauth-secret-key-1234567890abcdef";

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "dotdive-mcp-oauth-"));
    tokensFile = join(tempDir, "tokens.json");

    await writeFile(
      tokensFile,
      JSON.stringify({
        "test-ai-client": {
          clientName: "AI Test Model",
          clientSecret: "ai-secret-key-xyz",
          allowedProjects: ["lemmo"],
          redirectUris: ["https://chatgpt.com/callback"],
        },
        "multi-project-client": {
          clientName: "Multi Project AI",
          clientSecret: "multi-secret-456",
          allowedProjects: ["lemmo", "nons"],
        },
        "static-client": {
          clientName: "Static Bearer Client",
          allowedProjects: ["lemmo"],
          expiresAt: "2099-01-01T00:00:00.000Z",
        },
      })
    );

    const config: Config = {
      transport: "http",
      docsRoot: fileURLToPath(new URL("../../docs", import.meta.url)),
      allowedProjects: "",
      httpHost: "127.0.0.1",
      httpPort: 0,
      httpRateLimit: 100,
      tokensFile,
      oauthSecret,
    };

    httpServer = await createHttpServer(config);
    await new Promise<void>((resolve, reject) => {
      httpServer.once("error", reject);
      httpServer.listen(0, "127.0.0.1", resolve);
    });

    const address = httpServer.address();
    if (!address || typeof address === "string") throw new Error("Server failed to bind");
    serverBaseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    if (httpServer?.listening) {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  it("signs and verifies JWT tokens correctly with expiration and tampering checks", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signJwt(
      {
        sub: "client-1",
        clientName: "Test",
        allowedProjects: ["lemmo"],
        exp: now + 3600,
      },
      oauthSecret
    );

    const verified = verifyJwt(token, oauthSecret);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe("client-1");
    expect(verified?.allowedProjects).toEqual(["lemmo"]);

    // Tampered token check
    const tampered = token.slice(0, -5) + "abcde";
    expect(verifyJwt(tampered, oauthSecret)).toBeNull();

    // Expired token check
    const expiredToken = signJwt(
      {
        sub: "client-1",
        clientName: "Test",
        allowedProjects: ["lemmo"],
        exp: now - 10,
      },
      oauthSecret
    );
    expect(verifyJwt(expiredToken, oauthSecret)).toBeNull();
  });

  it("serves OAuth 2.0 discovery metadata at .well-known endpoints", async () => {
    const res = await fetch(`${serverBaseUrl}/.well-known/oauth-authorization-server`);
    expect(res.status).toBe(200);
    const meta = (await res.json()) as Record<string, unknown>;
    expect(meta.token_endpoint).toBe(`${serverBaseUrl}/oauth/token`);
    expect(meta.authorization_endpoint).toBe(`${serverBaseUrl}/oauth/authorize`);
    expect(meta.grant_types_supported).toContain("client_credentials");
    expect(meta.grant_types_supported).toContain("authorization_code");
  });

  it("handles CORS preflight OPTIONS request", async () => {
    const res = await fetch(`${serverBaseUrl}/oauth/token`, {
      method: "OPTIONS",
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
  });

  it("obtains an access token via client_credentials flow and accesses MCP tools", async () => {
    // 1. Exchange client credentials for an access token
    const tokenRes = await fetch(`${serverBaseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: "test-ai-client",
        client_secret: "ai-secret-key-xyz",
      }),
    });

    expect(tokenRes.status).toBe(200);
    const tokenData = (await tokenRes.json()) as { access_token: string; token_type: string; expires_in: number };
    expect(tokenData.access_token).toBeTruthy();
    expect(tokenData.token_type).toBe("Bearer");
    expect(tokenData.expires_in).toBe(3600);

    // 2. Connect an MCP Client using the obtained OAuth token
    const mcpEndpoint = new URL(`${serverBaseUrl}/mcp`);
    const transport = new StreamableHTTPClientTransport(mcpEndpoint, {
      requestInit: { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
    });
    const client = new Client({ name: "oauth-test-client", version: "1.0.0" }, { capabilities: {} });

    await client.connect(transport);

    const listed = await client.callTool({ name: "list_projects", arguments: {} });
    const contentStr = JSON.stringify(listed.content);
    expect(contentStr).toContain("lemmo");

    await client.close();
  });

  it("authenticates via HTTP Basic header in client_credentials grant", async () => {
    const basicAuth = Buffer.from("test-ai-client:ai-secret-key-xyz").toString("base64");
    const res = await fetch(`${serverBaseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { access_token: string };
    expect(body.access_token).toBeTruthy();
  });

  it("executes the authorization_code flow with redirect", async () => {
    // Step 1: Authorization request with redirect
    const authUrl = `${serverBaseUrl}/oauth/authorize?response_type=code&client_id=test-ai-client&redirect_uri=${encodeURIComponent("https://chatgpt.com/callback")}&state=state123`;
    const authRes = await fetch(authUrl, { redirect: "manual" });
    expect(authRes.status).toBe(302);

    const redirectLocation = authRes.headers.get("location");
    expect(redirectLocation).toBeTruthy();
    const redirectedUrl = new URL(redirectLocation!);
    expect(redirectedUrl.searchParams.get("state")).toBe("state123");
    const code = redirectedUrl.searchParams.get("code");
    expect(code).toBeTruthy();

    // Step 2: Token exchange with code
    const tokenRes = await fetch(`${serverBaseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: "test-ai-client",
        client_secret: "ai-secret-key-xyz",
        code,
        redirect_uri: "https://chatgpt.com/callback",
      }),
    });

    expect(tokenRes.status).toBe(200);
    const tokenData = (await tokenRes.json()) as { access_token: string };
    expect(tokenData.access_token).toBeTruthy();

    // Verify token works on MCP endpoint
    const mcpRes = await fetch(`${serverBaseUrl}/mcp`, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "auth-code-client", version: "1.0.0" },
        },
      }),
    });
    expect(mcpRes.status).toBe(200);
  });

  it("rejects invalid client credentials or missing parameters", async () => {
    const wrongSecret = await fetch(`${serverBaseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: "test-ai-client",
        client_secret: "wrong-password",
      }),
    });
    expect(wrongSecret.status).toBe(401);

    const missingGrant = await fetch(`${serverBaseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: "test-ai-client",
        client_secret: "ai-secret-key-xyz",
      }),
    });
    expect(missingGrant.status).toBe(400);

    const unsupportedGrant = await fetch(`${serverBaseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "implicit",
        client_id: "test-ai-client",
        client_secret: "ai-secret-key-xyz",
      }),
    });
    expect(unsupportedGrant.status).toBe(400);
  });
});
