import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { verifyJwt } from "./oauth.js";

export type TokenData = {
  clientName: string;
  allowedProjects: string[];
  expiresAt: string;
  canWrite?: boolean;
};

export type OAuthClient = {
  clientId: string;
  clientSecret: string;
  clientName: string;
  allowedProjects: string[];
  redirectUris?: string[];
  canWrite?: boolean;
};

export type AuthStore = {
  tokens: Map<string, TokenData>;
  clients: Map<string, OAuthClient>;
};

let cachedFileMtime = 0;
let cachedFilePath = "";
let tokenCache = new Map<string, TokenData>();
let clientCache = new Map<string, OAuthClient>();

function validateProjects(projects: unknown): projects is string[] {
  return (
    Array.isArray(projects) &&
    projects.length > 0 &&
    projects.every((p) => typeof p === "string" && p.trim().length > 0)
  );
}

export async function loadAuthStore(filePath: string): Promise<AuthStore> {
  const resolvedPath = resolve(filePath);
  cachedFileMtime = 0;
  cachedFilePath = "";
  tokenCache.clear();
  clientCache.clear();

  const fileStats = await stat(resolvedPath);
  const content = await readFile(resolvedPath, "utf-8");
  const data: unknown = JSON.parse(content);

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("token store must be a JSON object");
  }

  const rawRecord = data as Record<string, unknown>;
  const tokensMap = new Map<string, TokenData>();
  const clientsMap = new Map<string, OAuthClient>();

  const hasStructuredSections =
    ("tokens" in rawRecord && typeof rawRecord.tokens === "object" && rawRecord.tokens !== null) ||
    ("clients" in rawRecord && typeof rawRecord.clients === "object" && rawRecord.clients !== null);

  if (hasStructuredSections) {
    if (rawRecord.tokens && typeof rawRecord.tokens === "object") {
      for (const [token, value] of Object.entries(rawRecord.tokens as Record<string, unknown>)) {
        parseTokenEntry(token, value, tokensMap);
      }
    }
    if (rawRecord.clients && typeof rawRecord.clients === "object") {
      for (const [clientId, value] of Object.entries(rawRecord.clients as Record<string, unknown>)) {
        parseClientEntry(clientId, value, clientsMap);
      }
    }
  } else {
    for (const [key, value] of Object.entries(rawRecord)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("token store contains an invalid entry");
      }
      const entry = value as Record<string, unknown>;
      if ("clientSecret" in entry) {
        parseClientEntry(key, value, clientsMap);
      } else {
        parseTokenEntry(key, value, tokensMap);
      }
    }
  }

  cachedFilePath = resolvedPath;
  cachedFileMtime = fileStats.mtimeMs;
  tokenCache = tokensMap;
  clientCache = clientsMap;

  return { tokens: tokenCache, clients: clientCache };
}

function parseTokenEntry(key: string, value: unknown, map: Map<string, TokenData>): void {
  if (!key || !value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("token store contains an invalid entry");
  }
  const entry = value as Partial<TokenData>;
  if (
    typeof entry.clientName !== "string" ||
    !validateProjects(entry.allowedProjects) ||
    typeof entry.expiresAt !== "string" ||
    !Number.isFinite(Date.parse(entry.expiresAt))
  ) {
    throw new Error(`token store entry '${key}' has invalid scope or metadata`);
  }
  map.set(key, {
    clientName: entry.clientName,
    allowedProjects: entry.allowedProjects,
    expiresAt: entry.expiresAt,
    canWrite: typeof entry.canWrite === "boolean" ? entry.canWrite : false,
  });
}

function parseClientEntry(key: string, value: unknown, map: Map<string, OAuthClient>): void {
  if (!key || !value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("token store contains an invalid entry");
  }
  const entry = value as Partial<OAuthClient>;
  if (
    typeof entry.clientName !== "string" ||
    typeof entry.clientSecret !== "string" ||
    !entry.clientSecret ||
    !validateProjects(entry.allowedProjects)
  ) {
    throw new Error(`token store entry '${key}' has invalid scope or metadata`);
  }

  if (entry.redirectUris !== undefined) {
    if (!Array.isArray(entry.redirectUris) || entry.redirectUris.some((u) => typeof u !== "string")) {
      throw new Error(`token store entry '${key}' has invalid redirectUris`);
    }
  }

  map.set(key, {
    clientId: key,
    clientSecret: entry.clientSecret,
    clientName: entry.clientName,
    allowedProjects: entry.allowedProjects,
    redirectUris: entry.redirectUris,
    canWrite: typeof entry.canWrite === "boolean" ? entry.canWrite : true,
  });
}

export async function loadTokens(filePath: string): Promise<Map<string, TokenData>> {
  const store = await loadAuthStore(filePath);
  return store.tokens;
}

async function ensureFreshStore(filePath: string): Promise<boolean> {
  const resolvedPath = resolve(filePath);
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
    clientCache.clear();
    return false;
  }

  if (shouldReload || (tokenCache.size === 0 && clientCache.size === 0)) {
    try {
      await loadAuthStore(filePath);
      return true;
    } catch {
      cachedFileMtime = 0;
      cachedFilePath = "";
      tokenCache.clear();
      clientCache.clear();
      return false;
    }
  }
  return true;
}

export async function getOAuthClient(clientId: string, tokensFile: string): Promise<OAuthClient | null> {
  const ok = await ensureFreshStore(tokensFile);
  if (!ok) return null;
  return clientCache.get(clientId) ?? null;
}

export async function validateToken(
  token: string,
  tokensFile: string,
  oauthSecret?: string
): Promise<TokenData | null> {
  if (oauthSecret) {
    const jwt = verifyJwt(token, oauthSecret);
    if (jwt) {
      const client = await getOAuthClient(jwt.sub, tokensFile);
      const canWrite = client ? (client.canWrite ?? true) : (jwt.canWrite ?? false);

      return {
        clientName: jwt.clientName,
        allowedProjects: jwt.allowedProjects,
        expiresAt: new Date(jwt.exp * 1000).toISOString(),
        canWrite,
      };
    }
  }

  const ok = await ensureFreshStore(tokensFile);
  if (!ok) return null;

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