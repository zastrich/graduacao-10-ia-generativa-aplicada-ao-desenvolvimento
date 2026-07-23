# 🏗️ Infraestrutura — Copiloto Corporativo com IA

Infraestrutura como código (IaC) utilizando **AWS SAM** (Serverless Application Model).

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
| `copiloto-frontend-{stage}` | Hosting do frontend SPA (React) |

### Lambda Functions
| Função | Handler | Rotas |
|--------|---------|-------|
| `copiloto-auth` | `handlers/auth.handler` | `POST /auth/login`, `POST /auth/register` |
| `copiloto-knowledge-bases` | `handlers/knowledgeBases.handler` | CRUD `/admin/knowledge-bases/*` |
| `copiloto-file-upload` | `handlers/files.handler` | Upload, Delete files, Add links |
| `copiloto-chat` | `handlers/chat.handler` | `POST /chat/{slug}` |
| `copiloto-conversations` | `handlers/conversations.handler` | `GET /conversations/{uid}/*` |
| `copiloto-public-kb` | `handlers/publicKnowledgeBases.handler` | `GET /knowledge-bases/*` |
| `copiloto-admin-logs` | `handlers/adminLogs.handler` | `GET /admin/logs` |

### API Gateway
- REST API com CORS habilitado
- Stage configurável (dev/staging/prod)

## Como Validar

```bash
# Instalar AWS SAM CLI (se não tiver)
# https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Validar o template
sam validate --template-file template.yaml

# Visualizar recursos
sam list resources --template-file template.yaml
```

## Como Deployar

```bash
# Build
sam build --template-file template.yaml

# Deploy guiado (primeira vez)
sam deploy --guided

# Deploy subsequente
sam deploy --template-file template.yaml --stack-name copiloto-corporativo --capabilities CAPABILITY_IAM
```

## Parâmetros

| Parâmetro | Descrição | Default |
|-----------|-----------|---------|
| `Stage` | Ambiente de deploy | `dev` |
| `JwtSecret` | Secret para assinar tokens JWT | (deve ser alterado em produção) |

## Arquitetura

```
API Gateway
    ├── /auth/*              → AuthFunction
    ├── /admin/knowledge-bases/* → KnowledgeBasesFunction
    ├── /admin/knowledge-bases/*/files/* → FileUploadFunction
    ├── /admin/knowledge-bases/*/links → FileUploadFunction
    ├── /admin/logs          → AdminLogsFunction
    ├── /chat/*              → ChatFunction
    ├── /conversations/*     → ConversationsFunction
    └── /knowledge-bases/*   → PublicKnowledgeBasesFunction
```
