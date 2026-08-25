terraform {
  source = local.should_create_slack_chatbot_integration ? "git::https://${get_env("QBDEVOPS_TERRAFORM_MODULES_GH_PERSONAL_TOKEN")}@github.com/quero-edu/terraform-modules.git//aws/modules/chatbot/notifications?ref=${chomp(file("../../.terraform-modulesrc"))}" : ""
}

locals {
  should_create_slack_chatbot_integration = length(local.globals.slack.channelId) > 1
  globals                                 = yamldecode(file("../../globals.yaml"))
}

include {
  path = find_in_parent_folders()
}

dependency "pipeline" {
  config_path = "../pipeline"
  mock_outputs = {
    codebuild_arn = "arn:aws:codepipeline:us-east-1:725582217686:pipeline-dummy-arn"
  }
}

inputs = {
  codestar_resource_arn = dependency.pipeline.outputs.codebuild_arn

  codestar_notification_events = [
    "codebuild-project-build-state-failed",
    "codebuild-project-build-state-succeeded"
  ]
}
