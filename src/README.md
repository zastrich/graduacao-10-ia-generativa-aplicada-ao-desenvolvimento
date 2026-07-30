# Copiloto Corporativo com IA — AWS Bedrock (Google Gemma 3 4b-it)

Assistente corporativo inteligente que permite consultar bases de conhecimento em linguagem natural, desenvolvido com arquitetura **Serverless** na AWS (AWS Lambda, S3, DynamoDB, API Gateway, AWS Bedrock) e **React SPA** no frontend.

---

## Estrutura do Projeto

```
/
├── src/
│   ├── infrastructure/     # IaC com AWS SAM (template.yaml)
│   ├── backend/            # APIs Node.js (TypeScript, Handlers Lambda)
│   └── frontend/           # React SPA (TypeScript, Material UI, Vite)
├── .github/workflows/      # CI/CD GitHub Actions (infra → backend → frontend)
└── .env.example            # Template de variaveis e secrets
```

---

## Tecnologias

- **IA:** AWS Bedrock (`google.gemma-3-4b-it`)
- **IaC:** AWS SAM + CloudFormation
- **Backend:** Node.js 24, TypeScript, AWS Lambda, API Gateway REST
- **Banco & Storage:** DynamoDB (4 tabelas + chunks), S3
- **Frontend:** React 19, TypeScript, Material UI v6, TanStack Router, Vite
- **CI/CD:** GitHub Actions (deploy sequencial: infra → backend → frontend)

---

## Como Rodar Localmente

```bash
# Backend (mock local)
cd src/backend && npm install && npm run dev

# Frontend
cd src/frontend && npm install && npm run dev

# Testes
cd src/backend && npm test
```

---

## Configuracao do GitHub Actions (Secrets e Variables)

### Secrets (Settings → Secrets and variables → Actions → Secrets)

| Secret | Descricao | Como obter |
|--------|-----------|-----------|
| `AWS_ACCESS_KEY_ID` | Chave de acesso IAM | IAM Console → Users → Security credentials |
| `AWS_SECRET_ACCESS_KEY` | Chave secreta IAM | Gerada junto com a access key |
| `JWT_SECRET` | Segredo JWT (min 32 chars) | `openssl rand -hex 64` |
| `CERTIFICATE_ARN` | ARN do certificado ACM (us-east-1) | ACM Console |

### Variables (Settings → Secrets and variables → Actions → Variables)

#### Regiao e Ambiente

| Variable | Descricao | Default | Exemplo |
|----------|-----------|---------|---------|
| `AWS_REGION` | Regiao AWS | `us-east-1` | `us-east-1` |
| `DEPLOY_STAGE` | Ambiente (dev/staging/prod) | `prod` | `prod` |

#### Dominios e DNS

| Variable | Descricao | Exemplo |
|----------|-----------|---------|
| `WEB_URL` | Subdominio do frontend | `copiloto-corporativo.code200.com.br` |
| `API_URL` | Subdominio da API | `copiloto-corporativo-api.code200.com.br` |
| `HOSTED_ZONE_ID` | ID da Hosted Zone Route53 | `Z0851491YVAOB1BFAMS` |
| `ALLOWED_ORIGIN` | Origem CORS (https://WEB_URL) | `https://copiloto-corporativo.code200.com.br` |

#### Frontend

| Variable | Descricao | Exemplo |
|----------|-----------|---------|
| `VITE_API_URL` | URL da API (opcional, usa API_URL se vazio) | `https://copiloto-corporativo-api.code200.com.br` |
| `FRONTEND_S3_BUCKET` | Bucket S3 do frontend | `copiloto-frontend-prod` |
| `CLOUDFRONT_DISTRIBUTION_ID` | ID da distribuicao CloudFront | `E23ZWQXFX7RLYY` |

#### Retrain (Processamento de Links)

| Variable | Descricao | Default | Opcoes |
|----------|-----------|---------|--------|
| `RETRAIN_BATCH_SIZE` | Links processados por batch | `10` | Qualquer inteiro > 0 |
| `RETRAIN_PARALLEL` | Processar links em paralelo? | `false` | `true` / `false` |
| `RETRAIN_MAX_CONCURRENCY` | Max links simultaneos (se paralelo) | `5` | 1-20 |

**Nota sobre retrain:**
- Com `RETRAIN_PARALLEL=false` (default): links sao processados sequencialmente em batches de `RETRAIN_BATCH_SIZE`. Mais seguro, menos risco de rate limiting.
- Com `RETRAIN_PARALLEL=true`: cada batch processa ate `RETRAIN_MAX_CONCURRENCY` links simultaneamente. Mais rapido, mas pode causar bloqueios em dominios com rate limiting.
- O retrain roda de forma **assincrona** — o endpoint retorna imediatamente com status 202 e o processamento continua em background (Lambda timeout: 5 min).

---

## Pipeline CI/CD

A pipeline executa em cadeia sequencial, disparada apenas em push/merge na `main`:

```
Push na main
    ↓
1. Deploy Infrastructure (SAM build + deploy)
    ↓ (so se sucesso)
2. Deploy Backend Lambdas (test + build validation)
    ↓ (so se sucesso)
3. Deploy Frontend SPA (build + S3 sync + CloudFront invalidation)
```

Tambem pode ser disparada manualmente via `workflow_dispatch`.

---

## URLs do Frontend

| Rota | Descricao |
|------|-----------|
| `/` | Catalogo de bases de conhecimento |
| `/:slug/chat` | Chat com uma base especifica |
| `/:slug/chat/:uuid` | Historico de conversa |
| `/admin/login` | Login de administrador |
| `/admin` | Dashboard admin (bases, arquivos, links, usuarios) |
| `/admin/logs` | Logs de conversas com filtros e paginacao |

---

## Funcionalidades

- **RAG (Retrieval-Augmented Generation):** busca por relevancia (TF + proximity) nos documentos da base
- **Multi-file upload:** upload em batches de 3, com status individual e retry
- **Sitemap import:** importa URLs de um sitemap.xml como fontes
- **Link fetching:** no retrain, faz fetch de cada link e indexa o conteudo (HTML stripped, JSON preservado)
- **Domain blocking:** se um dominio bloqueia (403/429/timeout), pula todos os links restantes desse dominio
- **Markdown chat:** respostas da IA renderizadas em Markdown com links clicaveis
- **Custom agent name:** nome configuravel por base (exibido no chat)
- **Admin users:** admins podem criar novos admins
- **Conversation memory:** historico enviado como multi-turn messages ao Bedrock
- **Delete cascade:** apagar uma base remove arquivos (S3), chunks, conversas e mensagens

---

## Licenca e Uso Academico

Desenvolvido como projeto pratico para o curso de Graduacao em IA e Automacao Digital.
