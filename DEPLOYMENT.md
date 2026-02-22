# 🚀 Deployment Guide

Complete guide para deploy do LabGrandisol em diferentes ambientes.

## Pre-requisitos

- Docker Desktop (Windows/Mac) ou Docker Engine (Linux)
- Docker Compose v2+
- 4GB RAM mínimo
- 10GB storage mínimo
- Git

## Local Development

### Setup Inicial

```bash
# Clone repositório
git clone https://github.com/labgrandisol/labgrandisol.git
cd labgrandisol

# Configure environment
cp .env.example .env

# Start services
docker-compose up -d

# Check health
curl http://localhost:3000/api/health
curl https://localhost (via Caddy)
```

### URLs Locais
- **Frontend**: http://localhost:5173 (dev) ou https://localhost (prod)
- **API**: http://localhost:3000/api
- **Docs**: http://localhost:3000/api-docs
- **Caddy Dashboard**: https://localhost:2019

## Staging Environment

### Via Docker Compose

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Initialize database
docker exec labgrandisol-api npm run migrate

# Check status
docker-compose ps
docker-compose logs -f backend

# Stop services
docker-compose down -v  # Remove volumes
```

### Environment Variables

```env
NODE_ENV=staging
DATABASE_TYPE=postgres
POSTGRES_HOST=postgres
POSTGRES_USER=labgrandisol
POSTGRES_PASSWORD=secure_password_here
JWT_SECRET=generate_random_string_here
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### Database Migration

```bash
docker exec labgrandisol-api npx knex migrate:latest
docker exec labgrandisol-api npx kind seed:run
```

## Production Deployment

### Option 1: AWS ECS + RDS

```bash
# 1. Build and push image to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker build -t labgrandisol:latest .
docker tag labgrandisol:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/labgrandisol:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/labgrandisol:latest

# 2. Create ECS task definition
# 3. Create ECS service
# 4. Create RDS PostgreSQL instance
# 5. Create ElastiCache Redis cluster
```

### Option 2: Kubernetes (GKE/AKS)

```bash
# Build and push image
docker build -t gcr.io/PROJECT_ID/labgrandisol:latest .
docker push gcr.io/PROJECT_ID/labgrandisol:latest

# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/secrets.yml
kubectl apply -f k8s/postgres.yml
kubectl apply -f k8s/redis.yml
kubectl apply -f k8s/deployment.yml
kubectl apply -f k8s/service.yml
kubectl apply -f k8s/ingress.yml

# Check deployment
kubectl get pods -n labgrandisol
kubectl logs -f deployment/labgrandisol -n labgrandisol
```

### Option 3: Traditional Server (VPS)

```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose

# 3. Clone repository
git clone https://github.com/labgrandisol/labgrandisol.git
cd labgrandisol

# 4. Configure environment
nano .env  # Edit with production values

# 5. Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 6. Setup SSL/TLS (Caddy handles automatically)
# 7. Configure backups

# 8. Monitor logs
docker-compose logs -f backend
```

## Health Checks & Monitoring

### API Health Check

```bash
curl -X GET http://localhost:3000/api/health \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-22T10:30:00.000Z",
  "version": "2.0.0",
  "database": "connected",
  "redis": "connected"
}
```

### Docker Health Status

```bash
# Check container health
docker ps --format 'table {{.Names}}\t{{.Status}}'

# View detailed logs
docker logs --tail 100 labgrandisol-api
docker logs --tail 100 labgrandisol-postgres
```

### Database Backup

```bash
# Manual backup
docker exec labgrandisol-postgres pg_dump -U postgres labgrandisol > backup.sql

# Automated backup (daily at 2 AM)
# Add to crontab:
0 2 * * * docker exec labgrandisol-postgres pg_dump -U postgres labgrandisol > /backups/lab-$(date +\%Y-\%m-\%d).sql

# Upload to S3
aws s3 cp /backups/lab-*.sql s3://your-backup-bucket/database/
```

## Security Checklist

- [ ] Update `.env` com senhas fortes (mínimo 32 caracteres)
- [ ] Configure HTTPS/TLS (Caddy automation)
- [ ] Setup SSH key authentication
- [ ] Enable firewall (ufw)
- [ ] Configure rate limiting
- [ ] Setup security headers
- [ ] Enable CORS whitelist
- [ ] Rotate JWT secrets regularmente
- [ ] Monitor logs para atividade suspeita
- [ ] Backup regular de dados
- [ ] Test disaster recovery

## Rollback Procedure

```bash
# 1. Check current version
docker inspect labgrandisol-api | grep "Image"

# 2. Pull previous version
docker pull YOUR_REGISTRY/labgrandisol:previous-tag

# 3. Stop current container
docker-compose down

# 4. Update docker-compose.yml to use previous tag
# 5. Start with previous version
docker-compose up -d

# 6. Verify health
curl http://localhost:3000/api/health

# 7. Monitor logs
docker-compose logs -f backend
```

## Performance Tuning

### Database
```sql
-- Increase connections
ALTER SYSTEM SET max_connections = 200;

-- Enable query parallelization
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;

-- Restart PostgreSQL
SELECT pg_reload_conf();
```

### Application
```env
# Node.js memory
NODE_OPTIONS=--max-old-space-size=2048

# Connection pooling
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
REDIS_POOL_SIZE=10
```

### Infrastructure
```yaml
# Resource limits
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 4G
    reservations:
      cpus: '2'
      memory: 2G
```

## Troubleshooting

### Container won't start
```bash
docker logs labgrandisol-api
docker inspect labgrandisol-api
```

### Database connection issues
```bash
# Test connection
docker exec labgrandisol-postgres psql -U postgres -d labgrandisol -c "SELECT 1"

# Check logs
docker logs labgrandisol-postgres
```

### High memory usage
```bash
# Check container stats
docker stats

# Restart backend
docker-compose restart backend

# Increase memory limit
# Edit docker-compose.yml and restart
```

## Monitoring & Logging

### Send logs to cloud
```bash
# Using Datadog
docker-compose exec backend npm install --save dd-trace

# Using Sentry for error tracking
export SENTRY_DSN=your_sentry_dsn
```

### Alert Setup
- CPU usage > 80%
- Memory usage > 85%
- Database response time > 500ms
- Error rate > 1%

---

Para mais informações, veja [ARCHITECTURE.md](ARCHITECTURE.md) e [README.md](README.md).
