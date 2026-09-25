import type { MetadataRoute } from "next";
import { getPublicSitemap } from "@/server/content/index";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getCanonicalSiteUrl();

  const publicEntries = getPublicSitemap();

  // Static public core pages
  const staticUrls = [
    { path: "", priority: 1.0, changefreq: "weekly" as const },
    { path: "/docs", priority: 0.9, changefreq: "weekly" as const },
    { path: "/about", priority: 0.8, changefreq: "monthly" as const },
    { path: "/contact", priority: 0.7, changefreq: "monthly" as const },
  ];

  const seen = new Set<string>();
  const results: MetadataRoute.Sitemap = [];

  for (const item of staticUrls) {
    seen.add(item.path || "/");
    results.push({
      url: `${siteUrl}${item.path}`,
      lastModified: new Date(),
      changeFrequency: item.changefreq,
      priority: item.priority,
    });
  }

  // Dynamic public documentation entries
  for (const entry of publicEntries) {
    // Strictly exclude any private roots
    if (
      entry.url.startsWith("/p/") ||
      entry.url.startsWith("/projects") ||
      entry.url.startsWith("/login")
    ) {
      continue;
    }

    const cleanPath = entry.url.startsWith("/") ? entry.url : `/${entry.url}`;
    if (seen.has(cleanPath)) continue;
    seen.add(cleanPath);

    results.push({
      url: `${siteUrl}${cleanPath}`,
      lastModified: entry.lastmod ? new Date(entry.lastmod) : new Date(),
      changeFrequency: (entry.changefreq as any) || "weekly",
      priority: entry.priority || 0.8,
    });
  }

  return results;
}
