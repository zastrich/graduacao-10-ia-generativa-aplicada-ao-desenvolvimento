# Análise de Custos — Copiloto Corporativo com IA (AWS)

**Região:** us-east-1
**Cenário analisado:** conta AWS contendo *apenas* esta stack, sem nenhum consumo (zero requisições, zero dados armazenados, zero invocações).

## Resumo

> **Custo estimado parado: ~$0,00 / mês**

Esta é uma arquitetura 100% serverless. Todos os serviços utilizados seguem o modelo **pay-per-use**, sem taxas fixas mensais por existirem. O custo só aparece quando há uso real (requisições, armazenamento, invocações, tokens processados).

---

## Inventário de recursos e modelo de cobrança

### API Gateway
- `CopilotoApi` (REST API)
- Cobrança: por milhão de requisições recebidas + transferência de dados.
- Custo parado: **$0** (sem requisições, sem custo).

### DynamoDB (4 tabelas)
- `KnowledgeBasesTable`, `ConversationsTable`, `MessagesTable`, `UsersTable`
- Todas em modo `PAY_PER_REQUEST` (on-demand), com criptografia SSE ativada (`SSEType: KMS`).
- Cobrança: por unidade de leitura/escrita consumida (RRU/WRU) + GB armazenado/mês.
- Modo on-demand não tem taxas mínimas nem compromisso prévio.
- Custo parado: **$0** (tabelas vazias, sem tráfego).

### S3 (3 buckets)
- `LogsBucket` — destino de access logs, com versionamento e SSE-KMS.
- `KnowledgeBucket` — armazenamento de arquivos usados nas bases de conhecimento.
- `FrontendBucket` — serve o frontend via CloudFront (OAC), sem acesso público direto.
- Cobrança: por GB armazenado/mês + número de requisições (GET/PUT/etc).
- Custo parado: **$0** (buckets vazios).
- **Ponto de atenção:** o `LogsBucket` cresce sozinho assim que os outros dois buckets começarem a gerar tráfego (access logging habilitado), então ele nunca fica realmente "parado" em produção.

### CloudFront
- `FrontendDistribution` (CDN na frente do `FrontendBucket`) + `FrontendOAC` (Origin Access Control).
- `PriceClass_100`: distribuição limitada a edge locations da América do Norte e Europa (a opção mais barata).
- Cobrança: por GB de dados transferidos + número de requisições.
- Custo parado: **$0** (sem tráfego).

### Lambda (7 funções)
- `AuthFunction`, `KnowledgeBasesFunction`, `FileUploadFunction`, `ChatFunction`, `ConversationsFunction`, `PublicKnowledgeBasesFunction`, `AdminLogsFunction`
- Runtime Node.js 24.x, arquitetura x86_64.
- Cobrança: por número de invocações + tempo de execução (GB-segundo).
- Custo parado: **$0** (zero invocações).

### Amazon Bedrock (inferência de IA)
- Modelo: `google.gemma-3-4b-it`, invocado via `bedrock:InvokeModel` / `InvokeModelWithResponseStream` na `ChatFunction`.
- Modo on-demand, sem capacidade provisionada/reservada.
- Cobrança: por token de entrada e saída processado.
- Custo parado: **$0** (sem chamadas ao modelo).
- **Ponto de atenção:** essa costuma ser a maior linha de custo assim que o sistema entra em uso real.

### KMS (criptografia)
- O template usa `SSEType: KMS` nas tabelas DynamoDB e `SSEAlgorithm: aws:kms` nos buckets S3, **sem especificar uma chave própria** (`KMSMasterKeyId` não definido).
- Isso significa que as chaves usadas são as **gerenciadas pela AWS** (`aws/dynamodb`, `aws/s3`), que **não têm cobrança mensal por chave**.
- Se o template criasse uma CMK (Customer Managed Key) própria, haveria um custo fixo de ~$1/mês por chave — não é o caso aqui.
- Custo parado: **$0**.

### CloudWatch Logs
- Criados automaticamente pelas Lambdas (log groups), não estão explícitos no template.
- Cobrança: por GB ingerido + GB armazenado.
- Custo parado: **$0** (sem logs gerados).

---

## Tabela-resumo

| Recurso | Custo fixo mensal | Custo parado (zero uso) |
|---|---|---|
| API Gateway | Nenhum | $0 |
| DynamoDB (4 tabelas, on-demand) | Nenhum | $0 |
| S3 (3 buckets) | Nenhum | $0 |
| CloudFront + OAC | Nenhum | $0 |
| Lambda (7 funções) | Nenhum | $0 |
| Bedrock (Gemma 3 4b-it) | Nenhum | $0 |
| KMS (chaves gerenciadas AWS) | Nenhum | $0 |
| CloudWatch Logs | Nenhum | $0 |
| **Total** | — | **~$0,00/mês** |

---

## O que gera custo quando a stack estiver em uso

Para referência futura, os principais drivers de custo em produção seriam:

1. **Bedrock** — volume de tokens processados no chat (normalmente o maior custo).
2. **DynamoDB** — volume de leituras/escritas, especialmente pelos GSIs (cada índice secundário multiplica o custo de escrita da tabela).
3. **CloudFront** — volume de tráfego de saída do frontend.
4. **S3** — crescimento do `LogsBucket` por causa do access logging contínuo.
5. **Lambda** — número de invocações e duração (principalmente `ChatFunction` e `FileUploadFunction`, que têm timeout/memória maiores).