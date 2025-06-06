#!/bin/bash

# This script lists all the folders in files/ and uses them as "supported CNSA version"
# Then it updates the API_GO_FILE in two places
# It updates two specific lines for the metadata. If those lines are changed in the
# go file this script needs to be amended as well

API_GO_FILE="api/v1alpha1/fusionaccess_types.go"
TMP_FILE=$(mktemp)
trap 'rm -f "${TMP_FILE}"' EXIT SIGINT SIGTERM


#find files -mindepth 1 -type d -exec basename "{}" \;
CNSA_VERSIONS=()
while IFS= read -r dir; do
  CNSA_VERSIONS+=("$(basename "$dir")")
done < <(find files/ -mindepth 1 -maxdepth 1 -type d)

echo "Found the following CNSA Versions: ${CNSA_VERSIONS[@]}"
TECTONIC_VERSIONS="{$(for d in ${CNSA_VERSIONS[@]}; do echo "$d" | sed 's/.*/"urn:alm:descriptor:com.tectonic.ui:select:&"/'; done | paste -sd, -)}"
echo $TECTONIC_VERSIONS

ENUM_VERSIONS="$(IFS=\; ; echo "${CNSA_VERSIONS[*]}")"
echo $ENUM_VERSIONS

# This replaces the enum lines like below and stores it on a tmp file
# // +kubebuilder:validation:Enum=v5.2.1.1;v5.2.2.0;v5.2.2.1
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
    if (lines[i] ~ /StorageScaleVersion CNSAVersions .*storageScaleVersion/ && lines[i-1] ~ /xDescriptors=\{.*\}/) {
      sub(/xDescriptors=\{[^}]*\}/, "xDescriptors=" xd, lines[i-1])
    }
    print lines[i-1]
  }
  print lines[NR]
}' "${TMP_FILE}" > "${API_GO_FILE}"

