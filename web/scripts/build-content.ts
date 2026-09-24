/**
 * scripts/build-content.ts
 * Content build pipeline — M1
 * Scans docs/, validates, renders Markdown,
 * outputs to out/public and out/private/<root>
 */
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import matter from "gray-matter";
import { FrontMatterSchema } from "../src/server/content/types";
import { renderMarkdown } from "../src/server/content/markdown";
import type {
  ContentManifest,
  TreeNode,
  RootMeta,
  SearchRecord,
} from "../src/server/content/types";
import { normalizePersian, tokenize } from "../src/server/search/persian";

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

/* ── Main ────────────────────────────────────────────────────── */
async function main() {
  console.log("\n\x1b[1m🏗  dotdive content build\x1b[0m\n");

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
  };

  const publicSearchRecords: SearchRecord[] = [];
  const privateSearchRecords: Record<string, SearchRecord[]> = {};

  for (const rootName of roots) {
    info(`Processing root: ${rootName}`);
    const rootDir = path.join(DOCS_DIR, rootName);
    const isPublic = rootName === "public";

    // Read root index
    const indexPath = path.join(rootDir, "index.md");
    let rootMeta: RootMeta = {
      name: rootName,
      title: rootName,
      isPublic,
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
      } else {
        warn(`Invalid front matter in ${indexPath}`);
      }
    } else {
      warn(`No index.md in root: ${rootName}`);
    }

    manifest.roots.push(rootMeta);

    if (!isPublic) {
      privateSearchRecords[rootName] = [];
      fs.mkdirSync(path.join(OUT_PRIVATE, rootName, "pages"), { recursive: true });
    }

    // Scan all Markdown files
    const mdFiles = findMarkdownFiles(rootDir);
    for (const mdPath of mdFiles) {
      await processFile(
        mdPath,
        rootName,
        rootDir,
        isPublic,
        manifest,
        isPublic ? publicSearchRecords : privateSearchRecords[rootName],
      );
    }
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
    `\n✅ Build complete — ${Object.keys(manifest.nodes).length} pages, ` +
    `${errorCount} errors, ${warnCount} warnings\n`
  );

  if (errorCount > 0) {
    process.exit(1);
  }
}

/* ── Process a single Markdown file ─────────────────────────── */
async function processFile(
  mdPath: string,
  rootName: string,
  rootDir: string,
  isPublic: boolean,
  manifest: ContentManifest,
  searchRecords: SearchRecord[],
) {
  const relPath = path.relative(rootDir, mdPath);
  const content = fs.readFileSync(mdPath, "utf8");
  const { data, content: body } = matter(content);

  const fmResult = FrontMatterSchema.safeParse(data);
  if (!fmResult.success) {
    error(`Invalid front matter in ${mdPath}: ${fmResult.error.message}`);
    return;
  }
  const fm = fmResult.data;

  // Skip drafts in public
  if (fm.draft && isPublic) return;

  // Extract title
  const titleFromHeading = body.match(/^#\s+(.+)$/m)?.[1] ?? "";
  const rawName = path.basename(mdPath, ".md").replace(/^\d+-/, "");
  const slug = fm.slug ?? rawName;
  const title = fm.title ?? titleFromHeading ?? rawName;

  // Get git last-modified date
  let updatedAt: Date | undefined = fm.updated;
  if (!updatedAt) {
    try {
      const gitDate = execSync(
        `git log -1 --format=%ci -- "${mdPath}"`,
        { cwd: DOCS_DIR, stdio: ["pipe", "pipe", "pipe"] }
      ).toString().trim();
      if (gitDate) updatedAt = new Date(gitDate);
    } catch {
      // Shallow clone — use build time
    }
  }

  // Build URL path
  const urlPath = buildUrlPath(rootName, relPath);

  // Render Markdown
  const { html, headings } = await renderMarkdown(body);

  // Save rendered HTML
  const nodeId = `${rootName}/${relPath}`;
  const safeId = nodeId.replace(/\//g, "_").replace(/\.md$/, "");

  if (isPublic) {
    fs.writeFileSync(path.join(OUT_PUBLIC, "pages", `${safeId}.html`), html);
    // Raw .md version
    const rawMdPath = path.join(OUT_PUBLIC, urlPath.replace(/^\//, "") + ".md");
    fs.mkdirSync(path.dirname(rawMdPath), { recursive: true });
    fs.writeFileSync(rawMdPath, content);
  } else {
    fs.writeFileSync(
      path.join(OUT_PRIVATE, rootName, "pages", `${safeId.replace(`${rootName}_`, "")}.html`),
      html
    );
  }

  // Build tree node
  const node: TreeNode = {
    id: nodeId,
    kind: relPath.endsWith("index.md") ? "folder" : "file",
    title,
    slug,
    path: relPath,
    urlPath,
    root: rootName,
    icon: fm.icon,
    order: fm.order ?? extractNumericPrefix(path.basename(mdPath)),
    hidden: fm.hidden,
    draft: fm.draft,
    description: fm.description,
    tags: fm.tags,
    headings,
    children: [],
    updatedAt,
  };

  manifest.nodes[nodeId] = node;

  // Build search records (one per section/heading)
  if (!fm.hidden) {
    // Page-level record
    searchRecords.push({
      id: `${nodeId}#`,
      pageId: nodeId,
      root: rootName,
      title,
      heading: title,
      anchor: "",
      content: normalizePersian(body.slice(0, 500)),
      tags: fm.tags,
      urlPath,
      boost: 5,
    });

    // Section records
    for (const h of headings) {
      searchRecords.push({
        id: `${nodeId}#${h.id}`,
        pageId: nodeId,
        root: rootName,
        title,
        heading: h.text,
        anchor: h.id,
        content: normalizePersian(extractSectionContent(body, h.text)),
        tags: fm.tags,
        urlPath: `${urlPath}#${h.id}`,
        boost: h.level === 2 ? 3 : 2,
      });
    }
  }
}

/* ── Helpers ─────────────────────────────────────────────────── */
function findMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findMarkdownFiles(full));
    else if (entry.name.endsWith(".md")) results.push(full);
  }
  return results;
}

function buildUrlPath(root: string, relPath: string): string {
  const clean = relPath
    .replace(/\.md$/, "")
    .replace(/\/index$/, "")
    .replace(/\/?\d+-/g, "/")
    .replace(/^index$/, "");

  if (root === "public") return `/${clean}`;
  return `/p/${root}/${clean}`;
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
