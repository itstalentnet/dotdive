import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { getOutPublic, getDocsDir } from "@/server/content/paths";
import { getPublicSitemap } from "@/server/content/index";

export const dynamic = "force-static";
export const revalidate = 3600;

function getCanonicalSiteUrl(): string {
  const envUrl = process.env.SITE_URL?.trim();
  if (envUrl && !envUrl.includes("localhost")) {
    return (envUrl.startsWith("http") ? envUrl : `https://${envUrl}`).replace(/\/+$/, "");
  }
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl && !vercelUrl.includes("localhost")) {
    return `https://${vercelUrl}`.replace(/\/+$/, "");
  }
  return "https://www.dotdive.ir";
}

export async function GET() {
  const siteUrl = getCanonicalSiteUrl();

  const outPublic = getOutPublic();
  const docsDir = path.join(getDocsDir(), "public");

  const sitemapEntries = getPublicSitemap();
  const seenUrls = new Set<string>();

  const sections: string[] = [
    `# دات دایو — مستندات تجمیعی عمومی (DotDive Full Public Documentation)`,
    `منبع رسمی: ${siteUrl}`,
    `تاریخ تولید: ${new Date().toISOString()}`,
    `توضیحات: این فایل حاوی متن کامل تمام مستندات عمومی و باز پلتفرم دات دایو است که به صورت ساختاریافته برای استفاده در کانتکست مدل‌های هوش مصنوعی (LLMs) گردآوری شده است.`,
    `\n---\n`,
  ];

  // Helper to read markdown file safely from outPublic or docsDir
  function readDocMarkdown(relPath: string): string | null {
    // 1. Try outPublic (e.g. docs/architecture.md)
    const outPath = path.join(outPublic, `${relPath}.md`);
    if (fs.existsSync(outPath) && !fs.statSync(outPath).isDirectory()) {
      return fs.readFileSync(outPath, "utf8");
    }

    // 2. Try docs/public
    const directPath = path.join(docsDir, `${relPath}.md`);
    if (fs.existsSync(directPath) && !fs.statSync(directPath).isDirectory()) {
      return fs.readFileSync(directPath, "utf8");
    }

    // 3. Try directory with index.md
    const indexPath = path.join(docsDir, relPath, "index.md");
    if (fs.existsSync(indexPath)) {
      return fs.readFileSync(indexPath, "utf8");
    }

    return null;
  }

  for (const entry of sitemapEntries) {
    if (seenUrls.has(entry.url)) continue;
    seenUrls.add(entry.url);

    const cleanPath = entry.url.replace(/^\//, "");
    const content = cleanPath ? readDocMarkdown(cleanPath) : readDocMarkdown("index");

    if (content) {
      // Strip frontmatter from raw content for cleaner LLM ingestion
      const cleanContent = content.replace(/^---[\s\S]*?---\n*/, "").trim();

      sections.push(
        `## مستند: ${entry.url}`,
        `آدرس وب: ${siteUrl}${entry.url}`,
        `\n${cleanContent}\n`,
        `\n---\n`
      );
    }
  }

  return new NextResponse(sections.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
