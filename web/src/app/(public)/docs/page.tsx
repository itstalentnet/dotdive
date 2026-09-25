import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ANON_CTX, getPage, getTree } from "@/server/content/index";
import { DocViewer } from "@/components/docs/doc-viewer";

export const metadata: Metadata = {
  title: "مستندات عمومی",
  description: "دانشنامه و مستندات باز معماری و مهندسی دات دایو",
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "مستندات عمومی | دات دایو",
    description: "دانشنامه و مستندات باز معماری و مهندسی دات دایو",
    url: "/docs",
  },
};

const docsJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "مستندات عمومی دات دایو",
  url: "https://www.dotdive.ir/docs",
  description: "دانشنامه و مستندات باز فنی دات دایو",
  publisher: {
    "@type": "Organization",
    name: "دات دایو",
    alternateName: "DotDive",
    url: "https://www.dotdive.ir",
  },
};

export default async function DocsIndexPage() {
  const tree = getTree("public", ANON_CTX) ?? [];

  // Try loading /docs page
  let page = await getPage("/docs", ANON_CTX);

  // If /docs has no page, fallback to first file in tree
  if (!page) {
    const firstDoc = tree.find((n) => n.kind === "file" && !n.hidden && !n.draft);
    if (firstDoc) {
      page = await getPage(firstDoc.urlPath, ANON_CTX);
    }
  }

  if (!page) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(docsJsonLd) }}
      />
      <DocViewer
        page={page}
        tree={tree}
        rootTitle="مستندات عمومی"
      />
    </>
  );
}
