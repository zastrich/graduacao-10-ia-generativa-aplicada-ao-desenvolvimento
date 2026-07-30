# Backend — Copiloto Corporativo

Backend serverless em **Node.js 24 + TypeScript**. Cada handler e uma Lambda independente deployada via AWS SAM.

## Setup Local

```bash
npm install
npm run dev      # Servidor local com mocks (porta 3001)
npm test         # Testes unitarios (vitest)
npm run build    # Compila TypeScript
npm run build:lambda  # Build completo para deploy (tsc + node_modules no dist/)
```

O modo local (`IS_LOCAL=true`) ativa mocks de DynamoDB, S3 e Bedrock — nao precisa de credenciais AWS.

## Arquitetura

```
src/
├── handlers/           # Entry points das Lambdas (uma por recurso)
│   ├── auth.ts             # Login, register, status
│   ├── knowledgeBases.ts   # CRUD de bases + retrain + cancel
│   ├── files.ts            # Upload, download, links, sitemap
│   ├── chat.ts             # Envio de mensagens + RAG + Bedrock
│   ├── conversations.ts    # Listar, detalhar, deletar conversas
│   ├── publicKnowledgeBases.ts  # Listagem publica
│   └── adminLogs.ts        # Logs de conversas (admin)
├── services/           # Logica de negocio
│   ├── knowledgeBaseService.ts  # CRUD KB + retrain + buildContext (RAG)
│   ├── chatService.ts          # Orquestracao do chat (historico + Bedrock)
│   ├── bedrockService.ts       # Invocacao do modelo (Messages API format)
│   ├── userService.ts          # Auth (bcrypt + JWT)
│   ├── dynamoService.ts        # DynamoDB abstraction (paginado, appendToList)
│   └── s3Service.ts            # S3 abstraction (presigned URLs)
├── mocks/              # Mocks in-memory para dev local
├── utils/              # Config, types, auth, response, validators
└── server.ts           # Servidor HTTP local (simula API Gateway)
```

## Endpoints

### Auth (`/auth/*`)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/auth/status` | Verifica first-run (sem admin cadastrado) |
| POST | `/auth/login` | Login com email/senha → JWT |
| POST | `/auth/register` | Registrar admin (first-run ou admin autenticado) |

### Bases de Conhecimento (`/admin/knowledge-bases/*`) — requer JWT
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/admin/knowledge-bases` | Listar todas |
| POST | `/admin/knowledge-bases` | Criar nova base |
| GET | `/admin/knowledge-bases/:id` | Detalhe com arquivos e links |
| PUT | `/admin/knowledge-bases/:id` | Editar (nome, config, system prompt) |
| DELETE | `/admin/knowledge-bases/:id` | Remover (cascade: S3, chunks, conversas) |
| POST | `/admin/knowledge-bases/:id/retrain` | Iniciar retreino async |
| POST | `/admin/knowledge-bases/:id/cancel-retrain` | Cancelar retreino |

### Arquivos e Links (`/admin/knowledge-bases/:id/*`) — requer JWT
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `.../files` | Upload (JSON base64: fileName, fileContent, contentType) |
| GET | `.../files/:fileId` | Download (retorna presigned URL do S3) |
| DELETE | `.../files/:fileId` | Remover arquivo |
| POST | `.../links` | Adicionar link |
| DELETE | `.../links` | Remover link (body: {linkId}) |
| POST | `.../sitemap` | Importar sitemap (body: {url}) |

### Chat (`/chat/*`) — publico
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/chat/:slug` | Enviar mensagem (body: {message, userUid, conversationId?}) |

### Conversas (`/conversations/*`)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/conversations/:uid` | Listar conversas do usuario |
| GET | `/conversations/:uid/:id` | Detalhe com mensagens |
| DELETE | `/conversations/:uid/:id` | Deletar (verifica ownership) |

### Publico (`/knowledge-bases/*`)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/knowledge-bases` | Listar bases (campos publicos + sourceCount) |
| GET | `/knowledge-bases/:slug` | Detalhe por slug |

### Admin Logs (`/admin/logs`) — requer JWT
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/admin/logs` | Todas as conversas (para auditoria) |

## RAG (Retrieval-Augmented Generation)

O fluxo de consulta:

1. Usuario envia mensagem via `/chat/:slug`
2. `buildContext()` le `context.txt` do S3 (gerado pelo retrain)
3. Scoring TF + proximity seleciona os 5 trechos mais relevantes
4. System prompt + contexto + historico enviados ao Bedrock (Messages API)
5. Resposta salva em DynamoDB e retornada ao usuario

O retrain:
1. Re-parseia todos os arquivos (S3 → texto) e salva chunks no DynamoDB
2. Faz fetch de cada link (HTML → texto limpo, JSON mantido)
3. Consolida tudo em `{kbId}/context.txt` no S3
4. Processa em batches configuraveis (sequencial ou paralelo)

## Variaveis de Ambiente

Variaveis injetadas automaticamente pelo SAM no deploy. Para dev local, use `.env`:

| Variavel | Local | Descricao |
|----------|-------|-----------|
| `IS_LOCAL` | `true` | Ativa mocks |
| `PORT` | `3001` | Porta do servidor |
| `JWT_SECRET` | dev secret | Secret JWT |
| `AWS_REGION` | `us-east-1` | Regiao |
| `BEDROCK_MODEL_ID` | `google.gemma-3-4b-it` | Modelo |
| `RETRAIN_BATCH_SIZE` | `10` | Links por batch |
| `RETRAIN_PARALLEL` | `false` | Paralelo? |
| `RETRAIN_MAX_CONCURRENCY` | `5` | Max simultaneos |

Todas as tabelas DynamoDB e buckets S3 sao configurados via env vars injetadas pelo template SAM. Consulte `src/README.md` para a lista completa de GitHub Secrets e Variables.
