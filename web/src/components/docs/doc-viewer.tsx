"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
  Folder,
} from "lucide-react";
import type { Page, TreeNode } from "@/server/content/types";
import { DocsHeader } from "@/components/layout/docs-header";
import { DocsSidebar } from "@/components/layout/docs-sidebar";
import { TableOfContents } from "@/components/docs/toc";
import { PageContent } from "@/components/docs/page-content";
import { IconResolver } from "@/components/ui/icon-resolver";

interface DocViewerProps {
  page: Page;
  tree: TreeNode[];
  rootTitle: string;
}

export function DocViewer({ page, tree, rootTitle }: DocViewerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Compute breadcrumb parts from urlPath
  const pathParts = page.urlPath.split("/").filter(Boolean);

  return (
    <div className="docs-layout">
      <DocsHeader
        rootTitle={rootTitle}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="docs-body">
        {/* Right Sidebar (in RTL, it is on the right) */}
        <DocsSidebar
          nodes={tree}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Center Main Content */}
        <main className="docs-main">
          {/* Breadcrumb */}
          <nav className="page-breadcrumb" aria-label="موقعیت در مستندات">
            <Link href="/" className="hover:text-neutral-300">
              خانه
            </Link>
            <span className="breadcrumb-sep">
              <ChevronLeft size={12} strokeWidth={1.5} />
            </span>
            <Link
              href={page.root === "public" ? "/docs" : `/p/${page.root}`}
              className="hover:text-neutral-300"
            >
              {rootTitle}
            </Link>
            {pathParts.length > 2 && (
              <>
                <span className="breadcrumb-sep">
                  <ChevronLeft size={12} strokeWidth={1.5} />
                </span>
                <span className="text-neutral-400">
                  {pathParts[pathParts.length - 2]}
                </span>
              </>
            )}
            <span className="breadcrumb-sep">
              <ChevronLeft size={12} strokeWidth={1.5} />
            </span>
            <span className="text-neutral-200">{page.title}</span>
          </nav>

          {/* Page Header */}
          <header className="page-header">
            <h1 className="page-title">
              <IconResolver
                name={page.title}
                size={22}
                strokeWidth={1.75}
                className="text-neutral-400"
              />
              <span>{page.title}</span>
            </h1>

            {page.description && (
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--dd-text-secondary)",
                  lineHeight: 1.7,
                  marginTop: "0.35rem",
                  marginBottom: "0.85rem",
                }}
              >
                {page.description}
              </p>
            )}

            {/* Tags & Metadata */}
            <div className="page-meta">
              {page.updatedAt && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Clock size={12} strokeWidth={1.75} />
                  <span>
                    {new Intl.DateTimeFormat("fa-IR", {
                      dateStyle: "medium",
                    }).format(new Date(page.updatedAt))}
                  </span>
                </div>
              )}

              {page.tags && page.tags.length > 0 && (
                <div className="page-tags">
                  {page.tags.map((tag) => (
                    <span key={tag} className="page-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {page.draft && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "#f59e0b",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px",
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                  }}
                >
                  پیش‌نویس
                </span>
              )}
            </div>
          </header>

          {/* Rendered HTML */}
          <PageContent html={page.html} />

          {/* Prev / Next navigation */}
          {(page.prevPage || page.nextPage) && (
            <nav className="page-nav" aria-label="صفحات قبلی و بعدی">
              {page.prevPage ? (
                <Link href={page.prevPage.urlPath} className="page-nav-btn prev">
                  <span className="page-nav-label">صفحهٔ قبلی</span>
                  <span className="page-nav-title">{page.prevPage.title}</span>
                </Link>
              ) : (
                <div />
              )}
              {page.nextPage && (
                <Link href={page.nextPage.urlPath} className="page-nav-btn next">
                  <span className="page-nav-label">صفحهٔ بعدی</span>
                  <span className="page-nav-title">{page.nextPage.title}</span>
                </Link>
              )}
            </nav>
          )}
        </main>

        {/* Left TOC (in RTL, it is on the left) */}
        <TableOfContents headings={page.headings} />
      </div>
    </div>
  );
}
