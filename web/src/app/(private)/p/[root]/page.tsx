import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, getTree } from "@/server/content/index";
import { getSessionContext } from "@/server/auth/session";
import { DocViewer } from "@/components/docs/doc-viewer";

interface PrivateRootProps {
  params: Promise<{ root: string }>;
}

export async function generateMetadata({
  params,
}: PrivateRootProps): Promise<Metadata> {
  const { root } = await params;
  return {
    title: `مستندات پروژه ${root}`,
    robots: { index: false, follow: false },
  };
}

export default async function PrivateRootPage({ params }: PrivateRootProps) {
  const { root } = await params;
  const ctx = await getSessionContext();

  const tree = getTree(root, ctx);
  if (!tree) {
    notFound();
  }

  // Try root index page first e.g. /p/nons
  let page = await getPage(`/p/${root}`, ctx);

  if (!page) {
    // Fallback to first file node
    const firstDoc = tree.find((n) => n.kind === "file" && !n.hidden);
    if (firstDoc) {
      page = await getPage(firstDoc.urlPath, ctx);
    }
  }

  if (!page) {
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
