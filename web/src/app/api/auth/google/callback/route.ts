import { NextRequest, NextResponse } from "next/server";
import { createSessionToken } from "@/server/auth/session";
import { getAccessContext } from "@/server/access/index";

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
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const origin = getBaseOrigin(request);

  if (errorParam || !code || !state) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  // Parse state
  let nextUrl = "/projects";
  let stateNonce = "";
  let stateRedirectUri = "";
  try {
    const parsedState = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8")
    );
    stateNonce = parsedState.nonce;
    stateRedirectUri = parsedState.redirectUri;
    if (
      parsedState.next &&
      typeof parsedState.next === "string" &&
      parsedState.next.startsWith("/") &&
      !parsedState.next.startsWith("//")
    ) {
      nextUrl = parsedState.next;
    }
  } catch {
    return NextResponse.redirect(`${origin}/login?error=invalid_state`);
  }

  // Verify state cookie
  const cookieNonce = request.cookies.get("oauth_state")?.value;
  if (!cookieNonce || cookieNonce !== stateNonce) {
    return NextResponse.redirect(`${origin}/login?error=invalid_state`);
  }

  const rawClientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const rawClientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  const clientId = rawClientId?.trim().replace(/^["']|["']$/g, "").trim();
  const clientSecret = rawClientSecret?.trim().replace(/^["']|["']$/g, "").trim();

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/login?error=misconfigured`);
  }

  // Use the exact redirect_uri recorded in state, fallback to current origin
  const redirectUri = stateRedirectUri || `${origin}/api/auth/google/callback`;

  // Exchange code for Google tokens
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("[Google OAuth Error] Token exchange failed:", tokenResponse.status, errorBody);
      let reason = "unknown";
      try {
        const parsed = JSON.parse(errorBody);
        reason = parsed.error || reason;
      } catch {
        reason = errorBody.slice(0, 100);
      }
      return NextResponse.redirect(
        `${origin}/login?error=token_exchange_failed&reason=${encodeURIComponent(reason)}`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const idToken = tokenData.id_token;

    let email = "";

    // Try reading email from id_token first
    if (idToken) {
      try {
        const parts = idToken.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64url").toString("utf8")
          );
          if (payload.email) email = payload.email;
        }
      } catch {}
    }

    // Fallback to Google UserInfo endpoint
    if (!email && accessToken) {
      const userinfoRes = await fetch(
        "https://openidconnect.googleapis.com/v1/userinfo",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (userinfoRes.ok) {
        const userinfo = await userinfoRes.json();
        email = userinfo.email ?? "";
      }
    }

    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=email_not_provided`);
    }

    const normalEmail = email.trim().toLowerCase();

    // Check user access
    const ctx = getAccessContext(normalEmail);

    // If user has no private access (only public), deny with unauthorized
    const hasPrivateAccess =
      ctx.roots === "all" || (ctx.roots instanceof Set && ctx.roots.size > 1);

    if (!hasPrivateAccess) {
      return NextResponse.redirect(
        `${origin}/login?error=unauthorized&email=${encodeURIComponent(normalEmail)}`
      );
    }

    // Create session token
    const sessionToken = await createSessionToken(normalEmail);

    const redirectResponse = NextResponse.redirect(`${origin}${nextUrl}`);

    // Set HttpOnly session cookie
    redirectResponse.cookies.set("dd_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 14 * 24 * 60 * 60, // 14 days
    });

    // Clear state cookie
    redirectResponse.cookies.delete("oauth_state");

    return redirectResponse;
  } catch (err) {
    return NextResponse.redirect(`${origin}/login?error=auth_exception`);
  }
}
