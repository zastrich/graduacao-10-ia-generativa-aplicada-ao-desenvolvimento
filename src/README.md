# 🤖 Copiloto Corporativo com IA — AWS Bedrock (Google Gemma 3 4b-it)

Assistente corporativo inteligente que permite consultar bases de conhecimento em linguagem natural, desenvolvido com arquitetura **Serverless** na AWS (AWS Lambda, S3, DynamoDB, API Gateway, AWS Bedrock) e **React SPA** no frontend.

---

## 🏛️ Estrutura da Arquitetura do Projeto

```
/
├── src/
│   ├── infrastructure/     # IaC com AWS SAM (template.yaml, IAM roles, S3, DynamoDB)
│   ├── backend/            # APIs em Node.js (TypeScript, Handlers Lambda, Service Layer, Mocks)
│   └── frontend/           # React SPA (TypeScript, Material UI Dark Mode, Axios, Vite)
├── .github/
│   └── workflows/          # Workflows do GitHub Actions (CI/CD para infra, backend e frontend)
├── guia-de-execucao.md     # Requisitos e especificações do projeto
├── implementation_plan.md  # Plano detalhado de implementação por fases
└── task.md                 # Acompanhamento de progresso e tarefas
```

---

## 🚀 Tecnologias Utilizadas

- **Inteligência Artificial:** AWS Bedrock (`google.gemma-3-4b-it`)
- **Infraestrutura como Código:** AWS SAM (Serverless Application Model) & CloudFormation
- **Backend:** Node.js, TypeScript, AWS Lambda, API Gateway REST
- **Banco de Dados & Storage:** AWS DynamoDB, AWS S3 (`conhecimento-ia-generativa`)
- **Frontend:** React 19, TypeScript, Material UI (MUI v6 Dark Theme), React Router, Vite
- **CI/CD:** GitHub Actions (Deploy automatizado de infraestrutura, lambdas e SPA)

---

## ⚡ Como Rodar o Projeto Localmente

### 1. Backend (Servidor Local com Mocks de S3, DynamoDB e Bedrock)
```bash
cd src/backend
npm install
npm run dev
```
O servidor backend mock rodará na porta `3001` permitindo testar todas as APIs localmente sem necessidade de credenciais AWS ativas.

### 2. Frontend (React SPA)
```bash
cd src/frontend
npm install
npm run dev
```
O frontend abrirá em `http://localhost:5173`.

### 3. Testes Automatizados
```bash
cd src/backend
npm test
```

---

## 🌐 URLs do Frontend

- `/` — Página inicial com catálogo de bases de conhecimento e busca.
- `/:slug/chat` — Interface de chat conversacional em tempo real.
- `/:slug/chat/:uuid` — Histórico de conversa recuperado.
- `/admin/login` — Autenticação de administradores (JWT).
- `/admin` — Dashboard administrativo de bases, upload de arquivos, crawlers e guardrails do Bedrock.
- `/admin/logs` — Auditoria e logs de conversas realizadas.

---

## 📄 Licença e Uso Acadêmico
Desenvolvido como projeto prático para o curso de Graduação em IA e Automação Digital.
