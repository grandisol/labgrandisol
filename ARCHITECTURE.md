# 🏗️ Architecture

## System Design

LabGrandisol v2.0 é um sistema de biblioteca digital moderno com arquitetura de microsserviços containerizada.

```
┌─────────────────────────────────────────────────────┐
│                   Cliente Browser                    │
│              (React 18 + Vite Frontend)             │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────┐
│            Caddy Reverse Proxy (HTTP/2)             │
│                                                     │
│  • Automatic HTTPS with Let's Encrypt              │
│  • SSL/TLS termination                             │
│  • Load balancing                                   │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌────────┐   ┌────────┐   ┌────────┐
   │Frontend│   │  API   │   │ Static │
   │ (SPA)  │   │Service │   │ Files  │
   └────────┘   └────┬───┘   └────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │ Auth   │ │Library │ │ Social │
    │Service │ │Service │ │Service │
    └────┬───┘ └────┬───┘ └────┬───┘
         │         │          │
         └─────────┼──────────┘
                   ▼
         ┌─────────────────────┐
         │   Data Layer        │
         ├─────────────────────┤
         │ PostgreSQL (Primary)│
         │ Redis (Cache)       │
         │ SQLite (Dev)        │
         └─────────────────────┘
```

## Componentes Principais

### Frontend
- **Framework**: React 18 com Hooks
- **Build Tool**: Vite
- **Styling**: CSS3 + CSS Modules
- **State Management**: Custom hooks + Context API
- **HTTP Client**: Axios com interceptors

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (prod), SQLite (dev)
- **Cache**: Redis
- **Job Queue**: Bull.js
- **Authentication**: JWT + Refresh Tokens

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Caddy
- **CI/CD**: GitHub Actions
- **Monitoring**: Healthchecks + Logs
- **Networking**: Bridge network com subnet isolada

## Fluxo de Dados

### 1. Autenticação
```
User Login → API → Validation → Database → JWT Token
                                          → Refresh Token
```

### 2. Requisição de Dados
```
Request → Caddy → Backend → Cache Check → Database
(with JWT)                 → Update Cache
                           → Response
```

### 3. Processamento Assíncrono
```
User Action → Queue (Bull) → Workers → Database → Notifications
```

## Segurança

### Layers
1. **Network**: HTTPS/TLS, CORS, Rate Limiting
2. **Application**: Input validation, JWT auth, RBAC
3. **Database**: Encrypted passwords, prepared statements
4. **Container**: Non-root user, minimal base image

### Policies
- **Passwords**: bcrypt 10 rounds
- **Tokens**: 24h expiration (access), 7d (refresh)
- **CORS**: Whitelist apenas domínios confiáveis
- **Rate Limit**: 100 requests/15min per IP
- **Secrets**: Nunca em código, usar .env

## Escalabilidade

### Horizontal
- Múltiplas instâncias backend atrás de load balancer
- Redis para compartilhar sessions
- Database replication (PostgreSQL)

### Vertical
- Container resource limits definidos
- Memory pooling para databases
- Connection pooling (10-20 connections)

## Deployment Strategies

### Development
```bash
docker-compose up -d
```

### Staging
- Docker Compose com secrets
- PostgreSQL container
- Monitoring básico

### Production
- Kubernetes ou ECS
- Managed databases (RDS, CloudSQL)
- CDN para assets estáticos
- Centralized logging (ELK)
- Monitoring (Prometheus + Grafana)

## Performance

### Optimization
- Frontend code splitting (Vite)
- API response caching (Redis)
- Database query optimization
- Asset compression (Caddy)
- Connection pooling

### Metrics
- Response time: <200ms (p95)
- Availability: >99.9%
- Error rate: <0.1%
- Database connections: <100

## Disaster Recovery

### Backup Strategy
- Daily database dumps
- Volume snapshots
- Code in Git repository

### RTO/RPO
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 24 hours

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 20 LTS |
| Backend | Express.js | ^4.18 |
| Database | PostgreSQL | 15 |
| Cache | Redis | 7 |
| Frontend | React | 18 |
| Build | Vite | 5.4 |
| Container | Docker | 24+ |
| Proxy | Caddy | 2 |
| Auth | JWT | - |
