# ══════════════════════════════════════════════════════════════════════════════
# KlawTax Backend — Production Dockerfile
# Multi-stage build: builder → production image
# ══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

# Copy dependency manifests first (layer cache optimization)
COPY package.json package-lock.json ./

# Install all dependencies (including devDeps needed for TypeScript compilation)
RUN npm ci --ignore-scripts

# Copy source
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript
RUN npm run build


# ── Stage 2: Production Image ────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -S klawtax && adduser -S klawtax -G klawtax

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy compiled output from builder stage
COPY --from=builder /build/dist ./dist

# Create logs directory (writable by app user)
RUN mkdir -p /app/logs && chown klawtax:klawtax /app/logs

# Switch to non-root user
USER klawtax

# Expose API port
EXPOSE 5000

# Health check — uses the /ready endpoint (returns 503 if DB is down)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health/ready || exit 1

# Start command
CMD ["node", "dist/server.js"]
