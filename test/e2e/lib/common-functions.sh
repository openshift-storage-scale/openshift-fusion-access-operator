#!/bin/bash
# Common Functions Library for E2E Tests
# 
# This library provides consistent logging, resource management, and utility
# functions that can be shared across all E2E test scripts.
#
# Usage:
#   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
#   source "${SCRIPT_DIR}/../lib/common-functions.sh"

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

# Colors for output
export LOG_RED='\033[0;31m'
export LOG_GREEN='\033[0;32m'
export LOG_YELLOW='\033[1;33m'
export LOG_BLUE='\033[0;34m'
export LOG_PURPLE='\033[0;35m'
export LOG_CYAN='\033[0;36m'
export LOG_NC='\033[0m' # No Color

# Log levels
export LOG_LEVEL_DEBUG=0
export LOG_LEVEL_INFO=1
export LOG_LEVEL_WARN=2
export LOG_LEVEL_ERROR=3

# Default log level (can be overridden by setting LOG_LEVEL environment variable)
export CURRENT_LOG_LEVEL=${LOG_LEVEL:-$LOG_LEVEL_INFO}

# Enable/disable timestamps (set LOG_TIMESTAMPS=true to enable)
export LOG_TIMESTAMPS=${LOG_TIMESTAMPS:-false}

# Get timestamp if enabled
get_timestamp() {
    if [ "$LOG_TIMESTAMPS" = "true" ]; then
        date '+%Y-%m-%d %H:%M:%S'
    fi
}

# Format log message with optional timestamp
format_log_message() {
    local level=$1
    local color=$2
    local message=$3
    local timestamp=""
    
    if [ "$LOG_TIMESTAMPS" = "true" ]; then
        timestamp="$(get_timestamp) "
    fi
    
    echo -e "${color}[${level}]${LOG_NC} ${timestamp}${message}"
}

# Debug logging (level 0)
log_debug() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_DEBUG" ]; then
        format_log_message "DEBUG" "$LOG_CYAN" "$1"
    fi
}

# Info logging (level 1)  
log_info() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_INFO" ]; then
        format_log_message "INFO" "$LOG_GREEN" "$1"
    fi
}

# Warning logging (level 2)
log_warning() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_WARN" ]; then
        format_log_message "WARN" "$LOG_YELLOW" "$1" >&2
    fi
}

# Alias for consistency
log_warn() {
    log_warning "$1"
}

# Error logging (level 3)
log_error() {
    format_log_message "ERROR" "$LOG_RED" "$1" >&2
}

# Success logging (always shown, like info but with different color)
log_success() {
    format_log_message "SUCCESS" "$LOG_GREEN" "✓ $1"
}

# Progress logging with emojis
log_progress() {
    format_log_message "PROGRESS" "$LOG_BLUE" "⏳ $1"
}

# Header logging for sections
log_header() {
    local message="$1"
    local separator="================================================"
    
    echo ""
    echo "$separator"
    format_log_message "INFO" "$LOG_GREEN" "$message"
    echo "$separator"
}

# Step logging for numbered steps
log_step() {
    local step_num="$1"
    local message="$2"
    format_log_message "STEP $step_num" "$LOG_PURPLE" "$message"
}

# Cleanup/deletion logging
log_cleanup() {
    format_log_message "CLEANUP" "$LOG_YELLOW" "🗑️ $1"
}

# Installation logging
log_install() {
    format_log_message "INSTALL" "$LOG_BLUE" "📦 $1"
}

# ============================================================================
# KUBERNETES RESOURCE MANAGEMENT FUNCTIONS
# ============================================================================

# DELETION FUNCTION GUIDE:
# 
# 1. delete_resource() - Simple deletion, fire-and-forget
#    Use for: Quick cleanup where you don't care about completion
#
# 2. delete_resource_robust() - Standard deletion with finalizer awareness
#    Use for: Production-like scenarios where controllers should handle finalizers
#    Parameters: resource_type, name, namespace, [force_remove_finalizers=false]
#
# 3. delete_resource_with_finalizer_cleanup() - Test-friendly deletion
#    Use for: E2E tests where you need guaranteed cleanup even if controllers fail
#    Automatically force-removes finalizers after timeout
#
# 4. wait_for_finalizers_removed() - Wait for controller cleanup
#    Use for: When you want to ensure controllers properly handle finalizer removal

# Ensure a namespace exists, create if it doesn't
ensure_namespace() {
    local namespace=$1
    
    if [ -z "$namespace" ]; then
        log_error "ensure_namespace: namespace parameter is required"
        return 1
    fi
    
    if ! kubectl get namespace "$namespace" &>/dev/null; then
        log_info "Creating namespace: $namespace"
        kubectl create namespace "$namespace" || {
            log_error "Failed to create namespace: $namespace"
            return 1
        }
        log_success "Created namespace: $namespace"
    else
        log_success "Namespace $namespace already exists"
    fi
}

# Simple resource deletion
delete_resource() {
    local resource_type=$1
    local name=$2
    local namespace=$3
    
    if [ -z "$resource_type" ] || [ -z "$name" ]; then
        log_error "delete_resource: resource_type and name parameters are required"
        return 1
    fi
    
    if [ -n "$namespace" ]; then
        kubectl delete "$resource_type" "$name" -n "$namespace" --timeout=60s 2>/dev/null || true
    else
        kubectl delete "$resource_type" "$name" --timeout=60s 2>/dev/null || true
    fi
}

