#!/bin/bash

if [[ -z $1 ]]; then
    dir=$(basename $(pwd))
    if [[ ! $dir =~ cnsa-v...... ]]; then
	echo "run from a dir containing a CNSA drop"
	exit
    fi
    tag=${dir#cnsa-v}
else
    tag=$1
fi

if [[ ! -x load_and_push_images.sh ]]; then
    echo "run from a dir containing a CNSA drop"
    exit 1
fi

registry_url=quay.io
namespace=openshift-storage-scale

./load_and_push_images.sh $registry_url $namespace $tag

sed -e "s#cp.icr.io/cp/gpfs#${registry_url}/${namespace}#g" install-redhat-fusion-access.yaml | \
    sed -e "s#icr.io/cpopen#${registry_url}/${namespace}#g" | \
    sed -e "s#@sha256:.*#:${tag}#g" > install.yaml

echo "Now commit install.yaml to https://github.com/openshift-storage-scale/openshift-fusion-access-manifests"
echo "in directory manifests/$tag"
