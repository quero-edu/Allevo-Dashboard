# Allevo Dashboard

Dashboard de performance para campanhas dos livros da AllevoTech, com frontend React e backend Node/Express para leitura das planilhas do Google Sheets.

## Rodar localmente

```bash
npm ci
npm run dev
```

Abra:

```text
http://localhost:3000
```

## Variaveis de ambiente

Crie um arquivo `.env` no servidor ou configure as variaveis no EasyPanel:

```bash
DASHBOARD_ALLOWED_DOMAINS=allevotech.com,redealumni.com
DASHBOARD_ALLOWED_EMAILS=
DASHBOARD_PASSWORD=troque-essa-senha
DASHBOARD_USER=admin
```

Quando `DASHBOARD_PASSWORD` e os dominios/e-mails permitidos estao configurados, o dashboard inteiro e as APIs exigem login. A gestao de dominios e e-mails e feita pelo `.env` do servidor.

## Deploy com Docker

```bash
docker build -t allevo-dashboard:latest .
docker run -d \
  --name allevo-dashboard \
  --restart unless-stopped \
  --env-file .env \
  -p 8088:3000 \
  allevo-dashboard:latest
```

O Dockerfile gera a versao de producao durante o build e inicia apenas os arquivos compilados. Depois de um `git pull`, recrie a imagem e o container para publicar a nova versao.

## Deploy no EasyPanel

Use este repositorio como origem Git, selecione deploy por Dockerfile e configure:

```text
Porta interna: 3000
```

Adicione as variaveis de ambiente no painel do app.

## Dados

O backend le as planilhas publicadas/compartilhadas via Google Sheets. Para producao com planilhas privadas, o caminho recomendado e migrar para Service Account do Google e compartilhar as planilhas com o e-mail dessa conta.
