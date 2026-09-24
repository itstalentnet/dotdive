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

    // Remove any duplicate leading H1 (since page-header already renders the canonical H1)
    const prose = document.querySelector(".article-content .prose");
    if (prose) {
      const firstH1 = prose.querySelector("h1");
      if (firstH1) {
        const parentLink = firstH1.closest(".heading-anchor-link");
        if (parentLink && parentLink.parentElement === prose) {
          parentLink.remove();
        } else if (firstH1.parentElement === prose) {
          firstH1.remove();
        }
      }
    }

    // Lazy-load Mermaid diagrams safely
    const mermaidBlocks = document.querySelectorAll(".language-mermaid");
    if (mermaidBlocks.length > 0) {
      import("mermaid")
        .then(async (m) => {
          m.default.initialize({
            startOnLoad: false,
            securityLevel: "loose",
            suppressErrorRendering: true,
            theme: "dark",
            themeVariables: {
              background: "#090a0c",
              primaryColor: "#17191d",
              primaryTextColor: "#ededef",
              lineColor: "#202327",
            },
          });

          for (const block of Array.from(mermaidBlocks)) {
            const pre = block.closest("pre");
            if (!pre) continue;
            const code = block.textContent?.trim() ?? "";
            if (!code) continue;

            try {
              // Pre-validate syntax before rendering to prevent Mermaid from injecting error banners
              const isValid = await m.default.parse(code, { suppressErrors: true });
              if (isValid === false) continue;

              const id = "mermaid-" + Math.random().toString(36).slice(2, 9);
              const { svg } = await m.default.render(id, code);
              const wrapper = document.createElement("div");
              wrapper.className = "mermaid-wrapper";
              wrapper.innerHTML = svg;
              pre.replaceWith(wrapper);
            } catch {
              // Ignore and leave raw code block intact
            } finally {
              // Remove any temporary/error containers injected directly into document.body
              document
                .querySelectorAll('body > [id^="dmermaid"], body > [id*="mermaid"], [id^="dmermaid"]')
                .forEach((el) => {
                  if (!el.closest(".mermaid-wrapper")) {
                    el.remove();
                  }
                });
            }
          }
        })
        .catch(() => {});
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
