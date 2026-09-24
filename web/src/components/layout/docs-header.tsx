"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Menu,
  ChevronDown,
  LayoutGrid,
  BookOpen,
} from "lucide-react";
import { LogoIcon } from "@/components/ui/logo";
import { SearchDialog } from "@/components/search/search-dialog";

interface DocsHeaderProps {
  rootName?: string;
  rootTitle?: string;
  onMenuToggle?: () => void;
}

export function DocsHeader({
  rootName,
  rootTitle = "مستندات",
  onMenuToggle,
}: DocsHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global ⌘K / Ctrl+K shortcut listener
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

  return (
    <>
      <header className="docs-header">
        <div className="docs-header-inner">
          {/* Mobile menu button */}
          <button
            className="header-btn mobile-menu-btn"
            onClick={onMenuToggle}
            aria-label="باز کردن منو"
            type="button"
          >
            <Menu size={16} strokeWidth={1.75} />
          </button>

          {/* Logo with official SVG */}
          <Link href="/" className="logo-link" aria-label="صفحهٔ اصلی dotdive">
            <LogoIcon size={18} />
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
              dotdive
            </span>
          </Link>

          <span className="header-sep" aria-hidden>
            /
          </span>

          {/* Root switcher */}
          <div className="root-switcher">
            <BookOpen size={13} strokeWidth={1.75} className="text-neutral-400" />
            <span>{rootTitle}</span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Interactive Search Trigger */}
          <button
            className="search-trigger"
            aria-label="جستجو در مستندات"
            type="button"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search size={13} strokeWidth={1.75} />
            <span>جستجو در مستندات...</span>
            <kbd className="search-shortcut">⌘K</kbd>
          </button>

          {/* Projects / Dashboard Link */}
          <Link
            href="/projects"
            className="header-btn"
            aria-label="فهرست پروژه‌ها"
            title="پروژه‌ها"
          >
            <LayoutGrid size={15} strokeWidth={1.75} />
          </Link>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentRoot={rootName}
      />
    </>
  );
}
