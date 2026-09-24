/**
 * server/content/types.ts
 * Core content types — shared between content pipeline, server, and future MCP
 */
import { z } from "zod";

/* ── Front Matter Schema ─────────────────────────────────────── */

export const FrontMatterSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  cover: z.string().optional(),
  order: z.number().optional(),
  tags: z.array(z.string()).optional().default([]),
  slug: z.string().optional(),
  aliases: z.array(z.string()).optional().default([]),
  draft: z.boolean().optional().default(false),
  hidden: z.boolean().optional().default(false),
  updated: z.coerce.date().optional(),
  noindex: z.boolean().optional().default(false),
  // Blog only
  date: z.coerce.date().optional(),
  author: z.string().optional(),
  // index.md only
  collapsed: z.boolean().optional().default(false),
});

export type FrontMatter = z.infer<typeof FrontMatterSchema>;

/* ── Content Nodes ───────────────────────────────────────────── */

export type NodeKind = "file" | "folder" | "section";

export interface TreeNode {
  id: string; // unique path-based id
  kind: NodeKind;
  title: string;
  slug: string;
  path: string; // relative to docs/
  urlPath: string; // web URL path
  root: string; // root name (nons, public, etc.)
  icon?: string;
  order: number;
  hidden: boolean;
  draft: boolean;
  children: TreeNode[];
  // File-specific
  description?: string;
  tags: string[];
  headings: Heading[];
  updatedAt?: Date;
}

export interface Heading {
  id: string; // anchor
  level: 2 | 3 | 4;
  text: string;
}

/* ── Rendered Page ───────────────────────────────────────────── */

export interface Page {
  id: string;
  root: string;
  title: string;
  description?: string;
  icon?: string;
  cover?: string;
  tags: string[];
  headings: Heading[];
  html: string;
  rawMarkdown: string;
  draft: boolean;
  hidden: boolean;
  updatedAt?: Date;
  urlPath: string;
  prevPage?: { title: string; urlPath: string };
  nextPage?: { title: string; urlPath: string };
  // Blog
  date?: Date;
  author?: string;
}

/* ── Search ──────────────────────────────────────────────────── */

export interface SearchRecord {
  id: string;
  pageId: string;
  root: string;
  title: string;
  heading: string;
  anchor: string;
  content: string;
  tags: string[];
  urlPath: string;
  boost: number;
}

export interface SearchHit {
  score: number;
  pageId: string;
  title: string;
  heading: string;
  anchor: string;
  urlPath: string;
  snippet: string;
  root: string;
}

/* ── Manifest ────────────────────────────────────────────────── */

export interface ContentManifest {
  buildTime: string;
  roots: RootMeta[];
  nodes: Record<string, TreeNode>;
  tree?: Record<string, TreeNode[]>;
}

export interface RootMeta {
  name: string;
  title: string;
  description?: string;
  icon?: string;
  isPublic: boolean;
}

/* ── Sitemap ─────────────────────────────────────────────────── */

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}
