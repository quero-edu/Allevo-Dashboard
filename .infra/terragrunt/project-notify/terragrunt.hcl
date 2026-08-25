terraform {
  source = local.should_create_slack_chatbot_integration ? "git::https://${get_env("QBDEVOPS_TERRAFORM_MODULES_GH_PERSONAL_TOKEN")}@github.com/quero-edu/terraform-modules.git//aws/modules/chatbot/project-notify?ref=${chomp(file("../.terraform-modulesrc"))}" : ""
}

locals {
  should_create_slack_chatbot_integration = length(local.globals.slack.channelId) > 1
  globals                                 = yamldecode(file("../globals.yaml"))
  generated_files = read_terragrunt_config("./generated.hcl")
}

dependency "prod_notifications" {
  config_path  = "../prod/notifications"
  mock_outputs = {
    sns_topic_arn = "arn:aws:sns:us-east-1:123456789012:chatbot-dummy-arn"
  }
}

dependency "prod_pipeline" {
  config_path = "../prod/pipeline"
  mock_outputs = {
    codebuild_arn = "arn:aws:codebuild:us-east-1:123456789012:project/project-dummy"
  }
}

inputs = {
  project = {
    name        = "${local.globals.project}"
  }

  default_tags = {
    Project     = "${local.globals.project}"
    Repo        = "${local.globals.baseSourceConfig.owner}/${local.globals.baseSourceConfig.repoName}"
  }

  codebuild_arns = [
    dependency.prod_pipeline.outputs.codebuild_arn
  ]

  chatbot_config = {
    slack_channel_id   = local.globals.slack.channelId
    slack_workspace_id = local.globals.slack.workspaceId
  }

  sns_topic_arns = [
    dependency.prod_notifications.outputs.sns_topic_arn
  ]
}

generate = local.generated_files.generate

remote_state {
  backend = "s3"
  generate = {
    path      = "backend.g.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    bucket  = "tfstate-quero-infra-us-east-1"
    key     = "infra-${local.globals.project}/infra/terragrunt/project-notify/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
