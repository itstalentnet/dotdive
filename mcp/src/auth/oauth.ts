import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Config } from "../config.js";
import { type OAuthClient, getOAuthClient } from "./tokens.js";

export type JwtPayload = {
  iss: string;
  sub: string;
  clientName: string;
  allowedProjects: string[];
  scope?: string;
  iat: number;
  exp: number;
};

export type AuthCodeEntry = {
  code: string;
  clientId: string;
  redirectUri: string;
  allowedProjects: string[];
  expiresAt: number;
  scope?: string;
};

const authCodes = new Map<string, AuthCodeEntry>();

function base64UrlEncode(data: string | Buffer): string {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf-8");
  return buf.toString("base64url");
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf-8");
}

export function signJwt(
  payload: Omit<JwtPayload, "iat" | "iss"> & { iat?: number; iss?: string },
  secret: string
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const fullPayload: JwtPayload = {
    iss: payload.iss ?? "dotdive-mcp",
    iat: payload.iat ?? Math.floor(Date.now() / 1000),
    ...payload,
  };
  const payloadEncoded = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${headerEncoded}.${payloadEncoded}`;
  const signature = createHmac("sha256", secret).update(dataToSign).digest("base64url");
  return `${dataToSign}.${signature}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerEncoded, payloadEncoded, signatureProvided] = parts;
  if (!headerEncoded || !payloadEncoded || !signatureProvided) return null;

  try {
    const dataToSign = `${headerEncoded}.${payloadEncoded}`;
    const expectedSignature = createHmac("sha256", secret).update(dataToSign).digest("base64url");

    const sigBufA = Buffer.from(signatureProvided);
    const sigBufB = Buffer.from(expectedSignature);
    if (sigBufA.length !== sigBufB.length || !timingSafeEqual(sigBufA, sigBufB)) {
      return null;
    }

    const payload: unknown = JSON.parse(base64UrlDecode(payloadEncoded));
    if (!payload || typeof payload !== "object") return null;
    const typedPayload = payload as Partial<JwtPayload>;

    if (
      typeof typedPayload.exp !== "number" ||
      typeof typedPayload.sub !== "string" ||
      !Array.isArray(typedPayload.allowedProjects) ||
      typedPayload.allowedProjects.some((p) => typeof p !== "string")
    ) {
      return null;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (typedPayload.exp <= nowSeconds) {
      return null;
    }

    return typedPayload as JwtPayload;
  } catch {
    return null;
  }
}

