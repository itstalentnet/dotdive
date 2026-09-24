import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, getTree } from "@/server/content/index";
import { getSessionContext } from "@/server/auth/session";
import { DocViewer } from "@/components/docs/doc-viewer";

interface PrivateDocPageProps {
  params: Promise<{ root: string; slug: string[] }>;
}

export async function generateMetadata({
  params,
}: PrivateDocPageProps): Promise<Metadata> {
  const { root, slug } = await params;
  const ctx = await getSessionContext();
  const urlPath = `/p/${root}/${slug.join("/")}`;
  const page = await getPage(urlPath, ctx);

  if (!page) return { title: "مستند پیدا نشد" };

  return {
    title: `${page.title} — ${root}`,
    robots: { index: false, follow: false },
  };
}

export default async function PrivateDocSubPage({
  params,
}: PrivateDocPageProps) {
  const { root, slug } = await params;
  const ctx = await getSessionContext();
  const urlPath = `/p/${root}/${slug.join("/")}`;

  const [page, tree] = await Promise.all([
    getPage(urlPath, ctx),
    Promise.resolve(getTree(root, ctx)),
  ]);

  if (!page || !tree) {
    notFound();
  }

  return (
    <DocViewer
      page={page}
      tree={tree}
      rootTitle={`پروژه ${root}`}
    />
  );
}
