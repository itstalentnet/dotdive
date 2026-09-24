/**
 * Public docs index page — /docs
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ANON_CTX, getTree } from "@/server/content/index";

export const metadata: Metadata = {
  title: "مستندات",
  description: "مستندات عمومی dotdive",
};

export default function DocsIndexPage() {
  const tree = getTree("public", ANON_CTX) ?? [];
  const docsNodes = tree.filter((n) => !n.hidden && !n.draft);

  return (
    <div className="docs-index-page">
      <h1>مستندات</h1>
      <p style={{ color: "var(--dd-text-secondary)", marginBottom: "2rem" }}>
        راهنماها و مستندات عمومی dotdive
      </p>
      <div className="docs-cards">
        {docsNodes.map((node) => (
          <Link key={node.id} href={node.urlPath} className="docs-card">
            {node.icon && <span className="docs-card-icon">{node.icon}</span>}
            <h3>{node.title}</h3>
            {node.description && <p>{node.description}</p>}
          </Link>
        ))}
      </div>
      <style>{`
        .docs-index-page { padding: 2rem; max-width: 720px; margin: auto; }
        .docs-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
        .docs-card { 
          display: block; padding: 1.25rem; 
          background: var(--dd-surface-2); border: 1px solid var(--dd-border);
          border-radius: 8px; text-decoration: none; transition: all 0.15s;
        }
        .docs-card:hover { border-color: var(--dd-text-muted); background: var(--dd-surface-3); }
        .docs-card-icon { font-size: 1.5rem; display: block; margin-bottom: 0.5rem; }
        .docs-card h3 { font-family: var(--font-heading); color: var(--dd-text-primary); margin-bottom: 0.4rem; }
        .docs-card p { font-size: 0.85rem; color: var(--dd-text-secondary); line-height: 1.7; }
      `}</style>
    </div>
  );
}
