"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SearchDialog } from "@/components/search/search-dialog";

export default function LandingPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="public-page-wrapper">
      <SiteHeader />

      <main className="landing-main">
        {/* ── Ultra-Minimal Hero ───────────────────────────────── */}
        <section className="minimal-hero">
          <div className="landing-container">
            <h1 className="minimal-title">یک لینک تا قلب پروژه.</h1>

            <p className="minimal-desc">
              دات دایو مرجع مستندات و دانش پروژه‌هاست که تیم توسعه می‌سازد و
              کسب‌وکار مستقیم و از طریق مدل هوش مصنوعی دلخواهش، با یک لینک، به
              آن دسترسی دارد.
            </p>

            {/* ── Focused Search Bar ─────────────────────────────── */}
            <div className="minimal-search-box">
              <div
                className="minimal-search-input"
                onClick={() => setIsSearchOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsSearchOpen(true);
                  }
                }}
                aria-label="جستجو در مستندات دات دایو"
              >
                <Search size={16} strokeWidth={2} className="text-neutral-400" />
                <span className="minimal-search-placeholder">
                  جستجو در مستندات و دانش پروژه‌ها...
                </span>
                <kbd className="minimal-search-kbd">⌘K</kbd>
              </div>
            </div>

            {/* ── Single Focused Action ───────────────────────────── */}
            <div>
              <Link href="/docs" className="btn-minimal">
                <span>ورود به مستندات</span>
                <ArrowLeft size={14} strokeWidth={2.2} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── 3 Quiet Value Pillars ───────────────────────────── */}
        <section className="minimal-values-section">
          <div className="landing-container">
            <div className="minimal-values-grid">
              <div className="minimal-value-item">
                <h2 className="minimal-value-title">استقلال</h2>
                <p className="minimal-value-desc">
                  دانش پروژه مال کسب‌وکار است، نه گروگان یک تیم. با تغییر یا عدم
                  دسترسی افراد، تصمیم‌گیری و توسعه متوقف نمی‌شود.
                </p>
              </div>

              <div className="minimal-value-item">
                <h2 className="minimal-value-title">شفافیت</h2>
                <p className="minimal-value-desc">
                  دلیل هر تصمیم معماری و فنی ثبت شده است، نه فقط نتیجه. کارهای
                  گذشته دوباره از صفر اختراع نمی‌شوند.
                </p>
              </div>

              <div className="minimal-value-item">
                <h2 className="minimal-value-title">آماده برای هوش مصنوعی</h2>
                <p className="minimal-value-desc">
                  با یک لینک، مستندات هر پروژه به MCP یا مدل دلخواه کسب‌وکار متصل
                  می‌شود؛ بدون هزینهٔ واسطه و با پاسخ‌های دقیق.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <SiteFooter />
    </div>
  );
}
