#!/usr/bin/env bash

set -euo pipefail

[[ -n "${DEBUGME+x}" ]] && set -x

generate_report() {
  marge \
    -o ./integration-tests/screenshots/ \
    -f cypress-report \
    -t 'OpenShift Console Plugin Template Cypress Test Results' \
    -p 'OpenShift Cypress Plugin Template Test Results' \
    --showPassed false \
    --assetsDir ./integration-tests/screenshots/cypress/assets ./integration-tests/screenshots/cypress.json

  mochawesome-merge ./integration-tests/screenshots/cypress_report*.json > ./integration-tests/screenshots/cypress.json
}

run() {
  ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}
  SCREENSHOTS_DIR=integration-tests/screenshots
  INSTALLER_DIR=${INSTALLER_DIR:=${ARTIFACT_DIR}/installer}

  # shellcheck disable=SC2329
  copy_artifacts() {
    if [ -d "$ARTIFACT_DIR" ] && [ -d "$SCREENSHOTS_DIR" ]; then
      if [[ -z "$(ls -A -- "$SCREENSHOTS_DIR")" ]]; then
        echo "No artifacts were copied."
      else
        echo "Copying artifacts from $(pwd)..."
        cp -r "$SCREENSHOTS_DIR" "${ARTIFACT_DIR}/screenshots"
      fi
    fi
  }

  trap 'copy_artifacts' EXIT

  # don't log kubeadmin-password
  set +x
  BRIDGE_KUBEADMIN_PASSWORD="$(cat "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR}/auth/kubeadmin-password}")"
  export BRIDGE_KUBEADMIN_PASSWORD
  set -x
  BRIDGE_BASE_ADDRESS="$(oc get consoles.config.openshift.io cluster -o jsonpath='{.status.consoleURL}')"
  export BRIDGE_BASE_ADDRESS

  echo "Install dependencies"
  if [ ! -d node_modules ]; then
    npm install
  fi

  echo "Runs Cypress tests in headless mode"
  # shellcheck disable=SC2034
  NODE_OPTIONS='--max-old-space-size=4096'
  npx cypress run -p integration-tests --browser "${BRIDGE_E2E_BROWSER_NAME:=electron}"
}

"$@"
