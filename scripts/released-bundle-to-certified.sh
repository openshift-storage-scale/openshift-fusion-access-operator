#!/bin/bash

if [[ -z $1 || ! -d $1 ]]; then
    echo "usage: $0 <bundle-dir>"
    exit 1
fi

if [[ ! -f "$1/metadata/annotations.yaml" ]]; then
    echo "$1 doesn't appear to be a bundle directory"
    exit 1
fi

declare -A images
images['quay.io/openshift-storage-scale/controller-rhel9-operator']='icr.io/cpopen/fusion-access-controller-rhel9-operator'
images['quay.io/openshift-storage-scale/devicefinder-rhel9']='icr.io/cpopen/fusion-access/devicefinder-rhel9'
images['quay.io/openshift-storage-scale/console-plugin-rhel9']='icr.io/cpopen/fusion-access/console-plugin-rhel9'

for img in "${!images[@]}"; do
  sed -i -e "s#$img#${images[$img]}#" $1/manifests/openshift-fusion-access-operator.clusterserviceversion.yaml
done

sed -i -e "s#channels.v1: alpha#channels.v1: stable-v1#" $1/metadata/annotations.yaml