export function createAuthorizationCode(
  clientId: string,
  redirectUri: string,
  allowedProjects: string[],
  scope?: string,
  ttlSeconds = 300
): string {
  const code = randomBytes(24).toString("hex");
  authCodes.set(code, {
    code,
    clientId,
    redirectUri,
    allowedProjects,
    scope,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return code;
}

export function consumeAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri?: string
): AuthCodeEntry | null {
  const entry = authCodes.get(code);
  if (!entry) return null;
  authCodes.delete(code);

  if (entry.expiresAt <= Date.now()) return null;
  if (entry.clientId !== clientId) return null;
  if (redirectUri && entry.redirectUri && entry.redirectUri !== redirectUri) return null;

  return entry;
}

export function issueAccessToken(
  client: { clientId: string; clientName: string; allowedProjects: string[] },
  secret: string,
  requestedScope?: string,
  expiresInSeconds = 3600
): { access_token: string; token_type: string; expires_in: number; scope: string } {
  let scopedProjects = client.allowedProjects;
  if (requestedScope && requestedScope.trim()) {
    const requested = requestedScope.split(/[\s,]+/).filter(Boolean);
    const valid = requested.filter((p) => client.allowedProjects.includes(p));
    if (valid.length > 0) {
      scopedProjects = valid;
    }
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const token = signJwt(
    {
      sub: client.clientId,
      clientName: client.clientName,
      allowedProjects: scopedProjects,
      scope: scopedProjects.join(" "),
      exp: nowSeconds + expiresInSeconds,
    },
    secret
  );

  return {
    access_token: token,
    token_type: "Bearer",
    expires_in: expiresInSeconds,
    scope: scopedProjects.join(" "),
  };
}

async function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function parseClientCredentials(
  req: IncomingMessage,
  params: Record<string, string>
): { clientId?: string; clientSecret?: string } {
  const authHeader = req.headers.authorization;
  if (authHeader && /^Basic\s+/i.test(authHeader)) {
    try {
      const credentials = Buffer.from(authHeader.replace(/^Basic\s+/i, ""), "base64").toString("utf-8");
      const colonIndex = credentials.indexOf(":");
      if (colonIndex !== -1) {
        return {
          clientId: decodeURIComponent(credentials.slice(0, colonIndex)),
          clientSecret: decodeURIComponent(credentials.slice(colonIndex + 1)),
        };
      }
    } catch {
      // ignore base64 decode error and fallback to body params
    }
  }

  return {
    clientId: params.client_id,
    clientSecret: params.client_secret,
  };
}

export async function handleOAuthAuthorize(
  req: IncomingMessage,
  res: ServerResponse,
  requestUrl: URL,
  config: Config
): Promise<void> {
  const responseType = requestUrl.searchParams.get("response_type");
  const clientId = requestUrl.searchParams.get("client_id");
  const redirectUri = requestUrl.searchParams.get("redirect_uri");
  const state = requestUrl.searchParams.get("state") ?? "";
  const requestedScope = requestUrl.searchParams.get("scope") ?? "";

  if (responseType !== "code" || !clientId) {
    res.writeHead(400, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({
      error: "invalid_request",
      error_description: "Missing or invalid response_type (expected 'code') or client_id",
    }));
    return;
  }

  const client = await getOAuthClient(clientId, config.tokensFile);
  if (!client) {
    res.writeHead(401, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({
      error: "invalid_client",
      error_description: "Unknown client_id",
    }));
    return;
  }

  if (redirectUri && client.redirectUris && client.redirectUris.length > 0) {
    const isAllowedRedirect = client.redirectUris.some((allowed) => redirectUri.startsWith(allowed));
    if (!isAllowedRedirect) {
      res.writeHead(400, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({
        error: "invalid_request",
        error_description: "redirect_uri is not in the allowed redirect list for this client",
      }));
      return;
    }
  }

  let scopedProjects = client.allowedProjects;
  if (requestedScope.trim()) {
    const requested = requestedScope.split(/[\s,]+/).filter(Boolean);
    const valid = requested.filter((p) => client.allowedProjects.includes(p));
    if (valid.length > 0) {
      scopedProjects = valid;
    }
  }

  const code = createAuthorizationCode(clientId, redirectUri ?? "", scopedProjects, requestedScope);

  if (redirectUri) {
    const targetUrl = new URL(redirectUri);
    targetUrl.searchParams.set("code", code);
    if (state) targetUrl.searchParams.set("state", state);

    res.writeHead(302, {
      Location: targetUrl.toString(),
      "Access-Control-Allow-Origin": "*",
    });
    res.end();
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(`<!DOCTYPE html>
<html>
<head><title>Dotdive MCP Authorization</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px;">
  <h2>Authorization Granted</h2>
  <p>Client: <strong>${escapeHtml(client.clientName)}</strong></p>
  <p>Authorization Code:</p>
  <pre style="background: #f4f4f4; padding: 12px; border-radius: 4px;">${code}</pre>
</body>
</html>`);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function handleOAuthToken(
  req: IncomingMessage,
  res: ServerResponse,
  config: Config,
  oauthSecret: string
): Promise<void> {
  const rawBody = await readRequestBody(req);
  let params: Record<string, string> = {};

  const contentType = req.headers["content-type"] ?? "";
  if (contentType.includes("application/json")) {
    try {
      params = JSON.parse(rawBody);
    } catch {
      res.writeHead(400, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({
        error: "invalid_request",
        error_description: "Malformed JSON request body",
      }));
      return;
    }
  } else {
    const parsed = new URLSearchParams(rawBody);
    params = Object.fromEntries(parsed.entries());
  }

  const { clientId, clientSecret } = parseClientCredentials(req, params);
  const grantType = params.grant_type;

  if (!grantType) {
    res.writeHead(400, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({
      error: "invalid_request",
      error_description: "Missing grant_type parameter",
    }));
    return;
  }

  if (!clientId || !clientSecret) {
    res.writeHead(401, {
      "Content-Type": "application/json",
      "WWW-Authenticate": "Basic",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({
      error: "invalid_client",
      error_description: "Missing client credentials",
    }));
    return;
  }

  const client = await getOAuthClient(clientId, config.tokensFile);
  if (!client || client.clientSecret !== clientSecret) {
    res.writeHead(401, {
      "Content-Type": "application/json",
      "WWW-Authenticate": "Basic",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({
      error: "invalid_client",
      error_description: "Invalid client credentials",
    }));
    return;
  }

  if (grantType === "client_credentials") {
    const requestedScope = params.scope;
    const tokenResponse = issueAccessToken(client, oauthSecret, requestedScope);

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify(tokenResponse));
    return;
  }

  if (grantType === "authorization_code") {
    const code = params.code;
    const redirectUri = params.redirect_uri;

    if (!code) {
      res.writeHead(400, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({
        error: "invalid_request",
        error_description: "Missing code parameter",
      }));
      return;
    }

    const codeEntry = consumeAuthorizationCode(code, clientId, redirectUri);
    if (!codeEntry) {
      res.writeHead(400, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({
        error: "invalid_grant",
        error_description: "Invalid or expired authorization code",
      }));
      return;
    }

    const tokenResponse = issueAccessToken(
      {
        clientId: client.clientId,
        clientName: client.clientName,
        allowedProjects: codeEntry.allowedProjects,
      },
      oauthSecret,
      codeEntry.scope
    );

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify(tokenResponse));
    return;
  }

  res.writeHead(400, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify({
    error: "unsupported_grant_type",
    error_description: "Grant type must be 'client_credentials' or 'authorization_code'",
  }));
}
