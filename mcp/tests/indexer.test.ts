import { describe, it, expect, beforeAll } from "vitest";
import { buildIndex } from "../src/core/indexer.js";
import { searchIndex } from "../src/core/search.js";

describe("indexer", () => {
  let index: Map<string, any>;

  beforeAll(async () => {
    index = await buildIndex("../docs", []);
  });

  it("should find lemmo project", () => {
    expect(index.has("lemmo")).toBe(true);
  });

  it("should find nons project", () => {
    expect(index.has("nons")).toBe(true);
  });

  it("should find public project", () => {
    expect(index.has("public")).toBe(true);
  });

  it("should index files in lemmo project", () => {
    const lemmo = index.get("lemmo");
    expect(lemmo.files.length).toBeGreaterThan(0);
    expect(lemmo.files.some((f: any) => f.path === "index.md")).toBe(true);
  });

  it("should extract title from frontmatter or H1", () => {
    const lemmo = index.get("lemmo");
    const indexFile = lemmo.files.find((f: any) => f.path === "index.md");
    expect(indexFile.title).toBeTruthy();
    expect(indexFile.title).not.toBe("Untitled");
  });

  it("should extract headings", () => {
    const lemmo = index.get("lemmo");
    const indexFile = lemmo.files.find((f: any) => f.path === "index.md");
    expect(Array.isArray(indexFile.headings)).toBe(true);
  });
});

describe("search", () => {
  let index: Map<string, any>;

  beforeAll(async () => {
    index = await buildIndex("../docs", []);
  });

  it("should find results for common query", () => {
    const results = searchIndex(index, "architecture");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should return project, path, title, snippet", () => {
    const results = searchIndex(index, "architecture");
    const result = results[0];
    expect(result).toHaveProperty("project");
    expect(result).toHaveProperty("path");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("snippet");
  });

  it("should filter by project when specified", () => {
    const results = searchIndex(index, "architecture", "lemmo");
    expect(results.every((r) => r.project === "lemmo")).toBe(true);
  });

  it("should return empty array for empty query", () => {
    const results = searchIndex(index, "");
    expect(results).toEqual([]);
  });

  it("should return empty array for no matches", () => {
    const results = searchIndex(index, "xyznonexistentquery123");
    expect(results).toEqual([]);
  });
});