#!/bin/bash
# Script to prepare devices for new FSC by cleaning up existing FSCs
#
# This script:
# 1. Adds deletion label to Filesystems (required for FSC deletion)
# 2. Deletes existing FSCs that are using the specified devices
# 3. Waits for controller to clean up all resources
# 4. Optionally cleans up GPFS partitions on devices
# 5. Verifies devices appear in LVDR for new FSC creation
#
# Usage: ./prepare_fsc_object.sh [--devices /dev/nvme1n1,/dev/nvme2n1] [--namespace ibm-spectrum-scale] [--clean-partitions] [--skip-verification]
#
# Options:
#   --devices          Comma-separated list of device paths (default: /dev/nvme1n1,/dev/nvme2n1)
#   --namespace        Namespace where FSCs are located (default: ibm-spectrum-scale)
#   --clean-partitions Clean GPFS partitions from devices after FSC deletion
#   --skip-verification Skip LVDR verification at the end
#   --help             Show this help message

set -e

# Default values
DEVICES="/dev/nvme1n1,/dev/nvme2n1"
NAMESPACE="ibm-spectrum-scale"
CLEAN_PARTITIONS=false
SKIP_VERIFICATION=false
OPERATOR_NS="ibm-fusion-access"

# Load common functions if available
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/lib"

if [ -f "$LIB_DIR/common-functions.sh" ]; then
    source "$LIB_DIR/common-functions.sh"
else
    # Minimal logging functions if common-functions not available
    log_info() { echo "[INFO] $1"; }
    log_success() { echo "[SUCCESS] ✓ $1"; }
    log_warning() { echo "[WARNING] ⚠️ $1" >&2; }
    log_error() { echo "[ERROR] ❌ $1" >&2; }
    log_header() { echo ""; echo "================================================"; echo "[INFO] $1"; echo "================================================"; }
fi

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --devices)
            DEVICES="$2"
            shift 2
            ;;
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --clean-partitions)
            CLEAN_PARTITIONS=true
            shift
            ;;
        --skip-verification)
            SKIP_VERIFICATION=true
            shift
            ;;
        --help)
            head -20 "$0" | tail -19
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Convert comma-separated devices to array
IFS=',' read -ra DEVICE_ARRAY <<< "$DEVICES"

log_header "Preparing Devices for New FSC"
log_info "Devices: ${DEVICE_ARRAY[*]}"
log_info "Namespace: $NAMESPACE"
log_info "Clean partitions: $CLEAN_PARTITIONS"
echo ""

# Validate KUBECONFIG
if [ -z "$KUBECONFIG" ]; then
    log_error "KUBECONFIG environment variable must be set"
    exit 1
fi

if [ ! -f "$KUBECONFIG" ]; then
    log_error "KUBECONFIG file does not exist: $KUBECONFIG"
    exit 1
fi

# Test cluster connectivity
log_info "Testing cluster connectivity..."
if ! kubectl cluster-info &>/dev/null; then
    log_error "Cannot connect to cluster. Check KUBECONFIG and cluster status."
    exit 1
fi

CLUSTER_URL=$(kubectl cluster-info | head -1 | grep -o 'https://[^[:space:]]*' || echo "unknown")
log_success "Connected to cluster: $CLUSTER_URL"

# Find FSCs using the specified devices
log_header "Finding FSCs Using Specified Devices"

FSCS_TO_DELETE=()
for device in "${DEVICE_ARRAY[@]}"; do
    log_info "Checking for FSCs using device: $device"
    
    # Find FSCs that reference this device
    FSCS=$(kubectl get fsc -A -o json 2>/dev/null | \
        jq -r --arg dev "$device" '.items[] | select(.spec.devices[]? == $dev) | "\(.metadata.namespace)/\(.metadata.name)"' || echo "")
    
    if [ -n "$FSCS" ]; then
        while IFS= read -r fsc; do
            if [ -n "$fsc" ]; then
                FSCS_TO_DELETE+=("$fsc")
                log_warning "Found FSC using $device: $fsc"
            fi
        done <<< "$FSCS"
    else
        log_info "No FSCs found using device: $device"
    fi
done

# Remove duplicates
IFS=$'\n' FSCS_TO_DELETE=($(printf '%s\n' "${FSCS_TO_DELETE[@]}" | sort -u))

