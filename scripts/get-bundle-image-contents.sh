#!/bin/bash

set -e

tmp=$(mktemp -d -t image.XXXXXXXXXX)
echo "unpacking image in $tmp"

if [[ -n $2 ]]; then
    bundle=$(realpath $2)
else
    bundle=$tmp/bundle
fi

skopeo copy docker://$1 dir:$tmp
mkdir $bundle
cd $tmp
cat manifest.json | jq -r '.layers[] | select(.mediaType == "application/vnd.oci.image.layer.v1.tar+gzip") | .digest' | sed -e 's/^sha256://' | xargs -n1 tar -C $bundle -xvf
tree $bundle
