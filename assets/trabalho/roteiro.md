# Roteiro — Vídeo Pitch (até 4 minutos)

## Estrutura do Vídeo

| Bloco | Tempo | Conteúdo |
|-------|-------|----------|
| 1. Abertura | 0:00 – 0:20 | Apresentação pessoal + nome do projeto |
| 2. O Problema | 0:20 – 0:50 | Contextualização do desafio |
| 3. A Solução | 0:50 – 1:20 | Visão geral do Copiloto Corporativo |
| 4. Demonstração | 1:20 – 2:40 | Aplicação funcionando (telas reais) |
| 5. IA no Desenvolvimento | 2:40 – 3:20 | Como a IA foi usada para construir |
| 6. Encerramento | 3:20 – 3:50 | Desafios, aprendizados e links |

---

## Bloco 1 — Abertura (20s)

**[Tela: Webcam ou slide com nome]**

> "Olá! Meu nome é Robert Schweppe, aluno da graduação em IA e Automação Digital na UniFECAF. Vou apresentar o projeto **Copiloto Corporativo com IA** — um assistente inteligente que consulta bases de conhecimento em linguagem natural, desenvolvido inteiramente com auxílio de IA generativa."

---

## Bloco 2 — O Problema (30s)

**[Tela: Slide com bullets ou site da prefeitura mostrando a quantidade de páginas]**

> "O problema é simples: empresas e órgãos públicos têm centenas de documentos, mas as pessoas não conseguem acessar essas informações de forma rápida."

> "Para demonstrar na prática, usei a Carta de Serviços da Prefeitura de São José dos Pinhais. São mais de 300 serviços espalhados em páginas web individuais. O cidadão que quer saber 'como tirar credencial de estacionamento para idoso' precisa navegar por dezenas de páginas."

> "A pergunta é: e se ele pudesse simplesmente perguntar em linguagem natural e receber a resposta imediata?"

---

## Bloco 3 — A Solução (30s)

**[Tela: Diagrama de arquitetura ou slide resumo]**

> "O Copiloto Corporativo resolve isso. É uma aplicação serverless na AWS que permite criar bases de conhecimento, alimentá-las com arquivos ou links, e disponibilizar um chat inteligente para consulta."

> "A arquitetura usa React no frontend, Lambda + API Gateway no backend, DynamoDB para dados, S3 para armazenamento, e AWS Bedrock com o modelo Google Gemma 3 para a inteligência artificial."

> "O sistema utiliza RAG — Retrieval-Augmented Generation — que seleciona os trechos mais relevantes dos documentos e injeta no prompt do modelo, garantindo respostas baseadas nos dados reais."

---

## Bloco 4 — Demonstração (1min 20s)

**[Tela: Gravação da aplicação funcionando — compartilhar tela do navegador]**

### 4.1 — Home (10s)
> "Aqui temos a home com as bases de conhecimento disponíveis. Cada base mostra o nome, descrição e quantidade de fontes."

### 4.2 — Chat funcionando (30s)
> "Ao clicar, entramos no chat. Vou perguntar: 'quais serviços para idoso?'"

*[Esperar a resposta aparecer]*

> "O modelo lista os serviços encontrados nos documentos — credencial de estacionamento, ILPI, SCFV. Se eu perguntar sobre um específico, ele detalha com requisitos, documentos e local de atendimento."

> "Repare que a resposta está em Markdown formatado, com negrito, listas e links clicáveis."

### 4.3 — Área Admin (20s)
> "Na área administrativa, o gestor cria bases, faz upload de arquivos, importa sitemaps, configura o system prompt e os parâmetros do modelo como temperatura e max tokens."

### 4.4 — Retreino (20s)
> "Ao clicar em retreinar, o sistema processa todos os arquivos e links em background. Vemos a barra de progresso com status por item — sucesso, erro, ou domínio bloqueado. O progresso atualiza automaticamente a cada 30 segundos."

---

## Bloco 5 — IA no Desenvolvimento (40s)

**[Tela: Kiro/IDE com código ou slide com o fluxo]**

> "O diferencial deste projeto é que ele foi construído inteiramente com IA como copiloto. Usei o Kiro — um IDE com IA integrada — para tudo: desde criar a infraestrutura na AWS até debugar problemas em produção."

> "Antes de escrever código, a IA criou planos detalhados: um plano de implementação com 12 fases, um plano de segurança com 15 vulnerabilidades identificadas, e uma análise de custos da infraestrutura."

> "A IA gerou o template SAM com 7 Lambdas, 5 tabelas DynamoDB, CloudFront, Route53 — tudo a partir de descrições em linguagem natural. Quando algo falhava em produção, ela investigava os logs da AWS, identificava o problema e corrigia."

> "Cada feature foi desenvolvida em branches com Pull Requests — a pipeline de CI/CD executa automaticamente infra, backend e frontend em sequência."

---

## Bloco 6 — Encerramento (30s)

**[Tela: Webcam ou slide final com links]**

> "Os principais desafios foram: o modelo Gemma 3 é pequeno e alucina quando não tem contexto suficiente; o keyword matching do RAG não captura sinônimos; e o API Gateway tem timeout de 29 segundos que exigiu processamento assíncrono."

> "O grande aprendizado é que IA generativa como copiloto de desenvolvimento não é futuro — é presente. Um projeto completo com infraestrutura, backend, frontend, CI/CD e IA foi construído e iterado em produção em um único dia."

> "O código está aberto no GitHub, e a aplicação está funcionando em produção nos links que aparecem na descrição do vídeo. Obrigado!"

---

## Links para Descrição do Vídeo

```
Repositório: https://github.com/zastrich/graduacao-10-ia-generativa-aplicada-ao-desenvolvimento
Frontend: https://copiloto-corporativo.code200.com.br
API: https://copiloto-corporativo-api.code200.com.br
```

---

## Dicas de Gravação

- Gravar tela + webcam (picture-in-picture) durante a demo
- Testar o chat antes de gravar para garantir resposta rápida
- Manter ritmo — 4 minutos passa rápido
- Se errar, continuar (editar depois é mais rápido que regravar tudo)
- Publicar como "não listado" no YouTube e verificar o link antes de enviar
