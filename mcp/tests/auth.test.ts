import { describe, it, expect, beforeAll } from "vitest";
import { validateToken } from "../src/auth/tokens.js";

describe("auth/tokens", () => {
  it("should validate existing token", async () => {
    const result = await validateToken("test-token-123", "./tokens.json");
    expect(result).not.toBeNull();
    expect(result?.clientName).toBe("Test Client");
    expect(result?.allowedProjects).toContain("lemmo");
  });

  it("should return null for invalid token", async () => {
    const result = await validateToken("invalid-token", "./tokens.json");
    expect(result).toBeNull();
  });

  it("should return null for expired token", async () => {
    const result = await validateToken("expired-token", "./tokens.json");
    expect(result).toBeNull();
  });
});