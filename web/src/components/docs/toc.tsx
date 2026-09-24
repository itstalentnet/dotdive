"use client";
import React, { useEffect, useState } from "react";
import type { Heading } from "@/server/content/types";

interface TocProps {
  headings: Heading[];
  isOpen?: boolean;
  onClose?: () => void;
}

function findHeadingElement(id: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return (
    document.getElementById(id) ||
    document.getElementById(`user-content-${id}`) ||
    (typeof CSS !== "undefined" && CSS.escape
      ? document.querySelector(`[id="${CSS.escape(id)}"]`)
      : null) ||
    (typeof CSS !== "undefined" && CSS.escape
      ? document.querySelector(`[id="user-content-${CSS.escape(id)}"]`)
      : null)
  );
}

export function TableOfContents({ headings, isOpen, onClose }: TocProps) {
  const [activeId, setActiveId] = useState<string>("");

  // Filter strictly to H2 tags as requested: "ساید انتها تگ های h2 اون مستند"
  const h2Headings = headings.filter((h) => h.level === 2);

  useEffect(() => {
    if (!h2Headings.length) return;

    function handleScroll() {
      const topOffset = 80; // 52px sticky header + 28px buffer
      let currentActive = "";

      for (const h of h2Headings) {
        const el = findHeadingElement(h.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= topOffset + 40) {
            currentActive = h.id;
          }
        }
      }

      if (currentActive) {
        setActiveId(currentActive);
      } else if (h2Headings[0]) {
        const firstEl = findHeadingElement(h2Headings[0].id);
        if (firstEl && firstEl.getBoundingClientRect().top <= window.innerHeight * 0.45) {
          setActiveId(h2Headings[0].id);
        } else {
          setActiveId("");
        }
      }
    }

    // Run on mount
    handleScroll();

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [h2Headings]);

  if (!h2Headings || h2Headings.length === 0) return null;

  function scrollToHeading(e: React.MouseEvent, id: string) {
    e.preventDefault();
    const el = findHeadingElement(id);
    if (el) {
      const headerOffset = 70; // 52px header + 18px top margin
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: "smooth",
      });

      history.pushState(null, "", `#${id}`);
      setActiveId(id);
      onClose?.();
    }
  }

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
                  onClick={(e) => scrollToHeading(e, h.id)}
                  title={h.text}
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
