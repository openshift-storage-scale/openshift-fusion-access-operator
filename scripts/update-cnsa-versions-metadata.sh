#!/bin/bash

# This script gets the CNSA to be supported from the file CNSA_VERSION.txt.
# It verifies the corresponding install.yaml file exists and
# then it updates the API_GO_FILE in two places
# It updates two specific lines for the metadata. If those lines are changed in the
# go file this script needs to be amended as well

CNSA_VERSION=$(cat CNSA_VERSION.txt)

if [[ $CNSA_VERSION != v* ]]; then
    echo "the CNSA version $CNSA_VERSION must start with a 'v'"
    exit 1
fi

if [[ -f files/$CNSA_VERSION/install.yaml ]]; then
    echo "found CNSA version $CNSA_VERSION install.yaml"
else
    echo "couldn't find files/$CNSA_VERSION/install.yaml"
    exit 1
fi

API_GO_FILE="api/v1alpha1/fusionaccess_types.go"

TMP_FILE=$(mktemp)
trap 'rm -f "${TMP_FILE}"' EXIT SIGINT SIGTERM

TECTONIC_VERSIONS="{$(for d in ${CNSA_VERSION}; do echo "$d" | sed 's/.*/"urn:alm:descriptor:com.tectonic.ui:select:&"/'; done | paste -sd, -)}"
echo $TECTONIC_VERSIONS

ENUM_VERSIONS="$(IFS=\; ; echo "${CNSA_VERSION}")"
echo $ENUM_VERSIONS

# This replaces the enum lines like below and stores it on a tmp file
# // +kubebuilder:validation:Enum=v5.2.3.1
# type CNSAVersions string
awk -v enum="$ENUM_VERSIONS" '
{
  lines[NR] = $0
}
END {
  for (i = 2; i <= NR; i++) {
    if (lines[i] ~ /^type StorageScaleVersions.*/ && lines[i-1] ~ /Enum=.*/) {
      sub(/Enum=.*/, "Enum=" enum, lines[i-1])
    }
    print lines[i-1]
  }
  print lines[NR]
}' "${API_GO_FILE}" > "${TMP_FILE}"


# This replaces the xDescriptors section of the line above the "IbmCnsaVersion StorageScaleVersions" line
# and does so on the previous tmp file and saves it to the original file
# // +operator-sdk:csv:customresourcedefinitions:type=spec,order=2,xDescriptors={"urn:alm:descriptor:com.tectonic.ui:select:v5.2.1.1","urn:alm:descriptor:com.tectonic.ui:select:v5.2.2.0","urn:alm:descriptor:com.tectonic.ui:select:v5.2.2.1"}
# StorageScaleVersion StorageScaleVersions CNSAVersions `json:"storageScaleVersion,omitempty"`
awk -v xd="$TECTONIC_VERSIONS" '
{
  lines[NR] = $0
}
END {
  for (i = 2; i <= NR; i++) {
    if (lines[i] ~ /StorageScaleVersion StorageScaleVersions.*storageScaleVersion/ && lines[i-1] ~ /xDescriptors=\{.*\}/) {
      sub(/xDescriptors=\{[^}]*\}/, "xDescriptors=" xd, lines[i-1])
    }
    print lines[i-1]
  }
  print lines[NR]
}' "${TMP_FILE}" > "${API_GO_FILE}"

# Update the hard-coded version numbers in the console files
for f in "console/src/shared/types/fusion-storage-openshift-io/v1alpha1/FusionAccess.ts"; do
    sed -i -E "s/(storageScaleVersion\?:.*)\".*\"/\1\"$CNSA_VERSION\"/" $f
done

# Update the hard-coded version number in the fusionaccess object sample
sed -i -E "s/(storageScaleVersion:.*)\".*\"/\1\"$CNSA_VERSION\"/" config/samples/fusion_v1alpha1_fusionaccess.yaml
