#!/bin/bash
# Common Functions Library for Fusion Access Operator Scripts
# 
# This library provides consistent logging, resource management, and utility
# functions that can be shared across all scripts.
#
# Usage:
#   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
#   source "${SCRIPT_DIR}/common-functions.sh"

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
# RESOURCE MANAGEMENT FUNCTIONS
# ============================================================================

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
            log_debug "Still waiting... (${retry_count}/${max_retries})"
        fi
        sleep 2
    done
    
    log_error "${resource_type}/${name} was not ${condition:-available} after $max_retries attempts"
    return 1
}

# Robust resource deletion with finalizer handling
delete_resource_robust() {
    local resource_type=$1
    local name=$2
    local namespace=$3
    local max_retries=${4:-10}
    local retry_count=0
    
    if [ -z "$name" ]; then
        return 0
    fi
    
    log_cleanup "Deleting ${resource_type}/${name}"
    
    # Check if resource exists
    set +e
    if [ -n "$namespace" ]; then
        resource_exists=$(kubectl get "${resource_type}" "${name}" -n "${namespace}" &>/dev/null && echo "true" || echo "false")
    else
        resource_exists=$(kubectl get "${resource_type}" "${name}" &>/dev/null && echo "true" || echo "false")
    fi
    set -e
    
    if [ "$resource_exists" = "false" ]; then
        log_debug "${resource_type}/${name} already deleted"
        return 0
    fi
    
    while [ $retry_count -lt $max_retries ]; do
        # Try graceful deletion first
        if [ -n "$namespace" ]; then
            kubectl delete "${resource_type}" "${name}" -n "${namespace}" --ignore-not-found=true --wait=false || true
        else
            kubectl delete "${resource_type}" "${name}" --ignore-not-found=true --wait=false || true
        fi
        
        # Wait a moment
        sleep 2
        
        # Check if still exists
        set +e
        if [ -n "$namespace" ]; then
            still_exists=$(kubectl get "${resource_type}" "${name}" -n "${namespace}" &>/dev/null && echo "true" || echo "false")
        else
            still_exists=$(kubectl get "${resource_type}" "${name}" &>/dev/null && echo "true" || echo "false")
        fi
        set -e
        
        if [ "$still_exists" = "false" ]; then
            log_success "${resource_type}/${name} deleted successfully"
            return 0
        fi
        
        # If stuck, remove finalizers
        if [ $retry_count -ge 3 ]; then
            log_debug "Removing finalizers from ${resource_type}/${name}..."
            if [ -n "$namespace" ]; then
                kubectl patch "${resource_type}" "${name}" -n "${namespace}" \
                    -p '{"metadata":{"finalizers":[]}}' --type=merge 2>/dev/null || true
            else
                kubectl patch "${resource_type}" "${name}" \
                    -p '{"metadata":{"finalizers":[]}}' --type=merge 2>/dev/null || true
            fi
        fi
        
        retry_count=$((retry_count + 1))
        log_debug "Retrying deletion... (${retry_count}/${max_retries})"
    done
    
    log_warning "Could not delete ${resource_type}/${name} after ${max_retries} attempts"
    return 1
}

# Install CRD if missing with proper validation
install_crd_if_missing() {
    local crd_name=$1
    local group=$2
    local kind=$3
    local version=$4
    local scope=${5:-Namespaced}  # Default to Namespaced
    
    if kubectl get crd "$crd_name" &>/dev/null; then
        log_success "CRD $crd_name already exists"
        return 0
    fi
    
    log_install "Installing CRD: $crd_name"
    
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
    
    # Wait for CRD to be established
    wait_for_resource "crd" "$crd_name" "" "Established" 15
}

