# Adição do Route53 e configurações

Vamos apontar um sub-domínio de uma zona que já está no route53. mas devemos deixa agnóstico, ou seja, se eu clonar esse repositório e configurar novos endereços, ele deverá apontar tudo corretamente a partir das configurações de infraestrutura.

Teremos duas rotas, FRONTEND e API, já deixei configurado o endereço final nas variables do github:
WEB_URL
API_URL

Também coloquei nas variávels o AWS_REGION já com a definição de us-east-1, troque tudo que tiver fixo para que usa das vars do github.

Adicione as variáveis no arquivo .env e as instruções de como adicionar no Github Actions secrets and variables.

O que você deverá fazer agora, é garantir que todas as configurações estejam corretas, ao testar a aplicação até aqui, o S3 com o estático não estava funcional no endereço final, então preciso que você utiliza a AWS CLI caso seja necessário algum ajuste para equiparar as alterações do Cloudformation pelo SAM, no final, o que devemos ter, é um sistema que você possa clonar, configurar suas secrets e variáveis no Github e subir completamente, ou seja, criar desde os subdomínios (caso ainda não existam) na zona hospedada (caso não exista deverá dar um erro ao rodar a pipeline), e deverá estar com todas as configurações de acesso corretas, para que seja tão fácil de usar quanto subir e alimentar as bases.

Verifique as policies e outras configurações do S3 para sites estáticos, fiz alterações na mão para se comunicar corretamente com o cloudfront, mas essas configurações todas precisam estar resolvidas no repositório, dentro da pipeline ou no "src/infrastructure/template.yaml".

Todas as alterações efetuadas deverão ser salvas em seus respectivos arquivos README e outros arquivos de interesse.

Ao final de verificar e corrigir as configurações, você deverá usar o github cli para subir uma PR com a versão para a main, aguardar 10 minutos com um timer pra não gastar tokens, e após esse tempo verificar pelo github actions se as pipelines rodaram corretamente, se não rodaram, entenda e resolva, e repita o processo aguardando os 10 minutos novamente, se estiver tudo correto, verifique os endereços do front (web) e do back (api) para entender se já estão funcionais e trazendo o retorno correto.