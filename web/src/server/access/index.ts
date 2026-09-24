/**
 * server/access/index.ts
 * AccessContext + env-based access rules
 * Independent of UI — can be reused by MCP server later
 */
import path from "node:path";
import fs from "node:fs";

export type AccessContext = {
  email: string | null;
  /** Set of root names this user can access, or 'all' */
  roots: Set<string> | "all";
};

/** Anonymous principal — can only access public root */
export const ANON_CTX: AccessContext = {
  email: null,
  roots: new Set(["public"]),
};

/**
 * Discover all roots from docs/ directory
 */
export function discoverRoots(docsDir: string): string[] {
  try {
    return fs
      .readdirSync(docsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

/**
 * Build AccessContext for a given email from env variables.
 * Reads ACCESS_ALL, ACCESS_<ROOT> for each discovered root.
 */
export function getAccessContext(
  email: string | null,
  docsDir?: string
): AccessContext {
  if (!email) return ANON_CTX;

  const normalEmail = email.trim().toLowerCase();

  // ACCESS_ALL: super-admin for all roots
  const accessAll = (process.env.ACCESS_ALL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (accessAll.includes(normalEmail)) {
    return { email: normalEmail, roots: "all" };
  }

  // Discover roots
  const resolvedDocsDir =
    docsDir ?? path.resolve(process.cwd(), "..", "docs");
  const allRoots = discoverRoots(resolvedDocsDir);

  // Always include public
  const allowedRoots = new Set<string>(["public"]);

  for (const root of allRoots) {
    if (root === "public") continue;
    // Env var: ACCESS_NONS for root "nons", ACCESS_MY_ROOT for "my-root"
    const envKey = `ACCESS_${root.toUpperCase().replace(/-/g, "_")}`;
    const allowed = (process.env[envKey] ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowed.includes(normalEmail)) {
      allowedRoots.add(root);
    }
  }

  return { email: normalEmail, roots: allowedRoots };
}

/**
 * Check if AccessContext can access a given root
 */
export function canAccess(ctx: AccessContext, root: string): boolean {
  if (root === "public") return true;
  if (ctx.roots === "all") return true;
  return ctx.roots.has(root);
}
