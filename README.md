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
DASHBOARD_ADMIN_EMAILS=lancamentos@redealumni.com
```

Quando `DASHBOARD_PASSWORD` e os dominios/e-mails permitidos estao configurados, o dashboard inteiro e as APIs exigem login. A gestao de dominios e e-mails e feita pelo `.env` do servidor. `DASHBOARD_ADMIN_EMAILS` define quem pode cadastrar novos funis.

## Deploy com Docker

```bash
docker build -t allevo-dashboard:latest .
docker run -d \
  --name allevo-dashboard \
  --restart unless-stopped \
  --env-file .env \
  -v /opt/allevo-dashboard/data:/app/data \
  -p 8088:3000 \
  allevo-dashboard:latest
```

O Dockerfile gera a versao de producao durante o build e inicia apenas os arquivos compilados. Depois de um `git pull`, recrie a imagem e o container para publicar a nova versao.

## Deploy na Quero (EKS + base-app)

A infra vive em [`.infra/`](.infra/README.md), seguindo o
[`app-blueprint`](https://github.com/quero-edu/app-blueprint) (caminho EKS) com o chart
[`base-app`](https://github.com/quero-edu/helm-charts/tree/master/charts/base-app).

- Ambiente unico `prod`, no cluster `prod-nv-cluster`, namespace `shared`.
- Terragrunt (ECR, service account, secrets, CodeBuild) aplicado via Atlantis em PR.
- Push na `main` dispara o CodeBuild, que builda `--target=prod` e roda `helm upgrade`.
- Variaveis sensiveis ficam no AWS Secrets Manager (`allevo-dashboard-prod`), nao no repo.
- Host: `allevo-dashboard.quero.space`.

As pendencias antes do primeiro apply (host, secrets, canal do Slack) estao
listadas em [`.infra/README.md`](.infra/README.md).

## Deploy no EasyPanel

Use este repositorio como origem Git, selecione deploy por Dockerfile e configure:

```text
Porta interna: 3000
```

Adicione as variaveis de ambiente no painel do app.

## Dados

O backend le as planilhas via exportacao CSV do Google Sheets. Para cadastrar um funil, a planilha deve seguir o mesmo modelo das existentes e estar em `Compartilhar` > `Acesso geral` > `Qualquer pessoa com o link` com permissao `Leitor`. O cadastro fica salvo no volume `data` do servidor.
