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

   `NODE_ENV`, `AWS_REGION`, `DASHBOARD_FUNNELS_SSM_PARAM` e
   `DASHBOARD_FUNNELS_PATH` já vêm de `app.env` no values e não precisam entrar
   no bag.

3. **Policy de SSM** — o cadastro de funis passa a viver no Parameter Store
   (`/allevo-dashboard/funnels`, tipo `String`). A role do pod service account
   criada pelo `eks-application` só nasce com `ReadSecretManager`; o acesso ao
   parâmetro vem do input `attach_iam_custom_policy_json_document_on_pod_service_account`
   em `terragrunt/prod/eks-application/terragrunt.hcl`, que gera a policy inline
   `CustomPolicies`.

   Esse apply precisa acontecer **antes** do deploy que sobe
   `DASHBOARD_FUNNELS_SSM_PARAM`. Sem ele o `GetParameter` volta `AccessDenied`,
   e como a app só trata `ParameterNotFound`, toda requisição de dados responde
   502 com "Não foi possível ler a configuração de funis no SSM".

   Não use `SecureString`: os dados são nome, cor e `sheetId` de funil, e o tipo
   seguro exigiria também `kms:Decrypt`/`kms:Encrypt` sem ganho nenhum. O
   parâmetro não precisa ser pré-criado — com `ssm:PutParameter` a aplicação o
   cria no primeiro cadastro —, mas o ideal é criá-lo já com os dados migrados
   (ver "Migração dos dados atuais").

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

**Cadastro de funis no SSM Parameter Store.** `server.ts` tem dois backends de
persistência: com `DASHBOARD_FUNNELS_SSM_PARAM` definida, lê e grava no parâmetro
indicado; sem ela, cai no arquivo de `DASHBOARD_FUNNELS_PATH` (é o caminho usado
no desenvolvimento local, que assim não precisa de credencial AWS). Parâmetro
ausente é tratado como cadastro vazio, então o primeiro boot em prod sobe com os
funis padrão em vez de quebrar.

Duas restrições do Parameter Store viraram código: o tier `Standard` limita o
valor a 4 KB (~20-25 funis no formato atual), e a gravação recusa payload maior
com erro legível na tela em vez de estourar o erro cru da AWS — o teto é
ajustável por `DASHBOARD_FUNNELS_SSM_MAX_BYTES` caso migrem para o tier
`Advanced` (8 KB, US$ 0,05/mês). E `loadFunnels()` roda em toda request, então o
resultado fica em cache de memória por `DASHBOARD_FUNNELS_CACHE_TTL_MS` (30s por
padrão), invalidado a cada escrita; sem isso cada request viraria um
`GetParameter`.

**StatefulSet e réplica única — temporários.** `app.volume` no values ainda faz o
chart gerar um StatefulSet com `volumeClaimTemplate` (EBS, ReadWriteOnce) em
`/app/data`, e `replicaCount: 1` / `autoscaling.mode: Disabled` existem porque o
volume é ReadWriteOnce. Isso é rede de segurança para a janela de migração:
depois que o cadastro estiver validado no SSM, remover `app.volume` e liberar
`replicaCount`/`autoscaling` — aí acaba também a janela de indisponibilidade de
cada deploy, que hoje vem do rolling update do StatefulSet derrubar o pod antes
de subir o novo.

**`/healthz`.** `server.ts` aplica Basic Auth global (`app.use(requireDashboardAuth)`),
então qualquer rota responderia 401 para as probes e o pod nunca ficaria Ready.
O endpoint `/healthz` é registrado antes do middleware.

**`containerPort: 3000`.** `server.ts` escuta em `0.0.0.0:3000` com a porta fixa
no código; mudar o valor no values sozinho quebraria service e probes.

**Stage `prod` no Dockerfile.** O buildspec builda com `--target=prod`.

## Migração dos dados atuais

Hoje a aplicação roda como container avulso no host EasyPanel (`srv1460092`,
porta 8088), com bind mount `/opt/allevo-dashboard/data`. O `funnels.json` de lá
precisa ser carregado no parâmetro do SSM:

```bash
# no host antigo
scp /opt/allevo-dashboard/data/funnels.json .
# com o perfil AWS que enxerga a conta de prod
aws ssm put-parameter \
  --name /allevo-dashboard/funnels \
  --type String \
  --overwrite \
  --value file://funnels.json
```

Faça isso antes do deploy que sobe `DASHBOARD_FUNNELS_SSM_PARAM`. Conferindo
depois: `aws ssm get-parameter --name /allevo-dashboard/funnels`.
