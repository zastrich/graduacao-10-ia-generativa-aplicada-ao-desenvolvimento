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
- `[/]` 2.4 Configurar variáveis de ambiente local vs. produção (npm install em andamento)

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

## FASE 7 — Frontend: Setup + Design System
- `[ ]` 7.1 Criar projeto Vite + React + TypeScript
- `[ ]` 7.2 Material UI + tema premium
- `[ ]` 7.3 TanStack Router + Query
- `[ ]` 7.4 Layout base (Sidebar + Main + AppBar)
- `[ ]` 7.5 API client

## FASE 8 — Frontend: Páginas Públicas
- `[ ]` 8.1–8.6 Home, Chat, Sidebar, Conversas

## FASE 9 — Frontend: Área Administrativa
- `[ ]` 9.1–9.10 Login, Dashboard, CRUD, Upload, Logs

## FASE 10 — CI/CD + Deploy
- `[ ]` 10.1–10.4 GitHub Actions workflows

## FASE 11 — Integração Real AWS
- `[ ]` 11.1–11.4 Bedrock, DynamoDB, S3 reais

## FASE 12 — Documentação Final
- `[ ]` 12.1–12.5 READMEs + Screenshots
