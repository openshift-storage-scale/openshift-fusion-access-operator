#!/bin/bash
# Script to clean device partitions using oc rsh/oc debug
#
# Usage: ./clean-device-using-oc.sh [--device /dev/nvme2n1] [--method rsh|debug]
#   --device: Device to clean (default: /dev/nvme2n1)
#   --method: Use 'rsh' to connect to existing pod, or 'debug' to create debug pod (default: debug)

set -e

DEVICE="/dev/nvme2n1"
METHOD="debug"
NAMESPACE="ibm-fusion-access"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --device)
            DEVICE="$2"
            shift 2
            ;;
        --method)
            METHOD="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--device /dev/nvme2n1] [--method rsh|debug]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

export KUBECONFIG="${KUBECONFIG:-/home/nlevanon/aws-gpfs-playground/ocp_install_files/auth/kubeconfig}"

# Check if oc is available
if ! command -v oc &> /dev/null; then
    echo "ERROR: 'oc' command not found. Please install OpenShift CLI."
    exit 1
fi

echo "=== Cleaning Device Partitions Using oc ==="
echo "Device: $DEVICE"
echo "Method: $METHOD"
echo ""

# Get storage nodes
STORAGE_NODES=$(kubectl get nodes -l node-role.kubernetes.io/worker,scale.spectrum.ibm.com/role=storage -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")

if [ -z "$STORAGE_NODES" ]; then
    echo "ERROR: No storage nodes found"
    exit 1
fi

echo "Storage nodes: $STORAGE_NODES"
echo ""

# Convert space-separated nodes to array
NODE_ARRAY=($STORAGE_NODES)

if [ "$METHOD" = "rsh" ]; then
    echo "=== Method: oc rsh (using existing discovery pods) ==="
    
    # Find discovery pods
    DISCOVERY_PODS=$(kubectl get pods -n "$NAMESPACE" -l app=local-volume-discovery -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [ -z "$DISCOVERY_PODS" ]; then
        echo "ERROR: No discovery pods found. Try using --method debug instead"
        exit 1
    fi
    
    # For each node, find a pod on that node and run the command
    for node in "${NODE_ARRAY[@]}"; do
        echo "Processing node: $node"
        
        # Find a pod on this node
        POD=$(kubectl get pods -n "$NAMESPACE" -l app=local-volume-discovery -o json | \
            jq -r --arg node "$node" '.items[] | select(.spec.nodeName == $node) | .metadata.name' | head -1)
        
        if [ -z "$POD" ]; then
            echo "  ⚠️  No pod found on node $node, skipping..."
            continue
        fi
        
        echo "  Using pod: $POD"
        echo "  Running: sgdisk --zap-all $DEVICE"
        
        # Try to run the command via oc rsh
        if oc rsh -n "$NAMESPACE" "$POD" sh -c "sgdisk --zap-all $DEVICE 2>&1 && lsblk $DEVICE" 2>&1; then
            echo "  ✓ Successfully cleaned $DEVICE on node $node"
        else
            echo "  ⚠️  Failed to clean via oc rsh. Pod may not have host device access."
            echo "  Trying oc debug node method instead..."
            METHOD="debug"
            break
        fi
        echo ""
    done
fi

if [ "$METHOD" = "debug" ]; then
    echo "=== Method: oc debug node (creates temporary debug pod) ==="
    echo ""
    
    for node in "${NODE_ARRAY[@]}"; do
        echo "Processing node: $node"
        echo "  Creating debug pod on node..."
        
        # Use oc debug to create a pod and run the command
        # Note: oc debug automatically mounts host filesystem at /host
        # We need to chroot into /host to access the actual devices
        echo "  Running: chroot /host sgdisk --zap-all $DEVICE"
        
        # First check if device exists
        DEVICE_EXISTS=$(oc debug "node/$node" --image=quay.io/openshift/origin-tools:latest -- \
            sh -c "chroot /host test -b $DEVICE && echo 'exists' || echo 'not-found'" 2>&1 | grep -E "exists|not-found" | tail -1)
        
        if [ "$DEVICE_EXISTS" = "not-found" ]; then
            echo "  ⚠️  Device $DEVICE not found on node $node (may not exist on this node)"
            continue
        fi
        
        # Clean the device
        OUTPUT=$(oc debug "node/$node" --image=quay.io/openshift/origin-tools:latest -- \
            sh -c "chroot /host bash -c 'echo \"=== Cleaning $DEVICE on node $node ===\" && sgdisk --zap-all $DEVICE 2>&1 && echo \"=== Verifying cleanup ===\" && lsblk $DEVICE 2>&1'" 2>&1 | tee /tmp/cleanup-$node.log)
        
        if echo "$OUTPUT" | grep -qE "Creating new GPT|MBR|GPT|successfully|zap"; then
            echo "  ✓ Successfully cleaned $DEVICE on node $node"
        elif echo "$OUTPUT" | grep -q "does not exist"; then
            echo "  ⚠️  Device $DEVICE does not exist on node $node"
        else
            echo "  ⚠️  Cleanup result unclear. Check logs: /tmp/cleanup-$node.log"
            echo "  Last few lines:"
            tail -5 /tmp/cleanup-$node.log | sed 's/^/    /'
        fi
        echo ""
    done
fi

echo "=== Cleanup Summary ==="
echo "Device: $DEVICE"
echo "Nodes processed: ${#NODE_ARRAY[@]}"
echo ""
echo "Next steps:"
echo "1. Restart discovery pods to force immediate update:"
echo "   kubectl rollout restart daemonset/devicefinder-discovery -n $NAMESPACE"
echo ""
echo "2. Wait for discovery to update (runs every 5 minutes)"
echo ""
echo "3. Verify device appears in LVDR:"
echo "   kubectl get lvdr -n $NAMESPACE -o jsonpath='{.items[*].status.discoveredDevices[*].path}' | grep $DEVICE"

