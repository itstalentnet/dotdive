import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

export async function GET(request: NextRequest) {
  const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth is not configured (CLIENT_ID missing)" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") || "/projects";

  // Generate random state nonce to prevent CSRF
  const stateNonce = crypto.randomBytes(16).toString("hex");
  const statePayload = Buffer.from(
    JSON.stringify({ nonce: stateNonce, next })
  ).toString("base64url");

  // Determine redirect URI
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const origin = `${proto}://${host}`;
  const redirectUri = `${origin}/api/auth/google/callback`;

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
