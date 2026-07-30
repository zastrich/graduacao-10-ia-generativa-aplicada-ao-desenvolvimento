# Frontend — Copiloto Corporativo

SPA (Single Page Application) em **React 19 + TypeScript** com tema dark premium.

## Setup Local

```bash
npm install
npm run dev      # Dev server (porta 5173)
npm run build    # Build para producao (dist/)
```

O frontend se conecta a `VITE_API_URL` (env var em build time). Em desenvolvimento, usa `http://localhost:3001` (backend local).

## Tecnologias

- **React 19** + TypeScript
- **Vite** (bundler)
- **Material UI v6** (componentes + dark theme customizado)
- **TanStack Router** (rotas type-safe)
- **Axios** (HTTP client com interceptors para JWT e response wrapper)
- **react-markdown** (renderizacao de Markdown no chat)

## Estrutura

```
src/
├── api/
│   └── client.ts          # Axios instance + todos os endpoints
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      # Layout principal (sidebar + content)
│   │   └── Sidebar.tsx        # Menu lateral (permanente desktop, drawer mobile)
│   ├── chat/
│   │   ├── ChatBubble.tsx     # Mensagem com Markdown + agent name
│   │   ├── ChatHeader.tsx     # Info da base no topo do chat
│   │   └── ChatInput.tsx      # Input com auto-focus e envio
│   └── admin/
│       ├── AdminKBModal.tsx   # Criar/editar base (config, system prompt, agent name)
│       └── AdminFilesModal.tsx # Tabs: Arquivos + Links (upload, download, sitemap, retrain)
├── pages/
│   ├── HomePage.tsx           # Catalogo de bases com busca
│   ├── ChatPage.tsx           # Interface de chat conversacional
│   ├── AdminLoginPage.tsx     # Login/registro de admin
│   ├── AdminDashboard.tsx     # Tabela de bases + gestao de admins
│   └── AdminLogsPage.tsx      # Logs com filtros, paginacao e lazy-load
├── types/
│   └── index.ts               # Interfaces TypeScript (KnowledgeBase, Message, etc)
├── utils/
│   └── uid.ts                 # Geracao de UID anonimo + token admin (localStorage)
└── index.css                  # Variaveis CSS globais + reset
```

## Rotas

| Rota | Pagina | Descricao |
|------|--------|-----------|
| `/` | HomePage | Grid de bases disponiveis com busca |
| `/:slug/chat` | ChatPage | Chat com uma base (nova conversa) |
| `/:slug/chat/:uuid` | ChatPage | Conversa existente |
| `/admin/login` | AdminLoginPage | Login JWT (first-run: registro) |
| `/admin` | AdminDashboard | Gestao de bases, fontes, admins |
| `/admin/logs` | AdminLogsPage | Auditoria de conversas |

## Funcionalidades do Frontend

**Chat:**
- Mensagens renderizadas em Markdown (links clicaveis, listas, code blocks)
- Diferenciacao visual usuario (roxo, direita) vs IA (ciano, esquerda)
- Nome do agente configuravel por base
- Auto-focus no input ao entrar e apos enviar
- Memoria conversacional (historico mantido)
- Scroll automatico para ultima mensagem

**Admin:**
- Upload multi-arquivo (batches de 3, retry individual)
- Download de arquivos via presigned URL
- Import de sitemap (extrai URLs automaticamente)
- Adicionar/remover links
- Retreino assincrono com barra de progresso e auto-refresh (30s)
- Cancelamento de retreino em andamento
- Status por item (pending, success, error, skipped)
- System prompt e parametros do modelo editaveis
- Criacao de novos admins
- Logs com filtros por base e data, paginacao de 10

**Layout:**
- Sidebar permanente em desktop (>768px)
- Drawer com hamburger menu em mobile (<768px)
- Full-width (sem max-width constraint)
- Input de chat fixo no rodape

## Build de Producao

```bash
npm run build
```

Gera o bundle em `dist/`. O deploy para S3 e feito pela pipeline CI/CD (sync + CloudFront invalidation). Consulte `src/README.md` para configuracao das GitHub Variables necessarias.

## Variaveis de Ambiente (Build Time)

| Variavel | Descricao | Default |
|----------|-----------|---------|
| `VITE_API_URL` | URL base da API | `http://localhost:3001` |

Em producao, configurada via GitHub Variable `VITE_API_URL` ou derivada de `API_URL`.
