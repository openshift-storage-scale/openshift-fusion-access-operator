#!/usr/bin/env bash

set -Eeu -o pipefail
[[ -n "${DEBUGME+x}" ]] && set -x

script_name="${BASH_SOURCE[0]:-$0}"
script_path="$(realpath "$script_name")"
scripts_dir="$(dirname "$script_path")"
console_dir="$(dirname "$scripts_dir")"

PLUGIN_NAME="$(jq -r '.name' "$console_dir/package.json")"

CONSOLE_VERSION=${CONSOLE_VERSION:="latest"}
CONSOLE_IMAGE=${CONSOLE_IMAGE:="quay.io/openshift/origin-console:$CONSOLE_VERSION"}
CONSOLE_PORT=${CONSOLE_PORT:=9000}
CONSOLE_IMAGE_PLATFORM=${CONSOLE_IMAGE_PLATFORM:="linux/amd64"}

echo "Starting local OpenShift console v${CONSOLE_VERSION}..."

# shellcheck disable=SC2034
BRIDGE_I18N_NAMESPACES="plugin__${PLUGIN_NAME}"
# shellcheck disable=SC2034
BRIDGE_USER_AUTH="disabled"
# shellcheck disable=SC2034
BRIDGE_USER_SETTINGS_LOCATION="localstorage"
# shellcheck disable=SC2034
BRIDGE_K8S_MODE="off-cluster"
# shellcheck disable=SC2034
BRIDGE_K8S_AUTH_BEARER_TOKEN="${OC_DEV_TOKEN:-$(oc whoami --show-token 2>/dev/null)}"
BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT=$(oc whoami --show-server)
# shellcheck disable=SC2034
BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS=true
# The monitoring operator is not always installed (e.g. for local OpenShift). Tolerate missing config maps.
set +e
# shellcheck disable=SC2034
BRIDGE_K8S_MODE_OFF_CLUSTER_THANOS=$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.thanosPublicURL}' 2>/dev/null)
# shellcheck disable=SC2034
BRIDGE_K8S_MODE_OFF_CLUSTER_ALERTMANAGER=$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.alertmanagerPublicURL}' 2>/dev/null)
set -e

# Don't fail if the cluster doesn't have gitops.
set +e
GITOPS_HOSTNAME=$(oc -n openshift-gitops get route cluster -o jsonpath='{.spec.host}' 2>/dev/null)
set -e
if [ -n "$GITOPS_HOSTNAME" ]; then
    # shellcheck disable=SC2034
    BRIDGE_K8S_MODE_OFF_CLUSTER_GITOPS="https://$GITOPS_HOSTNAME"
fi

echo "API Server: $BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT"
echo "Console Image: $CONSOLE_IMAGE"
echo "Console URL: http://localhost:${CONSOLE_PORT}"
echo "Console Platform: $CONSOLE_IMAGE_PLATFORM"

# Prefer podman if installed. Otherwise, fall back to docker.
function pocker {
    $(command -v podman || command -v docker) "$@"
}

pocker_args=(
    --rm
    --pull=always
    --platform="$CONSOLE_IMAGE_PLATFORM"
    --name="openshift-console-${CONSOLE_VERSION%.*}"
)

echo "Checking if the volume containing the console-app is already available..."
if ! pocker volume inspect console-public-dir; then
    OPENSHIFT_CONSOLE_TMP="${OPENSHIFT_CONSOLE_TMP:-$(mktemp -d)}"
    "$scripts_dir/build-console-frontend.sh" "$OPENSHIFT_CONSOLE_TMP"

    echo "Creating a container volume with the console-app built in dev-mode"
    pocker volume create console-public-dir
    pocker run -d --rm --name tmp -v console-public-dir:/data alpine sleep infinity
    pocker cp "${OPENSHIFT_CONSOLE_TMP}/frontend/public/dist/." tmp:/data/
    pocker stop tmp >/dev/null
    rm -rf "$OPENSHIFT_CONSOLE_TMP"

    pocker_args+=(-v="console-public-dir:/opt/bridge/static")    
fi

if [ -x "$(command -v podman)" ]; then
    if [ "$(uname -s)" = "Linux" ]; then
        # Use host networking on Linux since host.containers.internal is unreachable in some environments.
        BRIDGE_PLUGINS="${PLUGIN_NAME}=http://localhost:9001"
        pocker_args+=(--network=host)
    else
        BRIDGE_PLUGINS="${PLUGIN_NAME}=http://host.containers.internal:9001"
        pocker_args+=(-p="$CONSOLE_PORT:9000")
    fi
else
    # shellcheck disable=SC2034
    BRIDGE_PLUGINS="${PLUGIN_NAME}=http://host.docker.internal:9001"
    pocker_args+=(-p="$CONSOLE_PORT:9000")
fi

pocker run "${pocker_args[@]}" --env-file=<(set | grep BRIDGE) "$CONSOLE_IMAGE"
