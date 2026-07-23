# Skill: Acesso e Navegação pelo Navegador Nativo do AntigravityIDE

Este documento descreve como utilizar a ferramenta nativa de navegador (`browser_subagent`) para acessar páginas web e interagir com elementos diretamente a partir do AntigravityIDE.

## 1. Ferramenta Principal
A ferramenta utilizada para controlar e interagir com o navegador de forma nativa é a `browser_subagent`. Ela executa um subagente autônomo com capacidades de controle do navegador (navegação, cliques, digitação, gravação de tela e captura de estado).

## 2. Parâmetros de Chamada do `browser_subagent`
Ao chamar a ferramenta `browser_subagent`, devem ser fornecidos os seguintes parâmetros estruturados:
* **TaskName**: Um título legível para a tarefa (ex: `Acessar Dashboard do Curso`).
* **Task**: Um prompt detalhado e de execução única (one-shot) que instrui o subagente exatamente sobre o que fazer, quais seletores interagir, e qual é a condição de parada/retorno.
* **TaskSummary**: Um resumo curto da tarefa exibido ao usuário (1 a 2 sentenças).
* **RecordingName**: Nome de gravação de vídeo da sessão (ex: `acesso_dashboard`). Deve ser em letras minúsculas com underscores, no máximo 3 palavras.

## 3. Instruções para Monitoramento de Login e Automação
Quando o acesso requer a intervenção do usuário para realizar o login:
1. **Chamada Inicial**: O subagente deve navegar para a URL de login ou conteúdos e aguardar que a dashboard ou conteúdo principal seja carregado.
2. **Definição de Condição de Retorno**: O prompt do subagente (`Task`) deve explicitar que ele deve aguardar até que elementos da interface logada (como a sidebar de aulas, botões de progresso ou termos como "Olá", "Módulos", "Progresso") estejam visíveis no DOM.
3. **Controle de Timeout**: O subagente deve ser instruído a verificar periodicamente se a tela logada foi alcançada, retornando um relatório do estado assim que a detecção for positiva ou se um timeout de inatividade for atingido.

## 4. Exemplo de Configuração de Task
```json
{
  "TaskName": "Acessar Conteúdo e Aguardar Login",
  "Task": "Navegue para a URL: https://ftr.rocketseat.com.br/jornada/desenvolvimento-de-aplicacoes-web-low-code/conteudos. Aguarde o usuário realizar o login manualmente. Você saberá que o login foi realizado quando a URL não contiver mais '/login' ou 'auth' e quando elementos da dashboard do curso (como uma sidebar ou botões contendo 'Marcar como assistida') estiverem carregados no DOM. Quando detectar o login com sucesso, tire um screenshot e finalize a tarefa retornando os detalhes da página atual.",
  "TaskSummary": "Navega para a URL do curso e aguarda o login do usuário para capturar a dashboard logada.",
  "RecordingName": "aguarda_login_usuario",
  "toolAction": "Iniciando subagente de navegação nativa",
  "toolSummary": "Navegação nativa do AntigravityIDE"
}
```
