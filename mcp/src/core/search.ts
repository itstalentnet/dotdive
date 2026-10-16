import { ProjectIndex, SearchResult } from "./types.js";

export type SearchOptions = {
  project?: string;
  folder?: string;
  limit?: number;
  allowedProjects?: string[];
};

function simpleMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  return t.includes(q);
}

function createSnippet(content: string, query: string, maxLength = 160): string {
  const q = query.toLowerCase();
  const idx = content.toLowerCase().indexOf(q);
  if (idx === -1) return content.slice(0, maxLength).replace(/\s+/g, " ").trim();
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + query.length + 100);
  let snippet = content.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";
  return snippet;
}

export function searchIndex(
  index: Map<string, ProjectIndex>,
  query: string,
  optionsOrProject?: SearchOptions | string
): SearchResult[] {
  if (!query.trim()) return [];

  let project: string | undefined;
  let folder: string | undefined;
  let limit = 5;
  let allowedProjects: string[] = [];

  if (typeof optionsOrProject === "string") {
    project = optionsOrProject;
  } else if (optionsOrProject && typeof optionsOrProject === "object") {
    project = optionsOrProject.project;
    folder = optionsOrProject.folder?.replace(/^[/\\]+/, "").replace(/[/\\]+$/, "");
    limit = typeof optionsOrProject.limit === "number" && optionsOrProject.limit > 0
      ? Math.min(optionsOrProject.limit, 20)
      : 5;
    allowedProjects = optionsOrProject.allowedProjects ?? [];
  }

  // Filter projects by allowed scope
  let projects: ProjectIndex[] = [];
  if (project) {
    if (allowedProjects.length === 0 || allowedProjects.includes("*") || allowedProjects.includes(project)) {
      const proj = index.get(project);
      if (proj) projects = [proj];
    }
  } else if (allowedProjects.length > 0 && !allowedProjects.includes("*")) {
    projects = allowedProjects.map((p) => index.get(p)).filter((p): p is ProjectIndex => p !== undefined);
  } else {
    projects = Array.from(index.values());
  }

  type ScoredResult = SearchResult & { score: number };
  const scoredResults: ScoredResult[] = [];
  const qLower = query.toLowerCase();

  for (const proj of projects) {
    for (const file of proj.files) {
      if (folder && !file.path.startsWith(folder)) {
        continue;
      }

      let score = 0;
      const titleLower = file.title.toLowerCase();
      if (titleLower === qLower) {
        score += 100;
      } else if (titleLower.includes(qLower)) {
        score += 50;
      }

      const matchingHeading = file.headings.find((h) => simpleMatch(query, h));
      if (matchingHeading) {
        score += 30;
      }

      const inContent = simpleMatch(query, file.content);
      if (inContent) {
        score += 15;
      }

      if (score > 0) {
        let snippet = "";
        if (inContent) {
          snippet = createSnippet(file.content, query);
        } else if (matchingHeading) {
          snippet = matchingHeading;
        } else {
          snippet = file.title;
        }

        scoredResults.push({
          project: proj.slug,
          path: file.path,
          title: file.title,
          snippet,
          score,
        });
      }
    }
  }

  // Sort by relevance score descending
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.slice(0, limit).map(({ project, path, title, snippet }) => ({
    project,
    path,
    title,
    snippet,
  }));
}