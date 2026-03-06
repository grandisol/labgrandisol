# 📖 LabGrandisol - Sistema de Biblioteca Virtual

Um sistema completo de biblioteca virtual com design vintage clássico, construído com tecnologias modernas.

![Version](https://img.shields.io/badge/version-2.1.0-burgundy)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)

## ✨ Características

### 🎨 Design Vintage Clássico
- Tema inspirado em bibliotecas clássicas e livrarias antigas
- Paleta de cores em tons de sépia, burgundy e dourado
- Tipografia elegante com fontes serifadas
- Ornamentos e detalhes decorativos

### 📚 Funcionalidades Principais
- **Acervo Digital**: Catálogo completo com busca avançada
- **Almanaque Botânico**: Enciclopédia de plantas, famílias botânicas e expedições de campo
- **Sistema de Empréstimos**: Gestão completa de empréstimos e devoluções
- **Lista de Leitura**: Organize livros por status (quero ler, lendo, concluído)
- **Comunidade**: Rede social para leitores
- **Relatórios**: Análises e estatísticas de uso

### 🔧 Recursos Técnicos
- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL
- **Cache**: Redis
- **Autenticação**: JWT

## 🚀 Instalação Rápida

```powershell
# Clone o repositório
git clone https://github.com/grandisol/labgrandisol.git
cd labgrandisol

# Execute o script de inicialização
.\init.ps1
```

## 📁 Estrutura do Projeto

```
labgrandisol/
├── frontend/           # Aplicação React
│   ├── src/
│   │   ├── pages/      # Páginas da aplicação
│   │   ├── styles/     # Estilos CSS por página
│   │   ├── store/      # Estado global (Zustand)
│   │   └── api/        # Cliente HTTP
│   └── dist/           # Build de produção
├── backend/            # API Node.js
│   ├── routes/         # Endpoints da API
│   ├── middleware/     # Middlewares Express
│   ├── utils/          # Utilitários
│   └── public/         # Arquivos estáticos
├── caddy/              # Configuração do proxy
└── scripts/            # Scripts de automação
```

## 🎨 Sistema de Design

### Paleta de Cores
| Nome | Código | Uso |
|------|--------|-----|
| Burgundy | `#722F37` | Cor principal |
| Gold | `#B8860B` | Acentos |
| Sepia | `#2C2416` | Fundos escuros |
| Cream | `#F5F0E6` | Fundos claros |
| Forest | `#2D4A3E` | Sucesso |

### Tipografia
- **Display**: Playfair Display (títulos)
- **Body**: Lora (texto corrido)
- **Sans**: Source Sans 3 (interface)

## 📱 Páginas Principais

| Rota | Descrição |
|------|-----------|
| `/` | Página inicial |
| `/login` | Autenticação |
| `/library` | Catálogo de livros |
| `/books/:id` | Detalhes do livro |
| `/my-loans` | Meus empréstimos |
| `/reading-list` | Lista de leitura |
| `/museum` | Almanaque Botânico |
| `/social` | Comunidade |
| `/reports` | Relatórios |
| `/dashboard` | Painel do usuário |
| `/admin` | Administração |

## 🔐 Credenciais de Demo

```
Email: admin@labgrandisol.com
Senha: admin123
```

## 🛠️ Scripts Disponíveis

```powershell
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Linting
npm run lint

# Testes
npm test
```

## 📖 Documentação

- [Arquitetura](./ARCHITECTURE.md)
- [Deploy](./DEPLOYMENT.md)
- [Contribuição](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Desenvolvido com ❤️ pela equipe LabGrandisol