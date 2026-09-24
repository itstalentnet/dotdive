/**
 * Rendered markdown page content
 * Adds copy buttons to code blocks, handles Mermaid diagrams
 */
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
      btn.textContent = "کپی";
      btn.setAttribute("aria-label", "کپی کد");
      btn.addEventListener("click", async () => {
        const code = block.querySelector("code")?.textContent ?? "";
        await navigator.clipboard.writeText(code).catch(() => null);
        btn.textContent = "✓";
        setTimeout(() => { btn.textContent = "کپی"; }, 1500);
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
            background: "#0d0e10",
            primaryColor: "#1a1c1f",
            primaryTextColor: "#e8eaec",
            lineColor: "#2a2d31",
          },
        });
        for (const block of mermaidBlocks) {
          const wrapper = document.createElement("div");
          wrapper.className = "mermaid-wrapper";
          const code = block.textContent ?? "";
          const pre = block.closest("pre");
          if (pre) {
            pre.replaceWith(wrapper);
            m.default.render("mermaid-" + Math.random().toString(36).slice(2), code)
              .then(({ svg }) => { wrapper.innerHTML = svg; })
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
