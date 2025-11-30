#!/bin/bash
# Complete cleanup script for FSC and all related resources
#
# This script properly cleans up FSC by:
# 1. Finding and deleting blocking PVCs/PVs
# 2. Adding deletion label to Filesystem
# 3. Removing finalizers from Filesystem and LocalDisks
# 4. Deleting FSC
# 5. Waiting for complete cleanup
#
# Usage: ./cleanup-fsc-complete.sh <fsc-name> [namespace]

set -e

FSC_NAME="${1:-filesystemclaim-sample}"
NAMESPACE="${2:-ibm-spectrum-scale}"

export KUBECONFIG="${KUBECONFIG:-/home/nlevanon/aws-gpfs-playground/ocp_install_files/auth/kubeconfig}"

echo "=== Complete FSC Cleanup: $FSC_NAME ==="
echo "Namespace: $NAMESPACE"
echo ""

# Check if FSC exists
if ! kubectl get fsc "$FSC_NAME" -n "$NAMESPACE" &>/dev/null; then
    echo "FSC $FSC_NAME not found, checking for orphaned resources..."
else
    echo "✅ FSC found: $FSC_NAME"
fi

# Step 1: Find and delete blocking PVCs/PVs
echo "=== Step 1: Cleaning up blocking PVCs/PVs ==="
STORAGECLASS="$FSC_NAME"

# Find and delete PVCs
PVCs=$(kubectl get pvc -A -o json 2>/dev/null | \
    jq -r --arg sc "$STORAGECLASS" '.items[]? | select(.spec.storageClassName == $sc) | "\(.metadata.namespace)/\(.metadata.name)"' || echo "")

if [ -n "$PVCs" ]; then
    echo "Found PVCs using StorageClass:"
    echo "$PVCs" | while read ns name; do
        [ -n "$ns" ] && [ -n "$name" ] && echo "  Deleting PVC: $ns/$name"
        kubectl delete pvc "$name" -n "$ns" --timeout=30s 2>&1 | head -1 || true
    done
else
    echo "No blocking PVCs found"
fi

# Find and delete PVs
PVs=$(kubectl get pv -o json 2>/dev/null | \
    jq -r --arg sc "$STORAGECLASS" '.items[]? | select(.spec.storageClassName == $sc) | .metadata.name' || echo "")

if [ -n "$PVs" ]; then
    echo "Found PVs using StorageClass:"
    echo "$PVs" | while read pv; do
        [ -n "$pv" ] && echo "  Deleting PV: $pv"
        kubectl delete pv "$pv" --timeout=30s 2>&1 | head -1 || true
    done
else
    echo "No blocking PVs found"
fi

echo ""

# Step 2: Add deletion label to Filesystem
echo "=== Step 2: Adding deletion label to Filesystem ==="
if kubectl get filesystem "$FSC_NAME" -n "$NAMESPACE" &>/dev/null; then
    kubectl label filesystem "$FSC_NAME" -n "$NAMESPACE" scale.spectrum.ibm.com/allowDelete="" --overwrite 2>&1
    echo "✅ Deletion label added"
else
    echo "Filesystem not found (may already be deleted)"
fi
echo ""

# Step 3: Remove finalizers from Filesystem
echo "=== Step 3: Removing finalizers from Filesystem ==="
if kubectl get filesystem "$FSC_NAME" -n "$NAMESPACE" &>/dev/null; then
    FINALIZERS=$(kubectl get filesystem "$FSC_NAME" -n "$NAMESPACE" -o jsonpath='{.metadata.finalizers[*]}' 2>/dev/null || echo "")
    if [ -n "$FINALIZERS" ]; then
        echo "Removing finalizers: $FINALIZERS"
        kubectl patch filesystem "$FSC_NAME" -n "$NAMESPACE" -p '{"metadata":{"finalizers":[]}}' --type=merge 2>&1
        echo "✅ Finalizers removed"
    else
        echo "No finalizers found"
    fi
else
    echo "Filesystem not found"
fi
echo ""

