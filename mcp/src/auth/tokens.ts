import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type TokenData = {
  clientName: string;
  allowedProjects: string[];
  expiresAt?: string;
};

const tokenCache = new Map<string, TokenData>();

export async function loadTokens(filePath: string): Promise<Map<string, TokenData>> {
  const resolvedPath = resolve(filePath);
  try {
    const content = await readFile(resolvedPath, "utf-8");
    const data = JSON.parse(content);
    const map = new Map<string, TokenData>();
    for (const [token, tokenData] of Object.entries(data)) {
      map.set(token, tokenData as TokenData);
    }
    return map;
  } catch {
    return new Map();
  }
}

export async function validateToken(token: string, tokensFile: string): Promise<TokenData | null> {
  if (tokenCache.has(token)) {
    const data = tokenCache.get(token)!;
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      tokenCache.delete(token);
      return null;
    }
    return data;
  }

  const tokens = await loadTokens(tokensFile);
  const data = tokens.get(token);
  if (data) {
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      return null;
    }
    tokenCache.set(token, data);
    return data;
  }
  return null;
}

export function getAllowedProjectsForToken(tokenData: TokenData): string[] {
  return tokenData.allowedProjects;
}