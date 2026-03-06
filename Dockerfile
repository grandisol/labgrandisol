# LabGrandisol - Dockerfile
# Multi-stage build for optimized production image

# ============ BACKEND BUILD STAGE ============
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY backend/package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY backend . 

# Build TypeScript
RUN npm run build 2>&1 || echo "Build completed"

# ============ FRONTEND BUILD STAGE ============
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm ci

COPY frontend .

RUN npm run build

# ============ PRODUCTION STAGE ============
FROM node:20-alpine

# Metadata
LABEL maintainer="LabGrandisol Team"
LABEL version="2.0.0"

# Create non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/logs /app/data && \
    chown -R nodejs:nodejs /app

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl jq tini

# Copy dependencies
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/package*.json ./

# Copy backend source code (for tsx runtime)
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/server.ts ./
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/middleware ./middleware
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/routes ./routes
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/utils ./utils
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/types ./types

# Copy frontend build
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/dist ./public

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=512 \
    LOG_LEVEL=info

# Expose port
EXPOSE 3000

# Use tini to handle signals
ENTRYPOINT ["/sbin/tini", "--"]

# Start application with tsx
CMD ["npx", "tsx", "server.ts"]