# Robust resource deletion with existence check, finalizer handling, and wait for completion
delete_resource_robust() {
    local resource_type=$1
    local name=$2
    local namespace=$3
    local force_remove_finalizers=${4:-false}  # Optional: force remove finalizers if stuck
    
    if [ -z "$resource_type" ] || [ -z "$name" ]; then
        log_error "delete_resource_robust: resource_type and name parameters are required"
        return 1
    fi
    
    log_cleanup "Deleting $resource_type/$name $([ -n "$namespace" ] && echo "in namespace $namespace" || echo "(cluster-scoped)")"
    
    # Check if resource exists first
    local exists=false
    if [ -n "$namespace" ]; then
        if kubectl get "$resource_type" "$name" -n "$namespace" &>/dev/null; then
            exists=true
        fi
    else
        if kubectl get "$resource_type" "$name" &>/dev/null; then
            exists=true
        fi
    fi
    
    if [ "$exists" = "false" ]; then
        log_success "Resource $resource_type/$name does not exist (already deleted)"
        return 0
    fi
    
    # Check for existing finalizers before deletion
    check_and_log_finalizers "$resource_type" "$name" "$namespace"
    
    # Initiate deletion
    if [ -n "$namespace" ]; then
        kubectl delete "$resource_type" "$name" -n "$namespace" --timeout=60s 2>/dev/null || true
    else
        kubectl delete "$resource_type" "$name" --timeout=60s 2>/dev/null || true
    fi
    
    # Wait for deletion to complete
    local max_wait=30
    local count=0
    local warned_about_finalizers=false
    
    while [ $count -lt $max_wait ]; do
        local still_exists=false
        if [ -n "$namespace" ]; then
            if kubectl get "$resource_type" "$name" -n "$namespace" &>/dev/null; then
                still_exists=true
            fi
        else
            if kubectl get "$resource_type" "$name" &>/dev/null; then
                still_exists=true
            fi
        fi
        
        if [ "$still_exists" = "false" ]; then
            log_success "Deletion completed for $resource_type/$name"
            return 0
        fi
        
        # Check if resource is stuck due to finalizers
        if [ "$still_exists" = "true" ] && [ $count -gt 10 ] && [ "$warned_about_finalizers" = "false" ]; then
            check_deletion_status "$resource_type" "$name" "$namespace"
            warned_about_finalizers=true
        fi
        
        sleep 2
        count=$((count + 1))
        
        if [ $((count % 5)) -eq 0 ]; then
            log_info "Waiting for $resource_type/$name deletion... (${count}/${max_wait})"
        fi
    done
    
    # Resource still exists after timeout
    if [ "$force_remove_finalizers" = "true" ]; then
        log_warning "Timeout reached, attempting to force remove finalizers for $resource_type/$name"
        force_remove_finalizers "$resource_type" "$name" "$namespace"
        
        # Wait a bit more after removing finalizers
        sleep 5
        if [ -n "$namespace" ]; then
            if ! kubectl get "$resource_type" "$name" -n "$namespace" &>/dev/null; then
                log_success "Forced deletion completed for $resource_type/$name"
                return 0
            fi
        else
            if ! kubectl get "$resource_type" "$name" &>/dev/null; then
                log_success "Forced deletion completed for $resource_type/$name"
                return 0
            fi
        fi
    fi
    
    log_warning "Resource $resource_type/$name still exists after ${max_wait} attempts"
    check_deletion_status "$resource_type" "$name" "$namespace"
    return 0
}

# Check and log finalizers on a resource
check_and_log_finalizers() {
    local resource_type=$1
    local name=$2
    local namespace=$3
    
    local finalizers
    if [ -n "$namespace" ]; then
        finalizers=$(kubectl get "$resource_type" "$name" -n "$namespace" -o jsonpath='{.metadata.finalizers[*]}' 2>/dev/null || echo "")
    else
        finalizers=$(kubectl get "$resource_type" "$name" -o jsonpath='{.metadata.finalizers[*]}' 2>/dev/null || echo "")
    fi
    
    if [ -n "$finalizers" ]; then
        log_info "Resource $resource_type/$name has finalizers: $finalizers"
        log_info "Deletion will wait for controller to remove finalizers"
    else
        log_debug "Resource $resource_type/$name has no finalizers"
    fi
}

# Check detailed deletion status including finalizers and deletion timestamp
check_deletion_status() {
    local resource_type=$1
    local name=$2
    local namespace=$3
    
    local deletion_timestamp finalizers
    if [ -n "$namespace" ]; then
        deletion_timestamp=$(kubectl get "$resource_type" "$name" -n "$namespace" -o jsonpath='{.metadata.deletionTimestamp}' 2>/dev/null || echo "")
        finalizers=$(kubectl get "$resource_type" "$name" -n "$namespace" -o jsonpath='{.metadata.finalizers[*]}' 2>/dev/null || echo "")
    else
        deletion_timestamp=$(kubectl get "$resource_type" "$name" -o jsonpath='{.metadata.deletionTimestamp}' 2>/dev/null || echo "")
        finalizers=$(kubectl get "$resource_type" "$name" -o jsonpath='{.metadata.finalizers[*]}' 2>/dev/null || echo "")
    fi
    
    if [ -n "$deletion_timestamp" ]; then
        log_warning "Resource $resource_type/$name is in Terminating state (deletionTimestamp: $deletion_timestamp)"
        if [ -n "$finalizers" ]; then
            log_warning "Blocking finalizers: $finalizers"
            log_info "The resource is waiting for controllers to remove these finalizers"
            log_info "If controllers are not running, you may need to manually remove finalizers"
        else
            log_warning "No finalizers found, but resource is still terminating - this may indicate a Kubernetes issue"
        fi
    else
        log_info "Resource $resource_type/$name exists but deletion has not been initiated"
    fi
}

