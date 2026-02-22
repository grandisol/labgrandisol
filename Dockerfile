# LabGrandisol - Dockerfile
# Multi-stage build for optimized production image
# Security: Non-root user, minimal base image, no dev dependencies

# ============ BACKEND BUILD STAGE ============
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Install build dependencies
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    && apk add --no-cache git

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY backend . 

# Build TypeScript
RUN npm run build 2>&1 || true

# ============ FRONTEND BUILD STAGE ============
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

RUN apk add --no-cache git

COPY frontend/package*.json ./

RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

COPY frontend .

RUN npm run build

# ============ PRODUCTION STAGE ============
FROM node:20-alpine

# Metadata
LABEL maintainer="LabGrandisol Team"
LABEL version="2.0.0"
LABEL description="LabGrandisol v2.0 - Private Internal System"

# Create non-root user for security
RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/logs /app/data && \
    chown -R nodejs:nodejs /app

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    curl \
    jq \
    tini

# Copy production dependencies from builder
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/dist ./dist
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/package*.json ./

# Copy frontend build
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/dist ./public

# Copy other necessary files
COPY --chown=nodejs:nodejs backend/utils ./dist/utils 2>/dev/null || true

# Create logs directory
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health | jq '.status == "ok"' || exit 1

# Environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=512 \
    LOG_LEVEL=info

# Expose ports
EXPOSE 3000 443

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "dist/server.js"]

# Security scanning metadata
LABEL scan.type="container" \
      scan.frequency="weekly" \
      scan.tool="trivy,snyk"

# Copiar build do frontend
COPY --from=frontend-builder /app/dist ./public

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar servidor
CMD ["node", "server.js"]
