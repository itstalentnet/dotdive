"use client";
import { useEffect, useState } from "react";
import type { Heading } from "@/server/content/types";

interface TocProps {
  headings: Heading[];
  isOpen?: boolean;
  onClose?: () => void;
}

export function TableOfContents({ headings, isOpen, onClose }: TocProps) {
  const [activeId, setActiveId] = useState<string>("");

  // Filter strictly to H2 tags as requested: "ساید انتها تگ های h2 اون مستند"
  const h2Headings = headings.filter((h) => h.level === 2);

  useEffect(() => {
    if (!h2Headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-70px 0px -60% 0px", threshold: 0.1 }
    );

    for (const h of h2Headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [h2Headings]);

  if (!h2Headings || h2Headings.length === 0) return null;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="toc-mobile-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <nav
        className={`docs-toc ${isOpen ? "open" : ""}`}
        aria-label="سرفصل‌های سند (H2)"
      >
        <div className="toc-header">
          <span className="toc-title">سرفصل‌های این صفحه</span>
        </div>

        <ul className="toc-list" role="list">
          {h2Headings.map((h) => {
            const isActive = activeId === h.id;

            return (
              <li key={h.id} className="toc-item">
                <a
                  href={`#${h.id}`}
                  className={`toc-link ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "location" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    const target = document.getElementById(h.id);
                    if (target) {
                      target.scrollIntoView({ behavior: "smooth" });
                      history.pushState(null, "", `#${h.id}`);
                      setActiveId(h.id);
                      onClose?.();
                    }
                  }}
                >
                  {h.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
