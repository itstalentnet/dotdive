import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

export type TokenData = {
  clientName: string;
  allowedProjects: string[];
  expiresAt: string;
};

let cachedFileMtime = 0;
let cachedFilePath = "";
let tokenCache = new Map<string, TokenData>();

export async function loadTokens(filePath: string): Promise<Map<string, TokenData>> {
  const resolvedPath = resolve(filePath);
  cachedFileMtime = 0;
  cachedFilePath = "";
  tokenCache.clear();
  const fileStats = await stat(resolvedPath);
  const content = await readFile(resolvedPath, "utf-8");
  const data: unknown = JSON.parse(content);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("token store must be a JSON object");
  }

  const map = new Map<string, TokenData>();
  for (const [token, value] of Object.entries(data)) {
    if (!token || !value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("token store contains an invalid entry");
    }
    const entry = value as Partial<TokenData>;
    if (
      typeof entry.clientName !== "string" ||
      !Array.isArray(entry.allowedProjects) ||
      entry.allowedProjects.length === 0 ||
      entry.allowedProjects.some((project) => typeof project !== "string" || !project.trim()) ||
      typeof entry.expiresAt !== "string" ||
      !Number.isFinite(Date.parse(entry.expiresAt))
    ) {
      throw new Error(`token store entry '${token}' has invalid scope or metadata`);
    }
    map.set(token, entry as TokenData);
  }

  cachedFilePath = resolvedPath;
  cachedFileMtime = fileStats.mtimeMs;
  tokenCache = map;
  return map;
}

export async function validateToken(token: string, tokensFile: string): Promise<TokenData | null> {
  const resolvedPath = resolve(tokensFile);
  let shouldReload = false;

  try {
    const fileStats = await stat(resolvedPath);
    if (resolvedPath !== cachedFilePath || fileStats.mtimeMs !== cachedFileMtime) {
      shouldReload = true;
    }
  } catch {
    cachedFileMtime = 0;
    cachedFilePath = "";
    tokenCache.clear();
    return null;
  }

  if (shouldReload || tokenCache.size === 0) {
    try {
      await loadTokens(tokensFile);
    } catch {
      cachedFileMtime = 0;
      cachedFilePath = "";
      tokenCache.clear();
      return null;
    }
  }

  const data = tokenCache.get(token);
  if (data) {
    if (data.expiresAt && Date.parse(data.expiresAt) <= Date.now()) {
      return null;
    }
    return data;
  }
  return null;
}

export function getAllowedProjectsForToken(tokenData: TokenData): string[] {
  return tokenData.allowedProjects;
}