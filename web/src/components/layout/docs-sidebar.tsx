"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft } from "lucide-react";
import type { TreeNode } from "@/server/content/types";
import { IconResolver } from "@/components/ui/icon-resolver";

interface DocsSidebarProps {
  nodes: TreeNode[];
  isOpen?: boolean;
  onClose?: () => void;
}

export function DocsSidebar({ nodes, isOpen, onClose }: DocsSidebarProps) {
  const pathname = usePathname();
  const sorted = [...nodes].sort((a, b) => a.order - b.order);

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 25,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      <aside
        className={`docs-sidebar${isOpen ? " open" : ""}`}
        aria-label="ناوبری مستندات"
      >
        <div className="sidebar-section">
          <TreeNodes nodes={sorted} pathname={pathname} depth={0} />
        </div>
      </aside>
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
  const [isOpen, setIsOpen] = useState(true);
  const isActive = pathname === node.urlPath;
  const paddingRight = `${0.45 + depth * 0.75}rem`;

  if (node.kind === "folder") {
    return (
      <div style={{ marginBottom: "0.15rem" }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="sidebar-item w-full"
          style={{ paddingRight }}
        >
          <span className="sidebar-icon">
            <IconResolver
              name={node.slug}
              fallback="folder"
              size={13}
              className={isActive ? "text-blue-400" : "text-neutral-400"}
            />
          </span>
          <span style={{ flex: 1, textAlign: "right" }}>{node.title}</span>
          <span className="sidebar-folder-toggle">
            {isOpen ? <ChevronDown size={12} /> : <ChevronLeft size={12} />}
          </span>
        </button>

        {isOpen && node.children.length > 0 && (
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
    <div style={{ marginBottom: "0.1rem" }}>
      <Link
        href={node.urlPath}
        className={`sidebar-item${isActive ? " active" : ""}`}
        style={{ paddingRight }}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="sidebar-icon">
          <IconResolver
            name={node.slug}
            fallback="file"
            size={13}
            className={isActive ? "text-blue-400" : "text-neutral-400"}
          />
        </span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {node.title}
        </span>
        {node.draft && (
          <span
            style={{
              fontSize: "0.62rem",
              color: "#f59e0b",
              marginRight: "auto",
              padding: "0.05rem 0.25rem",
              borderRadius: "3px",
              background: "rgba(245, 158, 11, 0.1)",
            }}
          >
            پیش‌نویس
          </span>
        )}
      </Link>

      {/* Heading anchors for active page */}
      {isActive &&
        node.headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={`sidebar-item sidebar-section-item`}
            style={{
              paddingRight: `${(depth + 1) * 0.75 + (h.level === 3 ? 0.65 : 0)}rem`,
            }}
          >
            <span style={{ opacity: 0.5, fontSize: "0.8em", marginLeft: "0.3rem" }}>
              #
            </span>
            <span>{h.text}</span>
          </a>
        ))}
    </div>
  );
}
