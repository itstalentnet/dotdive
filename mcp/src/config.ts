import { z } from "zod";

const configSchema = z.object({
  transport: z.enum(["stdio", "http"]).default("stdio"),
  docsRoot: z.string().default("../docs"),
  allowedProjects: z.string().optional().default(""),
  httpPort: z.coerce.number().default(3900),
  tokensFile: z.string().default("./tokens.json"),
});

export type Config = z.infer<typeof configSchema>;

let cachedConfig: Config | null = null;

export function loadConfig(): Config {
  if (cachedConfig) return cachedConfig;

  const env = {
    transport: process.env.MCP_TRANSPORT,
    docsRoot: process.env.DOCS_ROOT,
    allowedProjects: process.env.ALLOWED_PROJECTS,
    httpPort: process.env.HTTP_PORT,
    tokensFile: process.env.TOKENS_FILE,
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