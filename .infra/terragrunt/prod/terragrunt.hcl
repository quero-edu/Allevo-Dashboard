locals {
  globals         = yamldecode(file("../globals.yaml"))
  environment     = "prod"
  generated_files = read_terragrunt_config("${path_relative_from_include()}/generated.hcl")
}

generate = local.generated_files.generate

inputs = {
  project = {
    name        = "${local.globals.project}"
    environment = "${local.environment}"
  }

  default_tags = {
    Project       = "${local.globals.project}"
    Environment   = "${local.environment}"
    Repo          = "${local.globals.baseSourceConfig.owner}/${local.globals.baseSourceConfig.repoName}"
  }
}

remote_state {
  backend = "s3"
  generate = {
    path      = "backend.g.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    bucket  = "tfstate-quero-infra-us-east-1"
    key     = "infra-${local.globals.project}/${local.environment}/${path_relative_to_include()}/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
