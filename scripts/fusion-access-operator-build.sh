#!/bin/bash
set -x -e -o pipefail

CATALOGSOURCE="test-openshift-fusion-access-operator"
NS="ibm-fusion-access"
OPERATOR="openshift-fusion-access-operator"
VERSION="${VERSION:-6.6.6}"
REGISTRY="${REGISTRY:-kuemper.int.rhx/bandini}"

# Image cleanup configuration
CLEANUP_IMAGES="${CLEANUP_IMAGES:-true}"  # Set to false to disable automatic cleanup
CONTAINER_TOOL="${CONTAINER_TOOL:-podman}"

# Source shared cleanup utilities  
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/image-cleanup.sh"

# Setup EXIT trap for final cleanup
cleanup_on_exit() {
    echo "INFO: Build process completed!"
    if [ "$CLEANUP_IMAGES" = "true" ]; then
        echo "INFO: Running final cleanup..."
        cleanup_dangling_images
        cleanup_build_cache
        echo "INFO: Final system status:"
        $CONTAINER_TOOL system df || true
    fi
}

# Register cleanup function to run on script exit
trap cleanup_on_exit EXIT

wait_for_resource() {
    local resource_type=$1  # Either "packagemanifest", "operator", or "csv"
    local name=$2           # Name of the resource (e.g., Operator or CSV)
    local namespace=$3      # Namespace (optional, required for CSV and Operator)
    local label=$4          # Label selector (only for packagemanifests)
    local max_retries=${5:-30}  # Maximum retries (default: 30 = 5 minutes)
    local retry_count=0

    echo "⏳ Waiting for $resource_type: $name"
    while [ $retry_count -lt $max_retries ]; do
        set +e
        if [[ "$resource_type" == "packagemanifest" ]]; then
            oc get -n openshift-marketplace packagemanifests -l "catalog=${label}" --field-selector "metadata.name=${name}" &> /dev/null
        elif [[ "$resource_type" == "operator" ]]; then
            oc get operators.operators.coreos.com "${name}.${namespace}" &> /dev/null
        elif [[ "$resource_type" == "csv" ]]; then
            STATUS=$(oc get csv "$name" -n "$namespace" -o jsonpath='{.status.phase}' 2>/dev/null)
            if [[ "$STATUS" == "Succeeded" ]]; then
                echo "SUCCESS: Operator installation completed successfully!"
                break
            fi
            echo "⏳ Operator installation in progress... (Current status: ${STATUS:-Not Found}, attempt $((retry_count + 1))/$max_retries)"
        else
            echo "ERROR: Unknown resource type: $resource_type"
            return 1
        fi
        ret=$?
        set -e

        if [[ $ret -eq 0 && "$resource_type" != "csv" ]]; then
            echo "SUCCESS: $resource_type: $name is available!"
            break
        fi

        retry_count=$((retry_count + 1))
        sleep 10
    done

    if [ $retry_count -eq $max_retries ]; then
        echo "ERROR: $resource_type $name was not available after $max_retries attempts (5 minutes)"
        return 1
    fi
}

