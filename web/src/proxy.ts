/**
 * src/proxy.ts — Next.js proxy (formerly middleware)
 * Auth guard for private routes
 * Defense-in-depth: proxy is not the only guard
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PRIVATE_PATTERNS = [
  /^\/p\//,
  /^\/projects/,
  /^\/api\/search/,
  /^\/api\/asset\//,
];

const PUBLIC_API_PATTERNS = [/^\/api\/auth\//];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public API routes — skip
  if (PUBLIC_API_PATTERNS.some((p) => p.test(pathname))) {
    return NextResponse.next();
  }

  // Check if route needs auth
  const needsAuth = PRIVATE_PATTERNS.some((p) => p.test(pathname));
  if (!needsAuth) return NextResponse.next();

  // Check session cookie
  const session = request.cookies.get("dd_session");
  if (!session?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add security headers for private routes
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");

  return response;
}

export const config = {
  matcher: [
    "/p/:path*",
    "/projects",
    "/projects/:path*",
    "/api/search",
    "/api/asset/:path*",
    "/api/auth/:path*",
  ],
};
