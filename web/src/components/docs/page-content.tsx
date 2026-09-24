"use client";
import { useEffect } from "react";

interface PageContentProps {
  html: string;
}

export function PageContent({ html }: PageContentProps) {
  useEffect(() => {
    // Add copy buttons to all code blocks
    const codeBlocks = document.querySelectorAll("pre.code-block");
    for (const block of codeBlocks) {
      if (block.querySelector(".copy-btn")) continue;
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>کپی</span>`;
      btn.setAttribute("aria-label", "کپی کد");
      btn.addEventListener("click", async () => {
        const code = block.querySelector("code")?.textContent ?? "";
        await navigator.clipboard.writeText(code).catch(() => null);
        btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span style="color:#22c55e">کپی شد</span>`;
        setTimeout(() => {
          btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>کپی</span>`;
        }, 1800);
      });
      block.appendChild(btn);
    }

    // Lazy-load Mermaid diagrams
    const mermaidBlocks = document.querySelectorAll(".language-mermaid");
    if (mermaidBlocks.length > 0) {
      import("mermaid").then((m) => {
        m.default.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            background: "#090a0c",
            primaryColor: "#17191d",
            primaryTextColor: "#ededef",
            lineColor: "#202327",
          },
        });
        for (const block of mermaidBlocks) {
          const wrapper = document.createElement("div");
          wrapper.className = "mermaid-wrapper";
          const code = block.textContent ?? "";
          const pre = block.closest("pre");
          if (pre) {
            pre.replaceWith(wrapper);
            m.default
              .render("mermaid-" + Math.random().toString(36).slice(2), code)
              .then(({ svg }) => {
                wrapper.innerHTML = svg;
              })
              .catch(() => {
                wrapper.innerHTML = `<pre style="color:var(--dd-text-muted)">${code}</pre>`;
              });
          }
        }
      });
    }
  }, [html]);

  return (
    <div
      className="prose"
      dangerouslySetInnerHTML={{ __html: html }}
      dir="rtl"
    />
  );
}
