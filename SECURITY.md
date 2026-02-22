# 🔒 Security Policy

## Reporting a Vulnerability

Se você descobrir uma vulnerabilidade de segurança, **NÃO** crie um issue público. Em vez disso:

### ⚠️ **IMPORTANTE: Reportar Segurança com Responsabilidade**

1. **Email**: Envie um email para `security@labgrandisol.com` com:
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Attachments (se aplicável)

2. **Prazo de Resposta**: Você receberá uma confirmação dentro de 24-48 horas

3. **Timeline Responsável**:
   - 7 dias: Reconhecimento inicial
   - 30 dias: Plano de correção
   - 60 dias: Patch lançado

### 🔐 Práticas de Segurança

#### Senhas e Secrets
- Nunca commite `.env` ou arquivos com secrets
- Use `.env.example` como template
- Rotacione PII regularmente
- Use senhas fortes (mínimo 16 caracteres)

#### Autenticação
- JWT tokens: 24h expiration
- Refresh tokens: 7d expiration
- Rate limiting: 100 requests/15min
- CORS: Whitelist apenas domínios confiáveis

#### Dados
- Criptografe senhas com bcrypt (rounds=10)
- Use HTTPS em produção
- Implemente SSL/TLS 1.2+
- Valide todos os inputs

#### Dependências
- Mantenha dependências atualizadas
- Execute `npm audit` regularmente
- Use `npm token` em CI/CD
- Revise changelogs antes de atualizar

### 🛡️ Segurança do Container

- Use Alpine Linux (imagem base mínima)
- Rode como non-root user
- Scaneie com Trivy antes de push
- Limpe cache de apt/npm
- Use secrets do Docker para valores sensíveis

### 🔍 Verificação de Segurança

Executamos automaticamente:
- ✅ Secret scanning (TruffleHog)
- ✅ Vulnerability scanning (npm audit)
- ✅ Container scanning (Trivy)
- ✅ Code analysis (CodeQL)
- ✅ License compliance check

### 📋 Checklist de Segurança

Antes de commitar, verifique:
- [ ] Nenhum secret em código
- [ ] Inputs são validados
- [ ] Senhas são hashadas
- [ ] Erros não expõem informações sensíveis
- [ ] Rate limiting está ativado
- [ ] CORS está restrito
- [ ] Logs não contêm PII

### 🚨 Resposta a Incidentes

Se uma vulnerabilidade é descoberta em produção:
1. Isole o sistema
2. Notifique o time
3. Crie um patch
4. Teste completamente
5. Deploy em staging
6. Monitore em produção

---

**Obrigado por ajudar a manter o LabGrandisol seguro!** 🛡️
