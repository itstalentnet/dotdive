import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ANON_CTX, getPage, getTree } from "@/server/content/index";
import { DocViewer } from "@/components/docs/doc-viewer";

interface DocPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({
  params,
}: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const urlPath = `/docs/${slug.join("/")}`;
  const page = await getPage(urlPath, ANON_CTX);

  if (!page) return { title: "مستند پیدا نشد" };

  const description =
    page.description ||
    `مستند فنی و راهنمای مهندسی ${page.title} در پایگاه دانش دات دایو`;

  return {
    title: page.title,
    description,
    alternates: {
      canonical: urlPath,
    },
    openGraph: {
      title: `${page.title} | مستندات دات دایو`,
      description,
      url: urlPath,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | مستندات دات دایو`,
      description,
    },
  };
}

export default async function DocSubPage({ params }: DocPageProps) {
  const { slug } = await params;
  const urlPath = `/docs/${slug.join("/")}`;

  const [page, tree] = await Promise.all([
    getPage(urlPath, ANON_CTX),
    Promise.resolve(getTree("public", ANON_CTX) ?? []),
  ]);

  if (!page) {
    notFound();
  }

  const rawSiteUrl = process.env.SITE_URL?.trim();
  const siteUrl = (
    rawSiteUrl && rawSiteUrl.startsWith("http")
      ? rawSiteUrl
      : "https://www.dotdive.ir"
  ).replace(/\/+$/, "");

  const fullUrl = `${siteUrl}${urlPath}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${fullUrl}#article`,
        url: fullUrl,
        headline: page.title,
        description: page.description || `مستند فنی ${page.title}`,
        inLanguage: "fa-IR",
        mainEntityOfPage: fullUrl,
        dateModified: page.updatedAt
          ? new Date(page.updatedAt).toISOString()
          : undefined,
        publisher: {
          "@type": "Organization",
          name: "دات دایو",
          alternateName: "DotDive",
          url: siteUrl,
          logo: `${siteUrl}/icon.svg`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${fullUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "دات دایو",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "مستندات",
            item: `${siteUrl}/docs`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: page.title,
            item: fullUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <DocViewer
        page={page}
        tree={tree}
        rootTitle="مستندات عمومی"
      />
    </>
  );
}