wait_for_catalogsource_ready() {
    local catalogsource_name=$1
    local namespace=${2:-openshift-marketplace}
    local max_retries=${3:-30}  # Maximum retries (default: 30 = 5 minutes)
    local retry_count=0

    echo "⏳ Waiting for CatalogSource ${catalogsource_name} to be fully ready..."
    while [ $retry_count -lt $max_retries ]; do
        set +e
        # Check if CatalogSource exists
        oc get catalogsource "${catalogsource_name}" -n "${namespace}" &> /dev/null
        cs_exists=$?
        
        if [ $cs_exists -ne 0 ]; then
            echo "WARNING: CatalogSource ${catalogsource_name} not found in namespace ${namespace}, retrying... (attempt $((retry_count + 1))/$max_retries)"
            retry_count=$((retry_count + 1))
            sleep 10
            continue
        fi

        # Check if pod exists and is ready
        POD_STATUS=$(oc get pod -n "${namespace}" -l "olm.catalogSource=${catalogsource_name}" -o jsonpath='{.items[0].status.phase}' 2>/dev/null)
        POD_READY=$(oc get pod -n "${namespace}" -l "olm.catalogSource=${catalogsource_name}" -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null)
        POD_NAME=$(oc get pod -n "${namespace}" -l "olm.catalogSource=${catalogsource_name}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
        
        # Check CatalogSource connection state (this is the critical check)
        CS_STATUS=$(oc get catalogsource "${catalogsource_name}" -n "${namespace}" -o jsonpath='{.status.connectionState.lastObservedState}' 2>/dev/null)
        CS_GRPC_STATUS=$(oc get catalogsource "${catalogsource_name}" -n "${namespace}" -o jsonpath='{.status.grpcConnectionState.lastObservedState}' 2>/dev/null)
        set -e

        if [ -z "${POD_NAME}" ]; then
            echo "⏳ CatalogSource pod not found yet, waiting... (attempt $((retry_count + 1))/$max_retries)"
        elif [ "${POD_STATUS}" != "Running" ]; then
            echo "⏳ CatalogSource pod ${POD_NAME} status: ${POD_STATUS}, waiting... (attempt $((retry_count + 1))/$max_retries)"
        elif [ "${POD_READY}" != "True" ]; then
            echo "⏳ CatalogSource pod ${POD_NAME} not ready yet, waiting... (attempt $((retry_count + 1))/$max_retries)"
        elif [ "${CS_STATUS}" != "READY" ] && [ "${CS_GRPC_STATUS}" != "READY" ]; then
            # Wait for connection state to be READY - this is critical for gRPC to work
            echo "⏳ CatalogSource pod ready, but connection state: ${CS_STATUS:-Unknown}/${CS_GRPC_STATUS:-Unknown}, waiting for READY... (attempt $((retry_count + 1))/$max_retries)"
            # If in TRANSIENT_FAILURE or error state, show pod details for debugging
            if [[ "${CS_STATUS}" == "TRANSIENT_FAILURE" ]] || [[ "${CS_STATUS}" == "CONNECTING" ]]; then
                echo "   Checking pod status..."
                oc get pod "${POD_NAME}" -n "${namespace}" -o jsonpath='{.status.phase}' 2>/dev/null | xargs -I {} echo "   Pod phase: {}" || true
                oc get pod "${POD_NAME}" -n "${namespace}" -o jsonpath='{.status.containerStatuses[0].state}' 2>/dev/null | xargs -I {} echo "   Container state: {}" || true
            fi
        else
            echo "SUCCESS: CatalogSource ${catalogsource_name} pod ${POD_NAME} is ready!"
            echo "SUCCESS: CatalogSource connection state: ${CS_STATUS:-${CS_GRPC_STATUS}}"
            # Wait an additional 10 seconds to ensure gRPC service is fully operational
            echo "⏳ Waiting additional 10 seconds for gRPC service to stabilize..."
            sleep 10
            break
        fi

        retry_count=$((retry_count + 1))
        sleep 10
    done

    if [ $retry_count -eq $max_retries ]; then
        echo "ERROR: CatalogSource ${catalogsource_name} was not ready after $max_retries attempts (5 minutes)"
        echo "Checking CatalogSource status:"
        oc get catalogsource "${catalogsource_name}" -n "${namespace}" -o yaml || true
        echo ""
        echo "Checking CatalogSource pod:"
        oc get pod -n "${namespace}" -l "olm.catalogSource=${catalogsource_name}" || true
        echo ""
        echo "Checking CatalogSource pod logs (last 30 lines):"
        POD_NAME=$(oc get pod -n "${namespace}" -l "olm.catalogSource=${catalogsource_name}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
        if [ -n "${POD_NAME}" ]; then
            oc logs -n "${namespace}" "${POD_NAME}" --tail=30 || true
        fi
        return 1
    fi
}

extract_quay_credentials_from_auth_file() {
    # Extract quay.io credentials from a container auth file
    # Usage: extract_quay_credentials_from_auth_file <auth_file_path>
    # Sets global variables: QUAY_USER and QUAY_PASSWORD
    # Note: If QUAY_USER is already set, it will be preserved (useful for podman case)
    local auth_file=$1
    local existing_user="${QUAY_USER:-}"
    
    # Only reset QUAY_USER if it's not already set
    if [ -z "${existing_user}" ]; then
        QUAY_USER=""
    fi
    QUAY_PASSWORD=""
    
    if [ -f "${auth_file}" ] && command -v jq &> /dev/null; then
        local quay_auth=''
        quay_auth=$(jq -r ".auths.\"quay.io\".auth // empty" "${auth_file}" 2>/dev/null || echo "")
        if [ -n "${quay_auth}" ]; then
            # Decode base64 and extract username:password
            local decoded_auth=''
            decoded_auth=$(echo "${quay_auth}" | base64 -d 2>/dev/null || echo "")
            if [ -n "${decoded_auth}" ]; then
                # Only set QUAY_USER if it wasn't already set
                if [ -z "${existing_user}" ]; then
                    QUAY_USER=$(echo "${decoded_auth}" | cut -d':' -f1)
                fi
                QUAY_PASSWORD=$(echo "${decoded_auth}" | cut -d':' -f2)
            fi
        fi
    fi
}

create_catalog_pull_secret() {
    echo "Setting up image pull secret for CatalogSource..."
    # Extract registry from REGISTRY (e.g., quay.io/rh-ee-nlevanon -> quay.io)
    REGISTRY_HOST=$(echo "${REGISTRY}" | cut -d'/' -f1)
    
    # Check if we need authentication (quay.io usually requires auth)
    if [[ "${REGISTRY_HOST}" == "quay.io" ]]; then
        echo "Detected quay.io registry, setting up pull secret..."
        
        # Check if secret already exists
        if oc get secret quay-pull-secret -n openshift-marketplace &>/dev/null; then
            echo "SUCCESS: Pull secret already exists in openshift-marketplace"
        else
            echo "Creating pull secret from ${CONTAINER_TOOL} credentials..."
            QUAY_USER=""
            QUAY_PASSWORD=""
            
            # Extract credentials based on container tool
            if [[ "${CONTAINER_TOOL}" == "docker" ]]; then
                # Docker: Read from ~/.docker/config.json
                DOCKER_AUTH_FILE="${HOME}/.docker/config.json"
                extract_quay_credentials_from_auth_file "${DOCKER_AUTH_FILE}"
            elif [[ "${CONTAINER_TOOL}" == "podman" ]]; then
                # Podman: Try to get username from podman login command
                QUAY_USER=$(podman login --get-login quay.io 2>/dev/null || echo "")
                
                # Try to extract password from auth.json if available
                AUTH_FILE="${HOME}/.config/containers/auth.json"
                extract_quay_credentials_from_auth_file "${AUTH_FILE}"
                # Note: QUAY_USER from podman login takes precedence, only use password from auth file
                # QUAY_USER is already set above, QUAY_PASSWORD is set by the function
            fi
            
            if [ -z "${QUAY_USER}" ]; then
                echo "WARNING: Could not get quay.io username from ${CONTAINER_TOOL} credentials"
                echo "WARNING: Please create the pull secret manually:"
                echo "   oc create secret docker-registry quay-pull-secret \\"
                echo "     --docker-server=quay.io \\"
                echo "     --docker-username=<your-username> \\"
                echo "     --docker-password=<your-token> \\"
                echo "     --docker-email=\"\" \\"
                echo "     -n openshift-marketplace"
                return 1
            fi
            
            # If still no password, provide instructions
            if [ -z "${QUAY_PASSWORD}" ]; then
                echo "WARNING: Could not automatically extract quay.io credentials"
                echo "WARNING: Please create the pull secret manually before running this script:"
                echo ""
                echo "   oc create secret docker-registry quay-pull-secret \\"
                echo "     --docker-server=quay.io \\"
                echo "     --docker-username=${QUAY_USER} \\"
                echo "     --docker-password=<your-token-or-password> \\"
                echo "     --docker-email=\"\" \\"
                echo "     -n openshift-marketplace"
                echo ""
                echo "   oc patch serviceaccount default -n openshift-marketplace \\"
                echo "     --type='json' \\"
                echo "     -p='[{\"op\": \"add\", \"path\": \"/imagePullSecrets/-\", \"value\": {\"name\": \"quay-pull-secret\"}}]'"
                echo ""
                return 1
            fi
            
            # Create docker-registry secret
            oc create secret docker-registry quay-pull-secret \
                --docker-server=quay.io \
                --docker-username="${QUAY_USER}" \
                --docker-password="${QUAY_PASSWORD}" \
                --docker-email="" \
                -n openshift-marketplace || {
                echo "WARNING: Failed to create pull secret"
                return 1
            }
            
            echo "SUCCESS: Pull secret created successfully"
        fi
        
        # Add secret to default service account in openshift-marketplace
        echo "Adding pull secret to default service account..."
        oc patch serviceaccount default -n openshift-marketplace \
            --type='json' \
            -p='[{"op": "add", "path": "/imagePullSecrets/-", "value": {"name": "quay-pull-secret"}}]' 2>/dev/null || {
            # Check if it's already there
            if oc get serviceaccount default -n openshift-marketplace -o jsonpath='{.imagePullSecrets[*].name}' | grep -q quay-pull-secret; then
                echo "SUCCESS: Pull secret already added to default service account"
            else
                echo "WARNING: Failed to add pull secret to default service account (may already exist)"
            fi
        }
        
        echo "SUCCESS: Image pull secret configured for openshift-marketplace namespace"
        echo "   Note: Pull secret will be added to CatalogSource service account after CatalogSource is created"
    else
        echo "Registry ${REGISTRY_HOST} detected, skipping pull secret setup"
    fi
}

cleanup_old_catalogsource() {
    echo "Cleaning up old CatalogSource resources..."
    local catalogsource_name=$1
    local namespace=${2:-openshift-marketplace}
    
    # Delete old CatalogSource pods (they will be recreated automatically)
    echo "Deleting old CatalogSource pods..."
    oc delete pod -n "${namespace}" -l "olm.catalogSource=${catalogsource_name}" --ignore-not-found=true --wait=true --timeout=30s || true
    
    # Wait a moment for pods to be deleted
    sleep 5
    
    # Delete the CatalogSource itself (it will be recreated by catalog-install)
    echo "Deleting old CatalogSource resource..."
    oc delete catalogsource "${catalogsource_name}" -n "${namespace}" --ignore-not-found=true --wait=true --timeout=30s || true
    
    # Wait for cleanup to complete and ensure pods are gone
    echo "Waiting for all pods to be deleted..."
    for i in {1..10}; do
        if ! oc get pod -n "${namespace}" -l "olm.catalogSource=${catalogsource_name}" &>/dev/null; then
            break
        fi
        echo "   Waiting for pods to be deleted... (attempt $i/10)"
        sleep 2
    done
    
    # Force delete any remaining pods
    oc delete pod -n "${namespace}" -l "olm.catalogSource=${catalogsource_name}" --ignore-not-found=true --force --grace-period=0 || true
    
    echo "SUCCESS: Cleanup completed"
}

verify_catalog_image() {
    echo "Verifying catalog image exists and is accessible..."
    local catalog_image="${REGISTRY}/openshift-fusion-access-catalog:${VERSION}"
    
    # Try to pull the image locally to verify it exists
    if command -v "${CONTAINER_TOOL}" &> /dev/null; then
        echo "Checking if catalog image exists: ${catalog_image}"
        if "${CONTAINER_TOOL}" pull "${catalog_image}" &>/dev/null; then
            echo "SUCCESS: Catalog image exists and is accessible"
            return 0
        else
            echo "WARNING: Could not pull catalog image ${catalog_image}"
            echo "   This might be due to authentication issues or the image doesn't exist"
            echo "   The script will continue, but the CatalogSource may fail to start"
            return 1
        fi
    else
        echo "WARNING: ${CONTAINER_TOOL} not found, skipping image verification"
        return 0
    fi
}

apply_subscription() {
    echo "Creating/updating namespace and subscription resources..."
    # Delete existing subscription if it exists (this is safe to do)
    oc delete -n ${NS} subscription/${OPERATOR} || /bin/true
    # Note: We do NOT delete the CatalogSource here - it must exist in openshift-marketplace
    # for the subscription to work. The CatalogSource is created by 'catalog-install' above.
    
    oc apply -f - <<EOF
    apiVersion: v1
    kind: Namespace
    metadata:
      name: ${NS}
    spec:
EOF
    oc apply -f - <<EOF
    apiVersion: operators.coreos.com/v1
    kind: OperatorGroup
    metadata:
      name: fusion-access-operator-group
      namespace: ${NS}
    spec:
      upgradeStrategy: Default
EOF
    oc apply -f - <<EOF
    apiVersion: operators.coreos.com/v1alpha1
    kind: Subscription
    metadata:
      name: ${OPERATOR}
      namespace: ${NS}
    spec:
      channel: fast
      installPlanApproval: Automatic
      name: ${OPERATOR}
      source: ${CATALOGSOURCE}
      sourceNamespace: openshift-marketplace
EOF
}

if [[ -n $(git status --porcelain) ]]; then
    echo "Uncommitted changes detected."
    exit 1
fi

echo "Checking for cluster reachability:"
OUT=$(oc cluster-info 2>&1)
ret=$?
if [ $ret -ne 0 ]; then
    echo "Could not reach cluster: ${OUT}"
    exit 1
fi

# Pre-build cleanup: Free disk space before starting (preserves build cache)
# Note: Only removes dangling images, keeps intermediate layers for faster rebuilds
# Note: Final cleanup handled automatically by EXIT trap
cleanup_dangling_images

echo "INFO: Building and pushing all images..."
make VERSION=${VERSION} IMAGE_TAG_BASE=${REGISTRY}/openshift-fusion-access CHANNELS=fast USE_IMAGE_DIGESTS="" \
    manifests bundle generate docker-build docker-push bundle-build bundle-push console-build console-push \
    devicefinder-docker-build devicefinder-docker-push catalog-build catalog-push

# Verify catalog image exists before proceeding
verify_catalog_image || echo "WARNING: Image verification failed, continuing anyway..."

# Setup image pull secret for CatalogSource if needed (do this BEFORE creating CatalogSource)
create_catalog_pull_secret || echo "WARNING: Pull secret setup skipped, ensure images are publicly accessible or configure manually"

# Clean up old CatalogSource resources before creating new ones
# This must be done BEFORE creating CatalogSource to ensure clean state
cleanup_old_catalogsource "${CATALOGSOURCE}" "openshift-marketplace"

# Double-check: if CatalogSource still exists, delete it again (might have been recreated)
if oc get catalogsource "${CATALOGSOURCE}" -n openshift-marketplace &>/dev/null; then
    echo "WARNING: CatalogSource still exists after cleanup, force deleting..."
    oc delete catalogsource "${CATALOGSOURCE}" -n openshift-marketplace --ignore-not-found=true --wait=true --timeout=30s || true
    # Wait and ensure all pods are gone
    sleep 5
    oc delete pod -n openshift-marketplace -l "olm.catalogSource=${CATALOGSOURCE}" --ignore-not-found=true --force --grace-period=0 || true
fi

# Install the new CatalogSource
make VERSION=${VERSION} IMAGE_TAG_BASE=${REGISTRY}/openshift-fusion-access catalog-install

# Add pull secret to CatalogSource service account (OLM creates it when CatalogSource is created)
# This must be done AFTER CatalogSource creation but BEFORE pod starts pulling
echo "Ensuring pull secret is added to CatalogSource service account..."
REGISTRY_HOST=$(echo "${REGISTRY}" | cut -d'/' -f1)
if [[ "${REGISTRY_HOST}" == "quay.io" ]] && oc get secret quay-pull-secret -n openshift-marketplace &>/dev/null; then
    # Wait a moment for OLM to create the service account
    sleep 2
    # Ensure service account exists
    oc create serviceaccount "${CATALOGSOURCE}" -n openshift-marketplace --dry-run=client -o yaml | oc apply -f - 2>/dev/null || true
    # Add pull secret to CatalogSource service account
    oc patch serviceaccount "${CATALOGSOURCE}" -n openshift-marketplace \
        --type='json' \
        -p='[{"op": "add", "path": "/imagePullSecrets/-", "value": {"name": "quay-pull-secret"}}]' 2>/dev/null || {
        # Check if it's already there
        if oc get serviceaccount "${CATALOGSOURCE}" -n openshift-marketplace -o jsonpath='{.imagePullSecrets[*].name}' 2>/dev/null | grep -q quay-pull-secret; then
            echo "SUCCESS: Pull secret already added to CatalogSource service account"
        else
            echo "WARNING: Adding pull secret to CatalogSource service account..."
            # Try alternative method if patch fails
            oc get serviceaccount "${CATALOGSOURCE}" -n openshift-marketplace -o json | \
                jq '.imagePullSecrets = (.imagePullSecrets // []) + [{"name": "quay-pull-secret"}]' | \
                oc apply -f - 2>/dev/null || echo "WARNING: Could not add pull secret, you may need to add it manually"
        fi
    }
    # Delete any existing pods to force recreation with new service account config
    echo "Deleting any existing CatalogSource pods to force recreation with pull secret..."
    oc delete pod -n openshift-marketplace -l "olm.catalogSource=${CATALOGSOURCE}" --ignore-not-found=true --wait=true --timeout=30s || true
    
    # Force delete any stuck pods
    for pod in $(oc get pod -n openshift-marketplace -l "olm.catalogSource=${CATALOGSOURCE}" -o name 2>/dev/null || true); do
        echo "   Force deleting pod: ${pod}"
        oc delete "${pod}" -n openshift-marketplace --ignore-not-found=true --force --grace-period=0 || true
    done
    
    # Wait a moment for pods to be fully deleted
    sleep 3
    
    echo "SUCCESS: Pull secret configured for CatalogSource service account"
fi

echo "Waiting for CatalogSource to be ready before proceeding..."
wait_for_catalogsource_ready "${CATALOGSOURCE}" "openshift-marketplace"

wait_for_resource "packagemanifest" "${OPERATOR}" "" "${CATALOGSOURCE}"
apply_subscription
wait_for_resource "operator" "${OPERATOR}" "${NS}"

echo "⏳ Waiting for Subscription to install CSV..."
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    set +e
    INSTALLED_CSV=$(oc get subscription "${OPERATOR}" -n "${NS}" -o jsonpath='{.status.installedCSV}' 2>/dev/null)
    ret=$?
    set -e
    
    if [ $ret -ne 0 ]; then
        echo "WARNING: Subscription ${OPERATOR} not found in namespace ${NS}, retrying... (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)"
    elif [ -n "${INSTALLED_CSV}" ]; then
        echo "SUCCESS: CSV installed: ${INSTALLED_CSV}"
        break
    else
        echo "⏳ Waiting for CSV to be installed... (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)"
        # Check subscription status for debugging
        set +e
        SUB_STATUS=$(oc get subscription "${OPERATOR}" -n "${NS}" -o jsonpath='{.status.conditions[?(@.type=="CatalogSourcesUnhealthy")].message}' 2>/dev/null || echo "")
        RESOLUTION_ERROR=$(oc get subscription "${OPERATOR}" -n "${NS}" -o jsonpath='{.status.conditions[?(@.type=="ResolutionFailed")].message}' 2>/dev/null || echo "")
        if [ -n "${SUB_STATUS}" ]; then
            echo "   Subscription status: ${SUB_STATUS}"
        fi
        if [ -n "${RESOLUTION_ERROR}" ]; then
            echo "   WARNING: Resolution error: ${RESOLUTION_ERROR}"
            # If there's a resolution error, check CatalogSource pod status
            CS_POD=$(oc get pod -n openshift-marketplace -l "olm.catalogSource=${CATALOGSOURCE}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
            if [ -n "${CS_POD}" ]; then
                CS_POD_STATUS=$(oc get pod -n openshift-marketplace "${CS_POD}" -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
                echo "   CatalogSource pod ${CS_POD} status: ${CS_POD_STATUS}"
            fi
        fi
        set -e
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 10
done

if [ -z "${INSTALLED_CSV}" ]; then
    echo "ERROR: CSV was not installed after $MAX_RETRIES attempts (5 minutes)"
    echo "Checking subscription status:"
    oc get subscription "${OPERATOR}" -n "${NS}" -o yaml || true
    exit 1
fi

wait_for_resource "csv" "${INSTALLED_CSV}" "${NS}"

echo "SUCCESS: All done! Operator ${OPERATOR} is now installed and running in namespace ${NS}"
# Note: Final cleanup will be handled automatically by EXIT trap
