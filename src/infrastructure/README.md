# Infraestrutura — Copiloto Corporativo

Infraestrutura como codigo (IaC) com **AWS SAM** (Serverless Application Model). Um unico `template.yaml` define todos os recursos.

## Pre-requisitos

1. [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
2. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configurado
3. Hosted Zone no Route53 para o dominio (a pipeline nao cria a zona)
4. Certificado ACM em `us-east-1` cobrindo os subdominios (wildcard ou SAN)

## Recursos Criados

### DynamoDB (5 tabelas)

| Tabela | Chave | GSIs | Finalidade |
|--------|-------|------|-----------|
| `copiloto-knowledge-bases-{stage}` | `id` | `slug-index` | Metadados das bases |
| `copiloto-chunks-{stage}` | `knowledgeBaseId` + `fileId` | — | Conteudo parseado (RAG) |
| `copiloto-conversations-{stage}` | `id` | `userUid-index`, `knowledgeBase-index` | Conversas |
| `copiloto-messages-{stage}` | `conversationId` + `createdAt` | — | Mensagens |
| `copiloto-users-{stage}` | `id` | `email-index` | Admins |

### S3 (3 buckets)

| Bucket | Finalidade |
|--------|-----------|
| `conhecimento-ia-generativa-{stage}` | Arquivos das bases + context.txt |
| `copiloto-frontend-{stage}` | Frontend SPA (via CloudFront OAC) |
| `copiloto-logs-{stage}` | Access logs centralizados |

### CloudFront

- CDN + HTTPS para o frontend
- Origin Access Control (OAC) — S3 privado
- Security Headers (HSTS, CSP, X-Frame-Options)
- Custom domain com certificado ACM (condicional)
- SPA fallback (403/404 → index.html)

### API Gateway

- REST API com CORS
- Custom domain regional com TLS 1.2 (condicional)
- Base path mapping para o stage

### Route53

- Registro A (Alias) para CloudFront (frontend)
- Registro A (Alias) para API Gateway (API)
- Condicionais — so criados se HostedZoneId + dominio + cert forem fornecidos

### Lambda Functions (7)

| Funcao | Timeout | Memoria | Rotas |
|--------|---------|---------|-------|
| `copiloto-auth` | 30s | 256MB | `/auth/*` |
| `copiloto-knowledge-bases` | 300s | 512MB | `/admin/knowledge-bases/*`, retrain |
| `copiloto-file-upload` | 120s | 512MB | `files/*`, `links/*`, `sitemap` |
| `copiloto-chat` | 120s | 512MB | `/chat/*` |
| `copiloto-conversations` | 30s | 256MB | `/conversations/*` |
| `copiloto-public-kb` | 30s | 256MB | `/knowledge-bases/*` |
| `copiloto-admin-logs` | 30s | 256MB | `/admin/logs` |

## Parametros do Template

| Parametro | Default | Descricao |
|-----------|---------|-----------|
| `Stage` | `dev` | Ambiente (dev/staging/prod) |
| `JwtSecret` | (obrigatorio) | Secret para JWTs (min 32 chars) |
| `BedrockModelId` | `google.gemma-3-4b-it` | Modelo de IA |
| `AllowedOrigin` | `*` | Origem CORS |
| `HostedZoneId` | `''` | ID da zona Route53 |
| `WebDomain` | `''` | Subdominio frontend |
| `ApiDomain` | `''` | Subdominio API |
| `CertificateArn` | `''` | ARN do certificado ACM |
| `RetrainBatchSize` | `10` | Links por batch no retrain |
| `RetrainParallel` | `false` | Processamento paralelo |
| `RetrainMaxConcurrency` | `5` | Max simultaneos |

> Dominios e DNS sao condicionais. Se os parametros de dominio forem vazios, a aplicacao funciona com os endpoints padrao (*.cloudfront.net e *.execute-api).

## Validar Localmente

```bash
cd src/infrastructure
sam validate
sam build
```

## Deploy Manual

```bash
cd src/backend && npm ci && npm run build:lambda
cd ../infrastructure && sam build

sam deploy \
  --resolve-s3 \
  --no-confirm-changeset \
  --stack-name copiloto-corporativo-stack \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --parameter-overrides \
    Stage=prod \
    JwtSecret="<secret>" \
    AllowedOrigin="https://copiloto.example.com" \
    HostedZoneId="ZXXXXX" \
    WebDomain="copiloto.example.com" \
    ApiDomain="copiloto-api.example.com" \
    CertificateArn="arn:aws:acm:us-east-1:ACCOUNT:certificate/UUID"
```

## Bootstrap (Primeiro Deploy)

1. Configure `ALLOWED_ORIGIN=*` e deixe dominios vazios
2. Rode o deploy
3. Copie outputs da stack: `FrontendBucketName`, `CloudFrontDistributionId`
4. Configure as variables no GitHub com os valores obtidos
5. Atualize `ALLOWED_ORIGIN` para o dominio real
6. Rode novamente

## Diagrama de Arquitetura

```
Route53
├── copiloto.example.com → CloudFront Distribution
└── copiloto-api.example.com → API Gateway Custom Domain

CloudFront (CDN + HTTPS + Security Headers + OAC)
└── S3 (copiloto-frontend-{stage})

API Gateway REST (CORS + Custom Domain)
├── /auth/*                          → AuthFunction
├── /admin/knowledge-bases/*         → KnowledgeBasesFunction
├── /admin/knowledge-bases/*/files/* → FileUploadFunction
├── /admin/knowledge-bases/*/links   → FileUploadFunction
├── /admin/knowledge-bases/*/sitemap → FileUploadFunction
├── /admin/logs                      → AdminLogsFunction
├── /chat/*                          → ChatFunction
├── /conversations/*                 → ConversationsFunction
└── /knowledge-bases/*               → PublicKnowledgeBasesFunction

DynamoDB (knowledge-bases, chunks, conversations, messages, users)
S3 (conhecimento-ia-generativa — arquivos + context.txt)
Bedrock (google.gemma-3-4b-it — inferencia)
```

Para a lista completa de GitHub Secrets e Variables necessarias para o deploy via CI/CD, consulte `src/README.md`.
