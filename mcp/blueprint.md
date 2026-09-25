# Dotdive MCP Server — Technical Blueprint

*Sep 26, 2026 · @xoxxel*

## 1. Overview & Goals
This document specifies an MCP (Model Context Protocol) server for dotdive that exposes the contents of docs/<project> folders (e.g. docs/lemmo, docs/proje-02) so that AI models (Claude, or any MCP-compatible client) can read, browse, and search project documentation directly.
Two deployment modes, one codebase:

1. **Local mode (now):** runs on the developer's own machine via stdio transport, launched directly by a local MCP client (Claude Desktop, Claude Code, Cursor, etc.). No network exposure, no auth needed.
2. **Remote mode (later):** the same server runs on a server and is reachable over Streamable HTTP, so external clients (a customer's AI tool) can connect with a single URL + access token, matching dotdive's product positioning ("one link, standardized project knowledge, no dependency on the dev team").
Design goal: the transport is the only thing that changes between the two modes. All business logic (reading docs, indexing, search, listing projects) lives in a transport-agnostic core so the same server binary/package supports both without duplicating logic.
## 2. Architecture Overview
```text
monorepo/
├── docs/                  existing docs root (source of truth, Git)
│   ├── nons/
│   ├── lemmo/
│   ├── public/
│   └── proje-02/
├── web/                   existing frontend
└── mcp/                   NEW: MCP server package
    ├── src/
    │   ├── core/          transport-agnostic logic
    │   ├── transports/    stdio.ts, http.ts
    │   └── index.ts       entrypoint, picks transport by config
    └── package.json
```
Data flow:
1. `docs/*` is scanned at build/start time (or on file change in dev) by the Indexer.
2. The Indexer produces an in-memory (or on-disk cache) project index: list of projects, per-project file tree, per-file metadata (title, headings).
3. The MCP Core exposes this index through Tools/Resources, independent of how the client connected.
4. A Transport Adapter (stdio or http) wraps the MCP Core and handles the actual protocol handshake with the client.
5. In remote mode, an Auth Middleware sits in front of the HTTP transport, resolving a token to an allowed project scope before any tool call reaches the Core.
This mirrors dotdive's own split: docs are static content, the server is a thin runtime layer over them — no database.
## 3. Transport Layer
MCP defines two transport kinds; both wrap the same MCP Core.
| Transport | When used | Characteristics |
| --- | --- | --- |
| stdio | Local mode (now) | Server runs as a child process launched by the client (e.g. Claude Desktop config, Claude Code mcp config). Communicates over stdin/stdout. No network, no auth needed — trust boundary is "runs on your machine". |
| Streamable HTTP | Remote mode (later) | Server runs standalone (e.g. node dist/index.js --http) and listens on a port. Client connects via URL. Supports multiple simultaneous clients. Requires auth (see §6). |
Implementation approach: define one McpServer instance (using the official @modelcontextprotocol/sdk) that registers all tools/resources once. At startup, read a config flag (MCP_TRANSPORT=stdio|http) and attach the corresponding transport:
```ts
const server = createMcpServer(); // registers tools/resources from core/

if (config.transport === "stdio") {
  await server.connect(new StdioServerTransport());
} else {
  const httpServer = createHttpTransport(server, { port: config.port, authMiddleware });
  httpServer.listen(config.port);
}
```
This way, no tool/resource logic is ever duplicated between modes — only the outer connection code differs.
## 4. Data Model & Indexing
Source of truth: docs/<project>/**/*.md, same files the web/ frontend renders. No database — the index is derived, not authoritative.
Index shape (in-memory, rebuilt on demand):
```ts
type ProjectIndex = {
  slug: string;          // "lemmo", "proje-02"
  title: string;         // from project index file
  description: string;
  files: DocFile[];
};

type DocFile = {
  path: string;          // relative path within the project
  title: string;         // from frontmatter or first H1
  headings: string[];    // for search/section listing
};
```
Build strategy:

- **Local dev mode:** watch `docs/` with a file watcher (e.g. chokidar); rebuild the affected project's index in-memory on change. No build step needed to test with an AI client.
- **Production/remote mode:** generate the index once at deploy time (same script web/ may already use for static generation) and load it at server startup; optionally support a manual re-index trigger (webhook or CLI command) after a docs push, since content lives in GitHub.
Search: start with a simple in-memory full-text match (filename + heading + body substring) across the indexed files; this is enough at current scale and avoids adding a search infra dependency. Revisit only if project count/doc volume grows significantly.
## 5. MCP Capabilities
Tools (model-invoked functions):
| Tool | Parameters | Returns |
| --- | --- | --- |
| list_projects | (none, or scope token implied by auth) | Array of { slug, title, description } for every project the caller may access |
| get_project_docs | project: string | File tree: { path, title }[] for that project |
| read_doc | project: string, path: string | Raw Markdown content of that file, plus title |
| search_docs | query: string, project?: string | Ranked list of { project, path, title, snippet } |
Resources (URI-addressable content, for clients that prefer browsing over calling tools):

- `dotdive://<project>` → index/overview of a project
- `dotdive://<project>/<path>` → a specific document's raw Markdown
Exposing both Tools and Resources covers the two common client patterns: agentic tool-calling (search, then read) and direct resource browsing.
Error handling: unknown project/path → a clear MCP tool error (not a silent empty result), so the model can report back accurately rather than hallucinate content.
## 6. Authentication & Access Control

| Mode | Auth | Scope |
| --- | --- | --- |
| Local (stdio) | None — the launching client is already trusted (it's your own machine) | Full access to all projects, or restricted via ALLOWED_PROJECTS env var if you want to test scoping locally |
| Remote (HTTP) | Bearer token per request, validated against a token store | Each token maps to an allowed project list (same idea as the existing .env email allowlist for the web app) |
Token model (remote):

- A token is issued per client/customer (mirrors dotdive's "one access link per business" positioning).
- Token → { clientName, allowedProjects: string[], expiresAt? }.
- Every tool call resolves the token first; a project outside allowedProjects is filtered out of list_projects and rejected by get_project_docs/read_doc/search_docs.
- Token storage can start as a simple JSON/YAML file or the same .env-style config used elsewhere in dotdive — no need for a database or admin panel, consistent with the "no complexity" principle.
This lets local mode ship with zero auth code paths exercised, while the same middleware is ready to switch on the moment remote mode is deployed.
## 7. Configuration
All behavior is driven by a single .env (or .env.local for dev), matching the pattern already used elsewhere in dotdive:
```dotenv
# Mode switch
MCP_TRANSPORT=stdio          # "stdio" | "http"

# Docs source
DOCS_ROOT=../docs             # path to the docs/ folder, relative to mcp/

# Local-only override (optional)
ALLOWED_PROJECTS=             # empty = all projects visible

# Remote-only (used only when MCP_TRANSPORT=http)
HTTP_PORT=3900
TOKENS_FILE=./tokens.json     # or a DB/KV reference later, if ever needed
```
Switching from local to remote later is a config change, not a code change: set MCP_TRANSPORT=http, provide TOKENS_FILE, and run the same package on a server instead of launching it via stdio from a local client.
## 8. Project Structure
```text
mcp/
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts                # entrypoint: reads config, picks transport
│   ├── core/
│   │   ├── indexer.ts          # scans docs/, builds ProjectIndex
│   │   ├── search.ts           # in-memory search over the index
│   │   ├── tools.ts            # tool definitions (list_projects, read_doc, …)
│   │   └── resources.ts        # resource definitions (dotdive://…)
│   ├── transports/
│   │   ├── stdio.ts
│   │   └── http.ts              # Streamable HTTP + auth middleware wiring
│   ├── auth/
│   │   └── tokens.ts           # token load/validate, project scoping
│   └── config.ts               # env parsing/validation
└── tests/
    ├── indexer.test.ts
    ├── tools.test.ts
    └── auth.test.ts
```
Kept as its own package inside the monorepo (own package.json) so it can be run, tested, and deployed independently of web/, while still sharing the same docs/ folder via a relative path — no publishing or duplication needed.
## 9. Implementation Phases

| Phase | Scope | Exit criteria |
| --- | --- | --- |
| 1 — Core + stdio MVP | Indexer, list_projects/get_project_docs/read_doc tools, stdio transport | Connect from Claude Desktop/Code locally; can list lemmo/proje-02 and read a file |
| 2 — Search | search_docs tool + in-memory search | Query returns relevant snippets across projects |
| 3 — Resources | dotdive:// resource URIs alongside tools | A resource-browsing client (not just tool-calling) can navigate docs |
| 4 — HTTP transport | Streamable HTTP transport, no auth yet (dev/staging only) | Same tools reachable over a local HTTP URL |
| 5 — Auth & scoping | Token store, per-token project scope, deploy to a server | A test token restricted to one project only sees that project through a remote client |
| 6 — Hardening | Rate limiting, logging, re-index trigger after docs push, MCP protocol version pin | Ready to hand a real customer a link |
Phases 1–3 are enough for full local, single-developer use. Phases 4–6 are only needed when moving to remote/customer-facing access — nothing in Phases 1–3 needs to be rewritten to get there.
## 10. Non-Functional Requirements

- **Performance:** index build should stay well under 1s for the current doc volume; re-index on file change (local dev) should not block in-flight tool calls.
- **Security (remote mode only):** tokens transmitted over HTTPS only; never log token values; rate-limit per token to prevent scraping the whole docs set through repeated read_doc calls.
- **Logging:** structured logs per tool call (project, tool, caller in remote mode) to support later usage analytics per customer — useful for dotdive's business model (seeing which projects/customers actually use their MCP access).
- **Protocol versioning:** pin the @modelcontextprotocol/sdk version and document the MCP protocol version supported, since the spec is still evolving; re-test both transports on any SDK upgrade.
- **No lock-in to a specific AI client:** since MCP is an open protocol, the server must work with any compliant client (Claude, others), not just one — this is core to dotdive's "plug into your preferred AI model" pitch.