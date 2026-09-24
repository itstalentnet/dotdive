import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getAccessContext, type AccessContext, ANON_CTX } from "@/server/access/index";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "dotdive-super-secure-auth-secret-key-32chars";
const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET.padEnd(32, "0").slice(0, 32));

export interface SessionPayload {
  email: string;
}

/**
 * Sign an encrypted/signed JWT session token
 */
export async function createSessionToken(email: string): Promise<string> {
  const normalEmail = email.trim().toLowerCase();
  return new SignJWT({ email: normalEmail })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(SECRET_KEY);
}

/**
 * Verify a session JWT token and extract the user's email
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (typeof payload.email === "string" && payload.email) {
      return { email: payload.email.trim().toLowerCase() };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Set the HttpOnly session cookie
 */
export async function setSessionCookie(email: string) {
  const token = await createSessionToken(email);
  const cookieStore = await cookies();

  cookieStore.set("dd_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 14 * 24 * 60 * 60, // 14 days
  });
}

/**
 * Clear the session cookie (logout)
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("dd_session");
}

/**
 * Read session cookie and resolve AccessContext for the current request
 */
export async function getSessionContext(): Promise<AccessContext> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("dd_session");

  if (!sessionCookie?.value) {
    return ANON_CTX;
  }

  // 1. Try verifying signed JWT token
  const payload = await verifySessionToken(sessionCookie.value);
  if (payload?.email) {
    return getAccessContext(payload.email);
  }

  // 2. Fallback for raw email in dev
  try {
    let email: string | null = null;
    if (sessionCookie.value.startsWith("{")) {
      const data = JSON.parse(sessionCookie.value);
      email = data.email ?? null;
    } else if (sessionCookie.value.includes("@")) {
      email = sessionCookie.value;
    }
    if (email) return getAccessContext(email);
  } catch {}

  return ANON_CTX;
}
