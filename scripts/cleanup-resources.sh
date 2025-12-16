#!/bin/bash
# Cleanup script for resources created by fusion-access-operator-build.sh
# This script handles finalizers and ensures proper cleanup order

set -e

NS="${NS:-ibm-fusion-access}"
OPERATOR="${OPERATOR:-openshift-fusion-access-operator}"
CATALOGSOURCE="${CATALOGSOURCE:-test-openshift-fusion-access-operator}"

# Function to remove finalizers from a resource
remove_finalizers() {
    local resource_type=$1
    local name=$2
    local namespace=$3
    
    if [ -z "$name" ]; then
        return 0
    fi
    
    echo "   Removing finalizers from ${resource_type}/${name}..."
    oc patch "${resource_type}" "${name}" -n "${namespace}" \
        -p '{"metadata":{"finalizers":[]}}' \
        --type=merge 2>/dev/null || true
}

# Function to delete a resource with finalizer handling
delete_resource() {
    local resource_type=$1
    local name=$2
    local namespace=$3
    
    if [ -z "$name" ]; then
        return 0
    fi
    
    # Try to get the resource
    if ! oc get "${resource_type}" "${name}" -n "${namespace}" &>/dev/null; then
        return 0
    fi
    
    # Try to delete
    oc delete "${resource_type}" "${name}" -n "${namespace}" \
        --ignore-not-found=true --wait=false || true
    
    # Wait a moment
    sleep 1
    
    # Remove finalizers if still exists
    if oc get "${resource_type}" "${name}" -n "${namespace}" &>/dev/null; then
        remove_finalizers "${resource_type}" "${name}" "${namespace}"
        # Try to delete again
        oc delete "${resource_type}" "${name}" -n "${namespace}" \
            --ignore-not-found=true --wait=false || true
    fi
}

echo "Cleaning up resources created by fusion-access-operator-build.sh..."
echo "Namespace: ${NS}"
echo "Operator: ${OPERATOR}"
echo "CatalogSource: ${CATALOGSOURCE}"
echo ""

# Step 1: Delete Subscription (this will cascade delete CSV and Operator)
echo "1. Deleting Subscription..."
if oc get subscription "${OPERATOR}" -n "${NS}" &>/dev/null; then
    delete_resource "subscription" "${OPERATOR}" "${NS}"
else
    echo "   Subscription not found, skipping..."
fi
echo ""

# Step 2: Delete CSV resources
echo "2. Deleting CSV resources..."
CSV_LIST=$(oc get csv -n "${NS}" -o name 2>/dev/null | grep "${OPERATOR}" || true)
if [ -n "${CSV_LIST}" ]; then
    while IFS= read -r csv; do
        if [ -n "${csv}" ]; then
            csv_name=$(echo "${csv}" | cut -d'/' -f2)
            echo "   Deleting CSV: ${csv_name}"
            delete_resource "csv" "${csv_name}" "${NS}"
        fi
    done <<< "${CSV_LIST}"
else
    echo "   No CSV resources found, skipping..."
fi
echo ""

# Step 3: Delete Operator resource
echo "3. Deleting Operator resource..."
OPERATOR_NAME="${OPERATOR}.${NS}"
if oc get operators.operators.coreos.com "${OPERATOR_NAME}" &>/dev/null; then
    delete_resource "operators.operators.coreos.com" "${OPERATOR_NAME}" "${NS}"
else
    echo "   Operator not found, skipping..."
fi
echo ""

# Step 4: Delete OperatorGroup
echo "4. Deleting OperatorGroup..."
if oc get operatorgroup fusion-access-operator-group -n "${NS}" &>/dev/null; then
    delete_resource "operatorgroup" "fusion-access-operator-group" "${NS}"
else
    echo "   OperatorGroup not found, skipping..."
fi
echo ""

# Step 5: Delete CatalogSource and pods
echo "5. Deleting CatalogSource and pods..."
# Delete pods first
echo "   Deleting CatalogSource pods..."
oc delete pod -n openshift-marketplace \
    -l "olm.catalogSource=${CATALOGSOURCE}" \
    --ignore-not-found=true --wait=false || true
sleep 2

# Delete CatalogSource
if oc get catalogsource "${CATALOGSOURCE}" -n openshift-marketplace &>/dev/null; then
    delete_resource "catalogsource" "${CATALOGSOURCE}" "openshift-marketplace"
else
    echo "   CatalogSource not found, skipping..."
fi
echo ""

# Step 6: Clean up remaining resources in namespace before deleting namespace
echo "6. Cleaning up remaining resources in namespace..."
if oc get namespace "${NS}" &>/dev/null; then
    echo "   Removing finalizers from remaining resources..."
    
    # List of resource types to clean up
    RESOURCE_TYPES="deployments services configmaps secrets routes ingress networkpolicies daemonsets statefulsets jobs cronjobs"
    
    for resource_type in ${RESOURCE_TYPES}; do
        RESOURCE_LIST=$(oc get "${resource_type}" -n "${NS}" -o name 2>/dev/null || true)
        if [ -n "${RESOURCE_LIST}" ]; then
            while IFS= read -r item; do
                if [ -n "${item}" ]; then
                    item_name=$(echo "${item}" | cut -d'/' -f2)
                    echo "     Removing finalizers from ${resource_type}/${item_name}..."
                    remove_finalizers "${resource_type}" "${item_name}" "${NS}"
                    oc delete "${resource_type}" "${item_name}" -n "${NS}" \
                        --ignore-not-found=true --wait=false || true
                fi
            done <<< "${RESOURCE_LIST}"
        fi
    done
else
    echo "   Namespace not found, skipping..."
fi
echo ""

# Step 7: Delete Namespace
echo "7. Deleting Namespace..."
if oc get namespace "${NS}" &>/dev/null; then
    echo "   Attempting to delete namespace..."
    oc delete namespace "${NS}" --ignore-not-found=true --wait=false || true
    
    # Wait a bit and check if it's still there
    sleep 3
    
    if oc get namespace "${NS}" &>/dev/null; then
        echo "   Namespace still exists, removing finalizers..."
        remove_finalizers "namespace" "${NS}" ""
        oc delete namespace "${NS}" --ignore-not-found=true --wait=false || true
        
        # Final check - if still there, show warning
        sleep 2
        if oc get namespace "${NS}" &>/dev/null; then
            echo "   ⚠️  Warning: Namespace ${NS} still exists after cleanup"
            echo "   This may be due to remaining resources with finalizers"
            echo "   You may need to manually clean up remaining resources"
        else
            echo "   ✅ Namespace deleted successfully"
        fi
    else
        echo "   ✅ Namespace deleted successfully"
    fi
else
    echo "   Namespace not found, skipping..."
fi
echo ""

echo "✅ Cleanup completed!"

