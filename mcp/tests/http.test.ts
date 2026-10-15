import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Config } from "../src/config.js";
import { createHttpServer } from "../src/transports/http.js";

describe("HTTP transport", () => {
  const token = "http-integration-token";
  let tempDir: string;
  let httpServer: Awaited<ReturnType<typeof createHttpServer>>;
  let client: Client;
  let transport: StreamableHTTPClientTransport;
  let endpoint: URL;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "dotdive-mcp-http-"));
    const tokensFile = join(tempDir, "tokens.json");
    await writeFile(tokensFile, JSON.stringify({
      [token]: {
        clientName: "HTTP Test Client",
        allowedProjects: ["lemmo"],
        expiresAt: "2099-01-01T00:00:00.000Z",
      },
    }));

    const config: Config = {
      transport: "http",
      docsRoot: fileURLToPath(new URL("../../docs", import.meta.url)),
      allowedProjects: "",
      httpHost: "127.0.0.1",
      httpPort: 3900,
      httpRateLimit: 10,
      tokensFile,
    };
    httpServer = await createHttpServer(config);
    await new Promise<void>((resolve, reject) => {
      httpServer.once("error", reject);
      httpServer.listen(0, "127.0.0.1", resolve);
    });

    const address = httpServer.address();
    if (!address || typeof address === "string") throw new Error("HTTP test server did not bind a TCP port");
    endpoint = new URL(`http://127.0.0.1:${address.port}/mcp`);
    transport = new StreamableHTTPClientTransport(endpoint, {
      requestInit: { headers: { Authorization: `Bearer ${token}` } },
    });
    client = new Client({ name: "dotdive-mcp-test", version: "1.0.0" }, { capabilities: {} });
  });

  afterAll(async () => {
    await client?.close();
    if (httpServer?.listening) {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => error ? reject(error) : resolve());
      });
    }
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  it("supports initialize and repeated calls with project-scoped access", async () => {
    await client.connect(transport);
    expect(transport.sessionId).toBeUndefined();

    const listed = await client.callTool({ name: "list_projects", arguments: {} });
    const listedText = JSON.stringify(listed.content);
    expect(listedText).toContain("lemmo");
    expect(listedText).not.toContain("nons");

    const document = await client.callTool({
      name: "get_project_docs",
      arguments: { project: "lemmo" },
    });
    expect(document.isError).not.toBe(true);

    const denied = await client.callTool({
      name: "get_project_docs",
      arguments: { project: "nons" },
    });
    expect(denied.isError).toBe(true);

    let rateLimited: Response | undefined;
    for (let id = 2; id < 30; id++) {
      rateLimited = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json, text/event-stream",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jsonrpc: "2.0", id, method: "ping", params: {} }),
      });
      if (rateLimited.status === 429) break;
    }
    if (!rateLimited) throw new Error("rate-limit request loop did not run");
    expect(rateLimited.status).toBe(429);
    expect(rateLimited.headers.get("Retry-After")).toBeTruthy();
  });

  it("rejects unauthenticated MCP requests", async () => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json, text/event-stream", "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "unauthenticated-test", version: "1.0.0" },
        },
      }),
    });
    expect(response.status).toBe(401);
  });
});