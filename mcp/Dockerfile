FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@12.6.0 --activate
WORKDIR /workspace

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY mcp/package.json ./mcp/package.json
RUN pnpm install --filter @dotdive/mcp --frozen-lockfile --ignore-scripts

COPY mcp ./mcp
COPY docs ./docs
RUN pnpm --filter @dotdive/mcp build
RUN pnpm --filter @dotdive/mcp deploy --prod /deploy

FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    MCP_TRANSPORT=http \
    HTTP_HOST=0.0.0.0 \
    HTTP_PORT=3900 \
    DOCS_ROOT=/app/docs \
    TOKENS_FILE=/run/secrets/dotdive-mcp-tokens.json

WORKDIR /app
COPY --from=build --chown=node:node /deploy ./
COPY --from=build --chown=node:node /workspace/docs ./docs

USER node
EXPOSE 3900
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3900/readyz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]