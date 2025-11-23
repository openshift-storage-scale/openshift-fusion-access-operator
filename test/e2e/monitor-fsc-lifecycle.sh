#!/bin/bash
# Script to monitor FSC lifecycle including VolumeSnapshotClass creation
#
# Usage: ./monitor-fsc-lifecycle.sh <fsc-name> [namespace]
#   fsc-name: Name of the FileSystemClaim to monitor
#   namespace: Namespace (default: ibm-spectrum-scale)

set -e

FSC_NAME="${1:-fsc-single}"
NAMESPACE="${2:-ibm-spectrum-scale}"

export KUBECONFIG="${KUBECONFIG:-/home/nlevanon/aws-gpfs-playground/ocp_install_files/auth/kubeconfig}"

echo "=== Monitoring FSC Lifecycle: $FSC_NAME ==="
echo "Namespace: $NAMESPACE"
echo ""

# Function to check condition
check_condition() {
    local condition_type=$1
    kubectl get fsc "$FSC_NAME" -n "$NAMESPACE" -o jsonpath="{.status.conditions[?(@.type=='$condition_type')].status}" 2>/dev/null || echo "Unknown"
}

# Function to get condition message
get_condition_message() {
    local condition_type=$1
    kubectl get fsc "$FSC_NAME" -n "$NAMESPACE" -o jsonpath="{.status.conditions[?(@.type=='$condition_type')].message}" 2>/dev/null || echo ""
}

echo "=== Current FSC Status ==="
kubectl get fsc "$FSC_NAME" -n "$NAMESPACE" -o wide 2>/dev/null || echo "FSC not found"
echo ""

echo "=== All Conditions ==="
kubectl get fsc "$FSC_NAME" -n "$NAMESPACE" -o jsonpath='{range .status.conditions[*]}{.type}: {.status} ({.reason}) - {.message}{"\n"}{end}' 2>/dev/null || echo "No conditions found"
echo ""

echo "=== VolumeSnapshotClass Status ==="
if kubectl get volumesnapshotclass "$FSC_NAME" &>/dev/null; then
    echo "✓ VolumeSnapshotClass exists: $FSC_NAME"
    echo ""
    echo "Details:"
    kubectl get volumesnapshotclass "$FSC_NAME" -o jsonpath='{.driver}{"\n"}{.deletionPolicy}{"\n"}' 2>/dev/null
    echo ""
    kubectl get volumesnapshotclass "$FSC_NAME" -o jsonpath='{.metadata.labels}' 2>/dev/null | jq '.' 2>/dev/null || echo ""
else
    echo "✗ VolumeSnapshotClass not found: $FSC_NAME"
    echo ""
    VSC_CONDITION=$(check_condition "VolumeSnapshotClassCreated")
    if [ "$VSC_CONDITION" = "True" ]; then
        echo "⚠️  Condition says VolumeSnapshotClassCreated=True, but resource not found (may be deleted)"
    else
        echo "Condition: VolumeSnapshotClassCreated=$VSC_CONDITION"
        get_condition_message "VolumeSnapshotClassCreated" | sed 's/^/  /'
    fi
fi
echo ""

echo "=== StorageClass Status ==="
if kubectl get storageclass "$FSC_NAME" &>/dev/null; then
    echo "✓ StorageClass exists: $FSC_NAME"
else
    echo "✗ StorageClass not found: $FSC_NAME"
fi
echo ""

echo "=== Filesystem Status ==="
if kubectl get filesystem "$FSC_NAME" -n "$NAMESPACE" &>/dev/null; then
    echo "✓ Filesystem exists: $FSC_NAME"
    kubectl get filesystem "$FSC_NAME" -n "$NAMESPACE" -o jsonpath='{.status.phase}{"\n"}' 2>/dev/null || echo ""
else
    echo "✗ Filesystem not found: $FSC_NAME"
fi
echo ""

echo "=== LocalDisks Status ==="
LOCALDISKS=$(kubectl get localdisk -n "$NAMESPACE" -l fusion.storage.openshift.io/owned-by-fsc-name="$FSC_NAME" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
if [ -n "$LOCALDISKS" ]; then
    echo "✓ LocalDisks found:"
    for ld in $LOCALDISKS; do
        echo "  - $ld"
        kubectl get localdisk "$ld" -n "$NAMESPACE" -o jsonpath='  Phase: {.status.phase}, Device: {.spec.device}{"\n"}' 2>/dev/null || echo ""
    done
else
    echo "✗ No LocalDisks found for FSC: $FSC_NAME"
fi
echo ""

echo "=== Monitoring Commands ==="
echo ""
echo "Watch FSC status:"
echo "  kubectl get fsc $FSC_NAME -n $NAMESPACE -w"
echo ""
echo "Watch VolumeSnapshotClass:"
echo "  kubectl get volumesnapshotclass $FSC_NAME -w"
echo ""
echo "Follow operator logs:"
echo "  kubectl logs -n ibm-spectrum-scale-operator-system deployment/fusion-access-operator-controller-manager -f | grep -i volumesnapshotclass"
echo ""
echo "Check all conditions:"
echo "  kubectl get fsc $FSC_NAME -n $NAMESPACE -o jsonpath='{range .status.conditions[*]}{.type}: {.status} ({.reason}){\"\\n\"}{end}'"

