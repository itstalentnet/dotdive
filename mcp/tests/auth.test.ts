import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadTokens, validateToken } from "../src/auth/tokens.js";

describe("auth/tokens", () => {
  let tempDir: string;
  let tokensFile: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "dotdive-mcp-auth-"));
    tokensFile = join(tempDir, "tokens.json");
    await writeFile(tokensFile, JSON.stringify({
      scoped: {
        clientName: "Test Client",
        allowedProjects: ["lemmo"],
        expiresAt: "2027-01-01T00:00:00.000Z",
      },
      expired: {
        clientName: "Expired Client",
        allowedProjects: ["lemmo"],
        expiresAt: "2020-01-01T00:00:00.000Z",
      },
    }));
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should validate existing token", async () => {
    const result = await validateToken("scoped", tokensFile);
    expect(result).not.toBeNull();
    expect(result?.clientName).toBe("Test Client");
    expect(result?.allowedProjects).toContain("lemmo");
  });

  it("should return null for invalid token", async () => {
    const result = await validateToken("invalid-token", tokensFile);
    expect(result).toBeNull();
  });

  it("should return null for expired token", async () => {
    const result = await validateToken("expired", tokensFile);
    expect(result).toBeNull();
  });

  it("should reject tokens with an empty project scope", async () => {
    await writeFile(tokensFile, JSON.stringify({
      unrestricted: {
        clientName: "Unrestricted",
        allowedProjects: [],
        expiresAt: "2099-01-01T00:00:00.000Z",
      },
    }));

    await expect(loadTokens(tokensFile)).rejects.toThrow("invalid scope");
    expect(await validateToken("unrestricted", tokensFile)).toBeNull();
  });
});