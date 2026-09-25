/**
 * Docs Layout — sidebar, header, TOC
 */
import type { Metadata } from "next";
import "@/styles/docs.css";

export const metadata: Metadata = {
  title: {
    template: "%s | مستندات دات دایو",
    default: "مستندات | دات دایو",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="docs-layout">{children}</div>;
}
