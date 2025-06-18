#!/bin/bash
set -e -o pipefail

PROJ="storage-scale-releng-tenant"
DEST_REGISTRY="quay.io/openshift-storage-scale"

if [ -z "$1" ]; then
  # COMMIT=$(get_last_git_merge_commit)
  # echo "Using the last merge commit automatically: ${COMMIT}"
  echo "Please pass the merge commit you want to use: ./$0 <mergecommit>"
  exit 1
fi
COMMIT="${1}"
echo "User provided commit: ${COMMIT}"

if ! oc project "${PROJ}" &> /dev/null; then
  echo "Cannot access project ${PROJ}"
  echo "Make sure you are logged in via: https://oauth-openshift.apps.stone-prd-rh01.pg1f.p1.openshiftapps.com/oauth/token/display"
  exit 1
fi

applicationName=operator-0-1
releaseVersion=$(echo $applicationName | sed 's/operator//g')
operator_bundle=$(oc get components -ojsonpath='{range .items[?(@.spec.application=="'$applicationName'")]}{.metadata.name}{"\n"}{end}' | grep bundle)

unset components
declare -A components
componentNames=($(oc get components -ojsonpath='{range .items[?(@.spec.application=="'$applicationName'")]}{.metadata.name}{"\n"}{end}'))
for name in ${componentNames[@]}; do
  genericName=$(echo $name | sed 's/'$releaseVersion'//g')
  components[$genericName]=$name
done

SNAPSHOT=$(oc get snapshots --sort-by .metadata.creationTimestamp \
  -l appstudio.openshift.io/component=$operator_bundle  \
  -l pac.test.appstudio.openshift.io/event-type=push \
  -l pac.test.appstudio.openshift.io/sha=${COMMIT} \
  -ojsonpath='{range .items[*]}{@.metadata.name}{"\n"}{end}')

SNAPSHOT_COUNT=$(echo "${SNAPSHOT}" | grep -c '^')

if [ "${SNAPSHOT_COUNT}" -gt 1 ]; then
  echo "Error: More than one matching snapshot found:" >&2
  echo "${SNAPSHOT}" >&2
  exit 1
fi

if [ "${SNAPSHOT_COUNT}" -eq 0 ]; then
  echo "Error: No matching snapshot found." >&2
  exit 1
fi

