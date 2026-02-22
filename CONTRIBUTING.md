# 🤝 Guia de Contribuição

Obrigado por considerar contribuir para o **LabGrandisol**! Este documento fornece diretrizes e instruções para contribuir.

## 📋 Código de Conduta

Este projeto adota um Código de Conduta para garantir um ambiente acolhedor e inclusivo. Leia o [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) antes de contribuir.

## 🚀 Como Contribuir

### 1. **Reporte de Bugs**

Se encontrou um bug, crie uma issue com:
- **Título descritivo**: Descreva brevemente o problema
- **Reprodução**: Passos para reproduzir o issue
- **Comportamento esperado**: O que deveria acontecer
- **Comportamento atual**: O que está acontecendo
- **Ambiente**: SO, navegador, versão Node.js, etc.
- **Screenshots**: Se aplicável

### 2. **Requisição de Funcionalidades**

Para sugerir uma nova funcionalidade:
- Use um **título claro e descritivo**
- Forneça uma **descrição detalhada**
- Explique porque seria **útil**
- Liste exemplos de como seria **usado**

### 3. **Pull Requests**

1. **Fork o repositório**
   ```bash
   git clone https://github.com/labgrandisol/labgrandisol.git
   cd labgrandisol
   ```

2. **Create uma branch**
   ```bash
   git checkout -b feature/sua-feature
   # ou para bugfix
   git checkout -b bugfix/seu-bugfix
   ```

3. **Instale as dependências**
   ```bash
   npm install  # root
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. **Faça as mudanças**
   - Mantenha o código consistente
   - Escreva testes para novas funcionalidades
   - Siga o estilo de código do projeto

5. **Teste suas mudanças**
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

6. **Commit com mensagens claras**
   ```bash
   git commit -m "feat: Adiciona nova feature"
   # ou
   git commit -m "fix: Corrige bug em auth"
   ```

7. **Push para sua fork**
   ```bash
   git push origin feature/sua-feature
   ```

8. **Abra um Pull Request**
   - Forneça uma descrição clara do que foi mudado
   - Linke qualquer issue relacionada
   - Descreva como foi testado

## 📝 Estilo de Código

### JavaScript/TypeScript
```typescript
// Use camelCase para variáveis e funções
const myVariable = value;
function myFunction() {}

// Use PascalCase para classes e componentes
class MyClass {}
function MyComponent() {}

// Use const por padrão
const immutable = true;
let mutable = false;

// Prefira arrow functions
const fn = () => {};
```

### Commits
Siga o [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` Uma nova funcionalidade
- `fix:` Uma correção de bug
- `docs:` Mudanças em documentação
- `style:` Formatação, falta de ponto-e-vírgula, etc
- `refactor:` Refatoração de código
- `perf:` Melhoria de performance
- `test:` Adição de testes

## 🏗️ Estrutura do Projeto

```
labgrandisol/
├── backend/          # API Express.js
├── frontend/         # React 18 + Vite
├── caddy/           # Proxy HTTPS
├── scripts/         # Automation scripts
├── jest.config.js   # Jest configuration
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 🧪 Testes

- Escreva testes para novas funcionalidades
- Mantenha a cobertura de testes acima de 80%
- Use descritivo nomes nos testes

```bash
# Rodar todos os testes
npm test

# Com coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📚 Documentação

- Mantenha o README atualizado
- Documente APIs com comentários JSDoc
- Adicione exemplos de uso
- Faça commit de alterações de docs simultaneamente às de código

## ✅ Checklist para PR

Antes de submeter seu PR, verifique:
- [ ] Código segue o estilo do projeto
- [ ] Linting passa (`npm run lint`)
- [ ] Testes passam (`npm test`)
- [ ] Build passa (`npm run build`)
- [ ] Commits têm mensagens claras e descriptivas
- [ ] Documentação foi atualizada
- [ ] Não há console.log ou debug logs

## 📖 Recursos Adicionais

- [Documentação da API](backend/openapi.json)
- [Architecture Decision Records](docs/adr/)
- [Setup Local](README.md#quickstart)

## 💬 Dúvidas?

- Abra uma issue para discussão
- Participe das discussions no GitHub
- Contate o time via hello@labgrandisol.com

---

**Obrigado por contribuir! 🎉**
