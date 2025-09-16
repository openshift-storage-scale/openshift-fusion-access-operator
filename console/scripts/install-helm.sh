#!/usr/bin/env bash

set -euo pipefail

[[ -n "${DEBUGME+x}" ]] && set -x

if type "helm" &> /dev/null; then
    echo "OK, helm is already installed."
    exit 0
fi

# shellcheck disable=SC2034
USE_SUDO="false"
# shellcheck disable=SC2034
HELM_INSTALL_DIR="/tmp"
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