# Wait for CatalogSource to be ready (from fusion-access-operator-build.sh)
wait_for_catalogsource_ready() {
    local catalogsource_name=$1
    local namespace=${2:-openshift-marketplace}
    local max_retries=${3:-30}  # Maximum retries (default: 30 = 5 minutes)
    local retry_count=0

    log_progress "Waiting for CatalogSource ${catalogsource_name} to be fully ready..."
    while [ $retry_count -lt $max_retries ]; do
        set +e
        # Check if CatalogSource exists
        kubectl get catalogsource "${catalogsource_name}" -n "${namespace}" &> /dev/null
        cs_exists=$?
        
        if [ $cs_exists -ne 0 ]; then
            log_debug "CatalogSource ${catalogsource_name} not found, retrying... (${retry_count}/$max_retries)"
            retry_count=$((retry_count + 1))
            sleep 10
            continue
        fi

        # Check if pod exists and is ready
        POD_STATUS=$(kubectl get pod -n "${namespace}" -l "olm.catalogSource=${catalogsource_name}" -o jsonpath='{.items[0].status.phase}' 2>/dev/null)
        POD_READY=$(kubectl get pod -n "${namespace}" -l "olm.catalogSource=${catalogsource_name}" -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null)
        POD_NAME=$(kubectl get pod -n "${namespace}" -l "olm.catalogSource=${catalogsource_name}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
        
        # Check CatalogSource connection state (this is the critical check)
        CS_STATUS=$(kubectl get catalogsource "${catalogsource_name}" -n "${namespace}" -o jsonpath='{.status.connectionState.lastObservedState}' 2>/dev/null)
        CS_GRPC_STATUS=$(kubectl get catalogsource "${catalogsource_name}" -n "${namespace}" -o jsonpath='{.status.grpcConnectionState.lastObservedState}' 2>/dev/null)
        set -e

        if [ -z "${POD_NAME}" ]; then
            log_debug "CatalogSource pod not found yet, waiting... (${retry_count}/$max_retries)"
        elif [ "${POD_STATUS}" != "Running" ]; then
            log_debug "CatalogSource pod ${POD_NAME} status: ${POD_STATUS}, waiting... (${retry_count}/$max_retries)"
        elif [ "${POD_READY}" != "True" ]; then
            log_debug "CatalogSource pod ${POD_NAME} not ready yet, waiting... (${retry_count}/$max_retries)"
        elif [ "${CS_STATUS}" != "READY" ] && [ "${CS_GRPC_STATUS}" != "READY" ]; then
            log_debug "CatalogSource connection state: ${CS_STATUS:-Unknown}/${CS_GRPC_STATUS:-Unknown}, waiting for READY... (${retry_count}/$max_retries)"
        else
            log_success "CatalogSource ${catalogsource_name} pod ${POD_NAME} is ready!"
            log_success "CatalogSource connection state: ${CS_STATUS:-${CS_GRPC_STATUS}}"
            # Wait an additional 10 seconds to ensure gRPC service is fully operational
            log_debug "Waiting additional 10 seconds for gRPC service to stabilize..."
            sleep 10
            break
        fi

        retry_count=$((retry_count + 1))
        sleep 10
    done

    if [ $retry_count -eq $max_retries ]; then
        log_error "CatalogSource ${catalogsource_name} was not ready after $max_retries attempts"
        return 1
    fi
}

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

# Set log level from string
set_log_level() {
    case "${1^^}" in  # Convert to uppercase
        "DEBUG")
            export CURRENT_LOG_LEVEL=$LOG_LEVEL_DEBUG
            log_debug "Log level set to DEBUG"
            ;;
        "INFO")
            export CURRENT_LOG_LEVEL=$LOG_LEVEL_INFO
            log_info "Log level set to INFO"
            ;;
        "WARN"|"WARNING")
            export CURRENT_LOG_LEVEL=$LOG_LEVEL_WARN
            log_warning "Log level set to WARNING"
            ;;
        "ERROR")
            export CURRENT_LOG_LEVEL=$LOG_LEVEL_ERROR
            log_error "Log level set to ERROR"
            ;;
        *)
            log_error "Unknown log level: $1. Valid levels: DEBUG, INFO, WARN, ERROR"
            return 1
            ;;
    esac
}

# Enable/disable timestamps
enable_log_timestamps() {
    export LOG_TIMESTAMPS=true
    log_info "Log timestamps enabled"
}

disable_log_timestamps() {
    export LOG_TIMESTAMPS=false
    log_info "Log timestamps disabled"
}

# Check if running in OpenShift vs vanilla Kubernetes
is_openshift() {
    kubectl get route --all-namespaces &>/dev/null
}

# Check if CRD exists
crd_exists() {
    local crd_name=$1
    kubectl get crd "$crd_name" &>/dev/null
}

# Check if namespace exists
namespace_exists() {
    local namespace=$1
    kubectl get namespace "$namespace" &>/dev/null
}

# Create namespace if it doesn't exist
ensure_namespace() {
    local namespace=$1
    
    if namespace_exists "$namespace"; then
        log_success "Using existing namespace: $namespace"
    else
        log_install "Creating namespace: $namespace"
        kubectl create namespace "$namespace"
        log_success "Namespace $namespace created"
    fi
}

# Get project root directory (assumes this script is in scripts/ subdirectory)
get_project_root() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local project_root="$(cd "$script_dir/.." && pwd)"
    echo "$project_root"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Retry a command with exponential backoff
retry_with_backoff() {
    local max_attempts=$1
    local delay=$2
    local command="${@:3}"
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if eval "$command"; then
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Command failed after $max_attempts attempts: $command"
            return 1
        fi
        
        log_debug "Attempt $attempt failed, retrying in ${delay}s..."
        sleep "$delay"
        delay=$((delay * 2))  # Exponential backoff
        attempt=$((attempt + 1))
    done
}

# ============================================================================
# INITIALIZATION
# ============================================================================

# Initialize logging if script is run directly (for testing)
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    echo "Testing common functions library..."
    
    log_header "Testing Logging Functions"
    log_debug "This is a debug message"
    log_info "This is an info message"
    log_warning "This is a warning message" 
    log_error "This is an error message"
    log_success "This is a success message"
    log_progress "This is a progress message"
    
    log_header "Testing Section Headers"
    log_step "1" "First step"
    log_step "2" "Second step"
    
    log_cleanup "Cleaning up something"
    log_install "Installing something"
    
    echo ""
    echo "Testing utility functions:"
    
    if command_exists "kubectl"; then
        log_success "kubectl is available"
    else
        log_error "kubectl is not available"
    fi
    
    if is_openshift; then
        log_info "Running on OpenShift"
    else
        log_info "Running on vanilla Kubernetes"
    fi
    
    echo "Project root: $(get_project_root)"
fi
