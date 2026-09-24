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

  return {
    title: page.title,
    description: page.description,
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

  return (
    <DocViewer
      page={page}
      tree={tree}
      rootTitle="مستندات عمومی"
    />
  );
}
