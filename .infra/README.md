# Infra — Allevo Dashboard

Estrutura baseada no [`quero-edu/app-blueprint`](https://github.com/quero-edu/app-blueprint),
**Caminho 1 — EKS / querocore**. Ambiente único: `prod`, no cluster
`prod-nv-cluster`, namespace `shared`. O deploy da aplicação usa o chart
[`quero-edu/helm-charts` → `base-app`](https://github.com/quero-edu/helm-charts/tree/master/charts/base-app).

```
.infra/
  buildspecs/prod.yaml            CodeBuild: build da imagem + helm upgrade
  helm/base-app.values.yaml       valores comuns a todos os ambientes
  helm/prod/base-app.values.yaml  ingress/host de prod
  terragrunt/
    globals.yaml                  projeto, repo, canal do Slack
    .terraform-modulesrc          versão do terraform-modules (v20.12.1)
    prod/
      eks-application/            ECR + pod service account + bag de secrets
      pipeline/                   CodeBuild + webhook do GitHub
      notifications/              Slack (no-op enquanto slack.channelId estiver vazio)
    project-notify/               Slack chatbot (no-op idem)
```

Não existe ambiente de homolog. Para criar um depois, duplique
`terragrunt/prod/` em `terragrunt/homolog/` (`environment = "homolog"`,
`eks_cluster_name = "homolog-cluster"`), junto com `buildspecs/homolog.yaml` e
`helm/homolog/`, e adicione as dependências novas em `project-notify/`.

## Pendências antes do primeiro apply

1. **Host** — `helm/prod/base-app.values.yaml` está com
   `allevo-dashboard.quero.space`. Confirmar se é esse o domínio desejado.
2. **Secrets** — depois do apply do `eks-application`, popular o bag do Secrets
   Manager (`allevo-dashboard-prod`). Todas as chaves viram variáveis de
   ambiente no container via `envFrom` do Secret do chart:

   ```bash
   aws secretsmanager put-secret-value \
     --secret-id allevo-dashboard-prod \
     --secret-string '{
       "DASHBOARD_PASSWORD": "...",
       "DASHBOARD_USER": "admin",
       "DASHBOARD_ALLOWED_DOMAINS": "allevotech.com,redealumni.com",
       "DASHBOARD_ALLOWED_EMAILS": "",
       "DASHBOARD_ADMIN_EMAILS": "lancamentos@redealumni.com"
     }'
   ```

   `NODE_ENV` e `DASHBOARD_FUNNELS_PATH` já vêm de `app.env` no values e não
   precisam entrar no bag.

## Como aplicar

Via Atlantis, em um PR:

```
atlantis plan
atlantis apply
# ou, para um módulo específico:
atlantis apply -d .infra/terragrunt/prod/eks-application
```

Ordem de dependência: `eks-application` → `pipeline` → `notifications` →
`project-notify`.

## Decisões específicas desta aplicação

**StatefulSet em vez de Deployment.** O cadastro de funis é gravado em
`data/funnels.json` (`FUNNEL_CONFIG_PATH` em `server.ts`). `app.volume` no values
faz o chart gerar um StatefulSet com `volumeClaimTemplate` (EBS, ReadWriteOnce)
montado em `/app/data`.

**Réplica única, sem autoscaling** (`replicaCount: 1`, `autoscaling.mode: Disabled`).
O volume é ReadWriteOnce e o estado é local ao pod: com N réplicas cada uma
ganharia um PVC próprio e um cadastro de funis diferente. Consequência em prod:
o rolling update do StatefulSet derruba o pod antes de subir o novo, então cada
deploy tem alguns segundos de indisponibilidade. Para escalar horizontalmente e
acabar com essa janela, o estado precisa sair do disco primeiro — o
`app-blueprint` tem um módulo `dynamodb/` pronto para isso.

**`/healthz`.** `server.ts` aplica Basic Auth global (`app.use(requireDashboardAuth)`),
então qualquer rota responderia 401 para as probes e o pod nunca ficaria Ready.
O endpoint `/healthz` é registrado antes do middleware.

**Stage `prod` no Dockerfile.** O buildspec builda com `--target=prod`.

## Migração dos dados atuais

Hoje a aplicação roda como container avulso no host EasyPanel (`srv1460092`,
porta 8088), com bind mount `/opt/allevo-dashboard/data`. O `funnels.json` de lá
precisa ser copiado para o PVC novo:

```bash
# no host antigo
scp /opt/allevo-dashboard/data/funnels.json .
# com kubeconfig do cluster
kubectl -n shared cp funnels.json allevo-dashboard-0:/app/data/funnels.json
```
