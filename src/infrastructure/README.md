# 🏗️ Infraestrutura — Copiloto Corporativo com IA

Infraestrutura como código (IaC) utilizando **AWS SAM** (Serverless Application Model).

## Pré-requisitos

1. [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) instalado
2. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configurado
3. Certificado ACM (wildcard ou SAN) cobrindo os domínios `WEB_URL` e `API_URL` — **obrigatoriamente em us-east-1** (requisito do CloudFront)
4. Hosted Zone no Route53 já existente para o domínio raiz

## Recursos Criados

### DynamoDB Tables
| Tabela | Chave Primária | GSIs |
|--------|---------------|------|
| `copiloto-knowledge-bases-{stage}` | `id` (HASH) | `slug-index` |
| `copiloto-conversations-{stage}` | `id` (HASH) | `userUid-index`, `knowledgeBase-index` |
| `copiloto-messages-{stage}` | `conversationId` (HASH) + `createdAt` (RANGE) | — |
| `copiloto-users-{stage}` | `id` (HASH) | `email-index` |

### S3 Buckets
| Bucket | Finalidade |
|--------|-----------|
| `conhecimento-ia-generativa-{stage}` | Arquivos das bases de conhecimento |
| `copiloto-frontend-{stage}` | Hosting do frontend SPA (React) via CloudFront |
| `copiloto-logs-{stage}` | Access logs centralizados |

### CloudFront + Custom Domain
| Recurso | Descrição |
|---------|-----------|
| `FrontendDistribution` | CDN com HTTPS, SPA fallback (403/404 → index.html), Security Headers |
| `FrontendOAC` | Origin Access Control — S3 privado, acesso apenas via CloudFront |
| `SecurityHeadersPolicy` | HSTS, X-Content-Type-Options, X-Frame-Options, CSP |

### API Gateway + Custom Domain
| Recurso | Descrição |
|---------|-----------|
| `CopilotoApi` | REST API com CORS |
| `ApiCustomDomain` | Custom domain regional com TLS 1.2 |
| `ApiBasePathMapping` | Mapeia o domínio customizado para o stage da API |

### Route53 DNS
| Registro | Tipo | Destino |
|----------|------|---------|
| `{WebDomain}` | A (Alias) | CloudFront Distribution |
| `{ApiDomain}` | A (Alias) | API Gateway Regional Domain |

### Lambda Functions
| Função | Handler | Rotas |
|--------|---------|-------|
| `copiloto-auth` | `handlers/auth.handler` | `GET /auth/status`, `POST /auth/login`, `POST /auth/register` |
| `copiloto-knowledge-bases` | `handlers/knowledgeBases.handler` | CRUD `/admin/knowledge-bases/*` |
| `copiloto-file-upload` | `handlers/files.handler` | Upload, Delete files, Add links |
| `copiloto-chat` | `handlers/chat.handler` | `POST /chat/{slug}` |
| `copiloto-conversations` | `handlers/conversations.handler` | `GET /conversations/{uid}/*` |
| `copiloto-public-kb` | `handlers/publicKnowledgeBases.handler` | `GET /knowledge-bases/*` |
| `copiloto-admin-logs` | `handlers/adminLogs.handler` | `GET /admin/logs` |

## Configuração do GitHub

### Secrets (Settings → Secrets and variables → Actions → Secrets)

| Secret | Descrição | Como obter |
|--------|-----------|-----------|
| `AWS_ACCESS_KEY_ID` | Chave de acesso IAM | IAM Console → Users → Security credentials |
| `AWS_SECRET_ACCESS_KEY` | Chave secreta IAM | Gerada junto com a access key |
| `JWT_SECRET` | Segredo para assinar JWTs (min 32 chars) | `openssl rand -hex 64` |
| `CERTIFICATE_ARN` | ARN do certificado ACM (us-east-1) | ACM Console → copie o ARN |

### Variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Descrição | Exemplo |
|----------|-----------|---------|
| `AWS_REGION` | Região AWS para deploy | `us-east-1` |
| `DEPLOY_STAGE` | Ambiente (dev/staging/prod) | `prod` |
| `WEB_URL` | Subdomínio do frontend | `copiloto-corporativo.code200.com.br` |
| `API_URL` | Subdomínio da API | `copiloto-corporativo-api.code200.com.br` |
| `HOSTED_ZONE_ID` | ID da Hosted Zone Route53 | `Z0851491YVAOB1BFAMS` |
| `ALLOWED_ORIGIN` | Origem CORS (https://WEB_URL) | `https://copiloto-corporativo.code200.com.br` |
| `FRONTEND_S3_BUCKET` | Nome do bucket do frontend | `copiloto-frontend-prod` |
| `CLOUDFRONT_DISTRIBUTION_ID` | ID da distribuição CloudFront | `E23ZWQXFX7RLYY` |
| `VITE_API_URL` | (Opcional) URL completa da API para o frontend | `https://copiloto-corporativo-api.code200.com.br` |

> **Nota:** Se `VITE_API_URL` não for definida, o workflow usa `https://{API_URL}` automaticamente.

> **Atenção:** Se seu certificado ACM é wildcard (ex: `*.code200.com.br`), ele cobre apenas **um nível** de subdomínio. Use `app-api.code200.com.br` e não `api.app.code200.com.br`.

## Como Clonar e Subir do Zero

1. **Fork/Clone** o repositório
2. **Crie a Hosted Zone** no Route53 (se ainda não existir) — a pipeline **não** cria a zona
3. **Crie o certificado ACM** em `us-east-1` cobrindo `*.seudominio.com` (ou os subdomínios específicos)
4. **Configure os Secrets e Variables** no GitHub conforme as tabelas acima
5. **Faça push para `main`** — os workflows rodarão na ordem: infra → backend → frontend
6. Após o primeiro deploy, os outputs da stack fornecem `FRONTEND_S3_BUCKET` e `CLOUDFRONT_DISTRIBUTION_ID`

### Primeiro Deploy (bootstrap)

No primeiro deploy, se você ainda não tem o `CLOUDFRONT_DISTRIBUTION_ID`:
1. Configure `ALLOWED_ORIGIN=*` temporariamente
2. Rode o workflow de infra
3. Copie os outputs da stack (bucket name, distribution ID)
4. Atualize as variáveis no GitHub
5. Rode novamente com o `ALLOWED_ORIGIN` correto

## Como Validar Localmente

```bash
cd src/infrastructure
sam validate
sam build
```

## Como Deployar Manualmente

```bash
cd src/backend && npm ci && npm run build && cd ../infrastructure

sam build
sam deploy \
  --resolve-s3 \
  --no-confirm-changeset \
  --stack-name copiloto-corporativo-stack \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --parameter-overrides \
    Stage=prod \
    JwtSecret="<seu-jwt-secret>" \
    AllowedOrigin="https://copiloto-corporativo.code200.com.br" \
    HostedZoneId="Z0851491YVAOB1BFAMS" \
    WebDomain="copiloto-corporativo.code200.com.br" \
    ApiDomain="copiloto-corporativo-api.code200.com.br" \
    CertificateArn="arn:aws:acm:us-east-1:ACCOUNT:certificate/UUID"
```

## Parâmetros do Template

| Parâmetro | Descrição | Default |
|-----------|-----------|---------|
| `Stage` | Ambiente de deploy | `dev` |
| `JwtSecret` | Secret para assinar tokens JWT | (obrigatório) |
| `BedrockModelId` | ID do modelo Bedrock | `google.gemma-3-4b-it` |
| `AllowedOrigin` | Origem CORS | `*` |
| `HostedZoneId` | ID da Hosted Zone Route53 | `''` (DNS não criado) |
| `WebDomain` | Domínio do frontend | `''` (sem custom domain) |
| `ApiDomain` | Domínio da API | `''` (sem custom domain) |
| `CertificateArn` | ARN do certificado ACM | `''` (sem custom domain) |

> Quando `HostedZoneId`, `WebDomain`/`ApiDomain`, e `CertificateArn` são fornecidos, os registros DNS e custom domains são criados automaticamente. Se omitidos, a aplicação funciona com os endpoints padrão (*.cloudfront.net e *.execute-api).

## Arquitetura

```
Route53 (DNS)
    ├── copiloto-corporativo.code200.com.br → CloudFront
    └── copiloto-corporativo-api.code200.com.br → API Gateway Custom Domain

CloudFront (CDN + HTTPS + Security Headers)
    └── S3 (copiloto-frontend-{stage}) via OAC

API Gateway (Custom Domain + CORS)
    ├── /auth/*              → AuthFunction
    ├── /admin/knowledge-bases/* → KnowledgeBasesFunction
    ├── /admin/knowledge-bases/*/files/* → FileUploadFunction
    ├── /admin/knowledge-bases/*/links → FileUploadFunction
    ├── /admin/logs          → AdminLogsFunction
    ├── /chat/*              → ChatFunction
    ├── /conversations/*     → ConversationsFunction
    └── /knowledge-bases/*   → PublicKnowledgeBasesFunction
```
