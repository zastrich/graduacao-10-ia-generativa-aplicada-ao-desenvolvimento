# Copiloto Corporativo com IA

Assistente corporativo inteligente que permite consultar bases de conhecimento em linguagem natural. Arquitetura Serverless na AWS com React SPA no frontend.

## Estrutura

```
src/
├── infrastructure/     # IaC (AWS SAM) — DynamoDB, S3, Lambda, API Gateway, CloudFront, Route53
├── backend/            # Node.js 24 + TypeScript — Handlers Lambda, RAG, Bedrock
└── frontend/           # React 19 + TypeScript — Material UI, TanStack Router, Vite
```

## Stack Tecnologica

| Camada | Tecnologias |
|--------|------------|
| IA | AWS Bedrock (google.gemma-3-4b-it), RAG com TF scoring |
| IaC | AWS SAM, CloudFormation |
| Backend | Node.js 24, TypeScript, Lambda, API Gateway REST |
| Dados | DynamoDB (5 tabelas), S3 |
| Frontend | React 19, TypeScript, Material UI v6, TanStack Router, Vite, react-markdown |
| CI/CD | GitHub Actions (sequencial: infra → backend → frontend) |
| DNS/CDN | Route53, CloudFront, ACM |

## Como Rodar Localmente

```bash
# Backend (porta 3001, mocks de S3/DynamoDB/Bedrock)
cd src/backend && npm install && npm run dev

# Frontend (porta 5173)
cd src/frontend && npm install && npm run dev

# Testes do backend
cd src/backend && npm test
```

O backend local usa mocks — nao precisa de credenciais AWS para desenvolvimento.

## Deploy (GitHub Actions)

A pipeline roda em sequencia ao fazer push na `main`:

```
1. Deploy Infrastructure (SAM build + deploy)
   ↓
2. Deploy Backend Lambdas (test + build)
   ↓
3. Deploy Frontend SPA (build + S3 sync + CloudFront invalidation)
```

Tambem pode ser disparada manualmente via `workflow_dispatch`.

## Configuracao do GitHub

### Secrets (obrigatorios)

| Secret | Descricao |
|--------|-----------|
| `AWS_ACCESS_KEY_ID` | Chave de acesso IAM com permissoes de deploy |
| `AWS_SECRET_ACCESS_KEY` | Chave secreta correspondente |
| `JWT_SECRET` | Segredo para assinar JWTs (min 32 chars). Gerar: `openssl rand -hex 64` |
| `CERTIFICATE_ARN` | ARN do certificado ACM em us-east-1 (wildcard ou SAN) |

### Variables (obrigatorias)

| Variable | Descricao | Exemplo |
|----------|-----------|---------|
| `AWS_REGION` | Regiao AWS | `us-east-1` |
| `DEPLOY_STAGE` | Ambiente | `prod` |
| `WEB_URL` | Subdominio do frontend | `copiloto.example.com` |
| `API_URL` | Subdominio da API | `copiloto-api.example.com` |
| `HOSTED_ZONE_ID` | ID da Hosted Zone Route53 | `Z0851491YVAOB1BFAMS` |
| `ALLOWED_ORIGIN` | Origem CORS | `https://copiloto.example.com` |
| `FRONTEND_S3_BUCKET` | Bucket do frontend | `copiloto-frontend-prod` |
| `CLOUDFRONT_DISTRIBUTION_ID` | ID da distribuicao CloudFront | `E23ZWQXFX7RLYY` |
| `VITE_API_URL` | (Opcional) URL da API para o frontend | `https://copiloto-api.example.com` |

### Variables (retrain — opcionais)

| Variable | Descricao | Default |
|----------|-----------|---------|
| `RETRAIN_BATCH_SIZE` | Links por batch no retreino | `10` |
| `RETRAIN_PARALLEL` | Processar em paralelo? | `false` |
| `RETRAIN_MAX_CONCURRENCY` | Max simultaneos (se paralelo) | `5` |

## Primeiro Deploy (Bootstrap)

1. Fork/clone o repositorio
2. Crie uma Hosted Zone no Route53 para seu dominio
3. Crie um certificado ACM em `us-east-1` (wildcard `*.seudominio.com`)
4. Configure Secrets e Variables no GitHub (tabelas acima)
5. No primeiro deploy, use `ALLOWED_ORIGIN=*` temporariamente
6. Apos deploy, copie os outputs da stack (bucket, distribution ID) e atualize as variables
7. Rode novamente com `ALLOWED_ORIGIN` correto

> Se o certificado e wildcard (`*.example.com`), os subdominios devem ter apenas um nivel (ex: `copiloto-api.example.com`, nao `api.copiloto.example.com`).

## Funcionalidades

- **RAG (Retrieval-Augmented Generation)** com scoring por frequencia + proximidade
- **Upload de arquivos** (PDF, TXT, XLSX, CSV, MD, JSON) com parsing automatico
- **Import de sitemap** — extrai URLs e adiciona como links
- **Link fetching** — no retrain, faz HTTP GET em cada link e indexa o conteudo
- **Normalizacao HTML** — strip de tags, conversao em texto limpo
- **Domain blocking** — se um dominio bloqueia, pula os links restantes
- **Retrain assincrono** — retorna imediatamente, processa em background (5 min max)
- **Status de retreino** — progresso em tempo real com auto-refresh (30s)
- **Cancelamento** — interrompe o retrain entre batches
- **Chat com Markdown** — respostas renderizadas com formatacao
- **Memoria conversacional** — historico enviado como multi-turn messages
- **Custom agent name** — nome configuravel por base
- **System prompt editavel** — guardrails e comportamento por base
- **Admin users** — admins podem criar novos admins
- **Delete cascade** — apagar KB remove arquivos, chunks, conversas e mensagens
- **Presigned URL** — download de arquivos originais via S3

## URLs do Frontend

| Rota | Descricao |
|------|-----------|
| `/` | Catalogo de bases com busca |
| `/:slug/chat` | Chat com base especifica |
| `/:slug/chat/:uuid` | Conversa existente |
| `/admin/login` | Login de administrador |
| `/admin` | Dashboard admin |
| `/admin/logs` | Logs com filtros, paginacao e lazy-load |
