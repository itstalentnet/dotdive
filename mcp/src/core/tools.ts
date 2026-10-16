import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mkdir, writeFile, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { ProjectIndex } from "./types.js";
import { searchIndex } from "./search.js";
import { reindexProject } from "./indexer.js";

export type ToolContext = {
  index: Map<string, ProjectIndex>;
  allowedProjects: string[];
  docsRoot?: string;
  canWrite?: boolean;
};

function filterProjects(index: Map<string, ProjectIndex>, allowed: string[]): ProjectIndex[] {
  if (allowed.length === 0 || allowed.includes("*")) return Array.from(index.values());
  return allowed.map((slug) => index.get(slug)).filter((p): p is ProjectIndex => p !== undefined);
}

function getProject(index: Map<string, ProjectIndex>, slug: string, allowed: string[]): ProjectIndex | null {
  if (allowed.length > 0 && !allowed.includes("*") && !allowed.includes(slug)) return null;
  return index.get(slug) || null;
}

function resolveDocPath(docsRoot: string, project: string, relPath: string): string {
  if (relPath.includes("..")) {
    throw new Error("Invalid document path: path traversal is prohibited");
  }
  const cleanPath = relPath.replace(/^[/\\]+/, "");
  const target = resolve(docsRoot, project, cleanPath);
  const projectDir = resolve(docsRoot, project);
  if (!target.startsWith(projectDir)) {
    throw new Error("Invalid document path: path traversal is prohibited");
  }
  return target;
}

function stripMetadataHeader(content: string): string {
  // Strip markdown metadata tables: | فیلد / Field | مقدار / Value | ...
  return content.replace(/^\|[^\n]+\|\n\|[\s:\-|]+\|\n(\|[\s\S]+?\|\n)+\n*/m, "").trim();
}

function extractSection(content: string, sectionQuery: string): string | null {
  const lines = content.split("\n");
  const headingRegex = /^(#{1,6})\s+(.+)$/;
  let targetLevel = 0;
  let startIndex = -1;
  let endIndex = lines.length;
  const q = sectionQuery.toLowerCase().trim();

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(headingRegex);
    if (match) {
      const headingText = match[2].toLowerCase();
      if (startIndex === -1 && headingText.includes(q)) {
        targetLevel = match[1].length;
        startIndex = i;
      } else if (startIndex !== -1 && match[1].length <= targetLevel) {
        endIndex = i;
        break;
      }
    }
  }

  if (startIndex === -1) return null;
  return lines.slice(startIndex, endIndex).join("\n").trim();
}