# Force remove finalizers from a resource (use with caution)
force_remove_finalizers() {
    local resource_type=$1
    local name=$2
    local namespace=$3
    
    log_warning "⚠️  FORCE REMOVING FINALIZERS - This bypasses controller cleanup!"
    log_warning "⚠️  Use only when controllers are not running or are stuck"
    
    local patch_cmd
    if [ -n "$namespace" ]; then
        patch_cmd="kubectl patch $resource_type $name -n $namespace --type=merge -p '{\"metadata\":{\"finalizers\":null}}'"
    else
        patch_cmd="kubectl patch $resource_type $name --type=merge -p '{\"metadata\":{\"finalizers\":null}}'"
    fi
    
    log_info "Executing: $patch_cmd"
    eval "$patch_cmd" 2>/dev/null || log_error "Failed to remove finalizers"
}

# Enhanced delete function with automatic finalizer handling for tests
delete_resource_with_finalizer_cleanup() {
    local resource_type=$1
    local name=$2
    local namespace=$3
    local wait_timeout=${4:-60}  # Wait up to 60 seconds before force removing finalizers
    
    log_cleanup "Deleting $resource_type/$name with automatic finalizer cleanup"
    
    # First, try normal deletion
    delete_resource_robust "$resource_type" "$name" "$namespace" false
    
    # Check if resource still exists
    local still_exists=false
    if [ -n "$namespace" ]; then
        if kubectl get "$resource_type" "$name" -n "$namespace" &>/dev/null; then
            still_exists=true
        fi
    else
        if kubectl get "$resource_type" "$name" &>/dev/null; then
            still_exists=true
        fi
    fi
    
    if [ "$still_exists" = "true" ]; then
        log_info "Resource still exists, waiting $wait_timeout seconds before forcing finalizer removal..."
        sleep "$wait_timeout"
        
        # Check again
        if [ -n "$namespace" ]; then
            if kubectl get "$resource_type" "$name" -n "$namespace" &>/dev/null; then
                log_warning "Resource still stuck after $wait_timeout seconds, force removing finalizers"
                delete_resource_robust "$resource_type" "$name" "$namespace" true
            fi
        else
            if kubectl get "$resource_type" "$name" &>/dev/null; then
                log_warning "Resource still stuck after $wait_timeout seconds, force removing finalizers"
                delete_resource_robust "$resource_type" "$name" "$namespace" true
            fi
        fi
    fi
}

# Wait for finalizers to be removed by controllers
wait_for_finalizers_removed() {
    local resource_type=$1
    local name=$2
    local namespace=$3
    local max_wait=${4:-60}  # Default 60 seconds
    local count=0
    
    log_progress "Waiting for finalizers to be removed from $resource_type/$name"
    
    while [ $count -lt $max_wait ]; do
        local finalizers
        if [ -n "$namespace" ]; then
            finalizers=$(kubectl get "$resource_type" "$name" -n "$namespace" -o jsonpath='{.metadata.finalizers[*]}' 2>/dev/null || echo "")
        else
            finalizers=$(kubectl get "$resource_type" "$name" -o jsonpath='{.metadata.finalizers[*]}' 2>/dev/null || echo "")
        fi
        
        if [ -z "$finalizers" ]; then
            log_success "All finalizers removed from $resource_type/$name"
            return 0
        fi
        
        if [ $((count % 10)) -eq 0 ] && [ $count -gt 0 ]; then
            log_info "Still waiting for finalizers to be removed: $finalizers (${count}/${max_wait}s)"
        fi
        
        sleep 1
        count=$((count + 1))
    done
    
    log_warning "Timeout waiting for finalizers to be removed from $resource_type/$name"
    return 1
}

