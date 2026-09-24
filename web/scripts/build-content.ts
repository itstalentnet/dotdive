/**
 * scripts/build-content.ts
 * Content build pipeline — Hierarchical Tree & Markdown Compiler
 * Scans docs/, builds tree hierarchy per folder (using README.md or index.md as folder index),
 * validates, renders Markdown, outputs to out/public and out/private/<root>
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import matter from "gray-matter";
import { FrontMatterSchema } from "../src/server/content/types";
import { renderMarkdown } from "../src/server/content/markdown";
import type {
  ContentManifest,
  TreeNode,
  RootMeta,
  SearchRecord,
  Heading,
  FrontMatter,
} from "../src/server/content/types";
import { normalizePersian } from "../src/server/search/persian";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.resolve(__dirname, "../../docs");
const OUT_PUBLIC = path.resolve(__dirname, "../out/public");
const OUT_PRIVATE = path.resolve(__dirname, "../out/private");

let errorCount = 0;
let warnCount = 0;

function error(msg: string) {
  console.error(`\x1b[31m✗ ERROR:\x1b[0m ${msg}`);
  errorCount++;
}
function warn(msg: string) {
  console.warn(`\x1b[33m⚠ WARN:\x1b[0m ${msg}`);
  warnCount++;
}
function info(msg: string) {
  console.log(`\x1b[36m•\x1b[0m ${msg}`);
}

const FOLDER_TITLE_FALLBACKS: Record<string, string> = {
  team: "تیم‌ها",
  backend: "بک‌اند",
  frontend: "فرانت‌اند",
  platform: "پلتفرم",
  devops: "دواپس",
  branding: "برندینگ",
  seo: "سئو",
  support: "پشتیبانی",
  adr: "تصمیمات معماری (ADR)",
  ADR: "تصمیمات معماری (ADR)",
  diagram: "دیاگرام‌ها",
  diagrams: "دیاگرام‌ها",
  services: "سرویس‌ها",
  standard: "استانداردها",
  standards: "استانداردها",
  package: "پکیج‌ها",
  packages: "پکیج‌ها",
  api: "رابط‌های برنامه‌نویسی (API)",
  core: "هسته (Core)",
  gateway: "گیت‌وی (Gateway)",
  "get-started": "شروع به کار",
  architecture: "معماری",
  "design-system": "سیستم دیزاین",
  docs: "مستندات عمومی",
  blog: "وبلاگ",
  modules: "ماژول‌ها",
  roadmap: "نقشه راه",
  templates: "قالب‌ها",
  decisions: "تصمیمات",
};

/* ── Main ────────────────────────────────────────────────────── */
async function main() {
  console.log("\n\x1b[1m🏗  dotdive hierarchical content build\x1b[0m\n");

  if (!fs.existsSync(DOCS_DIR)) {
    error(`docs/ directory not found: ${DOCS_DIR}`);
    process.exit(1);
  }

  // Clean output
  fs.rmSync(OUT_PUBLIC, { recursive: true, force: true });
  fs.rmSync(OUT_PRIVATE, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT_PUBLIC, "pages"), { recursive: true });
  fs.mkdirSync(path.join(OUT_PRIVATE), { recursive: true });

  const roots = fs
    .readdirSync(DOCS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const manifest: ContentManifest = {
    buildTime: new Date().toISOString(),
    roots: [],
    nodes: {},
    tree: {},
  };

  const publicSearchRecords: SearchRecord[] = [];
  const privateSearchRecords: Record<string, SearchRecord[]> = {};

  for (const rootName of roots) {
    info(`Processing root: ${rootName}`);
    const rootDir = path.join(DOCS_DIR, rootName);
    const isPublic = rootName === "public";

    // Read root index
    let indexPath = path.join(rootDir, "index.md");
    if (!fs.existsSync(indexPath)) {
      const readmePath = path.join(rootDir, "README.md");
      if (fs.existsSync(readmePath)) indexPath = readmePath;
    }

    let rootMeta: RootMeta = {
      name: rootName,
      title: rootName,
      isPublic,
    };

    if (fs.existsSync(indexPath)) {
      const { data, content: body } = matter(fs.readFileSync(indexPath, "utf8"));
      const fm = FrontMatterSchema.safeParse(data);
      if (fm.success) {
        rootMeta = {
          ...rootMeta,
          title: fm.data.title ?? extractDocTitle(body, undefined, rootName),
          description: fm.data.description,
          icon: fm.data.icon,
        };
      }
    }

    manifest.roots.push(rootMeta);

    if (!isPublic) {
      privateSearchRecords[rootName] = [];
      fs.mkdirSync(path.join(OUT_PRIVATE, rootName, "pages"), { recursive: true });
    }

    const currentSearch = isPublic ? publicSearchRecords : privateSearchRecords[rootName];

    // Scan directory hierarchically
    const rootTreeResult = await scanDirectoryHierarchical(
      rootDir,
      "",
      rootName,
      rootDir,
      isPublic,
      manifest,
      currentSearch
    );

    manifest.tree![rootName] = Array.isArray(rootTreeResult)
      ? rootTreeResult
      : [rootTreeResult];
  }

  // Write manifest
  fs.writeFileSync(
    path.join(OUT_PUBLIC, "_manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  // Write public search index
  fs.writeFileSync(
    path.join(OUT_PUBLIC, "_search.json"),
    JSON.stringify(publicSearchRecords, null, 2)
  );

  // Write private search indexes
  for (const [rootName, records] of Object.entries(privateSearchRecords)) {
    fs.writeFileSync(
      path.join(OUT_PRIVATE, rootName, "_search.json"),
      JSON.stringify(records, null, 2)
    );
  }

  console.log(
    `\n✅ Build complete — ${Object.keys(manifest.nodes).length} nodes, ` +
    `${errorCount} errors, ${warnCount} warnings\n`
  );

  if (errorCount > 0) {
    process.exit(1);
  }
}

/* ── Hierarchical Directory Scanner ───────────────────────────── */
async function scanDirectoryHierarchical(
  dirPath: string,
  relDirPath: string,
  rootName: string,
  rootDir: string,
  isPublic: boolean,
  manifest: ContentManifest,
  searchRecords: SearchRecord[]
): Promise<TreeNode | TreeNode[]> {
  const entries = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((e) => !e.name.startsWith("."));

  const subdirs = entries.filter((e) => e.isDirectory());
  const mdFileEntries = entries.filter(
    (e) => e.isFile() && e.name.endsWith(".md") && !e.name.startsWith("_")
  );

  // Check for index file: index.md takes precedence, then README.md, then readme.md
  let indexFileEntry = mdFileEntries.find((e) => e.name === "index.md");
  if (!indexFileEntry) {
    indexFileEntry = mdFileEntries.find((e) => e.name === "README.md");
  }
  if (!indexFileEntry) {
    indexFileEntry = mdFileEntries.find((e) => e.name.toLowerCase() === "readme.md");
  }

  const childNodes: TreeNode[] = [];

  // 1. Process child markdown files (excluding the index file and redundant readme)
  for (const file of mdFileEntries) {
    if (indexFileEntry && file.name === indexFileEntry.name) {
      continue; // Handled as the folder document or root index
    }
    if (
      indexFileEntry &&
      indexFileEntry.name === "index.md" &&
      file.name.toLowerCase() === "readme.md"
    ) {
      continue; // Skip redundant readme when index.md is present
    }

    const filePath = path.join(dirPath, file.name);
    const fileRelPath = relDirPath ? `${relDirPath}/${file.name}` : file.name;
    const fileNode = await processFile(
      filePath,
      fileRelPath,
      rootName,
      rootDir,
      isPublic,
      manifest,
      searchRecords
    );
    if (fileNode) {
      childNodes.push(fileNode);
    }
  }

  // 2. Process child subdirectories recursively
  for (const dir of subdirs) {
    const subDirPath = path.join(dirPath, dir.name);
    const subRelDirPath = relDirPath ? `${relDirPath}/${dir.name}` : dir.name;
    const subFolderResult = await scanDirectoryHierarchical(
      subDirPath,
      subRelDirPath,
      rootName,
      rootDir,
      isPublic,
      manifest,
      searchRecords
    );
    if (Array.isArray(subFolderResult)) {
      childNodes.push(...subFolderResult);
    } else if (subFolderResult) {
      childNodes.push(subFolderResult);
    }
  }

  // Sort child nodes by order then Persian title
  childNodes.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title, "fa");
  });

  // 3. If relDirPath === "" (Root directory of the project)
  if (relDirPath === "") {
    const rootTree: TreeNode[] = [];

    if (indexFileEntry) {
      const rootIndexFile = path.join(dirPath, indexFileEntry.name);
      const rootIndexNode = await processFile(
        rootIndexFile,
        indexFileEntry.name,
        rootName,
        rootDir,
        isPublic,
        manifest,
        searchRecords,
        true // isRootIndex
      );
      if (rootIndexNode) {
        // Add root overview page at the top for private roots
        if (!isPublic) {
          rootIndexNode.order = -1;
          rootTree.push(rootIndexNode);
        }
      }
    }

    rootTree.push(...childNodes);
    return rootTree;
  }

  // 4. If relDirPath !== "" (Subfolder)
  if (!indexFileEntry && childNodes.length === 0) {
    return [];
  }

  const dirBaseName = path.basename(relDirPath);
  let folderTitle =
    FOLDER_TITLE_FALLBACKS[dirBaseName] ??
    FOLDER_TITLE_FALLBACKS[dirBaseName.toLowerCase()] ??
    dirBaseName.replace(/^\d+-/, "");
  let folderDesc: string | undefined;
  let folderIcon: string | undefined;
  let folderOrder = extractNumericPrefix(dirBaseName);
  let folderHidden = false;
  let folderDraft = false;
  let folderTags: string[] = [];
  let folderHeadings: Heading[] = [];
  let folderUrlPath = "";
  let folderPath = relDirPath;
  let folderUpdatedAt: Date | undefined;

  if (indexFileEntry) {
    const indexFilePath = path.join(dirPath, indexFileEntry.name);
    const indexFileRelPath = `${relDirPath}/${indexFileEntry.name}`;
    const rawContent = fs.readFileSync(indexFilePath, "utf8");
    const { data, content: body } = matter(rawContent);
    const fm = FrontMatterSchema.safeParse(data);
    const fmData: Partial<FrontMatter> = fm.success ? fm.data : {};

    folderTitle = extractDocTitle(body, fmData.title, dirBaseName);
    folderDesc = extractDocDescription(body, fmData.description);
    folderIcon = fmData.icon;
    if (fmData.order !== undefined) folderOrder = fmData.order;
    folderHidden = fmData.hidden ?? false;
    folderDraft = fmData.draft ?? false;
    folderTags = fmData.tags ?? [];
    folderPath = `${rootName}/${indexFileRelPath}`;
    folderUrlPath = buildUrlPath(rootName, relDirPath);

    try {
      const gitDate = execSync(
        `git log -1 --format=%ci -- "${indexFilePath}"`,
        { cwd: DOCS_DIR, stdio: ["pipe", "pipe", "pipe"] }
      ).toString().trim();
      if (gitDate) folderUpdatedAt = new Date(gitDate);
    } catch {}

    // Render markdown for this folder page
    const { html, headings } = await renderMarkdown(body);
    folderHeadings = headings;

    // Save HTML for folder document with both folder id and index file id
    const folderSafeId = `${rootName}/${relDirPath}`.replace(/\//g, "_");
    const indexSafeId = `${rootName}/${indexFileRelPath}`.replace(/\//g, "_").replace(/\.md$/, "");

    if (isPublic) {
      fs.writeFileSync(path.join(OUT_PUBLIC, "pages", `${folderSafeId}.html`), html);
      fs.writeFileSync(path.join(OUT_PUBLIC, "pages", `${indexSafeId}.html`), html);
      const rawMdPath = path.join(OUT_PUBLIC, folderUrlPath.replace(/^\//, "") + ".md");
      fs.mkdirSync(path.dirname(rawMdPath), { recursive: true });
      fs.writeFileSync(rawMdPath, rawContent);
    } else {
      const privateFolderId = relDirPath.replace(/\//g, "_");
      const privateIndexId = indexFileRelPath.replace(/\//g, "_").replace(/\.md$/, "");
      fs.writeFileSync(
        path.join(OUT_PRIVATE, rootName, "pages", `${privateFolderId}.html`),
        html
      );
      fs.writeFileSync(
        path.join(OUT_PRIVATE, rootName, "pages", `${privateIndexId}.html`),
        html
      );
    }

    // Add search record for the folder's index page
    const nodeId = `${rootName}/${indexFileRelPath}`;
    if (!folderHidden && !(folderDraft && isPublic)) {
      searchRecords.push({
        id: `${nodeId}#`,
        pageId: nodeId,
        root: rootName,
        title: folderTitle,
        heading: folderTitle,
        anchor: "",
        content: normalizePersian(body.slice(0, 500)),
        tags: folderTags,
        urlPath: folderUrlPath,
        boost: 6,
      });

      for (const h of headings) {
        searchRecords.push({
          id: `${nodeId}#${h.id}`,
          pageId: nodeId,
          root: rootName,
          title: folderTitle,
          heading: h.text,
          anchor: h.id,
          content: normalizePersian(extractSectionContent(body, h.text)),
          tags: folderTags,
          urlPath: `${folderUrlPath}#${h.id}`,
          boost: h.level === 2 ? 3 : 2,
        });
      }
    }
  }

  const folderNodeId = `${rootName}/${relDirPath}`;
  const folderNode: TreeNode = {
    id: folderNodeId,
    kind: "folder",
    title: folderTitle,
    slug: dirBaseName,
    path: folderPath,
    urlPath: folderUrlPath,
    root: rootName,
    icon: folderIcon,
    order: folderOrder,
    hidden: folderHidden,
    draft: folderDraft,
    description: folderDesc,
    tags: folderTags,
    headings: folderHeadings,
    children: childNodes,
    updatedAt: folderUpdatedAt,
  };

  manifest.nodes[folderNodeId] = folderNode;
  if (indexFileEntry) {
    const indexNodeId = `${rootName}/${relDirPath}/${indexFileEntry.name}`;
    manifest.nodes[indexNodeId] = folderNode;
  }

  return folderNode;
}

/* ── Process a single Markdown file ─────────────────────────── */
async function processFile(
  mdPath: string,
  relPath: string,
  rootName: string,
  rootDir: string,
  isPublic: boolean,
  manifest: ContentManifest,
  searchRecords: SearchRecord[],
  isRootIndex = false
): Promise<TreeNode | null> {
  const content = fs.readFileSync(mdPath, "utf8");
  const { data, content: body } = matter(content);

  const fmResult = FrontMatterSchema.safeParse(data);
  const fm: Partial<FrontMatter> = fmResult.success ? fmResult.data : {};

  if (fm.draft && isPublic) return null;

  const rawName = path.basename(mdPath, ".md").replace(/^\d+-/, "");
  const title = isRootIndex
    ? (fm.title ?? "نمای کلی")
    : extractDocTitle(body, fm.title, rawName);
  const description = extractDocDescription(body, fm.description);

  let updatedAt: Date | undefined = fm.updated;
  if (!updatedAt) {
    try {
      const gitDate = execSync(
        `git log -1 --format=%ci -- "${mdPath}"`,
        { cwd: DOCS_DIR, stdio: ["pipe", "pipe", "pipe"] }
      ).toString().trim();
      if (gitDate) updatedAt = new Date(gitDate);
    } catch {}
  }

  const urlPath = buildUrlPath(rootName, relPath);
  const { html, headings } = await renderMarkdown(body);

  const nodeId = `${rootName}/${relPath}`;
  const safeId = nodeId.replace(/\//g, "_").replace(/\.md$/, "");

  if (isPublic) {
    fs.writeFileSync(path.join(OUT_PUBLIC, "pages", `${safeId}.html`), html);
    const rawMdPath = path.join(OUT_PUBLIC, urlPath.replace(/^\//, "") + ".md");
    fs.mkdirSync(path.dirname(rawMdPath), { recursive: true });
    fs.writeFileSync(rawMdPath, content);
  } else {
    fs.writeFileSync(
      path.join(OUT_PRIVATE, rootName, "pages", `${safeId.replace(`${rootName}_`, "")}.html`),
      html
    );
  }

  const node: TreeNode = {
    id: nodeId,
    kind: "file",
    title,
    slug: fm.slug ?? rawName,
    path: relPath,
    urlPath,
    root: rootName,
    icon: fm.icon,
    order: fm.order ?? (isRootIndex ? -1 : extractNumericPrefix(path.basename(mdPath))),
    hidden: fm.hidden ?? false,
    draft: fm.draft ?? false,
    description,
    tags: fm.tags ?? [],
    headings,
    children: [],
    updatedAt,
  };

  manifest.nodes[nodeId] = node;

  if (!node.hidden) {
    searchRecords.push({
      id: `${nodeId}#`,
      pageId: nodeId,
      root: rootName,
      title,
      heading: title,
      anchor: "",
      content: normalizePersian(body.slice(0, 500)),
      tags: node.tags,
      urlPath,
      boost: isRootIndex ? 5 : 4,
    });

    for (const h of headings) {
      searchRecords.push({
        id: `${nodeId}#${h.id}`,
        pageId: nodeId,
        root: rootName,
        title,
        heading: h.text,
        anchor: h.id,
        content: normalizePersian(extractSectionContent(body, h.text)),
        tags: node.tags,
        urlPath: `${urlPath}#${h.id}`,
        boost: h.level === 2 ? 3 : 2,
      });
    }
  }

  return node;
}

/* ── Helpers ─────────────────────────────────────────────────── */
function buildUrlPath(root: string, relPath: string): string {
  const clean = relPath
    .replace(/\.md$/, "")
    .replace(/\/index$/, "")
    .replace(/\/?\d+-/g, "/")
    .replace(/^index$/, "");

  if (root === "public") return clean ? `/${clean}` : "/";
  return clean ? `/p/${root}/${clean}` : `/p/${root}`;
}

function extractDocTitle(body: string, fmTitle?: string, fallback = ""): string {
  if (fmTitle && fmTitle.trim()) return fmTitle.trim();
  const tableFaMatch = body.match(/\*\*Title\s*\((?:FA|fa)\)\*\*\s*\|\s*([^|\n]+)/);
  if (tableFaMatch?.[1]?.trim()) return tableFaMatch[1].trim();
  const headingMatch = body.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]?.trim()) {
    return headingMatch[1].replace(/[*_`\[\]]/g, "").trim();
  }
  if (fallback) {
    const clean = fallback.replace(/^\d+-/, "").replace(/\.md$/, "");
    return (
      FOLDER_TITLE_FALLBACKS[clean] ??
      FOLDER_TITLE_FALLBACKS[clean.toLowerCase()] ??
      clean
    );
  }
  return "بدون عنوان";
}

function extractDocDescription(body: string, fmDesc?: string): string | undefined {
  if (fmDesc && fmDesc.trim()) return fmDesc.trim();
  const tableFaSummary = body.match(/\*\*Summary\s*\((?:FA|fa)\)\*\*\s*\|\s*([^|\n]+)/);
  if (tableFaSummary?.[1]?.trim()) return tableFaSummary[1].trim();
  return undefined;
}

function extractNumericPrefix(name: string): number {
  return parseInt(name.match(/^(\d+)/)?.[1] ?? "999");
}

function extractSectionContent(body: string, heading: string): string {
  const idx = body.indexOf(heading);
  if (idx === -1) return body.slice(0, 300);
  return body.slice(idx, idx + 300);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
