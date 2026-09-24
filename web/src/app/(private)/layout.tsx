/**
 * Private docs layout — all /p/[root]/... routes
 * Handles auth check, sidebar, TOC
 */
import type { Metadata } from "next";
import "@/styles/docs.css";

export const metadata: Metadata = {
  title: {
    template: "%s | dotdive",
    default: "dotdive",
  },
  robots: { index: false, follow: false },
};

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="docs-layout">{children}</div>;
}
