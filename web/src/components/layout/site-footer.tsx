import React from "react";
import Link from "next/link";
import { LogoIcon } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="landing-container">
        <div className="footer-inner">
          <div className="footer-brand" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LogoIcon size={15} />
            <span style={{ fontWeight: 600, color: "var(--dd-text-primary)" }}>دات دایو</span>
            <span style={{ color: "var(--dd-text-muted)", fontSize: "0.78rem" }}>
              — مرجع مستندات و دانش پروژه‌ها
            </span>
          </div>

          <nav className="footer-links" aria-label="پیوندهای پاورقی">
            <Link href="/docs" className="footer-link">
              مستندات
            </Link>
            <Link href="/about" className="footer-link">
              درباره ما
            </Link>
            <Link href="/contact" className="footer-link">
              تماس با ما
            </Link>
            <a href="/llms.txt" className="footer-link" title="فایل متنی استاندارد هوش مصنوعی">
              llms.txt
            </a>
            <Link href="/login" className="footer-link">
              ورود
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