bundle=$(oc get snapshot ${SNAPSHOT} -ojsonpath='{.spec.components[?(@.name=="'$operator_bundle'")].containerImage}')
releaseLabelInBundle=$(skopeo inspect docker://$bundle --format "{{.Labels.release}}")
echo "Using snapshot: ${SNAPSHOT}"
echo " bundle: ${bundle}"
echo " release label: ${releaseLabelInBundle}"

unset errors
declare -A errors
echo "Checking hashes:"
for genericName in "${!components[@]}"; do
  versionedName="${components[$genericName]}"
  if [[ "$versionedName" == "$operator_bundle" ]]; then
    continue
  fi
  echo -n "$versionedName "
  echo -n "- Image digest: "
  imagePullSpecInSnapshot=$(oc get snapshot ${SNAPSHOT} -ojsonpath='{.spec.components[?(@.name=="'$versionedName'")].containerImage}')
  imageSHAInSnapshot=$(awk -F'@' '{print $2}' <<< "$imagePullSpecInSnapshot")
  imagePullSpecInBundle=$(skopeo inspect docker://$bundle --format '{{ index .Labels "'$genericName'" }}')
  imageSHAInBundle=$(awk -F'@' '{print $2}' <<< "$imagePullSpecInBundle")
  if [ -n "$imagePullSpecInSnapshot" ] && [ "$imageSHAInBundle" = "$imageSHAInSnapshot" ]; then
    echo -n "${imageSHAInBundle}"
  else
    errors+="$versionedName has digest $imageSHAInBundle in bundle but in snapshot it is $imageSHAInSnapshot \n";
    echo -n "Mismatch 👎"
  fi
  echo -n -e " - Release version: "
  imagePullSpecInSnapshot=$(oc get snapshot ${SNAPSHOT} -ojsonpath='{.spec.components[?(@.name=="'$versionedName'")].containerImage}')
  releaseLabelInComponent=$(skopeo inspect docker://$imagePullSpecInSnapshot --format "{{.Labels.release}}")
  if [ -n "$imagePullSpecInSnapshot" ] && [ "$releaseLabelInBundle" = "$releaseLabelInComponent" ]; then
    echo "$releaseLabelInBundle"
  else
    errors+="$versionedName has release $releaseLabelInBundle in bundle but in snapshot it is $releaseLabelInComponent \n";
    echo "Mismatch 👎"
  fi
done
echo ""
if [[ ${#errors[@]} == 0 ]];then
  echo "OK: snapshot ${SNAPSHOT} image pullspecs and release versions match with bundle's labels"
else
  echo "ERROR: This snapshot is not a good candidate for a release:"
  for error in ${(v)errors}; do
    echo -e $error
  done
  exit 1
fi

echo "Copying images to new location:"

for genericName in "${!components[@]}"; do
  versionedName="${components[$genericName]}"
  if [[ "$versionedName" == "$operator_bundle" ]]; then
    continue
  fi
  SOURCEIMAGE=$(oc get snapshot ${SNAPSHOT} -ojsonpath='{.spec.components[?(@.name=="'$versionedName'")].containerImage}')
  # quay.io/redhat-user-workloads/storage-scale-releng-tenant/must-gather-rhel9@sha256:efab18bf6e451624c1146cd04c672ae64a300fc2611b8dc10c0c1287607e976e
  # Extract repo name (everything after the last slash before @)
  REPO=$(basename "${SOURCEIMAGE%%@*}")
  DIGEST="${SOURCEIMAGE##*@}"
  DESTIMAGE="${DEST_REGISTRY}/${REPO}@${DIGEST}"
  echo "Check ${genericName} - ${versionedName}"
  case ${genericName} in
    console-plugin)
      export CONSOLE_PLUGIN_IMAGE=${DESTIMAGE}
      ;;
    controller-rhel9-operator)
      export OPERATOR_IMG=${DESTIMAGE}
      ;;
    devicefinder)
      export DEVICEFINDER_IMAGE=${DESTIMAGE}
      ;;
  esac

  echo "Uploading ${SOURCEIMAGE} to ${DESTIMAGE}"
  skopeo copy docker://${SOURCEIMAGE} docker://${DESTIMAGE}
done

echo "Rebuilding bundle with ${CONSOLE_PLUGIN_IMAGE} - ${OPERATOR_IMG} - ${DEVICEFINDER_IMAGE}"
make bundle
export BUNDLE_IMG="${DEST_REGISTRY}/openshift-fusion-access-bundle:$(cat VERSION.txt)"
echo "Rebuilding bundle image: ${BUNDLE_IMG}"
make bundle-build
echo "Pushing ${BUNDLE_IMG}"
podman push "${BUNDLE_IMG}"

BUNDLE_DIR="released-bundles/$(cat VERSION.txt)"
echo "Copying the newly created bundle to ${BUNDLE_DIR}"
mkdir -p "${BUNDLE_DIR}"
cp -avf bundle "${BUNDLE_DIR}"

export BUNDLE_IMGS=$(skopeo list-tags docker://${DEST_REGISTRY}/openshift-fusion-access-bundle | jq -r '[.Tags[] | select(test("^([0-9]+)\\.([0-9]+)\\.([0-9]+)($|-).*"))| "'${DEST_REGISTRY}'/openshift-fusion-access-bundle:\(.)"] | join(",")')
export CATALOG_IMG="${DEST_REGISTRY}/openshift-fusion-access-catalog:latest"
make catalog-build 
echo "Catalog built: ${CATALOG_IMG}"
make catalog-push

echo ""
echo "The following containers where pushed:"
echo "${CONSOLE_PLUGIN_IMAGE}"
echo "${OPERATOR_IMG}"
echo "${DEVICEFINDER_IMAGE}"
echo "${BUNDLE_IMG}"
echo ""
echo "The catalog has been pushed to: ${CATALOG_IMG}"
echo ""
echo "If you are happy about the changes you can run:"
echo "podman tag ${DEST_REGISTRY}/openshift-fusion-access-catalog:$(cat VERSION.txt) ${DEST_REGISTRY}/openshift-fusion-access-catalog:stable"
echo "podman push ${DEST_REGISTRY}/openshift-fusion-access-catalog:stable"
