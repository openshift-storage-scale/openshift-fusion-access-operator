#!/bin/bash
set -e

if [ $# -ne 1 ]; then
    echo "Usage: $0 <file>"
    exit 1
fi

# Example rbacs
# //+kubebuilder:rbac:groups=config.openshift.io,resources=infrastructures,verbs=list;get
# //+kubebuilder:rbac:groups="",resources=namespaces,verbs=list;watch;delete;update;get;create;patch

BASE_PERMS="list;watch;delete;update;get;create;patch"
FILE=$1

if [ ! -f "$FILE" ]; then
    echo "File ${FILE} not found"
    exit 1
fi

rm -f /tmp/purple_rbacs_*

# Generate one file for each kind / apiversion[0] combo
yq e '. | {"kind": (.kind | downcase), "apiVersion": (.apiVersion | downcase )}' -s '"/tmp/purple_rbacs_" + (.kind | downcase) + "_" + (.apiVersion | split("/") | .[0] | downcase)' "${FILE}"

for i in /tmp/purple_rbacs_*; do
    #echo -n "${i}"
    kind=$(yq e ".kind" "${i}")
    if [[ "${kind}" != *"s" ]]; then
        kind="${kind}s"
    fi
    apiversion=$(yq e ".apiVersion" "${i}")
    if [[ "${apiversion}" == *"/"* ]]; then
        group=$(cut -d '/' -f 1 <<< "${apiversion}")
    else
        group='""'
    fi
    echo "//+kubebuilder:rbac:groups=${group},resources=${kind},verbs=${BASE_PERMS}"
done
