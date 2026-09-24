"use client";
import Link from "next/link";
import {
  Search,
  Menu,
  ChevronDown,
  LayoutGrid,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { LogoIcon } from "@/components/ui/logo";

interface DocsHeaderProps {
  rootName?: string;
  rootTitle?: string;
  onMenuToggle?: () => void;
}

export function DocsHeader({
  rootTitle = "مستندات",
  onMenuToggle,
}: DocsHeaderProps) {
  return (
    <header className="docs-header">
      <div className="docs-header-inner">
        {/* Mobile menu button */}
        <button
          className="header-btn md:hidden"
          onClick={onMenuToggle}
          aria-label="باز کردن منو"
          type="button"
        >
          <Menu size={16} strokeWidth={1.75} />
        </button>

        {/* Logo */}
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

        {/* Search */}
        <SearchTrigger />

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
  );
}

function SearchTrigger() {
  return (
    <button
      className="search-trigger"
      aria-label="جستجو در مستندات"
      type="button"
    >
      <Search size={13} strokeWidth={1.75} />
      <span>جستجو...</span>
      <kbd className="search-shortcut">⌘K</kbd>
    </button>
  );
}
