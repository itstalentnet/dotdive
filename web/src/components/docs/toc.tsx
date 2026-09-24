"use client";
import { useEffect, useState } from "react";
import { ListOrdered } from "lucide-react";
import type { Heading } from "@/server/content/types";

interface TocProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TocProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!headings.length) return;

    // Use IntersectionObserver to track visible headings
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

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (!headings || headings.length === 0) return null;

  return (
    <nav className="docs-toc" aria-label="فهرست عناوین این صفحه">
      <div className="toc-title">
        <ListOrdered size={12} strokeWidth={2} />
        <span>در این صفحه</span>
      </div>

      <ul className="toc-list" role="list">
        {headings.map((h) => {
          const isActive = activeId === h.id;

          return (
            <li key={h.id} className="toc-item">
              <a
                href={`#${h.id}`}
                className={`toc-link ${isActive ? "active" : ""}`}
                data-level={h.level}
                aria-current={isActive ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(h.id);
                  if (target) {
                    target.scrollIntoView({ behavior: "smooth" });
                    history.pushState(null, "", `#${h.id}`);
                    setActiveId(h.id);
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
  );
}
