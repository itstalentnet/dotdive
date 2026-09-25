import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProjectIndex, DocFile } from "./types.js";
import { searchIndex } from "./search.js";

type ToolContext = {
  index: Map<string, ProjectIndex>;
  allowedProjects: string[];
};

function filterProjects(index: Map<string, ProjectIndex>, allowed: string[]): ProjectIndex[] {
  if (allowed.length === 0) return Array.from(index.values());
  return allowed.map((slug) => index.get(slug)).filter((p): p is ProjectIndex => p !== undefined);
}

function getProject(index: Map<string, ProjectIndex>, slug: string, allowed: string[]): ProjectIndex | null {
  if (allowed.length > 0 && !allowed.includes(slug)) return null;
  return index.get(slug) || null;
}

export function registerTools(server: McpServer, context: ToolContext): void {
  const { index, allowedProjects } = context;

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
      const filtered = project
        ? results.filter((r) => allowedProjects.length === 0 || allowedProjects.includes(r.project))
        : results.filter((r) => allowedProjects.length === 0 || allowedProjects.includes(r.project));
      return {
        content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }],
      };
    }
  );
}