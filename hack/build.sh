#!/bin/bash
set -ex

# GOOS and GOARCH will be set if calling from make. Dockerfile calls this script
# directly without calling make so the default values need to be set here also.
[[ -z "$GOOS" ]] && GOOS=linux
[[ -z "$GOARCH" ]] && GOARCH=amd64

GIT_VERSION=$(git describe --always --tags || true)
VERSION=${CI_UPSTREAM_VERSION:-${GIT_VERSION}}
GIT_COMMIT=$(git rev-list -1 HEAD || true)
COMMIT=${CI_UPSTREAM_COMMIT:-${GIT_COMMIT}}
BUILD_DATE=$(date --utc -Iseconds)

LDFLAGS="-s -w "
REPO="github.com/openshift-storage-scale/openshift-fusion-access-operator"
LDFLAGS+="-X $REPO/version.Version=${VERSION} "
LDFLAGS+="-X $REPO/version.GitCommit=${COMMIT} "
LDFLAGS+="-X $REPO/version.BuildDate=${BUILD_DATE} "

EXTRA=""
case $1 in
    "run") EXTRA="run";;
    *)	EXTRA="build -o manager";;
esac

go version

GOFLAGS=-mod=vendor CGO_ENABLED=0 GOOS=$GOOS GOARCH=$GOARCH go $EXTRA -ldflags="${LDFLAGS}" cmd/main.go
