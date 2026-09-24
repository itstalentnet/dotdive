"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
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
  const [expandAllSignal, setExpandAllSignal] = useState<boolean | null>(null);

  function handleToggleAll() {
    setExpandAllSignal((prev) => (prev === true ? false : true));
  }

  return (
    <aside
      className="docs-sidebar"
      aria-label="مستندات و فایل‌های پروژه"
    >
      {/* Optimized Minimalist Sidebar Header */}
      <div className="sidebar-tree-header">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="sidebar-tree-title">ساختار مستندات</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800/80 text-neutral-400 font-mono">
            {sorted.length}
          </span>
        </div>

        <button
          type="button"
          onClick={handleToggleAll}
          className="sidebar-tree-action-btn"
          aria-label={expandAllSignal === true ? "بستن همه شاخه‌ها" : "باز کردن همه شاخه‌ها"}
          title={expandAllSignal === true ? "بستن همه شاخه‌ها" : "باز کردن همه شاخه‌ها"}
        >
          {expandAllSignal === true ? (
            <>
              <ChevronsDownUp size={12} />
              <span>بستن همه</span>
            </>
          ) : (
            <>
              <ChevronsUpDown size={12} />
              <span>باز کردن همه</span>
            </>
          )}
        </button>
      </div>

      <div className="sidebar-section">
        <TreeNodes
          nodes={sorted}
          pathname={pathname}
          depth={0}
          onItemClick={onClose}
          expandAllSignal={expandAllSignal}
        />
      </div>
    </aside>
  );
}

export function TreeNodes({
  nodes,
  pathname,
  depth,
  onItemClick,
  expandAllSignal,
}: {
  nodes: TreeNode[];
  pathname: string;
  depth: number;
  onItemClick?: () => void;
  expandAllSignal?: boolean | null;
}) {
  return (
    <div className="flex flex-col gap-[1px]">
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          pathname={pathname}
          depth={depth}
          onItemClick={onItemClick}
          expandAllSignal={expandAllSignal}
        />
      ))}
    </div>
  );
}

function TreeItem({
  node,
  pathname,
  depth,
  onItemClick,
  expandAllSignal,
}: {
  node: TreeNode;
  pathname: string;
  depth: number;
  onItemClick?: () => void;
  expandAllSignal?: boolean | null;
}) {
  const isChildActive = (item: TreeNode): boolean => {
    if (item.urlPath && pathname === item.urlPath) return true;
    return item.children?.some(isChildActive) ?? false;
  };

  const isCurrentActive = Boolean(node.urlPath && pathname === node.urlPath);
  const hasActiveChild = node.children?.some(isChildActive) ?? false;

  const [isOpen, setIsOpen] = useState(
    () => depth === 0 || isCurrentActive || hasActiveChild
  );

  // Sync with global Expand All / Collapse All signal
  useEffect(() => {
    if (expandAllSignal !== null && expandAllSignal !== undefined) {
      if (expandAllSignal) {
        setIsOpen(true);
      } else {
        // Keep active branches open even when collapsing all
        setIsOpen(isCurrentActive || hasActiveChild);
      }
    }
  }, [expandAllSignal, isCurrentActive, hasActiveChild]);

  // Auto-expand active path when route changes
  useEffect(() => {
    if (isCurrentActive || hasActiveChild) {
      setIsOpen(true);
    }
  }, [pathname, isCurrentActive, hasActiveChild]);

  if (node.kind === "folder") {
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div className="flex flex-col">
        <div
          className={`sidebar-item-row ${isCurrentActive ? "active" : ""}`}
        >
          {/* Chevron toggle at the START (Right in RTL) — never hidden by long titles */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="tree-chevron-btn"
              aria-label={isOpen ? "بستن شاخه" : "باز کردن شاخه"}
              title={isOpen ? "بستن شاخه" : "باز کردن شاخه"}
            >
              <ChevronDown
                size={12}
                strokeWidth={2}
                style={{
                  transform: isOpen ? "rotate(0deg)" : "rotate(90deg)",
                  transition: "transform 0.15s ease",
                }}
              />
            </button>
          ) : (
            <span className="tree-spacer" aria-hidden="true" />
          )}

          {/* Folder Title Link or Action */}
          {node.urlPath ? (
            <Link
              href={node.urlPath}
              onClick={() => {
                setIsOpen(true);
                onItemClick?.();
              }}
              className="tree-link-wrapper"
              aria-current={isCurrentActive ? "page" : undefined}
            >
              <span className="sidebar-icon">
                <IconResolver
                  name={node.slug}
                  fallback="folder"
                  size={14}
                  className={isCurrentActive ? "text-blue-400" : "text-neutral-400"}
                />
              </span>
              <span
                className="sidebar-item-label"
                title={node.title}
              >
                {node.title}
              </span>
              {node.draft && <span className="sidebar-draft-badge">پیش‌نویس</span>}
            </Link>
          ) : (
            <div
              onClick={() => setIsOpen(!isOpen)}
              className="tree-link-wrapper cursor-pointer"
            >
              <span className="sidebar-icon">
                <IconResolver
                  name={node.slug}
                  fallback="folder"
                  size={14}
                  className="text-neutral-400"
                />
              </span>
              <span
                className="sidebar-item-label"
                title={node.title}
              >
                {node.title}
              </span>
            </div>
          )}
        </div>

        {/* Nested Children Container with Vertical Guide Lines */}
        {isOpen && hasChildren && (
          <div className="tree-children-container">
            <TreeNodes
              nodes={node.children.sort((a, b) => a.order - b.order)}
              pathname={pathname}
              depth={depth + 1}
              onItemClick={onItemClick}
              expandAllSignal={expandAllSignal}
            />
          </div>
        )}
      </div>
    );
  }

  // Leaf Markdown File Item
  return (
    <div className={`sidebar-item-row ${isCurrentActive ? "active" : ""}`}>
      {/* Empty spacer so file icons line up 100% with folder icons */}
      <span className="tree-spacer" aria-hidden="true" />

      <Link
        href={node.urlPath}
        onClick={onItemClick}
        className="tree-link-wrapper"
        aria-current={isCurrentActive ? "page" : undefined}
      >
        <span className="sidebar-icon">
          <IconResolver
            name={node.slug}
            fallback="file"
            size={14}
            className={isCurrentActive ? "text-blue-400" : "text-neutral-400"}
          />
        </span>
        <span
          className="sidebar-item-label"
          title={node.title}
        >
          {node.title}
        </span>
        {node.draft && <span className="sidebar-draft-badge">پیش‌نویس</span>}
      </Link>
    </div>
  );
}
