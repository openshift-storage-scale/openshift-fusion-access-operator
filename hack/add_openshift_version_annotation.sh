#!/usr/bin/env bash

OPENSHIFT_VERSIONS="\"${1}\""

{
  echo ""
  echo "  # OpenShift minimum version"
  echo "  com.redhat.openshift.versions: $OPENSHIFT_VERSIONS"
} >> bundle/metadata/annotations.yaml

echo "LABEL com.redhat.openshift.versions=$OPENSHIFT_VERSIONS" >> bundle.Dockerfile
