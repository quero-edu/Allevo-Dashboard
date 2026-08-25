# Dynamically Generated Files
# Keep provider dry and reuse default_tags
generate "provider" {
  path      = "provider.g.tf"
  if_exists = "overwrite"
  contents  = <<EOF
provider "aws" {
  region              = "us-east-1"
  default_tags {
    tags = var.default_tags
  }
}
EOF
}

# Inject default_tags var
generate "vars" {
  path      = "vars.g.tf"
  if_exists = "overwrite"
  contents  = <<EOF
variable "default_tags" {
  type = map(any)
}
EOF
}
