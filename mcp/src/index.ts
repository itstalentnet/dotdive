import { loadConfig } from "./config.js";
import { runStdio } from "./transports/stdio.js";
import { createHttpServer } from "./transports/http.js";

async function main(): Promise<void> {
  const config = loadConfig();

  if (config.transport === "stdio") {
    console.error("[dotdive-mcp] Starting in stdio mode...");
    await runStdio();
  } else {
    console.error(`[dotdive-mcp] Starting HTTP server on port ${config.httpPort}...`);
    const httpServer = await createHttpServer();
    httpServer.listen(config.httpPort, () => {
      console.error(`[dotdive-mcp] HTTP server listening on http://localhost:${config.httpPort}`);
    });
  }
}

main().catch((err) => {
  console.error("[dotdive-mcp] Fatal error:", err);
  process.exit(1);
});