# 🤖 Backend — Copiloto Corporativo com IA

Backend serverless em **Node.js + TypeScript** para o Copiloto Corporativo.

## Tecnologias

- **Runtime:** Node.js 20 + TypeScript
- **Deploy:** AWS Lambda (via SAM)
- **Banco:** DynamoDB (mock local disponível)
- **Storage:** S3 (mock local disponível)
- **IA:** AWS Bedrock - Gemma 3 4b-it (mock local disponível)
- **Auth:** JWT + bcrypt

## Setup Local

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento (com mocks)
npm run dev

# Build
npm run build

# Testes
npm test
```

## Variáveis de Ambiente

| Variável | Descrição | Default (local) |
|----------|-----------|-----------------|
| `IS_LOCAL` | Ativa mocks locais | `true` |
| `PORT` | Porta do servidor local | `3001` |
| `JWT_SECRET` | Secret para JWT | `copiloto-jwt-secret-dev` |
| `BEDROCK_MODEL_ID` | ID do modelo Bedrock | `google.gemma-3-4b-it` |

## Endpoints

### Auth (Público)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Login com email/senha |
| POST | `/auth/register` | Registrar novo admin |

### Admin (Requer JWT)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/knowledge-bases` | Listar bases |
| POST | `/admin/knowledge-bases` | Criar base |
| GET | `/admin/knowledge-bases/:id` | Detalhe da base |
| PUT | `/admin/knowledge-bases/:id` | Editar base |
| DELETE | `/admin/knowledge-bases/:id` | Remover base |
| POST | `/admin/knowledge-bases/:id/files` | Upload de arquivo |
| DELETE | `/admin/knowledge-bases/:id/files/:fileId` | Remover arquivo |
| POST | `/admin/knowledge-bases/:id/links` | Adicionar link |
| POST | `/admin/knowledge-bases/:id/retrain` | Retreinar base |
| GET | `/admin/logs` | Logs de conversas |

### Público
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/knowledge-bases` | Listar bases (público) |
| GET | `/knowledge-bases/:slug` | Detalhe por slug |
| POST | `/chat/:slug` | Enviar mensagem |
| GET | `/conversations/:uid` | Conversas do usuário |
| GET | `/conversations/:uid/:id` | Detalhe da conversa |

## Arquitetura

```
src/
├── handlers/        # Entry points das Lambdas
├── services/        # Lógica de negócio
│   ├── dynamoService.ts   # Abstração DynamoDB (mock/real)
│   ├── s3Service.ts        # Abstração S3 (mock/real)
│   ├── bedrockService.ts   # Abstração Bedrock (mock/real)
│   ├── userService.ts      # CRUD de usuários
│   ├── knowledgeBaseService.ts  # CRUD de bases + RAG
│   └── chatService.ts      # Orquestração do chat
├── mocks/           # Mocks para desenvolvimento local
├── utils/           # Utilitários (auth, config, response, types)
└── server.ts        # Servidor HTTP local de desenvolvimento
```