# Wait for a resource to be ready/available
wait_for_resource() {
    local resource_type=$1    # e.g., "crd", "pod", "filesystemclaim"
    local name=$2            # Resource name
    local namespace=$3       # Namespace (empty for cluster-scoped)
    local condition=$4       # Condition to check (e.g., "Ready", "Established")
    local max_retries=${5:-30}  # Maximum retries (default: 30 = 5 minutes)
    local retry_count=0

    log_progress "Waiting for ${resource_type}/${name} to be ${condition:-available}"
    
    while [ $retry_count -lt $max_retries ]; do
        set +e
        if [ -n "$namespace" ]; then
            resource_exists=$(kubectl get "${resource_type}" "${name}" -n "${namespace}" &>/dev/null && echo "true" || echo "false")
        else
            resource_exists=$(kubectl get "${resource_type}" "${name}" &>/dev/null && echo "true" || echo "false")
        fi
        
        if [ "$resource_exists" = "true" ]; then
            if [ -n "$condition" ]; then
                # Check specific condition
                if [ -n "$namespace" ]; then
                    status=$(kubectl get "${resource_type}" "${name}" -n "${namespace}" -o jsonpath="{.status.conditions[?(@.type=='${condition}')].status}" 2>/dev/null || echo "")
                else
                    status=$(kubectl get "${resource_type}" "${name}" -o jsonpath="{.status.conditions[?(@.type=='${condition}')].status}" 2>/dev/null || echo "")
                fi
                
                if [ "$status" = "True" ]; then
                    log_success "${resource_type}/${name} is ${condition}"
                    set -e
                    return 0
                fi
            else
                log_success "${resource_type}/${name} exists"
                set -e
                return 0
            fi
        fi
        set -e
        
        retry_count=$((retry_count + 1))
        if [ $((retry_count % 5)) -eq 0 ]; then
            log_info "Still waiting for ${resource_type}/${name}... (${retry_count}/${max_retries})"
        fi
        sleep 10
    done
    
    log_error "Timeout waiting for ${resource_type}/${name} after $((max_retries * 10)) seconds"
    return 1
}

# Check if a CRD exists
crd_exists() {
    local crd_name=$1
    resource_exists "crd" "$crd_name"
}

# Validate that critical CRDs are installed for IBM Spectrum Scale Fusion Access
# Returns 0 if all critical CRDs are present, 1 if any are missing
validate_critical_crds() {
    local fail_on_missing=${1:-true}  # Default to failing on missing CRDs
    
    log_info "🔍 Validating critical CRDs for IBM Spectrum Scale Fusion Access..."
    
    # Define critical CRDs that MUST be present
    local critical_crds=(
        "localdisks.scale.spectrum.ibm.com"
        "filesystems.scale.spectrum.ibm.com" 
        "filesystemclaims.fusion.storage.openshift.io"
        "localvolumediscoveryresults.fusion.storage.openshift.io"
        "volumesnapshotclasses.snapshot.storage.k8s.io"
    )
    
    local missing_crds=()
    local present_crds=()
    
    for crd in "${critical_crds[@]}"; do
        if crd_exists "$crd"; then
            present_crds+=("$crd")
            log_success "✓ $crd"
        else
            missing_crds+=("$crd")
            log_error "✗ $crd - MISSING"
        fi
    done
    
    # Summary
    log_info "CRD Status: ${#present_crds[@]}/${#critical_crds[@]} critical CRDs present"
    
    if [ ${#missing_crds[@]} -gt 0 ]; then
        log_error "❌ Missing critical CRDs:"
        for missing in "${missing_crds[@]}"; do
            case "$missing" in
                "localdisks.scale.spectrum.ibm.com"|"filesystems.scale.spectrum.ibm.com")
                    log_error "   $missing - Install IBM Spectrum Scale Container Native operator"
                    ;;
                "filesystemclaims.fusion.storage.openshift.io")
                    log_error "   $missing - Deploy OpenShift Fusion Access operator"
                    ;;
                "volumesnapshotclasses.snapshot.storage.k8s.io")
                    log_error "   $missing - Install Volume Snapshot CRDs/controller"
                    ;;
                *)
                    log_error "   $missing - Check operator installation"
                    ;;
            esac
        done
        
        log_info "💡 For complete validation, run: ./test/e2e/validate-crds.sh"
        
        if [ "$fail_on_missing" = "true" ]; then
            return 1
        fi
    else
        log_success "✅ All critical CRDs are present!"
    fi
    
    return 0
}

# Install a minimal CRD for testing purposes
install_crd_if_missing() {
    local crd_name=$1 
    local group=$2 
    local kind=$3 
    local version=$4 
    local scope=${5:-Namespaced}
    
    if kubectl get crd "$crd_name" &>/dev/null; then
        log_success "CRD $crd_name already exists"
        return 0
    fi
    
    log_install "Installing minimal CRD: $crd_name"
    
    kubectl apply -f - <<EOF
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: $crd_name
spec:
  group: $group
  versions:
  - name: $version
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            x-kubernetes-preserve-unknown-fields: true
          status:
            type: object
            x-kubernetes-preserve-unknown-fields: true
  scope: $scope
  names:
    plural: $(echo $kind | tr '[:upper:]' '[:lower:]')s
    kind: $kind
EOF
    
    log_success "Installed CRD: $crd_name"
}

