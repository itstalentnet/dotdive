import { ProjectIndex, DocFile, SearchResult } from "./types.js";

function simpleMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  return t.includes(q);
}

function createSnippet(content: string, query: string, maxLength = 200): string {
  const q = query.toLowerCase();
  const idx = content.toLowerCase().indexOf(q);
  if (idx === -1) return content.slice(0, maxLength);
  const start = Math.max(0, idx - 50);
  const end = Math.min(content.length, idx + query.length + 150);
  let snippet = content.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";
  return snippet;
}

export function searchIndex(
  index: Map<string, ProjectIndex>,
  query: string,
  project?: string
): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];
  const projects = project ? [index.get(project)].filter(Boolean) : Array.from(index.values());

  for (const proj of projects) {
    if (!proj) continue;
    for (const file of proj.files) {
      const inTitle = simpleMatch(query, file.title);
      const inHeadings = file.headings.some((h) => simpleMatch(query, h));
      const inContent = simpleMatch(query, file.content);

      if (inTitle || inHeadings || inContent) {
        let snippet = "";
        if (inContent) {
          snippet = createSnippet(file.content, query);
        } else if (inHeadings) {
          snippet = file.headings.find((h) => simpleMatch(query, h)) || "";
        } else {
          snippet = file.title;
        }

        results.push({
          project: proj.slug,
          path: file.path,
          title: file.title,
          snippet,
        });
      }
    }
  }

  return results;
}