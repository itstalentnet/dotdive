/**
 * server/content/index.ts
 * Content Core API — all functions accept AccessContext
 * Pure functions, independent of UI
 * Future MCP server will use these directly
 */
import path from "node:path";
import fs from "node:fs";
import matter from "gray-matter";
import { FrontMatterSchema } from "./types";
import type {
  TreeNode,
  Page,
  ContentManifest,
  RootMeta,
  SitemapEntry,
  FrontMatter,
} from "./types";
import type { AccessContext } from "@/server/access";
import { canAccess } from "@/server/access";
import { renderMarkdown } from "./markdown";

/** Anonymous principal — public access only */
export const ANON_CTX: AccessContext = {
  email: null,
  roots: new Set(["public"]),
};

import { getDocsDir, getOutPublic, getOutPrivate } from "./paths";

/* ── Manifest cache ──────────────────────────────────────────── */
let _manifest: ContentManifest | null = null;

function loadManifest(): ContentManifest {
  if (_manifest) return _manifest;
  const p = path.join(getOutPublic(), "_manifest.json");
  if (fs.existsSync(p)) {
    _manifest = JSON.parse(fs.readFileSync(p, "utf8")) as ContentManifest;
    return _manifest;
  }
  // Fallback: build on the fly in dev
  return buildManifestSync();
}

function buildManifestSync(): ContentManifest {
  const roots: RootMeta[] = [];
  const nodes: Record<string, TreeNode> = {};
  const docsDir = getDocsDir();

  if (!fs.existsSync(docsDir)) {
    return { buildTime: new Date().toISOString(), roots, nodes };
  }

  const rootDirs = fs
    .readdirSync(docsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const rootName of rootDirs) {
    const rootDir = path.join(docsDir, rootName);
    const indexPath = path.join(rootDir, "index.md");
    let rootMeta: RootMeta = {
      name: rootName,
      title: rootName,
      isPublic: rootName === "public",
    };

    if (fs.existsSync(indexPath)) {
      const { data } = matter(fs.readFileSync(indexPath, "utf8"));
      const fm = FrontMatterSchema.safeParse(data);
      if (fm.success) {
        rootMeta = {
          ...rootMeta,
          title: fm.data.title ?? rootName,
          description: fm.data.description,
          icon: fm.data.icon,
        };
      }
    }
    roots.push(rootMeta);
    scanDir(rootDir, rootName, nodes);
  }

  return { buildTime: new Date().toISOString(), roots, nodes };
}

/* ── Scan directory recursively ──────────────────────────────── */
function scanDir(
  dir: string,
  root: string,
  nodes: Record<string, TreeNode>,
  parentPath = ""
): void {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith("."));

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const indexFile = path.join(fullPath, "index.md");
      let folderNode: TreeNode = {
        id: `${root}/${relPath}`,
        kind: "folder",
        title: entry.name,
        slug: entry.name,
        path: relPath,
        urlPath: buildUrlPath(root, relPath),
        root,
        order: 999,
        hidden: false,
        draft: false,
        children: [],
        tags: [],
        headings: [],
      };

      if (fs.existsSync(indexFile)) {
        const { data } = matter(fs.readFileSync(indexFile, "utf8"));
        const fm = FrontMatterSchema.safeParse(data);
        if (fm.success) {
          folderNode.title = fm.data.title ?? entry.name;
          folderNode.icon = fm.data.icon;
          folderNode.order = fm.data.order ?? 999;
          folderNode.hidden = fm.data.hidden;
        }
      }

      nodes[folderNode.id] = folderNode;
      scanDir(fullPath, root, nodes, relPath);
    } else if (entry.name.endsWith(".md") && entry.name !== "index.md") {
      const content = fs.readFileSync(fullPath, "utf8");
      const { data, content: body } = matter(content);
      const fm = FrontMatterSchema.safeParse(data);
      const fmData: Partial<FrontMatter> = fm.success ? fm.data : {};

      // Extract title from first heading if not in front matter
      const titleFromHeading = body.match(/^#\s+(.+)$/m)?.[1] ?? "";
      const rawName = entry.name.replace(/\.md$/, "").replace(/^\d+-/, "");
      const slug = fmData.slug ?? rawName;
      const title = fmData.title ?? titleFromHeading ?? rawName;

      const fileNode: TreeNode = {
        id: `${root}/${relPath}`,
        kind: "file",
        title,
        slug,
        path: relPath,
        urlPath: buildUrlPath(root, relPath.replace(/\.md$/, "").replace(/^\d+-/, "")),
        root,
        order: fmData.order ?? extractNumericPrefix(entry.name),
        hidden: fmData.hidden ?? false,
        draft: fmData.draft ?? false,
        description: fmData.description,
        icon: fmData.icon,
        tags: fmData.tags ?? [],
        headings: [],
        children: [],
        updatedAt: fmData.updated,
      };

      nodes[fileNode.id] = fileNode;
    }
  }
}

function extractNumericPrefix(name: string): number {
  const match = name.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 999;
}

function buildUrlPath(root: string, relPath: string): string {
  const cleanPath = relPath
    .replace(/\.md$/, "")
    .replace(/\/index$/, "")
    .replace(/(^|\/)\d+-/g, "$1")
    .replace(/^index$/, "")
    .replace(/^\/+/, "");

  if (root === "public") {
    return cleanPath ? `/${cleanPath}` : "/";
  }
  return cleanPath ? `/p/${root}/${cleanPath}` : `/p/${root}`;
}