if [ ${#FSCS_TO_DELETE[@]} -eq 0 ]; then
    log_success "No FSCs found using the specified devices - devices may already be free"
    SKIP_DELETION=true
else
    log_info "Found ${#FSCS_TO_DELETE[@]} FSC(s) to delete:"
    for fsc in "${FSCS_TO_DELETE[@]}"; do
        echo "  - $fsc"
    done
    SKIP_DELETION=false
fi
echo ""

# Step 1: Add deletion label to Filesystems
if [ "$SKIP_DELETION" = "false" ]; then
    log_header "Step 1: Adding Deletion Label to Filesystems"
    
    for fsc_path in "${FSCS_TO_DELETE[@]}"; do
        IFS='/' read -r fsc_ns fsc_name <<< "$fsc_path"
        
        log_info "Processing FSC: $fsc_name (namespace: $fsc_ns)"
        
        # Check if Filesystem exists (it has the same name as FSC)
        if kubectl get filesystem "$fsc_name" -n "$fsc_ns" &>/dev/null; then
            # Check if label already exists
            CURRENT_LABEL=$(kubectl get filesystem "$fsc_name" -n "$fsc_ns" -o jsonpath='{.metadata.labels.scale\.spectrum\.ibm\.com/allowDelete}' 2>/dev/null || echo "")
            
            if [ -z "$CURRENT_LABEL" ]; then
                log_info "Adding deletion label to Filesystem: $fsc_name"
                kubectl label filesystem "$fsc_name" -n "$fsc_ns" scale.spectrum.ibm.com/allowDelete="" --overwrite
                log_success "Deletion label added to Filesystem: $fsc_name"
            else
                log_success "Filesystem $fsc_name already has deletion label"
            fi
        else
            log_warning "Filesystem $fsc_name not found (may not have been created yet)"
        fi
    done
    echo ""
fi

# Step 2: Delete FSCs
if [ "$SKIP_DELETION" = "false" ]; then
    log_header "Step 2: Deleting FileSystemClaims"
    
    for fsc_path in "${FSCS_TO_DELETE[@]}"; do
        IFS='/' read -r fsc_ns fsc_name <<< "$fsc_path"
        
        log_info "Deleting FSC: $fsc_name (namespace: $fsc_ns)"
        kubectl delete fsc "$fsc_name" -n "$fsc_ns" --timeout=60s || {
            log_warning "Failed to delete FSC $fsc_name, continuing..."
        }
    done
    echo ""
    
    # Step 3: Wait for FSC deletion to complete
    log_header "Step 3: Waiting for FSC Deletion to Complete"
    
    MAX_WAIT=300  # 5 minutes
    ELAPSED=0
    
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        REMAINING=0
        for fsc_path in "${FSCS_TO_DELETE[@]}"; do
            IFS='/' read -r fsc_ns fsc_name <<< "$fsc_path"
            if kubectl get fsc "$fsc_name" -n "$fsc_ns" &>/dev/null 2>&1; then
                REMAINING=$((REMAINING + 1))
            fi
        done
        
        if [ $REMAINING -eq 0 ]; then
            log_success "All FSCs deleted successfully"
            break
        fi
        
        if [ $((ELAPSED % 30)) -eq 0 ]; then
            log_info "Waiting for FSC deletion... ($REMAINING remaining, ${ELAPSED}s elapsed)"
            
            # Show deletion status for remaining FSCs
            for fsc_path in "${FSCS_TO_DELETE[@]}"; do
                IFS='/' read -r fsc_ns fsc_name <<< "$fsc_path"
                if kubectl get fsc "$fsc_name" -n "$fsc_ns" &>/dev/null 2>&1; then
                    DELETION_BLOCKED=$(kubectl get fsc "$fsc_name" -n "$fsc_ns" -o jsonpath='{.status.conditions[?(@.type=="DeletionBlocked")].reason}' 2>/dev/null || echo "")
                    if [ -n "$DELETION_BLOCKED" ]; then
                        log_warning "  $fsc_name: Deletion blocked - $DELETION_BLOCKED"
                    fi
                fi
            done
        fi
        
        sleep 5
        ELAPSED=$((ELAPSED + 5))
    done
    
    if [ $ELAPSED -ge $MAX_WAIT ]; then
        log_error "FSC deletion did not complete within $MAX_WAIT seconds"
        log_info "Remaining FSCs:"
        for fsc_path in "${FSCS_TO_DELETE[@]}"; do
            IFS='/' read -r fsc_ns fsc_name <<< "$fsc_path"
            if kubectl get fsc "$fsc_name" -n "$fsc_ns" &>/dev/null 2>&1; then
                log_warning "  - $fsc_name (namespace: $fsc_ns)"
            fi
        done
        exit 1
    fi
    echo ""
    
    # Step 4: Wait for LocalDisks to be deleted
    log_header "Step 4: Waiting for LocalDisks Cleanup"
    
    ELAPSED=0
    MAX_WAIT=180  # 3 minutes (controller waits 30s per LocalDisk)
    
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        REMAINING_LDS=0
        for device in "${DEVICE_ARRAY[@]}"; do
            LDS=$(kubectl get localdisk -A -o json 2>/dev/null | \
                jq -r --arg dev "$device" '.items[]? | select(.spec.device == $dev) | "\(.metadata.namespace)/\(.metadata.name)"' || echo "")
            if [ -n "$LDS" ]; then
                REMAINING_LDS=$((REMAINING_LDS + $(echo "$LDS" | wc -l)))
            fi
        done
        
        if [ $REMAINING_LDS -eq 0 ]; then
            log_success "All LocalDisks deleted"
            break
        fi
        
        if [ $((ELAPSED % 30)) -eq 0 ]; then
            log_info "Waiting for LocalDisk cleanup... ($REMAINING_LDS remaining, ${ELAPSED}s elapsed)"
        fi
        
        sleep 5
        ELAPSED=$((ELAPSED + 5))
    done
    
    if [ $REMAINING_LDS -gt 0 ]; then
        log_warning "Some LocalDisks may still exist after $MAX_WAIT seconds"
    fi
    echo ""
fi

# Step 5: Clean up GPFS partitions (optional)
if [ "$CLEAN_PARTITIONS" = "true" ]; then
    log_header "Step 5: Cleaning Up GPFS Partitions"
    
    STORAGE_NODES=$(kubectl get nodes -l node-role.kubernetes.io/worker,scale.spectrum.ibm.com/role=storage -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [ -z "$STORAGE_NODES" ]; then
        log_error "No storage nodes found with required labels"
        exit 1
    fi
    
    log_info "Storage nodes: $STORAGE_NODES"
    log_warning "⚠️  WARNING: This will destroy all data on the devices!"
    log_info "Cleaning partitions on storage nodes..."
    
    # Convert space-separated nodes to array
    NODE_ARRAY=($STORAGE_NODES)
    for node in "${NODE_ARRAY[@]}"; do
        log_info "Processing node: $node"
        
        for device in "${DEVICE_ARRAY[@]}"; do
            log_info "Cleaning partitions on $device (node: $node)"
            
            # Try using kubectl debug (non-interactive)
            log_info "Attempting to clean partitions via kubectl debug..."
            if kubectl debug "node/$node" --image=quay.io/openshift/origin-tools:latest -- \
                --target=/host -- sh -c "sgdisk --zap-all $device 2>&1 && lsblk $device" 2>&1 | grep -qE "(zap|GPT|nvme)"; then
                log_success "Partitions cleaned on $device (node: $node)"
            else
                log_warning "Failed to clean partitions on $device (node: $node) via kubectl debug"
                log_info "You may need to SSH to the node and run: sudo sgdisk --zap-all $device"
                log_info "Or use a privileged pod/daemonset to clean the partitions"
            fi
        done
    done
    echo ""
else
    log_info "Skipping partition cleanup (use --clean-partitions to enable)"
    log_info "Note: Devices with GPFS partitions will not appear in LVDR until partitions are removed"
    echo ""
fi

# Step 6: Wait for discovery to update
if [ "$CLEAN_PARTITIONS" = "true" ]; then
    log_header "Step 6: Waiting for Device Discovery to Update"
    
    log_info "Discovery runs every 5 minutes. Waiting for update..."
    log_info "You can also restart discovery pods to force immediate update:"
    log_info "  kubectl rollout restart daemonset/devicefinder-discovery -n $OPERATOR_NS"
    
    # Wait a bit for discovery to potentially update
    sleep 10
    
    # Optionally restart discovery pods
    if kubectl get daemonset devicefinder-discovery -n "$OPERATOR_NS" &>/dev/null; then
        log_info "Restarting discovery pods to force immediate update..."
        kubectl rollout restart daemonset/devicefinder-discovery -n "$OPERATOR_NS" &>/dev/null || true
        log_info "Waiting for discovery pods to be ready..."
        kubectl rollout status daemonset/devicefinder-discovery -n "$OPERATOR_NS" --timeout=60s &>/dev/null || true
    fi
    echo ""
fi

# Step 7: Verify devices appear in LVDR
if [ "$SKIP_VERIFICATION" = "false" ]; then
    log_header "Step 7: Verifying Devices in LVDR"
    
    STORAGE_NODES=$(kubectl get nodes -l node-role.kubernetes.io/worker,scale.spectrum.ibm.com/role=storage -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [ -z "$STORAGE_NODES" ]; then
        log_error "No storage nodes found"
        exit 1
    fi
    
    # Detect operator namespace
    OPERATOR_NS=$(kubectl get localvolumediscoveryresult -A -o jsonpath='{.items[0].metadata.namespace}' 2>/dev/null || echo "ibm-fusion-access")
    log_info "Operator namespace: $OPERATOR_NS"
    
    ALL_DEVICES_FOUND=true
    for device in "${DEVICE_ARRAY[@]}"; do
        log_info "Checking for device: $device"
        DEVICE_FOUND_ON_ALL_NODES=true
        
        # Convert space-separated nodes to array
        NODE_ARRAY=($STORAGE_NODES)
        for node in "${NODE_ARRAY[@]}"; do
            LVDR_NAME="discovery-result-$node"
            
            if kubectl get lvdr "$LVDR_NAME" -n "$OPERATOR_NS" &>/dev/null; then
                DEVICE_IN_LVDR=$(kubectl get lvdr "$LVDR_NAME" -n "$OPERATOR_NS" -o jsonpath='{.status.discoveredDevices[*].path}' 2>/dev/null | tr ' ' '\n' | grep -Fx "$device" || echo "")
                
                if [ -n "$DEVICE_IN_LVDR" ]; then
                    log_success "  ✓ Found on node: $node"
                else
                    log_warning "  ✗ NOT found on node: $node"
                    DEVICE_FOUND_ON_ALL_NODES=false
                    ALL_DEVICES_FOUND=false
                fi
            else
                log_warning "  ✗ LVDR not found for node: $node"
                DEVICE_FOUND_ON_ALL_NODES=false
                ALL_DEVICES_FOUND=false
            fi
        done
        
        if [ "$DEVICE_FOUND_ON_ALL_NODES" = "true" ]; then
            log_success "Device $device is available on all storage nodes"
        else
            log_error "Device $device is NOT available on all storage nodes"
            log_info "If device has GPFS partitions, run with --clean-partitions flag"
        fi
        echo ""
    done
    
    if [ "$ALL_DEVICES_FOUND" = "true" ]; then
        log_success "✅ All devices are ready for new FSC creation!"
    else
        log_error "❌ Some devices are not ready. Check the issues above."
        exit 1
    fi
else
    log_info "Skipping LVDR verification (use --skip-verification to disable)"
fi

# Summary
log_header "Summary"
log_success "Device preparation completed!"
log_info "Devices: ${DEVICE_ARRAY[*]}"
log_info "Ready for new FSC creation: $([ "$ALL_DEVICES_FOUND" = "true" ] && echo "Yes" || echo "No - check issues above")"
echo ""
log_info "To create a new FSC with these devices:"
echo "  kubectl apply -f - <<EOF"
echo "  apiVersion: fusion.storage.openshift.io/v1alpha1"
echo "  kind: FileSystemClaim"
echo "  metadata:"
echo "    name: <your-fsc-name>"
echo "    namespace: $NAMESPACE"
echo "  spec:"
echo "    devices:"
for device in "${DEVICE_ARRAY[@]}"; do
    echo "    - $device"
done
echo "  EOF"