# Step 4: Find and remove finalizers from LocalDisks
echo "=== Step 4: Cleaning up LocalDisks ==="
LOCALDISKS=$(kubectl get localdisk -n "$NAMESPACE" -l fusion.storage.openshift.io/owned-by-fsc-name="$FSC_NAME" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")

if [ -z "$LOCALDISKS" ]; then
    # Try to find by device
    LOCALDISKS=$(kubectl get localdisk -n "$NAMESPACE" -o json 2>/dev/null | \
        jq -r --arg fsc "$FSC_NAME" '.items[]? | select(.metadata.ownerReferences[]? | select(.kind=="FileSystemClaim" and .name==$fsc)) | .metadata.name' || echo "")
fi

if [ -n "$LOCALDISKS" ]; then
    echo "Found LocalDisks:"
    for ld in $LOCALDISKS; do
        echo "  Processing LocalDisk: $ld"
        FINALIZERS=$(kubectl get localdisk "$ld" -n "$NAMESPACE" -o jsonpath='{.metadata.finalizers[*]}' 2>/dev/null || echo "")
        if [ -n "$FINALIZERS" ]; then
            echo "    Removing finalizers: $FINALIZERS"
            kubectl patch localdisk "$ld" -n "$NAMESPACE" -p '{"metadata":{"finalizers":[]}}' --type=merge 2>&1 || true
        fi
        # Try to delete
        kubectl delete localdisk "$ld" -n "$NAMESPACE" --timeout=30s 2>&1 | head -1 || true
    done
    echo "✅ LocalDisks processed"
else
    echo "No LocalDisks found for FSC"
fi
echo ""

# Step 5: Delete FSC
echo "=== Step 5: Deleting FSC ==="
if kubectl get fsc "$FSC_NAME" -n "$NAMESPACE" &>/dev/null; then
    # Remove finalizers from FSC
    FINALIZERS=$(kubectl get fsc "$FSC_NAME" -n "$NAMESPACE" -o jsonpath='{.metadata.finalizers[*]}' 2>/dev/null || echo "")
    if [ -n "$FINALIZERS" ]; then
        echo "Removing finalizers from FSC: $FINALIZERS"
        kubectl patch fsc "$FSC_NAME" -n "$NAMESPACE" -p '{"metadata":{"finalizers":[]}}' --type=merge 2>&1
    fi
    
    kubectl delete fsc "$FSC_NAME" -n "$NAMESPACE" --timeout=60s 2>&1 | head -1 || true
    echo "✅ FSC deletion initiated"
else
    echo "FSC not found (may already be deleted)"
fi
echo ""

# Step 6: Wait for cleanup
echo "=== Step 6: Waiting for cleanup to complete ==="
MAX_WAIT=300
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    FSC_EXISTS=$(kubectl get fsc "$FSC_NAME" -n "$NAMESPACE" &>/dev/null && echo "yes" || echo "no")
    FS_EXISTS=$(kubectl get filesystem "$FSC_NAME" -n "$NAMESPACE" &>/dev/null && echo "yes" || echo "no")
    LD_COUNT=$(kubectl get localdisk -n "$NAMESPACE" -l fusion.storage.openshift.io/owned-by-fsc-name="$FSC_NAME" --no-headers 2>/dev/null | wc -l || echo "0")
    
    if [ "$FSC_EXISTS" = "no" ] && [ "$FS_EXISTS" = "no" ] && [ "$LD_COUNT" -eq 0 ]; then
        echo "✅ All resources cleaned up"
        break
    fi
    
    if [ $((ELAPSED % 30)) -eq 0 ]; then
        echo "  Waiting... (${ELAPSED}s elapsed)"
        echo "    FSC exists: $FSC_EXISTS"
        echo "    Filesystem exists: $FS_EXISTS"
        echo "    LocalDisks: $LD_COUNT"
    fi
    
    sleep 10
    ELAPSED=$((ELAPSED + 10))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "⚠️  Cleanup did not complete within $MAX_WAIT seconds"
    echo "Remaining resources:"
    kubectl get fsc,filesystem,localdisk -n "$NAMESPACE" | grep "$FSC_NAME" || echo "None found"
fi

echo ""
echo "=== Cleanup Summary ==="
echo "FSC: $FSC_NAME"
echo "Namespace: $NAMESPACE"
echo "Status: $([ "$FSC_EXISTS" = "no" ] && [ "$FS_EXISTS" = "no" ] && echo "✅ Complete" || echo "⚠️  Incomplete")"