/* ══════════════════════════════════════════════════════════════
   PUBLIC API — all accept AccessContext
   ══════════════════════════════════════════════════════════════ */

/**
 * List accessible roots for the given user
 */
export function listRoots(ctx: AccessContext): RootMeta[] {
  const manifest = loadManifest();
  return manifest.roots.filter(
    (r) => r.isPublic || canAccess(ctx, r.name)
  );
}

/**
 * Get full tree for a root (filtered by access)
 * Returns null if no access
 */
export function getTree(rootId: string, ctx: AccessContext): TreeNode[] | null {
  if (!canAccess(ctx, rootId)) return null;
  const manifest = loadManifest();
  if (manifest.tree && manifest.tree[rootId]) {
    return manifest.tree[rootId];
  }
  return Object.values(manifest.nodes).filter(
    (n) => n.root === rootId && !n.hidden
  );
}

/**
 * Get a single rendered page
 * Returns null for both "not found" and "no access" (ضد نشتی)
 */
export async function getPage(
  urlPath: string,
  ctx: AccessContext
): Promise<Page | null> {
  const manifest = loadManifest();

  // Find node by urlPath
  const node = Object.values(manifest.nodes).find(
    (n) => n.urlPath === urlPath
  );

  if (!node) return null;
  if (!canAccess(ctx, node.root)) return null;
  if (node.draft && node.root === "public") return null;

  // Try pre-rendered HTML from out/
  const safeId = node.id.replace(/\//g, "_").replace(/\.md$/, "");
  const safePrivateId = node.id
    .replace(`${node.root}/`, "")
    .replace(/\//g, "_")
    .replace(/\.md$/, "");

  let htmlPath =
    node.root === "public"
      ? path.join(getOutPublic(), "pages", `${safeId}.html`)
      : path.join(getOutPrivate(), node.root, "pages", `${safePrivateId}.html`);

  if (!fs.existsSync(htmlPath)) {
    const indexSafePath =
      node.root === "public"
        ? path.join(getOutPublic(), "pages", `${safeId}_index.html`)
        : path.join(getOutPrivate(), node.root, "pages", `${safePrivateId}_index.html`);
    if (fs.existsSync(indexSafePath)) {
      htmlPath = indexSafePath;
    }
  }

  let html = "";
  let headings = node.headings;

  if (fs.existsSync(htmlPath)) {
    html = fs.readFileSync(htmlPath, "utf8");
  } else {
    // Dev fallback: render on demand
    let fullDocPath = path.isAbsolute(node.path)
      ? node.path
      : path.join(
          getDocsDir(),
          node.path.startsWith(node.root) ? node.path : `${node.root}/${node.path}`
        );
    if (!fs.existsSync(fullDocPath)) return null;

    if (fs.statSync(fullDocPath).isDirectory()) {
      const indexMd = path.join(fullDocPath, "index.md");
      const readmeMd = path.join(fullDocPath, "README.md");
      if (fs.existsSync(indexMd)) {
        fullDocPath = indexMd;
      } else if (fs.existsSync(readmeMd)) {
        fullDocPath = readmeMd;
      } else {
        return null;
      }
    }

    try {
      const fileContent = fs.readFileSync(fullDocPath, "utf8");
      const { content } = matter(fileContent);
      const rendered = await renderMarkdown(content);
      html = rendered.html;
      headings = rendered.headings;
    } catch {
      return null;
    }
  }

  // Calculate prev and next pages in the same root
  const siblingNodes = Object.values(manifest.nodes)
    .filter((n) => n.root === node.root && n.kind === "file" && !n.hidden && !n.draft)
    .sort((a, b) => a.order - b.order);

  const currentIndex = siblingNodes.findIndex((n) => n.id === node.id);
  const prevNode = currentIndex > 0 ? siblingNodes[currentIndex - 1] : undefined;
  const nextNode =
    currentIndex >= 0 && currentIndex < siblingNodes.length - 1
      ? siblingNodes[currentIndex + 1]
      : undefined;

  return {
    id: node.id,
    root: node.root,
    title: node.title,
    description: node.description,
    icon: node.icon,
    tags: node.tags,
    headings,
    html,
    rawMarkdown: "", // filled by raw endpoint
    draft: node.draft,
    hidden: node.hidden,
    updatedAt: node.updatedAt,
    urlPath: node.urlPath,
    prevPage: prevNode ? { title: prevNode.title, urlPath: prevNode.urlPath } : undefined,
    nextPage: nextNode ? { title: nextNode.title, urlPath: nextNode.urlPath } : undefined,
  };
}

/**
 * Get public sitemap entries (no ctx needed — only public)
 */
export function getPublicSitemap(): SitemapEntry[] {
  const manifest = loadManifest();
  return Object.values(manifest.nodes)
    .filter((n) => n.root === "public" && !n.hidden && !n.draft)
    .map((n) => {
      const rawDate = n.updatedAt as unknown;
      let lastmod: string | undefined;
      if (rawDate instanceof Date) {
        lastmod = rawDate.toISOString();
      } else if (typeof rawDate === "string" && rawDate.trim()) {
        try {
          lastmod = new Date(rawDate).toISOString();
        } catch {
          lastmod = rawDate;
        }
      }
      return {
        url: n.urlPath,
        lastmod,
        changefreq: "weekly",
        priority: n.urlPath === "/" ? 1 : 0.8,
      };
    });
}
