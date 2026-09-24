"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Folder,
  Copy,
  Check,
  FileCode,
  Share2,
  ArrowUp,
  Sparkles,
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track reading scroll progress
  useEffect(() => {
    function handleScroll() {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const current = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, current)));
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Compute breadcrumb parts from urlPath
  const pathParts = page.urlPath.split("/").filter(Boolean);

  // Rough reading time estimation (approx 180 words/min)
  const plainText = page.html.replace(/<[^>]*>/g, "");
  const wordCount = plainText.trim().split(/\s+/).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  async function handleCopyPageLink() {
    if (typeof window !== "undefined") {
      await navigator.clipboard.writeText(window.location.href).catch(() => null);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  function handleScrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="docs-layout">
      {/* Top Reading Progress Bar */}
      <div
        className="reading-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      {/* Docs Header with Search & Navigation */}
      <DocsHeader
        rootName={page.root}
        rootTitle={rootTitle}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="docs-body">
        {/* Right Sidebar (Tree Navigation) */}
        <DocsSidebar
          nodes={tree}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Center Main Reading Content */}
        <main className="docs-main">
          {/* Breadcrumb Bar */}
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
            <div className="page-title-row">
              <h1 className="page-title">
                <IconResolver
                  name={page.title}
                  size={24}
                  strokeWidth={1.75}
                  className="text-neutral-400"
                />
                <span>{page.title}</span>
              </h1>
            </div>

            {page.description && (
              <p className="page-header-desc">{page.description}</p>
            )}

            {/* Document Action Toolbar & Metadata */}
            <div className="doc-toolbar">
              <div className="doc-meta-group">
                {page.updatedAt && (
                  <div className="doc-meta-item">
                    <Calendar size={13} strokeWidth={1.75} />
                    <span>
                      {new Intl.DateTimeFormat("fa-IR", {
                        dateStyle: "medium",
                      }).format(new Date(page.updatedAt))}
                    </span>
                  </div>
                )}

                <div className="doc-meta-item">
                  <Clock size={13} strokeWidth={1.75} />
                  <span>{readingTimeMinutes} دقیقه مطالعه</span>
                </div>

                {page.draft && (
                  <span className="badge-draft">
                    پیش‌نویس
                  </span>
                )}
              </div>

              {/* Utility actions */}
              <div className="doc-actions-group">
                <button
                  type="button"
                  onClick={handleCopyPageLink}
                  className="doc-action-btn"
                  title="کپی پیوند این صفحه"
                >
                  {copiedLink ? (
                    <>
                      <Check size={12} className="text-green-400" />
                      <span className="text-green-400">کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={12} strokeWidth={1.75} />
                      <span>کپی لینک</span>
                    </>
                  )}
                </button>

                {page.root === "public" && (
                  <a
                    href={`/api/raw?path=${encodeURIComponent(page.urlPath)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doc-action-btn"
                    title="مشاهده نسخه خام Markdown"
                  >
                    <FileCode size={12} strokeWidth={1.75} />
                    <span>سورس Markdown</span>
                  </a>
                )}
              </div>
            </div>

            {/* Tags Strip */}
            {page.tags && page.tags.length > 0 && (
              <div className="page-tags-strip">
                {page.tags.map((tag) => (
                  <span key={tag} className="page-tag-pill">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Rendered Prose Content */}
          <article className="article-container">
            <PageContent html={page.html} />
          </article>

          {/* Next / Previous Page Navigation Cards */}
          {(page.prevPage || page.nextPage) && (
            <nav className="doc-navigation-grid" aria-label="صفحات قبلی و بعدی">
              {page.prevPage ? (
                <Link href={page.prevPage.urlPath} className="doc-nav-card prev">
                  <div className="doc-nav-card-label">
                    <ArrowRight size={13} strokeWidth={2} />
                    <span>صفحهٔ قبلی</span>
                  </div>
                  <div className="doc-nav-card-title">{page.prevPage.title}</div>
                </Link>
              ) : (
                <div />
              )}

              {page.nextPage && (
                <Link href={page.nextPage.urlPath} className="doc-nav-card next">
                  <div className="doc-nav-card-label">
                    <span>صفحهٔ بعدی</span>
                    <ArrowLeft size={13} strokeWidth={2} />
                  </div>
                  <div className="doc-nav-card-title">{page.nextPage.title}</div>
                </Link>
              )}
            </nav>
          )}

          {/* Bottom Article Helpfulness Indicator */}
          <footer className="article-footer">
            <div className="article-feedback">
              <span>آیا این راهنما برای شما مفید بود؟</span>
              <div className="feedback-buttons">
                <button type="button" className="feedback-btn" onClick={() => alert("با تشکر از بازخورد شما!")}>
                  بله
                </button>
                <button type="button" className="feedback-btn" onClick={() => alert("با تشکر! بازخورد شما در بهبود مستندات بررسی خواهد شد.")}>
                  خیر
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleScrollToTop}
              className="scroll-top-btn"
            >
              <span>بازگشت به بالا</span>
              <ArrowUp size={12} strokeWidth={2} />
            </button>
          </footer>
        </main>

        {/* Left TOC (On This Page) */}
        <aside className="docs-toc-wrapper">
          <TableOfContents headings={page.headings} />
        </aside>
      </div>

      <style>{`
        .reading-progress-bar {
          position: fixed;
          top: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          z-index: 60;
          transition: width 0.1s ease-out;
        }
        .page-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.76rem;
          color: var(--dd-text-muted);
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .breadcrumb-link {
          color: var(--dd-text-secondary);
          transition: color 0.12s;
        }
        .breadcrumb-link:hover {
          color: var(--dd-text-primary);
        }
        .page-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .page-title {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-family: var(--font-heading);
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--dd-text-primary);
          line-height: 1.3;
        }
        .page-header-desc {
          font-size: 0.925rem;
          color: var(--dd-text-secondary);
          line-height: 1.75;
          margin-top: 0.35rem;
          margin-bottom: 1rem;
        }
        .doc-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-block: 0.65rem;
          border-top: 1px solid var(--dd-border-subtle);
          border-bottom: 1px solid var(--dd-border-subtle);
          margin-bottom: 0.85rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .doc-meta-group {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.75rem;
          color: var(--dd-text-muted);
        }
        .doc-meta-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .doc-actions-group {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .doc-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.2rem 0.5rem;
          background: var(--dd-surface-1);
          border: 1px solid var(--dd-border);
          border-radius: 5px;
          font-size: 0.72rem;
          color: var(--dd-text-secondary);
          cursor: pointer;
          transition: all 0.12s;
          text-decoration: none;
        }
        .doc-action-btn:hover {
          background: var(--dd-surface-2);
          color: var(--dd-text-primary);
          border-color: var(--dd-border-focus);
        }
        .page-tags-strip {
          display: flex;
          gap: 0.35rem;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }
        .page-tag-pill {
          font-size: 0.68rem;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          background: var(--dd-surface-2);
          border: 1px solid var(--dd-border-subtle);
          color: var(--dd-text-muted);
          font-family: var(--font-mono);
        }
        .badge-draft {
          font-size: 0.65rem;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.25);
          color: #f59e0b;
        }
        .article-container {
          min-height: 400px;
        }
        .doc-navigation-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 3.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--dd-border-subtle);
        }
        .doc-nav-card {
          display: flex;
          flex-direction: column;
          padding: 0.85rem 1rem;
          border: 1px solid var(--dd-border);
          border-radius: 8px;
          background: var(--dd-surface-1);
          text-decoration: none;
          transition: all 0.12s ease;
        }
        .doc-nav-card:hover {
          border-color: var(--dd-border-focus);
          background: var(--dd-surface-2);
          transform: translateY(-1px);
        }
        .doc-nav-card.prev { text-align: right; }
        .doc-nav-card.next { text-align: left; }
        .doc-nav-card-label {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.7rem;
          color: var(--dd-text-muted);
          margin-bottom: 0.35rem;
        }
        .doc-nav-card.next .doc-nav-card-label {
          justify-content: flex-end;
        }
        .doc-nav-card-title {
          font-family: var(--font-heading);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--dd-text-primary);
        }
        .article-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-block: 1.5rem;
          margin-top: 2rem;
          border-top: 1px solid var(--dd-border-subtle);
          font-size: 0.76rem;
          color: var(--dd-text-muted);
          flex-wrap: wrap;
          gap: 1rem;
        }
        .article-feedback {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .feedback-buttons {
          display: flex;
          gap: 0.35rem;
        }
        .feedback-btn {
          padding: 0.15rem 0.5rem;
          background: var(--dd-surface-2);
          border: 1px solid var(--dd-border);
          border-radius: 4px;
          color: var(--dd-text-secondary);
          font-size: 0.72rem;
          cursor: pointer;
          transition: all 0.1s;
        }
        .feedback-btn:hover {
          background: var(--dd-surface-3);
          color: var(--dd-text-primary);
        }
        .scroll-top-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: none;
          border: none;
          color: var(--dd-text-muted);
          font-size: 0.74rem;
          cursor: pointer;
          transition: color 0.12s;
        }
        .scroll-top-btn:hover {
          color: var(--dd-text-primary);
        }
        @media (max-width: 640px) {
          .doc-navigation-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
