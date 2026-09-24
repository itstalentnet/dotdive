/**
 * Docs header component — search trigger, root switcher, menu toggle
 */
"use client";
import Link from "next/link";
import { LogoIcon } from "@/components/ui/logo";
import { useState } from "react";

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
          className="menu-btn touch-target"
          onClick={onMenuToggle}
          aria-label="باز کردن منو"
          style={{ display: "none" }}
          id="mobile-menu-btn"
        >
          <MenuIcon />
        </button>

        {/* Logo */}
        <Link href="/" className="logo-link" aria-label="صفحهٔ اصلی dotdive">
          <LogoIcon size={22} />
        </Link>

        <span className="header-sep" aria-hidden>
          /
        </span>

        {/* Root name */}
        <button className="root-switcher" aria-label="تغییر پروژه">
          <span>{rootTitle}</span>
          <ChevronDown />
        </button>

        {/* Search */}
        <SearchTrigger />

        {/* User */}
        <Link
          href="/projects"
          className="touch-target"
          aria-label="پروژه‌ها"
          style={{
            color: "var(--dd-text-muted)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <GridIcon />
        </Link>
      </div>

      <style>{`
        .header-sep {
          color: var(--dd-border);
          font-size: 1.1em;
          user-select: none;
        }
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}

function SearchTrigger() {
  return (
    <button
      className="search-trigger"
      aria-label="جستجو در مستندات"
      onClick={() => {
        // TODO: open search palette
      }}
    >
      <SearchIcon />
      <span>جستجو...</span>
      <kbd className="search-shortcut">⌘K</kbd>
    </button>
  );
}

/* ── Icons ───────────────────────────────────────────────────── */
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
