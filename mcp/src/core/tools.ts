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
    "Get the file tree for a specific project",
    { project: z.string().describe("Project slug (e.g., 'lemmo', 'nons')") },
    async ({ project }) => {
      const proj = getProject(index, project, allowedProjects);
      if (!proj) {
        return {
          content: [{ type: "text", text: `Project '${project}' not found or access denied` }],
          isError: true,
        };
      }
      const tree = proj.files.map((f) => ({ path: f.path, title: f.title }));
      return {
        content: [{ type: "text", text: JSON.stringify(tree, null, 2) }],
      };
    }
  );

  server.tool(
    "read_doc",
    "Read the full content of a specific document",
    {
      project: z.string().describe("Project slug"),
      path: z.string().describe("Document path within the project (e.g., '01-architecture/index.md')"),
    },
    async ({ project, path }) => {
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
      return {
        content: [{ type: "text", text: `# ${file.title}\n\n${file.content}` }],
      };
    }
  );

  server.tool(
    "search_docs",
    "Search across documentation projects",
    {
      query: z.string().describe("Search query"),
      project: z.string().optional().describe("Optional project slug to limit search scope"),
    },
    async ({ query, project }) => {
      const results = searchIndex(index, query, project);
      const filtered = allowedProjects.length === 0 || allowedProjects.includes("*")
        ? results
        : results.filter((r) => allowedProjects.includes(r.project));
      return {
        content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }],
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