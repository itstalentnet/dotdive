import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import matter from "gray-matter";
import { ProjectIndex, DocFile } from "./types.js";

function extractHeadings(content: string): string[] {
  const headingRegex = /^#{1,6}\s+(.+)$/gm;
  const headings: string[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push(match[1].trim());
  }
  return headings;
}

function extractTitle(content: string, filePath: string): string {
  const frontmatterMatch = content.match(/^---[\s\S]*?---/);
  if (frontmatterMatch) {
    const { data } = matter(frontmatterMatch[0]);
    if (data.title) return data.title;
  }
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  return filePath.split("/").pop()?.replace(".md", "") || "Untitled";
}

async function scanProject(projectDir: string, projectSlug: string): Promise<ProjectIndex> {
  const files: DocFile[] = [];

  async function walk(dir: string, baseDir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath = relative(baseDir, fullPath);
      if (entry.isDirectory()) {
        await walk(fullPath, baseDir);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const content = await readFile(fullPath, "utf-8");
        const { content: mdContent } = matter(content);
        const title = extractTitle(content, relPath);
        const headings = extractHeadings(mdContent);
        files.push({
          path: relPath,
          title,
          headings,
          content: mdContent,
        });
      }
    }
  }

  await walk(projectDir, projectDir);

  let title = projectSlug;
  let description = "";
  const indexFile = files.find((f) => f.path === "index.md");
  if (indexFile) {
    title = indexFile.title;
    const firstPara = indexFile.content.split("\n\n")[0];
    description = firstPara.replace(/[#*`]/g, "").trim().slice(0, 200);
  }

  return { slug: projectSlug, title, description, files };
}

export async function buildIndex(docsRoot: string, allowedProjects: string[] = []): Promise<Map<string, ProjectIndex>> {
  const resolvedRoot = resolve(docsRoot);
  const entries = await readdir(resolvedRoot, { withFileTypes: true });
  const index = new Map<string, ProjectIndex>();

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;
    if (allowedProjects.length > 0 && !allowedProjects.includes(entry.name)) continue;

    const projectDir = join(resolvedRoot, entry.name);
    const projectIndex = await scanProject(projectDir, entry.name);
    index.set(entry.name, projectIndex);
  }

  return index;
}