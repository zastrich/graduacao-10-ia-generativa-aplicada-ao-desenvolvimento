# 📋 Task Tracker — Copiloto Corporativo com IA

## FASE 1 — Infraestrutura Base (IaC) ✅
- `[x]` 1.1 Criar `template.yaml` com SAM
- `[x]` 1.2 Definir DynamoDB Tables (KnowledgeBases, Conversations, Messages, Users)
- `[x]` 1.3 Definir S3 Bucket `conhecimento-ia-generativa`
- `[x]` 1.4 Definir S3 Bucket para frontend SPA
- `[x]` 1.5 Definir Lambda Functions (stubs) + API Gateway
- `[x]` 1.6 Configurar IAM Roles e Policies
- `[x]` 1.7 Criar README.md da infraestrutura

## FASE 2 — Backend: Foundation Layer ✅
- `[x]` 2.1 Inicializar projeto Node.js + TypeScript
- `[x]` 2.2 Criar utilitários (response builder, error handler, auth middleware)
- `[x]` 2.3 Criar camada de mocks locais (DynamoDB, S3, Bedrock)
- `[x]` 2.4 Configurar variáveis de ambiente local vs. produção

## FASE 3 — Backend: Auth + Usuários Admin ✅
- `[x]` 3.1 Handler `POST /auth/login`
- `[x]` 3.2 Handler `POST /auth/register`
- `[x]` 3.3 Middleware de autenticação JWT
- `[x]` 3.4 Service `UserService` com bcrypt

## FASE 4 — Backend: Bases de Conhecimento (CRUD) ✅
- `[x]` 4.1–4.5 CRUD completo de bases
- `[x]` 4.6–4.7 Upload e remoção de arquivos
- `[x]` 4.8 Links para crawl
- `[x]` 4.9 Service de parsing (PDF, XLSX, TXT)
- `[x]` 4.10 Retreino manual

## FASE 5 — Backend: Chat e Inferência ✅
- `[x]` 5.1 Handler `POST /chat/:slug`
- `[x]` 5.2 ChatService (RAG)
- `[x]` 5.3 BedrockService (abstração + mock)
- `[x]` 5.4–5.5 Listar/detalhar conversas
- `[x]` 5.6 Guardrails configuráveis

## FASE 6 — Backend: Endpoints Públicos ✅
- `[x]` 6.1 `GET /knowledge-bases` (público)
- `[x]` 6.2 `GET /knowledge-bases/:slug` (público)
- `[x]` 6.3 `GET /admin/logs`

## FASE 7 — Frontend: Setup + Design System ✅
- `[x]` 7.1 Criar projeto Vite + React + TypeScript
- `[x]` 7.2 Material UI + tema premium dark (glassmorphism, gradient palette)
- `[x]` 7.3 React Router setup
- `[x]` 7.4 Layout base (Sidebar + Main + Header)
- `[x]` 7.5 API client (Axios com interceptors JWT)

## FASE 8 — Frontend: Páginas Públicas ✅
- `[x]` 8.1 Home (`/`) — grid de cards com bases de conhecimento e busca
- `[x]` 8.2 Sidebar com histórico recente de conversas e lista de bases
- `[x]` 8.3 Página de Chat (`/:slug/chat`) — interface conversacional com input e scroll
- `[x]` 8.4 Integração Chat → Backend (`POST /chat/:slug`)
- `[x]` 8.5 Página de Conversa (`/:slug/chat/:uuid`) — resgate de conversas via URL
- `[x]` 8.6 Geração de UID anônimo no localStorage (`usr_...`)

## FASE 9 — Frontend: Área Administrativa ✅
- `[x]` 9.1 Página Login (`/admin/login`) — autenticação JWT
- `[x]` 9.2 Proteção de rotas admin (token no header)
- `[x]` 9.3 Dashboard Admin (`/admin`) — métricas e tabela de bases
- `[x]` 9.4 Formulário criar/editar base (`AdminKBModal`)
- `[x]` 9.5 Upload de arquivos por base (`AdminFilesModal`)
- `[x]` 9.6 Gestão de links para crawl (`AdminFilesModal`)
- `[x]` 9.7 Configurações de Bedrock por base (temperatura, top_p, top_k)
- `[x]` 9.8 Cadastro de administradores
- `[x]` 9.9 Página de logs de conversas (`/admin/logs`)
- `[x]` 9.10 Disparo de retreino manual por base

## FASE 10 — CI/CD + Deploy ✅
- `[x]` 10.1 Workflow `deploy-infra.yml` — deploy da stack SAM
- `[x]` 10.2 Workflow `deploy-backend.yml` — build + testes + deploy das Lambdas
- `[x]` 10.3 Workflow `deploy-frontend.yml` — build React SPA + sync S3 Bucket
- `[x]` 10.4 Configuração de secrets no GitHub Actions

## FASE 11 — Integração Real AWS (Pronto para Nuvem) ✅
- `[x]` 11.1 Abstração `BedrockService` chaveável para modelo real `google.gemma-3-4b-it`
- `[x]` 11.2 DynamoDB SDK e tabelas configuradas
- `[x]` 11.3 S3 SDK e bucket `conhecimento-ia-generativa` configurados
- `[x]` 11.4 Pipeline de RAG (Retrieval-Augmented Generation) com injeção de contexto no prompt

## FASE 12 — Documentação Final ✅
- `[x]` 12.1 `README.md` raiz com visão geral, arquitetura e instruções
- `[x]` 12.2 `src/backend/README.md` com documentação das APIs
- `[x]` 12.3 `src/frontend/README.md` com guia do React SPA
- `[x]` 12.4 `src/infrastructure/README.md` com especificações SAM
- `[x]` 12.5 `guia-de-execucao.md` e `implementation_plan.md` completamente alinhados
