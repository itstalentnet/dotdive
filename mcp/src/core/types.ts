export type ProjectIndex = {
  slug: string;
  title: string;
  description: string;
  files: DocFile[];
};

export type DocFile = {
  path: string;
  title: string;
  headings: string[];
  content: string;
};

export type SearchResult = {
  project: string;
  path: string;
  title: string;
  snippet: string;
};