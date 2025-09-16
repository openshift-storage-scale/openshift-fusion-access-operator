#!/usr/bin/env bash

set -Eeuo pipefail

[[ -n "${DEBUGME+x}" ]] && set -x

script_name="${BASH_SOURCE[0]:-$0}"
script_path="$(realpath "$script_name")"
scripts_dir="$(dirname "$script_path")"
project_dir="$(dirname "$scripts_dir")"

PLUGIN_NAME="$(jq -r '.name' "$project_dir/package.json")"

CONSOLE_VERSION=${CONSOLE_VERSION:="latest"}
CONSOLE_IMAGE=${CONSOLE_IMAGE:="quay.io/openshift/origin-console:$CONSOLE_VERSION"}
CONSOLE_PORT=${CONSOLE_PORT:=9000}
CONSOLE_IMAGE_PLATFORM=${CONSOLE_IMAGE_PLATFORM:="linux/amd64"}

BRIDGE_PLUGINS="${PLUGIN_NAME}=http://host.docker.internal:9001"
if [[ -x "$(command -v podman)" ]]; then
    if [[ "$(uname -s)" = "Linux" ]]; then
        # Use host networking on Linux since host.containers.internal is unreachable in some environments.
        BRIDGE_PLUGINS="${PLUGIN_NAME}=http://localhost:9001"
    else
        # shellcheck disable=SC2034
        BRIDGE_PLUGINS="${PLUGIN_NAME}=http://host.containers.internal:9001"
    fi
fi

# shellcheck disable=SC2034
BRIDGE_I18N_NAMESPACES="plugin__${PLUGIN_NAME}"
# shellcheck disable=SC2034
BRIDGE_USER_AUTH="disabled"
# shellcheck disable=SC2034
BRIDGE_USER_SETTINGS_LOCATION="localstorage"
# shellcheck disable=SC2034
BRIDGE_K8S_AUTH_BEARER_TOKEN="${OC_DEV_TOKEN:-$(oc whoami --show-token 2>/dev/null)}"
# shellcheck disable=SC2034
BRIDGE_K8S_MODE="off-cluster"
# shellcheck disable=SC2034
BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS=true
BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT="$(oc whoami --show-server)"

# The monitoring operator is not always installed (e.g. for local OpenShift). Tolerate missing config maps.
set +e
# shellcheck disable=SC2034
BRIDGE_K8S_MODE_OFF_CLUSTER_THANOS=$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.thanosPublicURL}' 2>/dev/null)
# shellcheck disable=SC2034
BRIDGE_K8S_MODE_OFF_CLUSTER_ALERTMANAGER=$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.alertmanagerPublicURL}' 2>/dev/null)

# Don't fail if the cluster doesn't have gitops.
GITOPS_HOSTNAME=$(oc -n openshift-gitops get route cluster -o jsonpath='{.spec.host}' 2>/dev/null)
set -e
if [[ -n "$GITOPS_HOSTNAME" ]]; then
    # shellcheck disable=SC2034
    BRIDGE_K8S_MODE_OFF_CLUSTER_GITOPS="https://$GITOPS_HOSTNAME"
fi

# Prefer podman if installed. Otherwise, fall back to docker.
pocker() {
    $(command -v podman || command -v docker) "$@"
}

# Used to build the console app
yarn() {
    node .yarn/releases/yarn-1.22.22.js "$@"
}

get_branch_name() {
    local version="$1"

    if [[ -z "$version" ]]; then
        echo "ERROR: Version is required."
        exit 1
    fi

    if [[ "$version" == "latest" ]]; then
        echo "main"
        return
    fi

    # shellcheck disable=SC2034
    IFS='.' read -r major minor patch <<< "$version"
    echo "release-${major}.${minor}"
}

build() {
    local console_repo_dir="$1"
    local console_version="$2"
    local console_repo_url="${CONSOLE_REPO_URL:=https://github.com/openshift/console.git}"
    
    echo "Starting the OpenShift Console build process..."

    local branch_name
    branch_name="$(get_branch_name "$console_version")"
    
    git clone --branch "$branch_name" "$console_repo_url" "$console_repo_dir"
    
    echo "Installing dependencies and building the front-end app..."
    pushd "${console_repo_dir}/frontend"

    if [[ ! -f .yarn/releases/yarn-1.22.22.js ]]; then
        corepack enable
    fi
    
    yarn install --frozen-lockfile

    # shellcheck disable=SC2034
    HOT_RELOAD=true
    # shellcheck disable=SC2034
    REACT_REFRESH=true
    # shellcheck disable=SC2034
    NODE_OPTIONS='--max-old-space-size=4096'
    yarn run ts-node node_modules/.bin/webpack --mode=development
    
    popd
}

create_console_volume() {
    local console_repo_dir
    console_repo_dir="${CONSOLE_REPO_DIR:="$(mktemp -d -t console-repo)"}"        
    build "$console_repo_dir" "$CONSOLE_VERSION"

    echo "Creating a volume with console built in dev-mode"
    pocker volume create console-public-dir
    pocker run -d --rm --name console-builder -v console-public-dir:/data registry.access.redhat.com/ubi9/ubi-micro sleep infinity
    pocker cp "${console_repo_dir}/frontend/public/dist/." console-builder:/data/
    pocker stop console-builder >/dev/null
    rm -rf "$console_repo_dir"
}

start() {
    echo "Starting local OpenShift console v${CONSOLE_VERSION}..."
    echo "API Server: $BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT"
    echo "Console URL: http://localhost:${CONSOLE_PORT}"
    echo "Console Platform: $CONSOLE_IMAGE_PLATFORM"
    echo "Console Image: $CONSOLE_IMAGE"

    echo "Checking if the volume containing the console app exists..."
    if ! pocker volume inspect console-public-dir; then
        create_console_volume
    fi

    local pocker_args=(
        --rm
        --pull=always
        --platform="$CONSOLE_IMAGE_PLATFORM"
        --name="openshift-console-${CONSOLE_VERSION%.*}"
        -v="console-public-dir:/opt/bridge/static"
    )

    if [[ -x "$(command -v podman)" ]] && [[ "$(uname -s)" = "Linux" ]]; then
        pocker_args+=(--network=host)
    else
        pocker_args+=(-p="$CONSOLE_PORT:9000")
    fi

    echo "Starting the console container..."
    pocker run "${pocker_args[@]}" --env-file=<(set | grep -E '^BRIDGE') "$CONSOLE_IMAGE"
}

test_env() {
   echo "API Server: $BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT"
   
   local env
   env="$(set | grep -E '^BRIDGE')"
   
   echo "Environment variables:"
   echo "$env"
}

"$@"
