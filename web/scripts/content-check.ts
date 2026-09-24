/**
 * scripts/content-check.ts
 * Validates docs/ without building
 * Run in CI: pnpm content:check
 */
import path from "node:path";
import fs from "node:fs";
import matter from "gray-matter";
import { FrontMatterSchema } from "../src/server/content/types";

const DOCS_DIR = path.resolve(__dirname, "../../docs");
let errors = 0;
let warnings = 0;

function err(msg: string) { console.error(`\x1b[31m✗\x1b[0m ${msg}`); errors++; }
function warn(msg: string) { console.warn(`\x1b[33m⚠\x1b[0m ${msg}`); warnings++; }

const PUBLIC_ROOTS = new Set(["public"]);

function check() {
  if (!fs.existsSync(DOCS_DIR)) {
    err(`docs/ not found: ${DOCS_DIR}`);
    process.exit(1);
  }

  const roots = fs.readdirSync(DOCS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory()).map((d) => d.name);

  const allSlugs = new Map<string, string>(); // slug → file path

  for (const root of roots) {
    const rootDir = path.join(DOCS_DIR, root);
    if (!fs.existsSync(path.join(rootDir, "index.md"))) {
      warn(`No index.md in root: ${root}`);
    }
    checkDir(rootDir, root, allSlugs);
  }

  console.log(
    `\nContent check: ${errors} errors, ${warnings} warnings\n`
  );
  if (errors > 0) process.exit(1);
}

function checkDir(
  dir: string,
  root: string,
  allSlugs: Map<string, string>
) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!fs.existsSync(path.join(full, "index.md"))) {
        warn(`No index.md in folder: ${full}`);
      }
      checkDir(full, root, allSlugs);
    } else if (entry.name.endsWith(".md")) {
      checkFile(full, root, allSlugs);
    } else if (!/\.(png|jpg|jpeg|webp|svg|gif|pdf|mp4)$/i.test(entry.name)) {
      warn(`Non-Markdown, non-attachment file ignored: ${full}`);
    }
  }
}

function checkFile(
  filePath: string,
  root: string,
  allSlugs: Map<string, string>
) {
  const content = fs.readFileSync(filePath, "utf8");
  const { data, content: body } = matter(content);

  // Validate front matter
  const result = FrontMatterSchema.safeParse(data);
  if (!result.success) {
    err(`Invalid front matter in ${filePath}: ${result.error.message}`);
    return;
  }

  // Check slug uniqueness
  const rawName = path.basename(filePath, ".md").replace(/^\d+-/, "");
  const slug = result.data.slug ?? rawName;
  const slugKey = `${root}/${slug}`;
  if (allSlugs.has(slugKey)) {
    err(`Duplicate slug "${slug}" in root "${root}": ${filePath} vs ${allSlugs.get(slugKey)}`);
  } else {
    allSlugs.set(slugKey, filePath);
  }

  // Check for links from public to private roots
  if (root === "public") {
    const privateLinks = body.match(/\[.*?\]\(\/p\/[^)]+\)/g);
    if (privateLinks) {
      for (const link of privateLinks) {
        err(`Public page links to private route: ${filePath}: ${link}`);
      }
    }
  }
}

check();
