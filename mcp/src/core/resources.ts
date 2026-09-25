import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ProjectIndex } from "./types.js";

type ResourceContext = {
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

export function registerResources(server: McpServer, context: ResourceContext): void {
  const { index, allowedProjects } = context;

  server.resource(
    "dotdive-projects",
    "dotdive://",
    async () => {
      const projects = filterProjects(index, allowedProjects).map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description,
      }));
      return {
        contents: [
          {
            uri: "dotdive://",
            mimeType: "application/json",
            text: JSON.stringify(projects, null, 2),
          },
        ],
      };
    }
  );

  for (const proj of index.values()) {
    const slug = proj.slug;
    if (allowedProjects.length > 0 && !allowedProjects.includes(slug)) continue;

    server.resource(
      `dotdive-project-${slug}`,
      `dotdive://${slug}`,
      async () => {
        const project = getProject(index, slug, allowedProjects);
        if (!project) {
          return {
            contents: [
              {
                uri: `dotdive://${slug}`,
                mimeType: "application/json",
                text: JSON.stringify({ error: "Project not found" }, null, 2),
              },
            ],
          };
        }
        const tree = project.files.map((f) => ({ path: f.path, title: f.title }));
        return {
          contents: [
            {
              uri: `dotdive://${slug}`,
              mimeType: "application/json",
              text: JSON.stringify({ ...project, files: tree }, null, 2),
            },
          ],
        };
      }
    );

    for (const file of proj.files) {
      server.resource(
        `dotdive-doc-${slug}-${file.path.replace(/[/.-]/g, "_")}`,
        `dotdive://${slug}/${file.path}`,
        async () => {
          const project = getProject(index, slug, allowedProjects);
          if (!project) {
            return {
              contents: [
                {
                  uri: `dotdive://${slug}/${file.path}`,
                  mimeType: "text/markdown",
                  text: `# Error\n\nProject '${slug}' not found or access denied`,
                },
              ],
            };
          }
          const docFile = project.files.find((f) => f.path === file.path);
          if (!docFile) {
            return {
              contents: [
                {
                  uri: `dotdive://${slug}/${file.path}`,
                  mimeType: "text/markdown",
                  text: `# Error\n\nDocument '${file.path}' not found in project '${slug}'`,
                },
              ],
            };
          }
          return {
            contents: [
              {
                uri: `dotdive://${slug}/${file.path}`,
                mimeType: "text/markdown",
                text: `# ${docFile.title}\n\n${docFile.content}`,
              },
            ],
          };
        }
      );
    }
  }
}