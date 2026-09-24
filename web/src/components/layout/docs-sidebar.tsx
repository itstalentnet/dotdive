"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, X } from "lucide-react";
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
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`docs-sidebar ${isOpen ? "open" : ""}`}
        aria-label="مستندات و فایل‌های پروژه"
      >
        {/* Mobile Drawer Header */}
        <div className="sidebar-mobile-header">
          <span className="sidebar-mobile-title">مستندات پروژه</span>
          <button
            type="button"
            onClick={onClose}
            className="sidebar-close-btn"
            aria-label="بستن منو"
          >
            <X size={16} />
          </button>
        </div>

        <div className="sidebar-section">
          <TreeNodes
            nodes={sorted}
            pathname={pathname}
            depth={0}
            onItemClick={onClose}
          />
        </div>
      </aside>
    </>
  );
}

function TreeNodes({
  nodes,
  pathname,
  depth,
  onItemClick,
}: {
  nodes: TreeNode[];
  pathname: string;
  depth: number;
  onItemClick?: () => void;
}) {
  return (
    <>
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          pathname={pathname}
          depth={depth}
          onItemClick={onItemClick}
        />
      ))}
    </>
  );
}

function TreeItem({
  node,
  pathname,
  depth,
  onItemClick,
}: {
  node: TreeNode;
  pathname: string;
  depth: number;
  onItemClick?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const isActive = pathname === node.urlPath;
  const paddingRight = `${0.5 + depth * 0.75}rem`;

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
              size={14}
              className={isActive ? "text-blue-400" : "text-neutral-400"}
            />
          </span>
          <span className="sidebar-item-label">{node.title}</span>
          <span className="sidebar-folder-toggle">
            {isOpen ? <ChevronDown size={12} /> : <ChevronLeft size={12} />}
          </span>
        </button>

        {isOpen && node.children.length > 0 && (
          <TreeNodes
            nodes={node.children.sort((a, b) => a.order - b.order)}
            pathname={pathname}
            depth={depth + 1}
            onItemClick={onItemClick}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "0.1rem" }}>
      <Link
        href={node.urlPath}
        onClick={onItemClick}
        className={`sidebar-item ${isActive ? "active" : ""}`}
        style={{ paddingRight }}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="sidebar-icon">
          <IconResolver
            name={node.slug}
            fallback="file"
            size={14}
            className={isActive ? "text-blue-400" : "text-neutral-400"}
          />
        </span>
        <span className="sidebar-item-label">{node.title}</span>
        {node.draft && <span className="sidebar-draft-badge">پیش‌نویس</span>}
      </Link>
    </div>
  );
}
