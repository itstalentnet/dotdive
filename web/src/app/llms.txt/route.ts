import { NextResponse } from "next/server";
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

  const sitemapEntries = getPublicSitemap();

  const docDescriptions: Record<string, string> = {
    "/": "صفحه اصلی پلتفرم دات دایو، معرفی سیستم و جستجوی متمرکز مستندات",
    "/about": "داستان پیدایش دات دایو، ضرورت استقلال دانش فنی کسب‌وکار از تیم توسعه و آمادگی کامل برای هوش مصنوعی",
    "/contact": "راه‌های ارتباط با تیم مهندسی و پشتیبانی دات دایو",
    "/docs": "درگاه ورودی مستندات عمومی و دانشنامه باز پروژه‌ها",
    "/docs/architecture": "معماری فنی و مهندسی پروژه، ساختار ماژول‌ها و استانداردهای طراحی سرویس‌ها",
    "/docs/design_brief": "سند دیزاین سیستم، اصول طراحی رابط و تجربه کاربری و هویت بصری",
    "/docs/user_flow": "جریان‌های کاربری، سناریوهای تعاملی و مسیرهای عملیاتی",
    "/docs/handoff": "سند تحویل نهایی فنی، چک‌لیست استقرار، الزامات پروداکشن و انتقال پروژه",
    "/docs/proposal": "پروپوزال سیستم، نیازمندی‌ها، ارزش‌های افزوده و چشم‌انداز آینده محصول",
    "/blog/hello-dotdive": "مقاله آغازین دات دایو: یک لینک تا قلب پروژه و پایان عصر انحصار دانش فنی",
  };

  const lines: string[] = [
    "# دات دایو | DotDive",
    "",
    "> پلتفرم مستندسازی فنی و پایگاه دانش ساختاریافته تیم‌های مهندسی. دانش هر پروژه، همیشه در دسترس؛ مستقل از اینکه چه کسی آن را ساخته.",
    "",
    "دات دایو (DotDive) یک بستر استاندارد برای مستندسازی معماری نرم‌افزار، راهنماهای مهندسی و تصمیمات فنی (ADR) است که به طور پیش‌فرض برای انسان‌ها، پروتکل‌های استاندارد مانند MCP (Model Context Protocol) و مدل‌های هوش مصنوعی (LLMs) بهینه‌سازی شده است.",
    "",
    "## صفحات اصلی پلتفرم",
    "",
    `- [صفحه اصلی دات دایو](${siteUrl}/): ${docDescriptions["/"]}`,
    `- [درباره دات دایو](${siteUrl}/about): ${docDescriptions["/about"]}`,
    `- [تماس با ما](${siteUrl}/contact): ${docDescriptions["/contact"]}`,
    "",
    "## مستندات عمومی و راهنماهای فنی باز",
    "",
  ];

  const seen = new Set<string>(["/", "/about", "/contact"]);

  for (const entry of sitemapEntries) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);

    const desc =
      docDescriptions[entry.url] ||
      `مستند فنی و راهنمای بخش ${entry.url.replace(/^\/(?:docs|blog)\/?/, "")}`;

    const title = entry.url
      .replace(/^\//, "")
      .replace(/\//g, " > ")
      .replace(/_/g, " ")
      .replace(/-/g, " ");

    lines.push(`- [${title}](${siteUrl}${entry.url}): ${desc}`);
  }

  lines.push(
    "",
    "## منابع متنی تجمیعی برای هوش مصنوعی (LLM Context)",
    "",
    `- [مستندات کامل یکپارچه (Full Context)](${siteUrl}/llms-full.txt): متن کامل و خام تمام مستندات عمومی باز در قالب یک فایل منسجم مارک‌داون مناسب برای تزریق در پنجره کانتکست (Context Window) مدل‌های زبانی.`,
    `- [نقشه سایت (Sitemap)](${siteUrl}/sitemap.xml): نقشه استاندارد XML کلیه صفحات عمومی دات دایو.`,
    "",
    "## مشخصات فنی و استانداردهای دات دایو",
    "",
    "- زبان محتوا: فارسی (fa-IR) با پشتیبانی کامل از اصطلاحات فنی انگلیسی",
    "- ساختار داده: Markdown همراه با Front Matter استاتیک",
    "- سازگاری با ایجنت‌ها: پشتیبانی از پروتکل سرور کانتکست مدل (MCP Server)",
    "- امنیت و حریم خصوصی: پروژه‌های خصوصی تحت پروتکل احراز هویت چندسطحی قرار داشته و در این فایل فهرست نمی‌شوند."
  );

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
