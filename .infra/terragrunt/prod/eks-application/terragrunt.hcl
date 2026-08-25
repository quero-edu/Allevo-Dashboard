terraform {
  source = "git::https://${get_env("QBDEVOPS_TERRAFORM_MODULES_GH_PERSONAL_TOKEN")}@github.com/quero-edu/terraform-modules.git//aws/modules/eks-application?ref=${chomp(file("../../.terraform-modulesrc"))}"
}

include {
  path = find_in_parent_folders()
}

inputs = {
  eks_cluster_name = "prod-nv-cluster" # homolog-cluster, prod-nv-cluster, prod-sp-cluster

  pod_service_account = {
    namespace = "shared"
  }
}
