/**
 * Docs sidebar — tree navigation, section anchors
 */
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { TreeNode } from "@/server/content/types";

interface DocsSidebarProps {
  nodes: TreeNode[];
  isOpen?: boolean;
  onClose?: () => void;
}

export function DocsSidebar({ nodes, isOpen, onClose }: DocsSidebarProps) {
  const pathname = usePathname();

  // Sort by order
  const sorted = [...nodes].sort((a, b) => a.order - b.order);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 25,
          }}
        />
      )}

      <nav
        className={`docs-sidebar${isOpen ? " open" : ""}`}
        aria-label="ناوبری مستندات"
      >
        <div className="sidebar-section">
          <TreeNodes nodes={sorted} pathname={pathname} depth={0} />
        </div>
      </nav>
    </>
  );
}

function TreeNodes({
  nodes,
  pathname,
  depth,
}: {
  nodes: TreeNode[];
  pathname: string;
  depth: number;
}) {
  return (
    <>
      {nodes.map((node) => (
        <TreeItem key={node.id} node={node} pathname={pathname} depth={depth} />
      ))}
    </>
  );
}

function TreeItem({
  node,
  pathname,
  depth,
}: {
  node: TreeNode;
  pathname: string;
  depth: number;
}) {
  const isActive = pathname === node.urlPath;
  const style = depth > 0 ? { paddingRight: `${0.5 + depth * 0.75}rem` } : {};

  if (node.kind === "folder") {
    return (
      <div>
        <div className="sidebar-item" style={style}>
          {node.icon && <span className="sidebar-icon">{node.icon}</span>}
          <span>{node.title}</span>
          <span className="sidebar-folder-toggle">▶</span>
        </div>
        {node.children.length > 0 && (
          <TreeNodes
            nodes={node.children.sort((a, b) => a.order - b.order)}
            pathname={pathname}
            depth={depth + 1}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <Link
        href={node.urlPath}
        className={`sidebar-item${isActive ? " active" : ""}`}
        style={style}
        aria-current={isActive ? "page" : undefined}
      >
        {node.icon && <span className="sidebar-icon">{node.icon}</span>}
        <span>{node.title}</span>
        {node.draft && (
          <span
            style={{
              fontSize: "0.65rem",
              color: "#f59e0b",
              marginRight: "auto",
            }}
          >
            پیش‌نویس
          </span>
        )}
      </Link>

      {/* Show section headings when page is active */}
      {isActive &&
        node.headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={`sidebar-item sidebar-section-item${
              h.level === 3 ? " sidebar-h3" : ""
            }`}
            style={{
              paddingRight: `${(depth + 1) * 0.75 + (h.level === 3 ? 0.75 : 0)}rem`,
            }}
          >
            {h.text}
          </a>
        ))}
    </div>
  );
}
