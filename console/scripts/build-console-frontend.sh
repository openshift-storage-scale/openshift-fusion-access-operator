#!/usr/bin/env bash

set -Eeu -o pipefail
[[ -n "${DEBUGME+x}" ]] && set -x

trap 'handle_error "$LINENO" "$BASH_COMMAND"' ERR

CONSOLE_DIR="${CONSOLE_DIR:-$HOME/.openshift-console}"
CONSOLE_REPO_URL="${CONSOLE_REPO_URL:-https://github.com/openshift/console.git}"
CONSOLE_VERSION="${CONSOLE_VERSION:-4.19.0}"

function handle_error {
    local line_number="$1"
    local command="$2"

    echo "An error occurred at line $line_number while executing: $command"
    rm -rf "$CONSOLE_DIR"
    exit 1
}

function get_branch_name {
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

function fetch_openshift_console_repo {
    local branch_name

    branch_name="$(get_branch_name "$CONSOLE_VERSION")"
    git clone --branch "$branch_name" "$CONSOLE_REPO_URL" "$CONSOLE_DIR"
}

function build_frontend {
    echo "Installing dependencies and building the frontend app..."
    pushd "${CONSOLE_DIR}/frontend"

    if [ -f .yarn/releases/yarn-1.22.22.js ]; then
        function yarn {
            node .yarn/releases/yarn-1.22.22.js "$@"
        }
    else
        corepack enable
    fi
    yarn install --frozen-lockfile


    function webpack {
         NODE_OPTIONS=--max-old-space-size=4096 yarn run ts-node node_modules/.bin/webpack "$@"
    }
    HOT_RELOAD=true REACT_REFRESH=true webpack --mode=development
    
    popd
}

function main {
    fetch_openshift_console_repo
    build_frontend
}

main