# Patch LocalDisks to set existingDataSkipVerify=true for test scenarios
# This is commonly needed in E2E tests where test devices may contain existing data
patch_localdisks_for_existing_data() {
    local fsc_name=$1
    local namespace=$2
    local test_device=${3:-""}  # Optional: specific device to match
    
    if [ -z "$fsc_name" ] || [ -z "$namespace" ]; then
        log_error "patch_localdisks_for_existing_data: fsc_name and namespace are required"
        return 1
    fi
    
    # Check if LocalDiskCreated condition has errors mentioning existing data
    local localdisk_errors=$(get_resource_condition_message "filesystemclaim" "$fsc_name" "$namespace" "LocalDiskCreated" | grep -i "spectrum scale filesystem data\|existingDataSkipVerify" || echo "")
    
    if [ -n "$localdisk_errors" ]; then
        log_info "🔍 LocalDisk errors detected, searching for LocalDisks to patch..."
        log_debug "Error: $localdisk_errors"
    else
        log_debug "No LocalDisk existing data errors detected - skipping patch attempt"
        return 0
    fi
    
    # Find LocalDisks owned by this FSC using multiple strategies
    local localdisks=""
    
    # Strategy 1: Use ownership labels (most reliable)
    localdisks=$(get_all_resources "localdisk" "$namespace" "fusion.storage.openshift.io/owned-by-fsc-name=$fsc_name" "name" || echo "")
    
    # Strategy 2: Find by owner references if labels don't work  
    if [ -z "$localdisks" ]; then
        log_debug "No LocalDisks found by labels, trying owner references..."
        localdisks=$(get_resources_by_owner "localdisk" "$fsc_name" "$namespace" || echo "")
        # Convert bare names to resource format for consistency
        if [ -n "$localdisks" ]; then
            localdisks=$(echo "$localdisks" | sed 's/^/localdisk\//')
        fi
    fi
    
    # Strategy 3: Find LocalDisks by device path (if test_device provided)
    if [ -z "$localdisks" ] && [ -n "$test_device" ]; then
        log_debug "Trying to find LocalDisks by device path: $test_device"
        local all_localdisks=$(get_all_resources "localdisk" "$namespace" "" "name" || echo "")
        for ld in $all_localdisks; do
            local ld_name=$(echo "$ld" | sed 's|localdisk/||')
            local device_path=$(get_resource_field "localdisk" "$ld_name" "$namespace" ".spec.device" || echo "")
            if [ "$device_path" = "$test_device" ]; then
                localdisks="$localdisks $ld"
            fi
        done
    fi
    
    # Strategy 4: Find recent LocalDisks (fallback for tests)
    if [ -z "$localdisks" ]; then
        log_debug "Finding recent LocalDisks as fallback..."
        # Find LocalDisks created in the last 10 minutes
        localdisks=$(get_resource "localdisk" "" "$namespace" "name" "" "--sort-by=.metadata.creationTimestamp" | tail -5 || echo "")
    fi
    
    # Clean up the list (remove empty entries)
    localdisks=$(echo "$localdisks" | tr ' ' '\n' | grep -v '^$' | sort -u | tr '\n' ' ')
    
    if [ -n "$localdisks" ]; then
        log_info "🔧 Found LocalDisks to check/patch: $(echo $localdisks | wc -w) LocalDisks"
        log_debug "Raw LocalDisk list: $localdisks"
        
        local patched_count=0
        for ld in $localdisks; do
            # Extract just the resource name (everything after the last slash)
            # Handles formats like "localdisk/name" and "localdisk.scale.spectrum.ibm.com/name"
            local ld_name="${ld##*/}"
            
            # Skip empty names
            if [ -z "$ld_name" ]; then
                log_debug "Skipping empty LocalDisk name from: $ld"
                continue
            fi
            
            log_debug "Processing LocalDisk: $ld_name (from resource: $ld)"
            
            # Get current existingDataSkipVerify value and device info using common functions
            local current_skip_verify=$(get_resource_field "localdisk" "$ld_name" "$namespace" ".spec.existingDataSkipVerify" || echo "false")
            local device_path=$(get_resource_field "localdisk" "$ld_name" "$namespace" ".spec.device" || echo "unknown")
            
            log_debug "Checking LocalDisk: $ld_name (device: $device_path, skipVerify: $current_skip_verify)"
            
            if [ "$current_skip_verify" != "true" ]; then
                log_info "🔧 LocalDisk $ld_name needs patching (current existingDataSkipVerify: $current_skip_verify)"
                
                # Try the patch with better error reporting
                local patch_output
                if patch_output=$(kubectl patch localdisk "$ld_name" -n "$namespace" -p '{"spec":{"existingDataSkipVerify":true}}' --type=merge 2>&1); then
                    log_success "✓ Successfully patched LocalDisk $ld_name (existingDataSkipVerify=true)"
                    patched_count=$((patched_count + 1))
                    
                    # Brief wait for controller to reconcile the change
                    sleep 2
                    
                    # Verify the patch took effect
                    local updated_skip_verify=$(get_resource_field "localdisk" "$ld_name" "$namespace" ".spec.existingDataSkipVerify" || echo "false")
                    if [ "$updated_skip_verify" = "true" ]; then
                        log_success "✓ Patch verified: LocalDisk $ld_name now has existingDataSkipVerify=true"
                    else
                        log_warning "⚠️ Patch may not have taken effect: LocalDisk $ld_name still shows existingDataSkipVerify=$updated_skip_verify"
                    fi
                else
                    log_warning "⚠️ Failed to patch LocalDisk $ld_name"
                    log_debug "Patch error: $patch_output"
                    
                    # Check if the LocalDisk actually exists
                    if resource_exists "localdisk" "$ld_name" "$namespace"; then
                        log_debug "LocalDisk $ld_name exists but patch failed - may be immutable or have validation errors"
                    else
                        log_debug "LocalDisk $ld_name does not exist in namespace $namespace"
                    fi
                fi
            else
                log_success "✓ LocalDisk $ld_name already has existingDataSkipVerify=true - no patch needed"
            fi
        done
        
        if [ $patched_count -gt 0 ]; then
            log_success "Patched $patched_count LocalDisk(s) for existing data handling"
            log_info "⏳ Waiting 5 seconds for controller to reconcile LocalDisk changes..."
            sleep 5
        else
            log_info "No LocalDisk patches were needed"
        fi
    else
        log_warning "⚠️ Could not find any LocalDisks for FSC $fsc_name in namespace $namespace"
        log_info "📋 Debugging info - listing all LocalDisks in namespace:"
        get_resource "localdisk" "" "$namespace" "custom-columns=NAME:.metadata.name,DEVICE:.spec.device,SKIP_VERIFY:.spec.existingDataSkipVerify,OWNER_LABELS:.metadata.labels" 2>/dev/null || log_warning "No LocalDisks found in namespace $namespace"
    fi
}

