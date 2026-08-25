terraform {
  source = "git::https://${get_env("QBDEVOPS_TERRAFORM_MODULES_GH_PERSONAL_TOKEN")}@github.com/quero-edu/terraform-modules.git//aws/modules/pipeline?ref=${chomp(file("../../.terraform-modulesrc"))}"
}

include {
  path = find_in_parent_folders()
}

locals {
  globals = yamldecode(file("../../globals.yaml"))
}

dependency "eks-application" {
  config_path = "../eks-application"
  mock_outputs = {
    project_secrets_arn = "arn:aws:secretsmanager:us-east-1:123456789012:secret:project-prod-yy7Pk9"
    eks_cluster_name    = "mock-cluster"
    ecr_repository_url  = "123456789012.dkr.ecr.us-east-1.amazonaws.com/mock-project-prod"
    ecr_repository_arn  = "arn:aws:ecr:us-east-1:123456789012:repository/repository-dummy-arn"
    eks_cluster_arn     = "arn:aws:eks:us-east-1:123456789012:cluster/dummy-cluster"
    pod_service_account = {
      name      = ""
      namespace = ""
      role_arn  = ""
    }
  }
}

inputs = {
  source_config = {
    owner  = "${local.globals.baseSourceConfig.owner}"
    repo   = "${local.globals.baseSourceConfig.repoName}"
    branch = "^refs/heads/main$" # ambiente único; deploy sai da branch principal
  }

  codebuild = {
    buildspec = "${local.globals.infraPath}/buildspecs/prod.yaml"
    environment_variables = [
      {
        name  = "INFRA_DIRECTORY"
        value = "./${local.globals.infraPath}"
      },
      {
        name  = "PROJECT_NAME"
        value = local.globals.project
      },
      {
        name  = "PROJECT_SECRETS"
        value = dependency.eks-application.outputs.project_secrets_arn,
        type  = "SECRETS_MANAGER"
      },
      {
        name  = "EKS_CLUSTER_NAME"
        value = dependency.eks-application.outputs.eks_cluster_name,
      },
      {
        name  = "REPOSITORY_URL"
        value = dependency.eks-application.outputs.ecr_repository_url,
      },
      {
        name  = "POD_SERVICE_ACCOUNT_NAME"
        value = dependency.eks-application.outputs.pod_service_account.name,
      },
      {
        name  = "POD_SERVICE_ACCOUNT_NAMESPACE"
        value = dependency.eks-application.outputs.pod_service_account.namespace,
      },
      {
        name  = "POD_SERVICE_ACCOUNT_ROLE_ARN"
        value = dependency.eks-application.outputs.pod_service_account.role_arn,
      }
    ]
  }

  project_secrets_arns = [dependency.eks-application.outputs.project_secrets_arn]
  ecr_repository_arn   = dependency.eks-application.outputs.ecr_repository_arn
  eks_cluster_arns     = [dependency.eks-application.outputs.eks_cluster_arn]
}
