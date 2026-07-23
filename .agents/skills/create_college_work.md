# Skill: Criação de Plano de Trabalho Acadêmico

**Descrição:** Capacidade de acessar materiais em formato PDF, extrair conteúdo e criar um planejamento detalhado para a execução do trabalho acadêmico.

## 📋 Instruções

1.  **Acessar e Ler os Materiais (PDF):**
    *   Verifique os arquivos PDF disponíveis no diretório `/assets/material`.
    *   Utilize o script Node.js localizado em `/scripts/read_pdf.ts` para ler o conteúdo dos arquivos PDF. Se o script ou as dependências não estiverem configuradas, utilize um instalador de pacotes ou execute via `tsx`.
    *   Exemplo de execução do script: `npx tsx scripts/read_pdf.ts assets/material/nome_do_arquivo.pdf`.

2.  **Análise do Conteúdo Extraído:**
    *   Sintetize os objetivos principais do trabalho a partir do texto extraído.
    *   Identifique os requisitos obrigatórios, os temas centrais e as orientações fornecidas no documento.
    *   Divida o escopo do trabalho em etapas lógicas e acionáveis.

3.  **Criação do Plano de Trabalho:**
    *   Com base na análise, crie e estruture o arquivo `/src/plano-trabalho.md`.
    *   O planejamento deve conter, no mínimo, as seguintes seções:
        *   **Objetivo:** Visão geral e propósito do trabalho.
        *   **Escopo e Requisitos:** Lista clara do que deve ser desenvolvido e entregue.
        *   **Etapas de Execução:** Passos organizados de forma sequencial (ex: Pesquisa, Prototipação, Desenvolvimento, Revisão).
        *   **Recursos e Ferramentas:** O que será necessário para concluir as atividades.

4.  **Saída Esperada:**
    *   O arquivo `/src/plano-trabalho.md` devidamente preenchido e formatado em Markdown, servindo como guia claro para a execução do trabalho.
