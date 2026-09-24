/**
 * TOC Component — Table of Contents, sticky right column
 * Client-side: tracks active heading via IntersectionObserver
 */
"use client";
import { useEffect, useState } from "react";
import type { Heading } from "@/server/content/types";

interface TocProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TocProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return (
    <aside className="docs-toc" aria-label="فهرست مطالب این صفحه">
      <p className="toc-title">در این صفحه</p>
      <ul className="toc-list" role="list">
        {headings.map((h) => (
          <li key={h.id} className="toc-item">
            <a
              href={`#${h.id}`}
              className={`toc-link${activeId === h.id ? " active" : ""}`}
              data-level={h.level}
              aria-label={h.text}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
