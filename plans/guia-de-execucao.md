Tecnologias utilizadas:
- AWS S3 (para hospedar bases de conhecimento)
- AWS Lambda (para receber arquivos, criar novas bases, conversar com o AWS Bedrock)
- AWS Bedrock (para inferência)
- AWS Bedrock com modelo Google Gemma 3 4b-it
- AWS API Gateway (para receber as requisições das APIs)
- AWS DynamoDB (para banco de dados)
- Região da AWS para todos os recursos possíveis: us-east-1
- AWS Infrastructure Composer (para desenhar e provisionar a infraestrutura)
- ENVs para testes locais deverão ficar no .env
- ENVs para deploy estarão no Github Secrets
- Github Actions (para CI/CD)
- React no Frontend (formato SPA salvo em um bucket exclusivo do S3 para servir sites estáticos)
- NodeJS no Backend (design pattern limpo e funcional para serverless)
- Padrão de arquitetura Serverless (sem containers)

O projeto deverá ficar no seguinte padrão:
/src/frontend
/src/backend
/src/infrastructure
/.github

No backend deverá ser utilizado o NodeJS sem muitas libs desnecessárias.

No frontend deverá ser utilizado o MaterialUI como DS, e o kit de desenvolvimento com as libs da tanstack (router, query, etc), para facilitar o desenvolvimento.

O Bucket geral do S3 no projeto deverá se chamar "conhecimento-ia-generativa" e deverá conter os arquivos de todas as bases de conhecimento, separados por pasta com o UUID da base.

Deverá ter uma área administrativa que permita:
- Incluir bases de conhecimento
    - Dentro de cada base de conhecimento será possível enviar:
        - Arquivos que possam ser consumidos, planilhas, PDFs, TXT
        - Links de páginas ou arquivos que possam ser baixados e terem seus conteúdos salvos como JSON - Deverá ter um timer para reexecução desse download, ou até que ele possa ser atualizado manualmente
    - A base de conhecimento deverá ter um UUID (que pode ser gerado pelo DynamoDB), Nome, um Slug para a URL e uma Descrição.
    - O Slug será utilizado para criar a URL da página consultiva por chat no padrão de IA conversacional daquela base de conhecimento.
    - A base de conhecimento deverá criar uma pasta dentro do bucket geral do projeto com o seu UUDI como nome da pasta, e todos os arquivos ou downloads deverão ir para lá
    - A base de conhecimento deverá ter a opção de configurar pré-configurações de resposta e guardrails do AWS Bedrock, como temperatura, top_p, top_k,
    - Deverá ser possível retreinar a base de forma manual, mas o retreino também deverá ser disparado ao atualizar algum dado da base, deixe sempre a informação da última data de treinamento da base
- Incluir mais usuários administrativos com email e senha
- A área administrativa deverá ser protegida por senha
- Log com todas as conversas executadas

O projeto deverá ter uma página pública no frontend com o chat configurado, que permita consultar as bases de conhecimento criadas na área administrativa.

A página pública deverá ter o mesmo padrão de navegação de ferramentas de IA como o ChatGPT e o Gemini, com uma barra lateral para armazenar conversas anteriores, como a área não terá login, a cada acesso deverá gerar um UID e salvar no localStorage do navegador, dessa forma permite recuperar as conversas. Deverá ter uma página "Home" que liste todas as bases de conhecimento criadas na área administrativa e que permita iniciar uma conversa com cada uma delas. Deverá mostrar o título e descrição da base, e o número de arquivos que ela consulta como fonte de dados, e a data da última atualização. Ao clicar em uma base, deverá abrir a página de chat.

O padrão de URLs públicas deverá ser:
- /: para a página inicial com a lista de bases de conhecimento
- /:slug/chat para a página de chat com a base de conhecimento específica
- /:slug/chat/:uuid para cada conversa individual (ela poderá ser acessada por qualquer usuário)

Identifique se é necessário criar uma instância do Bedrock para cada base de conhecimento para atender as expectativas do projeto.

Faça ser possível testar cada parte da aplicação localmente, o que não puder, aponte para mocks locais (acredito que seja o caso do Bedrock)

Comece a aplicação pela criação da infraestrutura, depois o backend e por fim o frontend, deixe um README.md bem documentado dentro de cada parte.

Evite usar pastas fora da "/src/" é ali que toda a aplicação deverá ficar, o "/.github" com os arquivos de CI/CD é uma exceção.