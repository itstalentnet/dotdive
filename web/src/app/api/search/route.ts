import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { normalizePersian } from "@/server/search/persian";
import { getSessionContext } from "@/server/auth/session";
import { canAccess } from "@/server/access";
import type { SearchRecord, SearchHit } from "@/server/content/types";

import { getOutPublic, getOutPrivate } from "@/server/content/paths";

let publicRecordsCache: SearchRecord[] | null = null;
const privateRecordsCache: Record<string, SearchRecord[]> = {};

function getPublicRecords(): SearchRecord[] {
  if (publicRecordsCache) return publicRecordsCache;
  const p = path.join(getOutPublic(), "_search.json");
  if (fs.existsSync(p)) {
    try {
      publicRecordsCache = JSON.parse(fs.readFileSync(p, "utf8"));
      return publicRecordsCache ?? [];
    } catch {
      return [];
    }
  }
  return [];
}

function getPrivateRecords(root: string): SearchRecord[] {
  if (privateRecordsCache[root]) return privateRecordsCache[root];
  const p = path.join(getOutPrivate(), root, "_search.json");
  if (fs.existsSync(p)) {
    try {
      privateRecordsCache[root] = JSON.parse(fs.readFileSync(p, "utf8"));
      return privateRecordsCache[root] ?? [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const rootParam = searchParams.get("root")?.trim();
  const limit = Math.min(25, parseInt(searchParams.get("limit") ?? "10"));

  if (!q) {
    return NextResponse.json({ hits: [] });
  }

  const ctx = await getSessionContext();
  const normalizedQ = normalizePersian(q);
  const queryTokens = normalizedQ.split(/\s+/).filter(Boolean);

  if (queryTokens.length === 0) {
    return NextResponse.json({ hits: [] });
  }

  // Collect records from accessible roots
  const pool: SearchRecord[] = [];

  // Public records
  if (!rootParam || rootParam === "public") {
    pool.push(...getPublicRecords());
  }

  // Private records
  if (rootParam && rootParam !== "public") {
    if (canAccess(ctx, rootParam)) {
      pool.push(...getPrivateRecords(rootParam));
    }
  } else if (!rootParam) {
    // If no specific root requested, query all accessible roots
    if (ctx.roots === "all") {
      try {
        const outPrivate = getOutPrivate();
        if (fs.existsSync(outPrivate)) {
          const dirs = fs.readdirSync(outPrivate, { withFileTypes: true });
          for (const d of dirs) {
            if (d.isDirectory()) pool.push(...getPrivateRecords(d.name));
          }
        }
      } catch {}
    } else {
      for (const root of ctx.roots) {
        if (root !== "public") {
          pool.push(...getPrivateRecords(root));
        }
      }
    }
  }

  // Perform search scoring
  const hits: SearchHit[] = [];

  for (const record of pool) {
    const normTitle = normalizePersian(record.title);
    const normHeading = normalizePersian(record.heading);
    const normContent = record.content;
    const normTags = record.tags.map((t) => normalizePersian(t)).join(" ");

    let score = 0;
    let matchedTokenCount = 0;

    for (const token of queryTokens) {
      let tokenMatched = false;
      if (normTitle.includes(token)) {
        score += 8;
        tokenMatched = true;
      }
      if (normHeading.includes(token)) {
        score += 5;
        tokenMatched = true;
      }
      if (normTags.includes(token)) {
        score += 4;
        tokenMatched = true;
      }
      if (normContent.includes(token)) {
        score += 2;
        tokenMatched = true;
      }
      if (tokenMatched) matchedTokenCount++;
    }

    if (matchedTokenCount > 0) {
      // Calculate snippet
      let snippet = "";
      const firstToken = queryTokens[0];
      const matchIdx = normContent.indexOf(firstToken);
      if (matchIdx !== -1) {
        const start = Math.max(0, matchIdx - 40);
        snippet = record.content.slice(start, start + 140);
        if (start > 0) snippet = "..." + snippet;
        if (start + 140 < record.content.length) snippet += "...";
      } else {
        snippet = record.content.slice(0, 120) + "...";
      }

      hits.push({
        score: score * (record.boost ?? 1),
        pageId: record.pageId,
        title: record.title,
        heading: record.heading,
        anchor: record.anchor,
        urlPath: record.urlPath,
        snippet,
        root: record.root,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);

  const response = NextResponse.json({ hits: hits.slice(0, limit) });

  // Security headers for private results
  if (rootParam && rootParam !== "public") {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}