# Patch all LocalDisks in a namespace to skip existing data verification
# Useful for test cleanup or when setting up test environments
patch_all_localdisks_skip_verify() {
    local namespace=$1
    
    if [ -z "$namespace" ]; then
        log_error "patch_all_localdisks_skip_verify: namespace parameter is required"
        return 1
    fi
    
    log_info "🔧 Patching all LocalDisks in namespace $namespace to skip data verification..."
    
    local all_localdisks=$(get_all_resources "localdisk" "$namespace" "" "name" || echo "")
    local patched_count=0
    
    if [ -n "$all_localdisks" ]; then
        for ld in $all_localdisks; do
            # Extract just the resource name (everything after the last slash)
            # Handles formats like "localdisk/name" and "localdisk.scale.spectrum.ibm.com/name"
            local ld_name="${ld##*/}"
            
            # Skip empty names
            if [ -z "$ld_name" ]; then
                log_debug "Skipping empty LocalDisk name from: $ld"
                continue
            fi
            
            log_debug "Patching LocalDisk: $ld_name (from resource: $ld)"
            if kubectl patch localdisk "$ld_name" -n "$namespace" -p '{"spec":{"existingDataSkipVerify":true}}' --type=merge 2>/dev/null; then
                log_success "✓ Patched LocalDisk $ld_name"
                patched_count=$((patched_count + 1))
            else
                log_warning "⚠️ Failed to patch LocalDisk $ld_name"
            fi
        done
        log_success "Patched $patched_count LocalDisk(s) in namespace $namespace"
    else
        log_info "No LocalDisks found in namespace $namespace"
    fi
}

# ============================================================================
# KUBERNETES RESOURCE RETRIEVAL FUNCTIONS
# ============================================================================

