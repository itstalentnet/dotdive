import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

  it("should have read tools registered by default", () => {
    const tools = (server as any)._registeredTools;
    expect(tools).toBeDefined();
    expect("list_projects" in tools).toBe(true);
    expect("get_project_docs" in tools).toBe(true);
    expect("read_doc" in tools).toBe(true);
    expect("search_docs" in tools).toBe(true);
    // Write tools should NOT be registered if canWrite is not set
    expect("write_doc" in tools).toBe(false);
  });
});

describe("write tools", () => {
  let tempDocsDir: string;
  let index: Map<string, any>;
  let writeServer: McpServer;

  beforeAll(async () => {
    tempDocsDir = await mkdtemp(join(tmpdir(), "dotdive-write-test-"));
    index = new Map();
    index.set("testproj", {
      slug: "testproj",
      title: "Test Project",
      description: "Test Desc",
      files: [],
    });

    writeServer = new McpServer({ name: "write-test", version: "0.1.0" });
    registerTools(writeServer, {
      index,
      allowedProjects: ["testproj"],
      docsRoot: tempDocsDir,
      canWrite: true,
    });
  });

  afterAll(async () => {
    if (tempDocsDir) await rm(tempDocsDir, { recursive: true, force: true });
  });

  it("should have write_doc, update_doc, and delete_doc registered when canWrite is true", () => {
    const tools = (writeServer as any)._registeredTools;
    expect("write_doc" in tools).toBe(true);
    expect("update_doc" in tools).toBe(true);
    expect("delete_doc" in tools).toBe(true);
  });

  it("creates, updates, and deletes documentation files and refreshes index", async () => {
    const tools = (writeServer as any)._registeredTools;

    // 1. write_doc
    const writeHandler = tools["write_doc"].handler;
    const writeRes = await writeHandler({
      project: "testproj",
      path: "guide/getting-started.md",
      content: "# Getting Started\n\nWelcome to test docs.",
    });
    expect(writeRes.isError).toBeFalsy();
    expect(JSON.stringify(writeRes.content)).toContain("Successfully wrote");

    // Verify on disk
    const onDisk = await readFile(join(tempDocsDir, "testproj", "guide/getting-started.md"), "utf-8");
    expect(onDisk).toContain("Welcome to test docs");

    // Verify in index
    const proj = index.get("testproj");
    expect(proj.files.some((f: any) => f.path === "guide/getting-started.md")).toBe(true);

    // 2. update_doc
    const updateHandler = tools["update_doc"].handler;
    const updateRes = await updateHandler({
      project: "testproj",
      path: "guide/getting-started.md",
      content: "# Getting Started Updated\n\nNew content.",
    });
    expect(updateRes.isError).toBeFalsy();

    // 3. delete_doc
    const deleteHandler = tools["delete_doc"].handler;
    const deleteRes = await deleteHandler({
      project: "testproj",
      path: "guide/getting-started.md",
    });
    expect(deleteRes.isError).toBeFalsy();
    expect(index.get("testproj").files.length).toBe(0);
  });

  it("rejects path traversal attempts", async () => {
    const tools = (writeServer as any)._registeredTools;
    const writeHandler = tools["write_doc"].handler;
    const res = await writeHandler({
      project: "testproj",
      path: "../../evil.md",
      content: "malicious",
    });
    expect(res.isError).toBe(true);
    expect(JSON.stringify(res.content)).toContain("path traversal");
  });
});