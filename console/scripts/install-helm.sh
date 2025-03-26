#!/usr/bin/env bash

set -euo pipefail
[[ -n "${DEBUGME+x}" ]] && set -x

if type "helm" &> /dev/null; then
    echo "helm is already installed. Exiting."
    exit 0
fi

USE_SUDO="false"
HELM_INSTALL_DIR="/tmp"
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
