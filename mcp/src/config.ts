import { z } from "zod";
import { fileURLToPath } from "node:url";

const defaultDocsRoot = fileURLToPath(new URL("../../docs", import.meta.url));

const configSchema = z.object({
  transport: z.enum(["stdio", "http"]).default("stdio"),
  docsRoot: z.string().default(defaultDocsRoot),
  allowedProjects: z.string().optional().default(""),
  httpHost: z.string().default("127.0.0.1"),
  httpPort: z.coerce.number().int().min(1).max(65535).default(3900),
  httpRateLimit: z.coerce.number().int().min(1).default(120),
  tokensFile: z.string().default("/run/secrets/dotdive-mcp-tokens.json"),
  oauthSecret: z.string().optional(),
  publicUrl: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

let cachedConfig: Config | null = null;

export function loadConfig(): Config {
  if (cachedConfig) return cachedConfig;

  const env = {
    transport: process.env.MCP_TRANSPORT,
    docsRoot: process.env.DOCS_ROOT,
    allowedProjects: process.env.ALLOWED_PROJECTS,
    httpHost: process.env.HTTP_HOST,
    httpPort: process.env.HTTP_PORT,
    httpRateLimit: process.env.HTTP_RATE_LIMIT,
    tokensFile: process.env.TOKENS_FILE,
    oauthSecret: process.env.MCP_OAUTH_SECRET || process.env.OAUTH_SECRET,
    publicUrl: process.env.MCP_PUBLIC_URL || process.env.PUBLIC_URL,
  };

  const result = configSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid configuration: ${result.error.message}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export function getAllowedProjects(): string[] {
  const config = loadConfig();
  if (!config.allowedProjects) return [];
  return config.allowedProjects.split(",").map((s) => s.trim()).filter(Boolean);
}