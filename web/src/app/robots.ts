import type { MetadataRoute } from "next";

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

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getCanonicalSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/contact",
          "/docs",
          "/docs/",
          "/blog",
          "/blog/",
          "/llms.txt",
          "/llms-full.txt",
          "/icon.svg",
          "/favicon.ico",
        ],
        disallow: ["/p/", "/projects", "/api/", "/login"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Google-Extended",
          "Applebot-Extended",
          "cohere-ai",
        ],
        allow: [
          "/",
          "/about",
          "/contact",
          "/docs",
          "/docs/",
          "/blog",
          "/blog/",
          "/llms.txt",
          "/llms-full.txt",
        ],
        disallow: ["/p/", "/projects", "/api/", "/login"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