# Get a Kubernetes resource with consistent error handling and flexible output options
# Usage: get_resource <resource_type> [name] [namespace] [output_format] [selector] [additional_args...]
# 
# Parameters:
#   resource_type: Required - Type of resource (e.g., "pod", "filesystemclaim", "crd")
#   name: Optional - Name of specific resource (if omitted, gets all resources of type)
#   namespace: Optional - Namespace for namespaced resources (use "" for cluster-scoped)
#   output_format: Optional - Output format: "yaml", "json", "jsonpath=<path>", "wide", "custom-columns=<spec>", etc.
#   selector: Optional - Label selector (e.g., "app=myapp,env=test")
#   additional_args: Optional - Additional kubectl arguments
#
# Examples:
#   get_resource "pod" "my-pod" "default"
#   get_resource "filesystemclaim" "" "ibm-spectrum-scale" "jsonpath={.items[*].metadata.name}"
#   get_resource "crd" "filesystemclaims.fusion.storage.openshift.io"
#   get_resource "pod" "" "kube-system" "wide" "app=kube-dns"
get_resource() {
    local resource_type="$1"
    local name="$2"
    local namespace="$3"
    local output_format="$4"
    local selector="$5"
    shift 5 # Remove the first 5 parameters, rest are additional args
    local additional_args=("$@")
    
    if [ -z "$resource_type" ]; then
        log_error "get_resource: resource_type parameter is required"
        return 1
    fi
    
    # Build kubectl command
    local cmd_args=("kubectl" "get" "$resource_type")
    
    # Add resource name if specified
    if [ -n "$name" ]; then
        cmd_args+=("$name")
    fi
    
    # Add namespace if specified (and not empty string)
    if [ -n "$namespace" ]; then
        cmd_args+=("-n" "$namespace")
    fi
    
    # Add output format if specified
    if [ -n "$output_format" ]; then
        cmd_args+=("-o" "$output_format")
    fi
    
    # Add label selector if specified
    if [ -n "$selector" ]; then
        cmd_args+=("-l" "$selector")
    fi
    
    # Add any additional arguments
    if [ ${#additional_args[@]} -gt 0 ]; then
        cmd_args+=("${additional_args[@]}")
    fi
    
    # Execute command with error handling
    log_debug "Executing: ${cmd_args[*]}"
    
    if "${cmd_args[@]}" 2>/dev/null; then
        return 0
    else
        local exit_code=$?
        log_debug "get_resource failed with exit code $exit_code for: ${cmd_args[*]}"
        return $exit_code
    fi
}

# Get resource with existence check - returns true/false without error output
# Usage: resource_exists <resource_type> [name] [namespace]
resource_exists() {
    local resource_type="$1"
    local name="$2"
    local namespace="$3"
    
    if [ -z "$resource_type" ]; then
        log_error "resource_exists: resource_type parameter is required"
        return 1
    fi
    
    local cmd_args=("kubectl" "get" "$resource_type")
    
    if [ -n "$name" ]; then
        cmd_args+=("$name")
    fi
    
    if [ -n "$namespace" ]; then
        cmd_args+=("-n" "$namespace")
    fi
    
    "${cmd_args[@]}" &>/dev/null
}

# Get resource field value using jsonpath
# Usage: get_resource_field <resource_type> <name> <namespace> <jsonpath>
# Returns the field value or empty string if not found
get_resource_field() {
    local resource_type="$1"
    local name="$2"
    local namespace="$3"
    local jsonpath="$4"
    
    if [ -z "$resource_type" ] || [ -z "$name" ] || [ -z "$jsonpath" ]; then
        log_error "get_resource_field: resource_type, name, and jsonpath parameters are required"
        return 1
    fi
    
    get_resource "$resource_type" "$name" "$namespace" "jsonpath={$jsonpath}" || echo ""
}

# Get all resources of a type with optional filtering
# Usage: get_all_resources <resource_type> [namespace] [selector] [output_format]
get_all_resources() {
    local resource_type="$1"
    local namespace="$2"
    local selector="$3"
    local output_format="${4:-name}"  # Default to 'name' output
    
    get_resource "$resource_type" "" "$namespace" "$output_format" "$selector"
}

# Get resource count
# Usage: get_resource_count <resource_type> [namespace] [selector]
get_resource_count() {
    local resource_type="$1"
    local namespace="$2"
    local selector="$3"
    
    local count=$(get_all_resources "$resource_type" "$namespace" "$selector" "name" | wc -l)
    echo "$count"
}

# Get resource status condition
# Usage: get_resource_condition <resource_type> <name> <namespace> <condition_type>
# Returns the status of the specified condition (True, False, Unknown, or empty if not found)
get_resource_condition() {
    local resource_type="$1"
    local name="$2"
    local namespace="$3"
    local condition_type="$4"
    
    if [ -z "$condition_type" ]; then
        log_error "get_resource_condition: condition_type parameter is required"
        return 1
    fi
    
    get_resource_field "$resource_type" "$name" "$namespace" ".status.conditions[?(@.type=='$condition_type')].status"
}

# Get resource condition message
# Usage: get_resource_condition_message <resource_type> <name> <namespace> <condition_type>
get_resource_condition_message() {
    local resource_type="$1"
    local name="$2"
    local namespace="$3"
    local condition_type="$4"
    
    if [ -z "$condition_type" ]; then
        log_error "get_resource_condition_message: condition_type parameter is required"
        return 1
    fi
    
    get_resource_field "$resource_type" "$name" "$namespace" ".status.conditions[?(@.type=='$condition_type')].message"
}

# Get resources by owner reference
# Usage: get_resources_by_owner <resource_type> <owner_name> <namespace> [output_format]
get_resources_by_owner() {
    local resource_type="$1"
    local owner_name="$2"
    local namespace="$3"
    local output_format="${4:-name}"
    
    if [ -z "$resource_type" ] || [ -z "$owner_name" ]; then
        log_error "get_resources_by_owner: resource_type and owner_name are required"
        return 1
    fi
    
    # Get all resources and filter by owner reference
    local all_resources=$(get_all_resources "$resource_type" "$namespace" "" "json")
    
    if [ -n "$all_resources" ]; then
        echo "$all_resources" | jq -r ".items[] | select(.metadata.ownerReferences[]?.name == \"$owner_name\") | .metadata.name" 2>/dev/null || echo ""
    fi
}

# Smart LocalDisk patching that handles cross-namespace scenarios and avoids redundant patches
# This is an enhanced version of patch_localdisks_for_existing_data that searches multiple namespaces
patch_localdisks_smart() {
    local fsc_name=$1
    local fsc_namespace=$2
    local test_device=${3:-""}
    local operator_namespace=${4:-""}
    
    if [ -z "$fsc_name" ] || [ -z "$fsc_namespace" ]; then
        log_error "patch_localdisks_smart: fsc_name and fsc_namespace are required"
        return 1
    fi
    
    # Use OPERATOR_NS from environment if not provided
    if [ -z "$operator_namespace" ]; then
        operator_namespace="${OPERATOR_NS:-ibm-fusion-access}"
    fi
    
    # Check if LocalDiskCreated condition has errors mentioning existing data
    local localdisk_errors=$(get_resource_condition_message "filesystemclaim" "$fsc_name" "$fsc_namespace" "LocalDiskCreated" | grep -i "spectrum scale filesystem data\|existingDataSkipVerify" || echo "")
    
    if [ -z "$localdisk_errors" ]; then
        log_debug "No LocalDisk existing data errors detected - no patching needed"
        return 0
    fi
    
    log_debug "🔍 LocalDisk errors detected, checking if LocalDisks need patching..."
    
    # Find LocalDisks owned by this FSC - search multiple namespaces
    local localdisks=""
    local working_namespace=""
    local search_namespaces=("$fsc_namespace" "$operator_namespace")
    
    # Remove duplicates and empty entries
    search_namespaces=($(printf '%s\n' "${search_namespaces[@]}" | sort -u | grep -v '^$'))
    
    for ns in "${search_namespaces[@]}"; do
        log_debug "Searching for LocalDisks in namespace: $ns"
        local found_lds=$(get_all_resources "localdisk" "$ns" "fusion.storage.openshift.io/owned-by-fsc-name=$fsc_name" "name" 2>/dev/null || echo "")
        if [ -n "$found_lds" ]; then
            log_info "Found LocalDisks in namespace $ns: $found_lds"
            localdisks="$found_lds"
            working_namespace="$ns"
            break
        fi
    done
    
    # If still not found, search by device path in operator namespace
    if [ -z "$localdisks" ] && [ -n "$test_device" ]; then
        log_debug "Searching by device path in operator namespace: $operator_namespace"
        local all_lds=$(get_all_resources "localdisk" "$operator_namespace" "" "name" 2>/dev/null || echo "")
        for ld in $all_lds; do
            local ld_name="${ld##*/}"
            local device_path=$(get_resource_field "localdisk" "$ld_name" "$operator_namespace" ".spec.device" 2>/dev/null || echo "")
            if [ "$device_path" = "$test_device" ]; then
                log_info "Found LocalDisk by device path in $operator_namespace: $ld"
                localdisks="$ld"
                working_namespace="$operator_namespace"
                break
            fi
        done
    fi
    
    if [ -n "$localdisks" ]; then
        log_info "Found LocalDisks in namespace: $working_namespace"
        local needs_patching=0
        local patched_count=0
        
        for ld in $localdisks; do
            local ld_name="${ld##*/}"
            
            # Check current existingDataSkipVerify value using the correct namespace
            local current_skip_verify=$(get_resource_field "localdisk" "$ld_name" "$working_namespace" ".spec.existingDataSkipVerify" || echo "false")
            local device_path=$(get_resource_field "localdisk" "$ld_name" "$working_namespace" ".spec.device" || echo "unknown")
            
            log_debug "Checking LocalDisk $ld_name in namespace $working_namespace (device: $device_path, existingDataSkipVerify: $current_skip_verify)"
            
            if [ "$current_skip_verify" != "true" ]; then
                log_info "🔧 LocalDisk $ld_name needs patching (existingDataSkipVerify: $current_skip_verify)"
                needs_patching=1
                
                # Apply the patch using the correct namespace
                local patch_output
                if patch_output=$(kubectl patch localdisk "$ld_name" -n "$working_namespace" -p '{"spec":{"existingDataSkipVerify":true}}' --type=merge 2>&1); then
                    log_success "✓ Successfully patched LocalDisk $ld_name in namespace $working_namespace (existingDataSkipVerify=true)"
                    patched_count=$((patched_count + 1))
                else
                    log_warning "⚠️ Failed to patch LocalDisk $ld_name in namespace $working_namespace: $patch_output"
                fi
            else
                log_success "✓ LocalDisk $ld_name already has existingDataSkipVerify=true"
            fi
        done
        
        if [ $patched_count -gt 0 ]; then
            log_success "Patched $patched_count LocalDisk(s) in namespace $working_namespace - waiting 5 seconds for controller reconciliation"
            sleep 5
        elif [ $needs_patching -eq 0 ]; then
            log_info "All LocalDisks already have correct existingDataSkipVerify setting"
        fi
    else
        log_warning "No LocalDisks found for FSC $fsc_name in any searched namespace"
        log_info "Searched namespaces: ${search_namespaces[*]}"
        
        # List all LocalDisks for debugging
        log_info "Available LocalDisks across namespaces:"
        for ns in "${search_namespaces[@]}"; do
            local all_lds=$(get_all_resources "localdisk" "$ns" "" "name" 2>/dev/null || echo "")
            if [ -n "$all_lds" ]; then
                log_info "  Namespace $ns: $all_lds"
            else
                log_info "  Namespace $ns: (none)"
            fi
        done
    fi
}

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

# Check if kubectl is available and cluster is accessible
validate_kubectl_access() {
    if ! command -v kubectl &>/dev/null; then
        log_error "kubectl is not installed or not in PATH"
        return 1
    fi
    
    if ! kubectl cluster-info &>/dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Check KUBECONFIG."
        return 1
    fi
    
    log_success "kubectl access validated"
    return 0
}

# Check if required environment variables are set
validate_env_vars() {
    local required_vars=("$@")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        return 1
    fi
    
    log_success "All required environment variables are set"
    return 0
}

# ============================================================================
# UTILITY FUNCTIONS  
# ============================================================================

# Generate a unique test name with timestamp
generate_test_name() {
    local prefix=${1:-test}
    echo "${prefix}-$(date +%s)"
}

# Cleanup function that can be used with trap
cleanup_on_exit() {
    local exit_code=$?
    local cleanup_func=$1
    
    if [ -n "$cleanup_func" ] && type "$cleanup_func" &>/dev/null; then
        log_info "Running cleanup function: $cleanup_func"
        $cleanup_func
    fi
    
    exit $exit_code
}

# Set up trap for cleanup on script exit
setup_cleanup_trap() {
    local cleanup_func=$1
    
    if [ -z "$cleanup_func" ]; then
        log_error "setup_cleanup_trap: cleanup function name is required"
        return 1
    fi
    
    trap "cleanup_on_exit $cleanup_func" EXIT SIGINT SIGTERM SIGQUIT
    log_success "Cleanup trap configured with function: $cleanup_func"
}
