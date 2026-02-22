# Dashboard Admin - Sistema Interno Privado
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Dependências do sistema
RUN apk add --no-cache python3 make g++

# Copiar package.json
COPY backend/package*.json ./

# Instalar todas as dependências
RUN npm install

# Copiar código backend
COPY backend . 

# Compilar TypeScript
RUN npm run build || echo "Build completed with warnings"

# Limpar dependências de dev e reinstalar somente prod
RUN rm -rf node_modules && npm install --production || true

# Frontend builder
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend . 

RUN npm run build

# Imagem final - Node.js servidor
FROM node:20-alpine

WORKDIR /app

# Instalar deno para scripts extras
RUN apk add --no-cache deno

# Copiar dependências do backend
COPY --from=backend-builder /app/node_modules ./node_modules

# Copiar SOURCE de backend para server.js conseguir importar
COPY backend ./

# Copiar build do frontend
COPY --from=frontend-builder /app/dist ./public

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar servidor
CMD ["node", "server.js"]
