import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const origin = `${proto}://${host}`;

  const response = NextResponse.redirect(`${origin}/`);
  response.cookies.delete("dd_session");
  return response;
}

export async function POST(request: NextRequest) {
  return GET(request);
}
