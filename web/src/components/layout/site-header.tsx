"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Menu,
  X,
  BookOpen,
  Lock,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ListOrdered,
  Folder,
  FileText,
} from "lucide-react";
import { LogoIcon } from "@/components/ui/logo";
import { SearchDialog } from "@/components/search/search-dialog";
import type { TreeNode, Heading } from "@/server/content/types";
import { IconResolver } from "@/components/ui/icon-resolver";

interface SiteHeaderProps {
  currentRoot?: string;
  // If on a doc page, pass tree and headings for the mobile drawer
  docTree?: TreeNode[];
  docHeadings?: Heading[];
}

export function SiteHeader({
  currentRoot,
  docTree,
  docHeadings,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"tree" | "toc">("tree");

  const isDocsPage = pathname.startsWith("/docs") || pathname.startsWith("/p/");
  const isPublicDocs = pathname.startsWith("/docs");
  const isPrivateDocs = pathname.startsWith("/p/") || pathname.startsWith("/projects");
  const isAbout = pathname === "/about";
  const isContact = pathname === "/contact";

  const h2Headings = docHeadings?.filter((h) => h.level === 2) ?? [];

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          {/* Start: Logo + Brand */}
          <div className="site-header-start">
            <Link href="/" className="site-logo" aria-label="دات دایو — صفحه اصلی">
              <LogoIcon size={20} />
              <span className="site-logo-text">dotdive</span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="site-nav-desktop" aria-label="ناوبری اصلی">
              <Link
                href="/docs"
                className={`site-nav-link ${isPublicDocs ? "active" : ""}`}
              >
                مستندات
              </Link>
              <Link
                href="/projects"
                className={`site-nav-link ${isPrivateDocs ? "active" : ""}`}
              >
                پروژه‌های خصوصی
              </Link>
              <Link
                href="/about"
                className={`site-nav-link ${isAbout ? "active" : ""}`}
              >
                درباره ما
              </Link>
              <Link
                href="/contact"
                className={`site-nav-link ${isContact ? "active" : ""}`}
              >
                تماس با ما
              </Link>
            </nav>
          </div>

          {/* End: Search + Actions + Mobile Menu Toggle */}
          <div className="site-header-end">
            {/* Search Trigger (Desktop: Bar with shortcut / Mobile: Icon) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="site-search-btn desktop-search"
              aria-label="جستجو در مستندات"
            >
              <Search size={14} strokeWidth={2} />
              <span>جستجو در مستندات...</span>
              <kbd className="site-search-kbd">⌘K</kbd>
            </button>

            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="site-icon-btn mobile-search-btn"
              aria-label="جستجو"
            >
              <Search size={18} strokeWidth={2} />
            </button>

            {/* Login / Auth Button on Desktop */}
            <Link href="/login" className="site-login-btn">
              <span>ورود</span>
              <ArrowLeft size={13} strokeWidth={2} />
            </Link>

            {/* Mobile Menu Toggle (Hamburger) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="site-icon-btn mobile-menu-toggle"
              aria-label="منوی سایت و مستندات"
            >
              <Menu size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Unified Mobile Drawer ───────────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`mobile-drawer ${isMobileMenuOpen ? "open" : ""}`}
        aria-label="منوی موبایل"
      >
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <Link href="/" className="site-logo" onClick={() => setIsMobileMenuOpen(false)}>
            <LogoIcon size={20} />
            <span className="site-logo-text">dotdive</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="site-icon-btn"
            aria-label="بستن منو"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Primary Navigation */}
        <div className="mobile-drawer-nav">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`mobile-nav-link ${pathname === "/" ? "active" : ""}`}
          >
            صفحه اصلی
          </Link>
          <Link
            href="/docs"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`mobile-nav-link ${isPublicDocs ? "active" : ""}`}
          >
            مستندات عمومی
          </Link>
          <Link
            href="/projects"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`mobile-nav-link ${isPrivateDocs ? "active" : ""}`}
          >
            پروژه‌های خصوصی
          </Link>
          <Link
            href="/about"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`mobile-nav-link ${isAbout ? "active" : ""}`}
          >
            درباره ما
          </Link>
          <Link
            href="/contact"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`mobile-nav-link ${isContact ? "active" : ""}`}
          >
            تماس با ما
          </Link>
          <Link
            href="/login"
            onClick={() => setIsMobileMenuOpen(false)}
            className="mobile-nav-link text-blue-400"
          >
            ورود به سیستم
          </Link>
        </div>

        {/* If on a Documentation Page: Show Tree and H2 Tabs */}
        {isDocsPage && (
          <div className="mobile-docs-section">
            <div className="mobile-tabs-header">
              <button
                type="button"
                className={`mobile-tab-btn ${mobileTab === "tree" ? "active" : ""}`}
                onClick={() => setMobileTab("tree")}
              >
                <Folder size={14} />
                <span>فهرست اسناد</span>
              </button>

              {h2Headings.length > 0 && (
                <button
                  type="button"
                  className={`mobile-tab-btn ${mobileTab === "toc" ? "active" : ""}`}
                  onClick={() => setMobileTab("toc")}
                >
                  <ListOrdered size={14} />
                  <span>سرفصل‌های صفحه (H2)</span>
                </button>
              )}
            </div>

            <div className="mobile-tab-content">
              {mobileTab === "tree" && docTree && (
                <MobileTree
                  nodes={docTree}
                  pathname={pathname}
                  onClose={() => setIsMobileMenuOpen(false)}
                />
              )}

              {mobileTab === "toc" && (
                <div className="mobile-toc-list">
                  {h2Headings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className="mobile-toc-item"
                      onClick={(e) => {
                        e.preventDefault();
                        const el =
                          document.getElementById(h.id) ||
                          document.getElementById(`user-content-${h.id}`);
                        if (el) {
                          const headerOffset = 65;
                          const pos =
                            el.getBoundingClientRect().top +
                            window.pageYOffset -
                            headerOffset;
                          window.scrollTo({
                            top: Math.max(0, pos),
                            behavior: "smooth",
                          });
                          history.pushState(null, "", `#${h.id}`);
                        }
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <span>#</span>
                      <span>{h.text}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Global Command Palette Dialog */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentRoot={currentRoot}
      />

      <style jsx global>{`
        /* ── Site Header CSS ────────────────────────────────────────── */
        .site-header {
          position: fixed;
          top: 0;
          inset-inline: 0;
          height: 52px;
          z-index: 50;
          background-color: rgba(9, 10, 12, 0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--dd-border-subtle);
          display: flex;
          align-items: center;
        }

        .site-header-inner {
          width: 100%;
          max-width: 1400px;
          margin-inline: auto;
          padding-inline: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .site-header-start {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .site-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--dd-text-primary);
          text-decoration: none;
        }
        .site-logo-text {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.05rem;
          letter-spacing: -0.01em;
        }

        .site-nav-desktop {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .site-nav-link {
          padding: 0.35rem 0.65rem;
          font-size: 0.825rem;
          color: var(--dd-text-secondary);
          border-radius: 5px;
          text-decoration: none;
          transition: all 0.12s;
        }
        .site-nav-link:hover {
          color: var(--dd-text-primary);
          background-color: var(--dd-surface-2);
        }
        .site-nav-link.active {
          color: var(--dd-text-primary);
          font-weight: 500;
          background-color: var(--dd-surface-1);
        }

        .site-header-end {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .site-search-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          height: 32px;
          padding-inline: 0.75rem;
          background-color: var(--dd-surface-1);
          border: 1px solid var(--dd-border);
          border-radius: 6px;
          color: var(--dd-text-muted);
          font-size: 0.78rem;
          cursor: pointer;
          width: 220px;
          text-align: right;
          transition: all 0.12s;
        }
        .site-search-btn:hover {
          border-color: var(--dd-border-focus);
          color: var(--dd-text-secondary);
        }

        .site-search-kbd {
          margin-right: auto;
          padding: 0.05rem 0.35rem;
          background-color: var(--dd-surface-2);
          border: 1px solid var(--dd-border);
          border-radius: 3px;
          font-size: 0.65rem;
          font-family: var(--font-mono);
          color: var(--dd-text-muted);
        }

        .site-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          background: transparent;
          border: none;
          color: var(--dd-text-secondary);
          cursor: pointer;
          transition: all 0.12s;
        }
        .site-icon-btn:hover {
          background-color: var(--dd-surface-2);
          color: var(--dd-text-primary);
        }

        .site-login-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          height: 32px;
          padding-inline: 0.85rem;
          background-color: var(--dd-surface-2);
          border: 1px solid var(--dd-border);
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--dd-text-primary);
          text-decoration: none;
          transition: all 0.12s;
        }
        .site-login-btn:hover {
          background-color: var(--dd-surface-hover);
          border-color: var(--dd-border-focus);
        }

        .mobile-search-btn, .mobile-menu-toggle {
          display: none;
        }

        /* ── Mobile Drawer ──────────────────────────────────────────── */
        .mobile-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(4px);
          z-index: 90;
        }

        .mobile-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(340px, 86vw);
          background-color: #0b0c0e;
          border-left: 1px solid var(--dd-border);
          z-index: 100;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: -12px 0 36px rgba(0, 0, 0, 0.8);
        }
        .mobile-drawer.open {
          transform: translateX(0);
        }

        .mobile-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--dd-border-subtle);
        }

        .mobile-drawer-nav {
          display: flex;
          flex-direction: column;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--dd-border-subtle);
          gap: 0.25rem;
        }

        .mobile-nav-link {
          padding: 0.45rem 0.65rem;
          font-size: 0.875rem;
          color: var(--dd-text-secondary);
          border-radius: 6px;
          text-decoration: none;
        }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          color: var(--dd-text-primary);
          background-color: var(--dd-surface-2);
        }

        .mobile-docs-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .mobile-tabs-header {
          display: flex;
          border-bottom: 1px solid var(--dd-border-subtle);
          padding: 0.4rem 0.75rem;
          gap: 0.4rem;
        }

        .mobile-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.4rem 0.5rem;
          border-radius: 5px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--dd-text-muted);
          font-size: 0.75rem;
          cursor: pointer;
        }
        .mobile-tab-btn.active {
          background-color: var(--dd-surface-2);
          border-color: var(--dd-border);
          color: var(--dd-text-primary);
          font-weight: 500;
        }

        .mobile-tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 0.75rem;
        }

        .mobile-toc-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .mobile-toc-item {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.65rem;
          font-size: 0.8rem;
          color: var(--dd-text-secondary);
          border-radius: 5px;
          text-decoration: none;
        }
        .mobile-toc-item:active {
          background-color: var(--dd-surface-2);
          color: var(--dd-accent);
        }
        .mobile-toc-item span:first-child {
          color: var(--dd-accent);
          opacity: 0.7;
        }

        /* ── Mobile Responsive Header Queries ──────────────────────── */
        @media (max-width: 768px) {
          .site-nav-desktop, .desktop-search, .site-login-btn {
            display: none !important;
          }
          .mobile-search-btn, .mobile-menu-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}

function MobileTree({
  nodes,
  pathname,
  onClose,
}: {
  nodes: TreeNode[];
  pathname: string;
  onClose: () => void;
}) {
  const sorted = [...nodes].sort((a, b) => a.order - b.order);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
      {sorted.map((node) => (
        <MobileTreeItem
          key={node.id}
          node={node}
          pathname={pathname}
          depth={0}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

function MobileTreeItem({
  node,
  pathname,
  depth,
  onClose,
}: {
  node: TreeNode;
  pathname: string;
  depth: number;
  onClose: () => void;
}) {
  const isChildActive = (item: TreeNode): boolean => {
    if (item.urlPath && pathname === item.urlPath) return true;
    return item.children?.some(isChildActive) ?? false;
  };

  const isCurrentActive = Boolean(node.urlPath && pathname === node.urlPath);
  const hasActiveChild = node.children?.some(isChildActive) ?? false;

  const [isOpen, setIsOpen] = useState(
    () => depth === 0 || isCurrentActive || hasActiveChild
  );

  useEffect(() => {
    if (isCurrentActive || hasActiveChild) {
      setIsOpen(true);
    }
  }, [pathname, isCurrentActive, hasActiveChild]);

  if (node.kind === "folder") {
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            minHeight: "30px",
            padding: "0.15rem 0.25rem",
            borderRadius: "5px",
            color: isCurrentActive ? "var(--dd-accent)" : "var(--dd-text-secondary)",
            backgroundColor: isCurrentActive ? "rgba(79, 141, 245, 0.08)" : "transparent",
            fontWeight: isCurrentActive ? 500 : 400,
          }}
        >
          {/* Chevron at start */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              style={{
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                color: "var(--dd-text-muted)",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
              }}
              aria-label={isOpen ? "بستن شاخه" : "باز کردن شاخه"}
            >
              <ChevronDown
                size={13}
                strokeWidth={2}
                style={{
                  transform: isOpen ? "rotate(0deg)" : "rotate(90deg)",
                  transition: "transform 0.15s ease",
                }}
              />
            </button>
          ) : (
            <span style={{ width: 20, height: 20, flexShrink: 0 }} aria-hidden="true" />
          )}

          {node.urlPath ? (
            <Link
              href={node.urlPath}
              onClick={() => {
                setIsOpen(true);
                onClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                flex: 1,
                minWidth: 0,
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", flexShrink: 0, width: 16 }}>
                <IconResolver
                  name={node.slug}
                  fallback="folder"
                  size={14}
                  className={isCurrentActive ? "text-blue-400" : "text-neutral-400"}
                />
              </span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
                  fontSize: "0.82rem",
                }}
                title={node.title}
              >
                {node.title}
              </span>
            </Link>
          ) : (
            <div
              onClick={() => setIsOpen(!isOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                flex: 1,
                minWidth: 0,
                cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", flexShrink: 0, width: 16 }}>
                <IconResolver
                  name={node.slug}
                  fallback="folder"
                  size={14}
                  className="text-neutral-400"
                />
              </span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
                  fontSize: "0.82rem",
                }}
                title={node.title}
              >
                {node.title}
              </span>
            </div>
          )}
        </div>

        {/* Nested container with vertical guide line */}
        {isOpen && hasChildren && (
          <div
            style={{
              position: "relative",
              marginRight: "0.6rem",
              paddingRight: "0.4rem",
              borderRight: "1px solid var(--dd-border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "0.15rem",
            }}
          >
            {node.children
              .sort((a, b) => a.order - b.order)
              .map((c) => (
                <MobileTreeItem
                  key={c.id}
                  node={c}
                  pathname={pathname}
                  depth={depth + 1}
                  onClose={onClose}
                />
              ))}
          </div>
        )}
      </div>
    );
  }

  // File leaf item
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        minHeight: "30px",
        padding: "0.15rem 0.25rem",
        borderRadius: "5px",
        color: isCurrentActive ? "var(--dd-accent)" : "var(--dd-text-secondary)",
        backgroundColor: isCurrentActive ? "rgba(79, 141, 245, 0.08)" : "transparent",
        fontWeight: isCurrentActive ? 500 : 400,
      }}
    >
      <span style={{ width: 20, height: 20, flexShrink: 0 }} aria-hidden="true" />
      <Link
        href={node.urlPath}
        onClick={onClose}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          flex: 1,
          minWidth: 0,
          color: "inherit",
          textDecoration: "none",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", flexShrink: 0, width: 16 }}>
          <IconResolver
            name={node.slug}
            fallback="file"
            size={14}
            className={isCurrentActive ? "text-blue-400" : "text-neutral-400"}
          />
        </span>
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            minWidth: 0,
            fontSize: "0.82rem",
          }}
          title={node.title}
        >
          {node.title}
        </span>
      </Link>
    </div>
  );
}
