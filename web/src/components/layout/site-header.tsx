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
