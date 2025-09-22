#!/usr/bin/env bash

set -euo pipefail

[[ -n "${DEBUGME+x}" ]] && set -x

declare -A WELL_KNOWN_CRDS
WELL_KNOWN_CRDS=(
  [Cluster]='clusters.scale.spectrum.ibm.com'
  [Daemon]='daemons.scale.spectrum.ibm.com'
  [Filesystem]='filesystems.scale.spectrum.ibm.com'
  [LocalDisk]='localdisks.scale.spectrum.ibm.com'
  [FusionAccess]='fusionaccesses.fusion.storage.openshift.io'
  [LocalVolumeDiscoveryResult]='localvolumediscoveryresults.fusion.storage.openshift.io'
)

get_crd_details() {
  local crd_name="$1"

  oc get crd "${WELL_KNOWN_CRDS[$crd_name]}" -o json | jq '
    .spec
    | {
        group,
        kind: .names.kind,
        scope,
        versions: .versions | map(.name),
        schemas: (
          .versions
          | map({(.name): .schema.openAPIV3Schema})
          | add
        )
      }
  '
}

get_crd_versions() {
  local crd_name="$1"

  get_crd_details "$crd_name" | jq -r '.versions[]'
}

get_cluster_versions() {
  oc version -o json | jq '{ openshift: .openshiftVersion, kubernetes: .serverVersion.gitVersion[1:] }'
}

generate_type_from_schema() {
  local crd_name="$1" 
  local version="$2"
  
  local schema_temp_file
  schema_temp_file="$(mktemp -t "$crd_name.XXXXXX")"
  # shellcheck disable=SC2064
  trap "rm -f $schema_temp_file" EXIT
  
  crd_details=$(get_crd_details "$crd_name")
  group=$(jq -r '.group' <<< "$crd_details")
  output_dir="src/shared/types/$(tr '.' '-' <<< "$group")/$version"  
  schema=$(jq -r ".schemas[\"$version\"]" <<< "$crd_details")
  echo "$schema" > "$schema_temp_file"
  
  mkdir -p "$output_dir"
  npx --package=json-schema-to-typescript json2ts \
    --input "$schema_temp_file" \
    --output "$output_dir/$crd_name.ts" \
    --additionalProperties=false
}

generate_plugin_types() {
  for crd_name in "${!WELL_KNOWN_CRDS[@]}"; do
    # Get all versions for this CRD
    for version in $(get_crd_versions "$crd_name"); do
      generate_type_from_schema "$crd_name" "$version"
    done
  done
}

generate_openshift_types() {
  echo "[info] Generating OpenShift types"
  
  echo "[info] Getting cluster versions"
  local version
  version="$(get_cluster_versions | jq -r '.openshift' | awk -F '.' '{print $1"."$2}')"
  echo "[info] Cluster version: $version"
  
  echo "[info] Getting OpenAPI spec from $(oc whoami --show-server)"
  local spec_temp_file
  spec_temp_file="$(mktemp -t "openshift-$version-openapi.json")"
  # shellcheck disable=SC2064
  trap "rm -f $spec_temp_file" EXIT
  oc get --raw "/openapi/v2" > "$spec_temp_file"
  if [[ ! -s "$spec_temp_file" ]]; then
    echo "[error] Failed to download OpenAPI spec"
    exit 1
  fi

  echo "[info] Configuring openapi-generator-cli"
  local config_temp_file
  config_temp_file="$(mktemp -t "openapitools-openshift.json")"
  # shellcheck disable=SC2064
  trap "rm -f $config_temp_file" EXIT
  sed \
    -e 's/%VERSION%/'"$version"'/g' \
    -e 's|%OPENSHIFT_OAS_FILE%|'"$spec_temp_file"'|g' \
    config/openapitools.json > "$config_temp_file"
  
  echo "[info] Running openapi-generator-cli"
  local output_dir
  output_dir="$(jq -r '.["generator-cli"].generators.openshift.output' "$config_temp_file")"
  mkdir -p "$output_dir"
  npx openapi-generator-cli generate \
    --generator-key openshift \
    --openapitools "$config_temp_file" | tee openapi-generator.log > /dev/null
  
  echo "[info] Fixing models/index.ts file"
  # Fixes:
  #   - Occurences of */ in jsdoc comments
  #   - Malformed string enum symbols where their values are =~ and !~
  sed -E \
    -e 's|(["'\''])\*/|\1*\\/|g' \
    -e 's/^(    ) = ('\''=~'\'',)$/\1 RegexMatch = \2/g' \
    -e 's/^(    )2 = ('\''!~'\'')$/\1 NotRegexMatch = \2/g' \
    "$output_dir/models/index.ts" > "$output_dir/types.ts"
  
  echo "[info] Cleaning up"
  find "$output_dir" -mindepth 1 -not -name 'types.ts' -exec rm -rf {} +
  echo "[info] Done"
}

generate_kubernetes_types() {
  local version
  version="${1:-$(get_cluster_versions | jq -r '.kubernetes' | awk -F '.' '{print $1"."$2}')}"

  local config_temp_file
  config_temp_file="$(mktemp -t "openapitools-kubernetes.json")"
  # shellcheck disable=SC2064
  trap "rm -f $config_temp_file" EXIT
  
  sed 's/%VERSION%/'"$version"'/g' config/openapitools.json > "$config_temp_file"

  local output_dir
  output_dir="$(jq -r '.["generator-cli"].generators.kubernetes.output' "$config_temp_file")"

  mkdir -p "$output_dir"
  npx openapi-generator-cli generate \
    --generator-key kubernetes \
    --openapitools "$config_temp_file"

  cp "$output_dir/models/index.ts" "$output_dir/types.ts"
  find "$output_dir" -mindepth 1 -not -name 'types.ts' -exec rm -rf {} +
}

"$@"
