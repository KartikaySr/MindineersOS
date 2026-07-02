# ─── MindineersOS Production Dockerfile ───
# Built by Kartikay Srivastava at Mindineers Labs
# Multi-stage build for optimal image size

# Stage 1: Install dependencies
FROM oven/bun:latest AS deps
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
COPY packages/ ./packages/
COPY plugins/ ./plugins/
COPY patches/ ./patches/
COPY scripts/ ./scripts/

RUN bun install --frozen-lockfile

# Stage 2: Build application
FROM oven/bun:latest AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run build

# Stage 3: Production runtime
FROM oven/bun:latest AS runtime
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 mindineers && \
    adduser --system --uid 1001 mindineers

# Copy built application
COPY --from=builder --chown=mindineers:mindineers /app .

# Create data directories
RUN mkdir -p .eliza/pglite && chown -R mindineers:mindineers .eliza

USER mindineers

EXPOSE 3000

ENV NODE_ENV=production
ENV SERVER_PORT=3000
ENV MINDINEERS_OS_UI_ENABLE=true

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["bun", "run", "start"]
