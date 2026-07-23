# 💻 Copiloto Corporativo — Frontend (React SPA)

Interface web moderna e responsiva construída em **React**, **TypeScript**, **Material UI (Dark Theme)** e **Vite**, projetada no padrão visual de assistentes corporativos como ChatGPT e Google Gemini.

---

## 🎨 Design System e Estética Visual

- **Tema:** Dark mode premium (`#0B0F19`) com efeitos de *glassmorphism* e gradientes vibrantes em roxo (`#7C3AED`) e ciano (`#06B6D4`).
- **Tipografia:** Google Fonts (`Plus Jakarta Sans` & `Inter`).
- **Navegação:** `react-router-dom` com suporte às URLs:
  - `/` — Página inicial com grid de cards de bases de conhecimento e busca.
  - `/:slug/chat` — Interface pública de conversa com a base selecionada.
  - `/:slug/chat/:uuid` — Conversa individual resgatada via histórico.
  - `/admin/login` — Login de usuários administradores via JWT.
  - `/admin` — Painel administrativo para gestão de bases, upload de arquivos, crawlers de links e guardrails.
  - `/admin/logs` — Histórico de todas as conversas registradas.

---

## 🛠️ Tecnologias Utilizadas

- **React 19 + TypeScript**
- **Vite** (Bundler ultrarrápido)
- **Material UI (MUI v6)** + MUI Icons
- **Axios** (API Client com interceptors JWT)
- **LocalStorage UID Manager** (Identificação única de visitantes anônimos para persistência de chats no navegador)

---

## 🚀 Como Executar Localmente

1. Navegue até o diretório do frontend:
```bash
cd src/frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`.

---

## 📦 Build para Produção

Para gerar o bundle estático otimizado para deploy em buckets **AWS S3**:
```bash
npm run build
```

Os arquivos compilados serão gerados no diretório `dist/`.
