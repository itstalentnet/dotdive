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
| `DOCS_ROOT` | package-relative docs path | Path to docs folder; the default is independent of the process working directory |
| `ALLOWED_PROJECTS` | (empty) | Comma-separated list of allowed projects (local mode) |
| `HTTP_HOST` | `127.0.0.1` | Bind address for direct HTTP runs; container deployment sets this to its private interface |
| `HTTP_PORT` | `3900` | Port for HTTP transport |
| `HTTP_RATE_LIMIT` | `120` | Maximum authenticated HTTP requests per token per minute |
| `TOKENS_FILE` | `/run/secrets/dotdive-mcp-tokens.json` | JSON token store for HTTP auth; required in HTTP mode |

## Remote Mode (HTTP)

For local smoke testing only:

```bash
MCP_TRANSPORT=http HTTP_HOST=127.0.0.1 HTTP_PORT=3900 \
TOKENS_FILE=/secure/path/mcp-tokens.json node dist/index.js
```

### Token & Client Store JSON Format

Keep this file outside the repository (e.g. `/etc/dotdive/mcp-tokens.json`):

```json
{
  "client-token-123": {
    "clientName": "Customer A (Static Token)",
    "allowedProjects": ["lemmo"],
    "expiresAt": "2027-01-01T00:00:00.000Z"
  },
  "chatgpt-action-client": {
    "clientName": "ChatGPT Custom GPT",
    "clientSecret": "your-super-strong-client-secret",
    "allowedProjects": ["lemmo"],
    "redirectUris": ["https://chatgpt.com/aip/g-abc123/oauth/callback"]
  }
}
```

### OAuth 2.0 for AI Models & Platforms

For AI platforms (ChatGPT Custom GPTs, Claude Web, OpenAI Actions, Copilot Studio) requiring OAuth 2.0 authentication:

- **Token Endpoint:** `POST https://<your-host>/oauth/token`
  - Supports `grant_type=client_credentials` (machine-to-machine) and `grant_type=authorization_code`.
  - Accepts credentials via `Authorization: Basic <base64>` header or form/json body (`client_id`, `client_secret`).
  - Returns a standard signed Bearer JWT valid for 1 hour (`expires_in: 3600`).
- **Authorization Endpoint:** `GET https://<your-host>/oauth/authorize`
  - Validates `client_id`, `redirect_uri`, and issues authorization codes.
- **Discovery Metadata:** `GET https://<your-host>/.well-known/oauth-authorization-server` and `/.well-known/openid-configuration`
- **MCP Endpoint:** `POST https://<your-host>/mcp`
  - Authenticate using `Authorization: Bearer <access_token>` (issued via OAuth 2.0) or a static token.
  - Automatically restricts document visibility to the client's `allowedProjects`.
  - Supports CORS for browser-based AI clients.

Do not expose the plain HTTP listener directly to the Internet. Public access must terminate TLS at a reverse proxy and apply an additional proxy-level rate limit. The server itself applies a per-token request limit.

### Docker Compose deployment

Requirements: Docker Engine with the Compose plugin, an HTTPS reverse proxy, and a token file stored outside this repository.

Create a private token file. Keep the generated token in a secret manager or deliver it to the client through a secure channel; do not commit it or put it in shell history:

```bash
sudo install -d -m 700 /etc/dotdive
umask 077
TOKEN="$(openssl rand -hex 32)"
EXPIRES_AT="$(date -u -d '+90 days' '+%Y-%m-%dT%H:%M:%SZ')"
printf '{"%s":{"clientName":"Client name","allowedProjects":["lemmo"],"expiresAt":"%s"}}\n' "$TOKEN" "$EXPIRES_AT" | sudo tee /etc/dotdive/mcp-tokens.json >/dev/null
unset TOKEN
unset EXPIRES_AT
sudo chmod 600 /etc/dotdive/mcp-tokens.json
sudo chown 1000:1000 /etc/dotdive/mcp-tokens.json
```

Build and start the service. The published port is bound to host loopback only:

```bash
MCP_TOKENS_FILE=/etc/dotdive/mcp-tokens.json \
  docker compose -f mcp/compose.yaml up --build -d
curl --fail http://127.0.0.1:3900/readyz
```

Configure the HTTPS reverse proxy to forward `https://<your-host>/mcp` to `http://127.0.0.1:3900/mcp`, preserving the `Authorization` header. Apply proxy-level connection/request limits and do not publish `/healthz` or `/readyz`. After documentation changes, rebuild and restart the image so its startup index contains the new content.

Inspect runtime status and logs with:

```bash
MCP_TOKENS_FILE=/etc/dotdive/mcp-tokens.json docker compose -f mcp/compose.yaml ps
MCP_TOKENS_FILE=/etc/dotdive/mcp-tokens.json docker compose -f mcp/compose.yaml logs --tail=100 dotdive-mcp
```

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
├── compose.yaml              # Loopback-only Docker deployment
├── Dockerfile                # Multi-stage production image
└── .env.example              # Config template
```

## How It Works

1. **Indexer** scans `docs/<project>/**/*.md` at startup
2. Extracts title (frontmatter/H1), headings, and content
3. Builds in-memory `ProjectIndex` per project
4. MCP Core exposes tools/resources over stdio or HTTP
5. Local mode: zero auth, full access to all projects
6. Remote mode: Bearer token → project scoping, with empty scopes rejected

## Architecture

See `blueprint.md` for full technical specification.