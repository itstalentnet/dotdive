# Dotdive MCP Server

Model Context Protocol server for exposing dotdive documentation to AI clients (Claude Desktop, Claude Code, Cursor, etc.).

## Quick Start

### 1. Install dependencies (once)
```bash
cd mcp
npm install
```

### 2. Configure (optional)
```bash
cp .env.example .env
# Edit .env if needed - defaults work for local development
```

### 3. Run in development (stdio mode)
```bash
npm run dev
```
This starts the server with file watching - changes to `docs/` are reflected immediately.

### 4. Connect from your AI client

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
```json
{
  "mcpServers": {
    "dotdive": {
      "command": "node",
      "args": ["/absolute/path/to/dotdive/mcp/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "DOCS_ROOT": "../docs"
      }
    }
  }
}
```

**Claude Code** (in project directory):
```bash
claude mcp add dotdive node /absolute/path/to/dotdive/mcp/dist/index.js --env MCP_TRANSPORT=stdio --env DOCS_ROOT=../docs
```

**Cursor** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "dotdive": {
      "command": "node",
      "args": ["/absolute/path/to/dotdive/mcp/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "DOCS_ROOT": "../docs"
      }
    }
  }
}
```

> **Note:** Use the built `dist/index.js` for production. For development with auto-reload, use `tsx src/index.ts` instead.

## Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_projects` | List all documentation projects | none |
| `get_project_docs` | Get file tree for a project | `project: string` |
| `read_doc` | Read full document content | `project: string`, `path: string` |
| `search_docs` | Search across projects | `query: string`, `project?: string` |

## Available Resources

Resources use the `dotdive://` URI scheme:

- `dotdive://` — Overview of all projects
- `dotdive://<project>` — Project index (e.g., `dotdive://lemmo`)
- `dotdive://<project>/<path>` — Specific document (e.g., `dotdive://lemmo/index.md`)

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_TRANSPORT` | `stdio` | Transport mode: `stdio` (local) or `http` (remote) |
| `DOCS_ROOT` | `../docs` | Path to docs folder relative to mcp/ |
| `ALLOWED_PROJECTS` | (empty) | Comma-separated list of allowed projects (local mode) |
| `HTTP_PORT` | `3900` | Port for HTTP transport |
| `TOKENS_FILE` | `./tokens.json` | Token store for HTTP auth |

## Remote Mode (HTTP)

For customer-facing access:

```bash
MCP_TRANSPORT=http HTTP_PORT=3900 TOKENS_FILE=./tokens.json node dist/index.js
```

Tokens in `tokens.json`:
```json
{
  "client-token-123": {
    "clientName": "Customer A",
    "allowedProjects": ["lemmo"],
    "expiresAt": "2027-01-01T00:00:00.000Z"
  }
}
```

Client connects with `Authorization: Bearer client-token-123`.

## Development

```bash
# Type checking
npm run typecheck

# Run tests
npm test

# Build for production
npm run build

# Start production build
npm start
```

## Project Structure

```
mcp/
├── src/
│   ├── index.ts              # Entrypoint
│   ├── config.ts             # Configuration
│   ├── core/
│   │   ├── indexer.ts        # Documentation indexer
│   │   ├── search.ts         # Search engine
│   │   ├── tools.ts          # MCP tools
│   │   └── resources.ts      # MCP resources
│   ├── transports/
│   │   ├── stdio.ts          # Stdio transport
│   │   └── http.ts           # HTTP transport
│   └── auth/
│       └── tokens.ts         # Token validation
├── tests/                    # Unit tests
├── tokens.json               # Token store (remote mode)
└── .env.example              # Config template
```

## How It Works

1. **Indexer** scans `docs/<project>/**/*.md` at startup
2. Extracts title (frontmatter/H1), headings, and content
3. Builds in-memory `ProjectIndex` per project
4. MCP Core exposes tools/resources over stdio or HTTP
5. Local mode: zero auth, full access to all projects
6. Remote mode: Bearer token → project scoping

## Architecture

See `blueprint.md` for full technical specification.