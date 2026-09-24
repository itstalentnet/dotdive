import path from "node:path";
import fs from "node:fs";

/**
 * Resolves paths dynamically whether executed from monorepo root or web package.
 */
export function getDocsDir(): string {
  const rootDocs = path.resolve(process.cwd(), "docs");
  if (fs.existsSync(rootDocs)) return rootDocs;
  const parentDocs = path.resolve(process.cwd(), "..", "docs");
  if (fs.existsSync(parentDocs)) return parentDocs;
  return rootDocs;
}

export function getOutPublic(): string {
  const localOut = path.resolve(process.cwd(), "out", "public");
  if (fs.existsSync(localOut)) return localOut;
  const webOut = path.resolve(process.cwd(), "web", "out", "public");
  if (fs.existsSync(webOut)) return webOut;
  return localOut;
}

export function getOutPrivate(): string {
  const localOut = path.resolve(process.cwd(), "out", "private");
  if (fs.existsSync(localOut)) return localOut;
  const webOut = path.resolve(process.cwd(), "web", "out", "private");
  if (fs.existsSync(webOut)) return webOut;
  return localOut;
}