export function registerTools(server: McpServer, context: ToolContext): void {
  const { index, allowedProjects, docsRoot, canWrite } = context;

  server.tool(
    "list_projects",
    "List all available documentation projects",
    {},
    async () => {
      const projects = filterProjects(index, allowedProjects).map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
      };
    }
  );

  server.tool(
    "get_project_docs",
    "Get documents in a project, optionally filtered by folder/category to save tokens",
    {
      project: z.string().describe("Project slug (e.g., 'lemmo')"),
      folder: z.string().optional().describe("Optional folder/category filter (e.g., '01-architecture', '02-frontend', '03-backend', '07-devops')"),
      compact: z.boolean().optional().default(true).describe("Return compact text format to save tokens (default: true)"),
    },
    async ({ project, folder, compact }) => {
      const proj = getProject(index, project, allowedProjects);
      if (!proj) {
        return {
          content: [{ type: "text", text: `Project '${project}' not found or access denied` }],
          isError: true,
        };
      }

      let files = proj.files;
      if (folder) {
        const cleanFolder = folder.replace(/^[/\\]+/, "").replace(/[/\\]+$/, "");
        files = files.filter((f) => f.path.startsWith(cleanFolder));
      }

      if (compact) {
        const lines = files.map((f) => `- ${f.path}: ${f.title}`);
        const header = `Project '${project}'${folder ? ` [folder: ${folder}]` : ""}: ${files.length} document(s)\n`;
        return {
          content: [{ type: "text", text: header + lines.join("\n") }],
        };
      }

      const tree = files.map((f) => ({ path: f.path, title: f.title }));
      return {
        content: [{ type: "text", text: JSON.stringify(tree, null, 2) }],
      };
    }
  );

  server.tool(
    "read_doc",
    "Read document content. Supports reading specific sections or line ranges to minimize token consumption.",
    {
      project: z.string().describe("Project slug (e.g., 'lemmo')"),
      path: z.string().describe("Document path within the project (e.g., '01-architecture/index.md')"),
      section: z.string().optional().describe("Optional heading/section to extract (e.g. 'Authentication', 'Architecture'). Saves tokens by returning only that section."),
      strip_metadata: z.boolean().optional().default(true).describe("Strip repetitive metadata header table to save tokens (default: true)"),
      start_line: z.number().optional().describe("Start line (1-indexed, optional)"),
      max_lines: z.number().optional().describe("Maximum lines to return (optional)"),
    },
    async ({ project, path, section, strip_metadata, start_line, max_lines }) => {
      const proj = getProject(index, project, allowedProjects);
      if (!proj) {
        return {
          content: [{ type: "text", text: `Project '${project}' not found or access denied` }],
          isError: true,
        };
      }
      const file = proj.files.find((f) => f.path === path);
      if (!file) {
        return {
          content: [{ type: "text", text: `Document '${path}' not found in project '${project}'` }],
          isError: true,
        };
      }

      let textContent = file.content;
      if (strip_metadata) {
        textContent = stripMetadataHeader(textContent);
      }

      if (section && section.trim()) {
        const extracted = extractSection(textContent, section);
        if (extracted) {
          return {
            content: [{ type: "text", text: `# ${file.title} > Section: ${section}\n\n${extracted}` }],
          };
        }
      }

      if (typeof start_line === "number" || typeof max_lines === "number") {
        const lines = textContent.split("\n");
        const start = typeof start_line === "number" && start_line > 0 ? start_line - 1 : 0;
        const count = typeof max_lines === "number" && max_lines > 0 ? max_lines : lines.length;
        textContent = lines.slice(start, start + count).join("\n");
      }

      return {
        content: [{ type: "text", text: `# ${file.title}\n\n${textContent}` }],
      };
    }
  );

  server.tool(
    "search_docs",
    "Search across documentation with relevance ranking, project/folder filtering, and result limits",
    {
      query: z.string().describe("Search query keywords"),
      project: z.string().optional().describe("Project slug (e.g., 'lemmo')"),
      folder: z.string().optional().describe("Folder/category filter (e.g. '01-architecture', '02-frontend', '03-backend')"),
      limit: z.number().optional().default(5).describe("Max results to return (default: 5, max: 20) to save tokens"),
    },
    async ({ query, project, folder, limit }) => {
      const results = searchIndex(index, query, {
        project,
        folder,
        limit,
        allowedProjects,
      });

      if (results.length === 0) {
        return {
          content: [{ type: "text", text: `No documents found matching '${query}'` }],
        };
      }

      // Compact representation to save tokens
      const formatted = results.map((r, i) => `${i + 1}. [${r.project}] ${r.path} — ${r.title}\n   Snippet: ${r.snippet}`);
      return {
        content: [{ type: "text", text: `Found ${results.length} relevant document(s):\n\n` + formatted.join("\n\n") }],
      };
    }
  );

  if (canWrite && docsRoot) {
    server.tool(
      "write_doc",
      "Create a new documentation file or overwrite an existing one",
      {
        project: z.string().describe("Project slug (e.g., 'lemmo')"),
        path: z.string().describe("Relative document path (e.g., '01-architecture/new-doc.md')"),
        content: z.string().describe("Markdown content of the document"),
      },
      async ({ project, path, content }) => {
        if (allowedProjects.length > 0 && !allowedProjects.includes("*") && !allowedProjects.includes(project)) {
          return {
            content: [{ type: "text", text: `Permission denied: access to project '${project}' is not allowed` }],
            isError: true,
          };
        }

        try {
          const filePath = resolveDocPath(docsRoot, project, path);
          await mkdir(dirname(filePath), { recursive: true });
          await writeFile(filePath, content, "utf-8");
          await reindexProject(docsRoot, project, index);

          return {
            content: [{ type: "text", text: `Successfully wrote document '${path}' in project '${project}'` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to write document: ${String(error)}` }],
            isError: true,
          };
        }
      }
    );

    server.tool(
      "update_doc",
      "Update the content of an existing documentation file",
      {
        project: z.string().describe("Project slug (e.g., 'lemmo')"),
        path: z.string().describe("Document path (e.g., '01-architecture/existing-doc.md')"),
        content: z.string().describe("New full markdown content of the document"),
      },
      async ({ project, path, content }) => {
        if (allowedProjects.length > 0 && !allowedProjects.includes("*") && !allowedProjects.includes(project)) {
          return {
            content: [{ type: "text", text: `Permission denied: access to project '${project}' is not allowed` }],
            isError: true,
          };
        }

        try {
          const filePath = resolveDocPath(docsRoot, project, path);
          await stat(filePath);
          await writeFile(filePath, content, "utf-8");
          await reindexProject(docsRoot, project, index);

          return {
            content: [{ type: "text", text: `Successfully updated document '${path}' in project '${project}'` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to update document: ${String(error)}` }],
            isError: true,
          };
        }
      }
    );

    server.tool(
      "delete_doc",
      "Delete a documentation file",
      {
        project: z.string().describe("Project slug (e.g., 'lemmo')"),
        path: z.string().describe("Document path to delete"),
      },
      async ({ project, path }) => {
        if (allowedProjects.length > 0 && !allowedProjects.includes("*") && !allowedProjects.includes(project)) {
          return {
            content: [{ type: "text", text: `Permission denied: access to project '${project}' is not allowed` }],
            isError: true,
          };
        }

        try {
          const filePath = resolveDocPath(docsRoot, project, path);
          await rm(filePath, { force: true });
          await reindexProject(docsRoot, project, index);

          return {
            content: [{ type: "text", text: `Successfully deleted document '${path}' in project '${project}'` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to delete document: ${String(error)}` }],
            isError: true,
          };
        }
      }
    );
  }
}