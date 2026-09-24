import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";

import { getOutPublic } from "@/server/content/paths";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetPath = searchParams.get("path")?.trim() ?? "";

  if (!targetPath) {
    return new NextResponse("Path parameter is required", { status: 400 });
  }

  const outPublic = getOutPublic();
  // Prevent directory traversal
  const cleanPath = targetPath.replace(/^\//, "").replace(/\.md$/, "");
  const mdFile = path.resolve(outPublic, `${cleanPath}.md`);

  // Ensure file is within outPublic
  if (!mdFile.startsWith(outPublic)) {
    return new NextResponse("Access denied", { status: 403 });
  }

  if (!fs.existsSync(mdFile)) {
    return new NextResponse("Document not found", { status: 404 });
  }

  const content = fs.readFileSync(mdFile, "utf8");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
