# 🔐 LabGrandisol v2.0

> Sistema Interno Privado - Enterprise Grade

## 🚀 Quick Start (30 segundos)

### Pré-requisitos
- Windows 10/11 com acesso administrador
- Docker Desktop 4.0+ instalado
- 2GB RAM disponível

### Instalação
```powershell
# 1. Configure hosts (como administrador)
echo "127.0.0.1 wiki.local" | Add-Content "C:\Windows\System32\drivers\etc\hosts"

# 2. Copie arquivo de configuração
copy .env.example .env

# 3. Inicie containers
docker compose up -d --build

# 4. Aguarde 30 segundos e acesse
https://wiki.local
```

**Credenciais padrão:**
| Tipo | Email | Senha |
|------|-------|-------|
| Admin | `admin@wiki.local` | `admin123` |
| User | `usuario@wiki.local` | `user123` |

---

## 📋 Stack Tecnológico

| Camada | Tecnologia | Propósito |
|--------|-----------|----------|
| **Frontend** | React 18 + Vite | Interface moderna e responsiva |
| **Backend** | Node.js + Express + TypeScript | APIs RESTful com autenticação JWT |
| **Database** | SQLite (em memória) | Dados estruturados e rápidos |
| **Proxy** | Caddy 2 | HTTPS automático e reverse proxy |

---

## ✨ Funcionalidades Principais

✅ **Autenticação JWT** segura com refresh token  
✅ **Painel Admin** completo com gerenciamento de usuários  
✅ **20+ API endpoints** operacionais  
✅ **HTTPS/TLS 1.3** automático  
✅ **Interface responsiva** (desktop, tablet, mobile)  
✅ **Senhas bcrypt** (10 rounds)  
✅ **CORS configurado** corretamente  
✅ **Logging estruturado** e persistente  
✅ **Validação de inputs** com Express Validator  
✅ **Rate limiting** implementado  

---

## 📁 Estrutura do Projeto

```
labgrandisol/
├── backend/
│   ├── server.ts                # Entry point
│   ├── middleware/              # Auth, validators, rate limit
│   ├── routes/                  # API endpoints
│   ├── utils/                   # Database, cache, logger
│   ├── types/                   # TypeScript types
│   ├── __tests__/              # Jest tests
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/              # React components
│   │   ├── store/              # Zustand state management
│   │   ├── api/                # API client
│   │   ├── styles/             # CSS modules
│   │   └── main.jsx
│   └── vite.config.js
│
├── caddy/
│   └── Caddyfile               # HTTPS config
│
├── scripts/
│   ├── up.ps1                  # Iniciar
│   ├── down.ps1                # Parar
│   ├── reset.ps1               # Resetar dados
│   └── start-dev.ps1            # Dev mode
│
├── docker-compose.yml           # Orquestração
├── Dockerfile                   # Container build
├── .env.example                 # Template config
└── README.md
```

---

## 🎮 Comandos de Desenvolvimento

### Iniciar Sistema

```powershell
# Com Docker (recomendado)
docker compose up -d --build

# Ou manualmente (dev mode)
# Terminal 1:
cd backend
npm run dev

# Terminal 2:
cd frontend
npm run dev
```

### Parar Sistema

```powershell
# Parar containers
docker compose down

# Ou PowerShell script
powershell .\scripts\down.ps1
```

### Desenvolvimento

```powershell
# Backend - Em tempo real
cd backend
npm run dev

# Frontend - Em tempo real
cd frontend
npm run dev

# TypeScript check
cd backend
npm run typecheck

# Tests
npm test

# Lint & Format
npm run lint
npm run lint:fix
npm run format
```

### Monitoramento

```powershell
# Ver status dos containers
docker compose ps

# Ver logs em tempo real
docker compose logs -f app          # Backend
docker compose logs -f frontend     # Frontend

# Ver logs específicos
docker compose logs app --tail 50
```

### Reset & Limpeza

```powershell
# Remover todos dados
.\scripts\reset.ps1

# Down sem volume
docker compose down -v

# Limpar containers dangling
docker system prune
```

---

## 🔐 Segurança

| Aspecto | Implementação |
|--------|---------------|
| **Autenticação** | JWT com expiry 7 dias |
| **Senhas** | bcryptjs (10 rounds) |
| **HTTPS** | TLS 1.3 automático via Caddy |
| **Headers** | Helmet.js middleware |
| **CORS** | Restrito a origin configurado |
| **Rate Limiting** | 100 req/15min por IP |
| **Validação** | Express-validator em todos inputs |
| **Rede** | Docker network isolada |
| **Variáveis** | .env com secrets |

---

## 📡 API Reference

### Authentication
```
POST   /api/auth/login        Login (email + password)
POST   /api/auth/register     Register (email + password)
POST   /api/auth/refresh      Refresh JWT token
POST   /api/auth/logout       Logout
```

### Profile
```
GET    /api/profile           Get current user
PUT    /api/profile           Update profile
GET    /api/profile/settings  User settings
```

### Admin (requer token + admin role)
```
GET    /api/admin/dashboard   System stats
GET    /api/admin/users       List users
PUT    /api/admin/users/:id   Update user
DELETE /api/admin/users/:id   Delete user
GET    /api/admin/settings    App settings
POST   /api/admin/backup      Create backup
```

---

## 🐛 Troubleshooting

### Erro: "Porto 3001 em uso"
```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Erro: "Certificado SSL inválido"
Normal em desenvolvimento. Clique "Prosseguir" no navegador (ignore aviso).

### Erro: "Docker não encontrado"
Instale Docker Desktop: https://www.docker.com/products/docker-desktop

### Erro: "Cannot GET /"
Verifique se o frontend está rodando na porta 5173 e acesse:
```
http://localhost:5173
```

### Reset completo do ambiente
```powershell
docker compose down -v
Remove-Item -Recurse -Force backend\node_modules
Remove-Item -Recurse -Force frontend\node_modules
docker compose up -d --build
```

---

## 📊 Endpoints de Status

```
GET    /health                Health check
GET    /metrics               Prometheus metrics (em breve)
GET    /api/version           Versão do sistema
```

---

## 🚀 Deployment

Pronto para:
- ✅ Produção (com .env configurado)
- ✅ CI/CD (GitHub Actions)
- ✅ Kubernetes (Helm chart)
- ✅ Cloud (AWS, Azure, GCP)

---

**LabGrandisol v2.0** — Desenvolvido com ❤️ em 2026
