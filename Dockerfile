# ═══════════════════════════════════════════════════════════════
# STANDARD.Rent — Production Dockerfile (P0 fixes applied)
# - Multi-stage build
# - prisma generate step (was missing → every DB query failed at runtime)
# - Non-root user (was running as root)
# - Standalone output (matches next.config.ts output: 'standalone')
# ═══════════════════════════════════════════════════════════════

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ──── Install dependencies (full deps incl. prisma CLI) ────
FROM base AS deps
COPY package.json bun.lock* package-lock.json* ./
RUN npm install -g bun@1.3.14
# Install ALL deps (including devDependencies) so `prisma generate` works
RUN bun install --frozen-lockfile

# ──── Build ────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g bun@1.3.14
# P0-2 fix: generate Prisma client BEFORE building Next.js
# Without this, @prisma/client has no query engine and every db.* call throws at runtime
RUN bunx prisma generate
RUN bun run build

# ──── Production runtime ────
FROM base AS runner
ENV NODE_ENV=production

# P1 fix: create non-root user and switch to it
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy standalone build output (requires next.config.ts output: 'standalone')
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
# P0-2 fix: copy generated Prisma client + engine binaries into runner
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Create data directory for SQLite (owned by non-root user)
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck runs as nextjs user
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=20s \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
