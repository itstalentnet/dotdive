"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Share2,
  Check,
} from "lucide-react";
import type { Page, TreeNode } from "@/server/content/types";
import { SiteHeader } from "@/components/layout/site-header";
import { DocsSidebar } from "@/components/layout/docs-sidebar";
import { TableOfContents } from "@/components/docs/toc";
import { PageContent } from "@/components/docs/page-content";

interface DocViewerProps {
  page: Page;
  tree: TreeNode[];
  rootTitle: string;
}

export function DocViewer({ page, tree, rootTitle }: DocViewerProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  async function handleCopyPageLink() {
    if (typeof window !== "undefined") {
      await navigator.clipboard.writeText(window.location.href).catch(() => null);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  return (
    <div className="docs-layout">
      {/* Unified Header with Global Search and Mobile Drawer */}
      <SiteHeader
        currentRoot={page.root}
        docTree={tree}
        docHeadings={page.headings}
      />

      <div className="docs-body">
        {/* Start Sidebar (Right side in RTL): Documentation Tree */}
        <DocsSidebar nodes={tree} />

        {/* Center Main Content Area: Pure Document */}
        <main className="docs-main">
          {/* Breadcrumb */}
          <nav className="page-breadcrumb" aria-label="موقعیت در مستندات">
            <Link href="/" className="breadcrumb-link">
              خانه
            </Link>
            <span className="breadcrumb-sep">
              <ChevronLeft size={12} strokeWidth={1.5} />
            </span>
            <Link
              href={page.root === "public" ? "/docs" : `/p/${page.root}`}
              className="breadcrumb-link"
            >
              {rootTitle}
            </Link>
            <span className="breadcrumb-sep">
              <ChevronLeft size={12} strokeWidth={1.5} />
            </span>
            <span className="text-neutral-200">{page.title}</span>
          </nav>

          {/* Clean Document Header */}
          <header className="page-header">
            <div className="page-title-row">
              <h1 className="page-title">{page.title}</h1>

              <button
                type="button"
                onClick={handleCopyPageLink}
                className="copy-link-btn"
                title="کپی لینک مستقیم"
                aria-label="کپی لینک مستقیم"
              >
                {copiedLink ? (
                  <>
                    <Check size={13} className="text-green-400" />
                    <span className="text-green-400 text-xs">کپی شد</span>
                  </>
                ) : (
                  <>
                    <Share2 size={13} strokeWidth={1.75} />
                    <span className="text-xs">کپی لینک</span>
                  </>
                )}
              </button>
            </div>

            {page.description && (
              <p className="page-description">{page.description}</p>
            )}

            {page.draft && (
              <div style={{ marginTop: "0.5rem" }}>
                <span className="badge-draft">پیش‌نویس</span>
              </div>
            )}
          </header>

          {/* Pure Markdown Render */}
          <article className="article-content">
            <PageContent html={page.html} />
          </article>

          {/* Clean Prev / Next Page Navigation */}
          {(page.prevPage || page.nextPage) && (
            <nav className="doc-navigation-grid" aria-label="صفحات قبلی و بعدی">
              {page.prevPage ? (
                <Link href={page.prevPage.urlPath} className="doc-nav-card prev">
                  <span className="doc-nav-label">
                    <ArrowRight size={12} strokeWidth={2} />
                    <span>صفحهٔ قبلی</span>
                  </span>
                  <span className="doc-nav-title">{page.prevPage.title}</span>
                </Link>
              ) : (
                <div />
              )}

              {page.nextPage && (
                <Link href={page.nextPage.urlPath} className="doc-nav-card next">
                  <span className="doc-nav-label">
                    <span>صفحهٔ بعدی</span>
                    <ArrowLeft size={12} strokeWidth={2} />
                  </span>
                  <span className="doc-nav-title">{page.nextPage.title}</span>
                </Link>
              )}
            </nav>
          )}
        </main>

        {/* End Sidebar (Left side in RTL): Document H2 Outline */}
        <aside className="docs-end-toc">
          <TableOfContents headings={page.headings} />
        </aside>
      </div>
    </div>
  );
}
