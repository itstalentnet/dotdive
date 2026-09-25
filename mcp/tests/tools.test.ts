import { describe, it, expect, beforeAll } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { buildIndex } from "../src/core/indexer.js";
import { registerTools } from "../src/core/tools.js";

describe("tools", () => {
  let index: Map<string, any>;
  let server: McpServer;

  beforeAll(async () => {
    index = await buildIndex("../docs", []);
    server = new McpServer({ name: "test", version: "0.1.0" });
    registerTools(server, { index, allowedProjects: [] });
  });

  it("should have list_projects tool registered", () => {
    const tools = (server as any)._registeredTools;
    expect(tools).toBeDefined();
    expect("list_projects" in tools).toBe(true);
  });

  it("should have get_project_docs tool registered", () => {
    const tools = (server as any)._registeredTools;
    expect("get_project_docs" in tools).toBe(true);
  });

  it("should have read_doc tool registered", () => {
    const tools = (server as any)._registeredTools;
    expect("read_doc" in tools).toBe(true);
  });

  it("should have search_docs tool registered", () => {
    const tools = (server as any)._registeredTools;
    expect("search_docs" in tools).toBe(true);
  });
});