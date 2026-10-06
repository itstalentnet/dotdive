import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

export type TokenData = {
  clientName: string;
  allowedProjects: string[];
  expiresAt?: string;
};

let cachedFileMtime = 0;
let tokenCache = new Map<string, TokenData>();

export async function loadTokens(filePath: string): Promise<Map<string, TokenData>> {
  const resolvedPath = resolve(filePath);
  try {
    const fileStats = await stat(resolvedPath);
    const content = await readFile(resolvedPath, "utf-8");
    const data = JSON.parse(content);
    const map = new Map<string, TokenData>();
    for (const [token, tokenData] of Object.entries(data)) {
      map.set(token, tokenData as TokenData);
    }
    cachedFileMtime = fileStats.mtimeMs;
    tokenCache = map;
    return map;
  } catch {
    cachedFileMtime = 0;
    tokenCache = new Map();
    return new Map();
  }
}

export async function validateToken(token: string, tokensFile: string): Promise<TokenData | null> {
  const resolvedPath = resolve(tokensFile);
  let shouldReload = false;

  try {
    const fileStats = await stat(resolvedPath);
    if (fileStats.mtimeMs !== cachedFileMtime) {
      shouldReload = true;
    }
  } catch {
    cachedFileMtime = 0;
    tokenCache.clear();
    return null;
  }

  if (shouldReload || tokenCache.size === 0) {
    await loadTokens(tokensFile);
  }

  const data = tokenCache.get(token);
  if (data) {
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      return null;
    }
    return data;
  }
  return null;
}

export function getAllowedProjectsForToken(tokenData: TokenData): string[] {
  return tokenData.allowedProjects;
}