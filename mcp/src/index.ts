import { loadConfig } from "./config.js";
import { runStdio } from "./transports/stdio.js";
import { createHttpServer } from "./transports/http.js";

async function main(): Promise<void> {
  const config = loadConfig();

  if (config.transport === "stdio") {
    console.error("[dotdive-mcp] Starting in stdio mode...");
    await runStdio();
  } else {
    console.error(`[dotdive-mcp] Starting HTTP server on ${config.httpHost}:${config.httpPort}...`);
    const httpServer = await createHttpServer(config);
    httpServer.listen(config.httpPort, config.httpHost, () => {
      console.error(`[dotdive-mcp] HTTP server listening on ${config.httpHost}:${config.httpPort}`);
    });

    const shutdown = () => {
      httpServer.close((error) => {
        if (error) {
          console.error("[dotdive-mcp] HTTP shutdown failed:", error);
          process.exitCode = 1;
        }
      });
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  }
}

main().catch((err) => {
  console.error("[dotdive-mcp] Fatal error:", err);
  process.exit(1);
});