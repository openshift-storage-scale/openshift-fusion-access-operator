#!/bin/bash

set -eo pipefail

function usage {
        echo
        echo "Usage: $0 -t tag [-c] [-d] [-i] [-q] [-p] [-s] [-n]"
        echo "Options:"
        echo "  -t tag  image tag"
        echo "  -q      operate on images in quay.io"
        echo "  -c      print skopeo commands for copying from quay.io to icr.io"
        echo "  -d      print image digests"
        echo "  -i      inspect the images"
        echo "  -p      run pre-flight checks without submitting them"
        echo "  -s      run pre-flight checks and submit them (icr.io only)"
        echo "  -n      show pre-flight check commands that would be run"
        exit 1
}

preflight=n
submit=n
inspect=n
quay=n
echo=
digest=n
copy=n
tag=

while getopts ":t:cdpsiqn" opt; do
    case $opt in
    t) tag=$OPTARG;;
    c) copy=y;;
    d) digest=y;;
    p) preflight=y;;
    s) submit=y;;
    i) inspect=y;;
    q) quay=y;;
    n) echo="echo ";;
   \?) usage;;
    esac
done
([[ -z $tag ]] || (( $# >= $OPTIND ))) && usage

declare -a quay_images=(
  quay.io/openshift-storage-scale/controller-rhel9-operator
  quay.io/openshift-storage-scale/console-plugin-rhel9
  quay.io/openshift-storage-scale/devicefinder-rhel9
)
declare -a icr_images=(
  icr.io/cpopen/fusion-access-controller-rhel9-operator
  icr.io/cpopen/fusion-access/console-plugin-rhel9
  icr.io/cpopen/fusion-access/devicefinder-rhel9
)
declare -a certification_component_id=(
    683ef93d40192e8e3104997a  # controller
    6852878f5aa26e6aedeaf4f6  # console
    683b082edaaf2d35a7d1d082  # devicefinder
)

if [[ $quay = y || $copy = y ]]; then
    for i in 0 1 2; do
        img=${quay_images[$i]}
        sha=$(skopeo inspect docker://$img:$tag | jq -r .Digest)
        if [[ $inspect = y ]]; then
            skopeo inspect docker://$img:$tag
        elif [[ $copy = y ]]; then
            echo "skopeo copy docker://$img@$sha docker://${icr_images[$i]}:$tag"
            echo
        elif [[ $digest = y ]]; then
            echo "$img@$sha"
        elif [[ $preflight = y ]]; then
            ${echo}preflight check container $img@$sha
        fi
    done
else
    if [[ ($preflight = y || $submit = y) && -z $PYXIS_API_TOKEN ]]; then
        echo "environment variable PYXIS_API_TOKEN must be set"
        exit 1
    fi
    for i in 0 1 2; do
        img=${icr_images[$i]}
        sha=$(skopeo inspect docker://$img:$tag | jq -r .Digest)
        if [[ $inspect = y ]]; then
    	    skopeo inspect --config "docker://$img:$tag" | jq '.config.Labels | {description,version}'
        elif [[ $digest = y ]]; then
    	    echo "$img@$sha"
    	elif [[ $preflight = y ]]; then
            ensure_pyxis_token
     	    ${echo}preflight check container "$img@$sha" --loglevel trace --pyxis-api-token=$PYXIS_API_TOKEN \
                  --certification-component-id=${certification_component_id[$i]}
    	elif [[ $submit = y ]]; then
            ensure_pyxis_token
    	    ${echo}preflight check container "$img@$sha" --submit --loglevel trace --pyxis-api-token=$PYXIS_API_TOKEN \
                  --certification-component-id=${certification_component_id[$i]}
    	fi
    done
fi
