import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

function getBaseOrigin(request: NextRequest): string {
  if (process.env.SITE_URL) {
    const raw = process.env.SITE_URL.trim();
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return raw.replace(/\/+$/, "");
    }
  }
  const hostHeader =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host ||
    "localhost:3000";
  const host = hostHeader.split(",")[0].trim();
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const protoHeader = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const proto = protoHeader || (isLocal ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const rawClientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientId = rawClientId?.trim().replace(/^["']|["']$/g, "").trim();
  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth is not configured (CLIENT_ID missing)" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") || "/projects";

  // Determine redirect URI
  const origin = getBaseOrigin(request);
  const redirectUri = `${origin}/api/auth/google/callback`;

  // Generate random state nonce to prevent CSRF and embed redirectUri
  const stateNonce = crypto.randomBytes(16).toString("hex");
  const statePayload = Buffer.from(
    JSON.stringify({ nonce: stateNonce, next, redirectUri })
  ).toString("base64url");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", statePayload);
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl.toString());

  // Store state nonce in cookie
  response.cookies.set("oauth_state", stateNonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  });

  return response;
}
