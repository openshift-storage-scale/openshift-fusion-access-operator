#!/bin/bash
# CRD Validation Script for IBM Spectrum Scale Fusion Access Operator
# 
# This script validates that all required CRDs are installed in the cluster
# before running E2E tests. It can be run standalone or integrated into test scripts.
#
# Usage: ./validate-crds.sh [--strict|--list-only]
# 
# Options:
#   --strict     Exit with error if any required CRDs are missing
#   --list-only  Only list CRDs without validation
#
# Exit codes:
#   0 - All required CRDs are present
#   1 - Some required CRDs are missing (only in --strict mode)
#   2 - Cluster connection or other error

set -e

# Determine script directory and load common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/lib"

# Load common functions if available
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

# Parse command line options
STRICT_MODE=false
LIST_ONLY=false

for arg in "$@"; do
    case $arg in
        --strict)
            STRICT_MODE=true
            shift
            ;;
        --list-only)
            LIST_ONLY=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--strict|--list-only]"
            echo "  --strict     Exit with error if any required CRDs are missing"
            echo "  --list-only  Only list CRDs without validation"
            exit 0
            ;;
        *)
            log_error "Unknown option: $arg"
            exit 2
            ;;
    esac
done

# Define required CRDs with their descriptions and categories
declare -A REQUIRED_CRDS
declare -A CRD_DESCRIPTIONS
declare -A CRD_CATEGORIES

# IBM Spectrum Scale Core CRDs
REQUIRED_CRDS["localdisks.scale.spectrum.ibm.com"]="CRITICAL"
CRD_DESCRIPTIONS["localdisks.scale.spectrum.ibm.com"]="LocalDisk resources for storage device management"
CRD_CATEGORIES["localdisks.scale.spectrum.ibm.com"]="IBM Spectrum Scale Core"

REQUIRED_CRDS["filesystems.scale.spectrum.ibm.com"]="CRITICAL"
CRD_DESCRIPTIONS["filesystems.scale.spectrum.ibm.com"]="Filesystem resources for Spectrum Scale filesystems"
CRD_CATEGORIES["filesystems.scale.spectrum.ibm.com"]="IBM Spectrum Scale Core"

# Fusion Storage CRDs  
REQUIRED_CRDS["filesystemclaims.fusion.storage.openshift.io"]="CRITICAL"
CRD_DESCRIPTIONS["filesystemclaims.fusion.storage.openshift.io"]="FileSystemClaim resources for fusion storage requests"
CRD_CATEGORIES["filesystemclaims.fusion.storage.openshift.io"]="Fusion Storage"

REQUIRED_CRDS["fusionaccesses.fusion.storage.openshift.io"]="IMPORTANT"
CRD_DESCRIPTIONS["fusionaccesses.fusion.storage.openshift.io"]="FusionAccess configuration resources"
CRD_CATEGORIES["fusionaccesses.fusion.storage.openshift.io"]="Fusion Storage"

REQUIRED_CRDS["localvolumediscoveries.fusion.storage.openshift.io"]="IMPORTANT"
CRD_DESCRIPTIONS["localvolumediscoveries.fusion.storage.openshift.io"]="LocalVolumeDiscovery resources for device discovery"
CRD_CATEGORIES["localvolumediscoveries.fusion.storage.openshift.io"]="Fusion Storage"

REQUIRED_CRDS["localvolumediscoveryresults.fusion.storage.openshift.io"]="CRITICAL"
CRD_DESCRIPTIONS["localvolumediscoveryresults.fusion.storage.openshift.io"]="LocalVolumeDiscoveryResult resources with discovered devices"
CRD_CATEGORIES["localvolumediscoveryresults.fusion.storage.openshift.io"]="Fusion Storage"

# Volume Snapshot CRDs
REQUIRED_CRDS["volumesnapshotclasses.snapshot.storage.k8s.io"]="CRITICAL"
CRD_DESCRIPTIONS["volumesnapshotclasses.snapshot.storage.k8s.io"]="VolumeSnapshotClass resources for snapshot configuration"
CRD_CATEGORIES["volumesnapshotclasses.snapshot.storage.k8s.io"]="Volume Snapshots"

REQUIRED_CRDS["volumesnapshotcontents.snapshot.storage.k8s.io"]="IMPORTANT"
CRD_DESCRIPTIONS["volumesnapshotcontents.snapshot.storage.k8s.io"]="VolumeSnapshotContent resources for snapshot content"
CRD_CATEGORIES["volumesnapshotcontents.snapshot.storage.k8s.io"]="Volume Snapshots"

REQUIRED_CRDS["volumesnapshots.snapshot.storage.k8s.io"]="IMPORTANT"
CRD_DESCRIPTIONS["volumesnapshots.snapshot.storage.k8s.io"]="VolumeSnapshot resources for snapshot requests"
CRD_CATEGORIES["volumesnapshots.snapshot.storage.k8s.io"]="Volume Snapshots"

# Optional CRDs (good to have but not strictly required for basic functionality)
REQUIRED_CRDS["builds.build.openshift.io"]="OPTIONAL"
CRD_DESCRIPTIONS["builds.build.openshift.io"]="OpenShift Build resources (used by some operators)"
CRD_CATEGORIES["builds.build.openshift.io"]="OpenShift Platform"

# Function to check if kubectl is available and cluster is accessible
validate_cluster_access() {
    log_info "Validating cluster access..."
    
    if ! command -v kubectl &>/dev/null; then
        log_error "kubectl is not installed or not in PATH"
        return 1
    fi
    
    if ! kubectl cluster-info &>/dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Check KUBECONFIG and cluster status."
        return 1
    fi
    
    local cluster_url=$(kubectl cluster-info | head -1 | grep -o 'https://[^[:space:]]*' || echo "unknown")
    log_success "Connected to cluster: $cluster_url"
    
    return 0
}

# Function to check if a CRD exists
crd_exists() {
    local crd_name=$1
    kubectl get crd "$crd_name" &>/dev/null
}

# Function to get CRD creation timestamp
get_crd_creation_time() {
    local crd_name=$1
    kubectl get crd "$crd_name" -o jsonpath='{.metadata.creationTimestamp}' 2>/dev/null || echo "unknown"
}

# Function to list all CRDs in the cluster
list_all_crds() {
    log_header "All CRDs in Cluster"
    
    local all_crds=$(kubectl get crd --no-headers -o custom-columns="NAME:.metadata.name,CREATED:.metadata.creationTimestamp" 2>/dev/null)
    local crd_count=$(echo "$all_crds" | wc -l)
    
    log_info "Total CRDs in cluster: $crd_count"
    echo ""
    echo "$all_crds" | head -20
    
    if [ $crd_count -gt 20 ]; then
        echo "... (showing first 20 of $crd_count CRDs)"
        echo ""
        log_info "Use 'kubectl get crd' to see all CRDs"
    fi
}

# Function to validate required CRDs
validate_required_crds() {
    log_header "Validating Required CRDs"
    
    local missing_critical=0
    local missing_important=0  
    local missing_optional=0
    local present_crds=0
    
    # Group CRDs by category for organized output
    local categories=("IBM Spectrum Scale Core" "Fusion Storage" "Volume Snapshots" "OpenShift Platform")
    
    for category in "${categories[@]}"; do
        echo ""
        log_info "=== $category ==="
        
        for crd_name in "${!REQUIRED_CRDS[@]}"; do
            local priority="${REQUIRED_CRDS[$crd_name]}"
            local description="${CRD_DESCRIPTIONS[$crd_name]}"
            local crd_category="${CRD_CATEGORIES[$crd_name]}"
            
            if [ "$crd_category" = "$category" ]; then
                if crd_exists "$crd_name"; then
                    local creation_time=$(get_crd_creation_time "$crd_name")
                    log_success "$crd_name ($priority) - $description"
                    log_info "    Created: $creation_time"
                    present_crds=$((present_crds + 1))
                else
                    case "$priority" in
                        "CRITICAL")
                            log_error "$crd_name ($priority) - MISSING - $description"
                            missing_critical=$((missing_critical + 1))
                            ;;
                        "IMPORTANT")
                            log_warning "$crd_name ($priority) - MISSING - $description"
                            missing_important=$((missing_important + 1))
                            ;;
                        "OPTIONAL")
                            log_info "$crd_name ($priority) - MISSING - $description"
                            missing_optional=$((missing_optional + 1))
                            ;;
                    esac
                fi
            fi
        done
    done
    
    # Summary
    echo ""
    log_header "CRD Validation Summary"
    
    local total_crds=${#REQUIRED_CRDS[@]}
    log_info "Present CRDs: $present_crds/$total_crds"
    
    if [ $missing_critical -gt 0 ]; then
        log_error "Missing CRITICAL CRDs: $missing_critical"
    fi
    
    if [ $missing_important -gt 0 ]; then
        log_warning "Missing IMPORTANT CRDs: $missing_important"
    fi
    
    if [ $missing_optional -gt 0 ]; then
        log_info "Missing OPTIONAL CRDs: $missing_optional"
    fi
    
    # Installation guidance
    if [ $missing_critical -gt 0 ] || [ $missing_important -gt 0 ]; then
        echo ""
        log_header "Installation Guidance"
        
        if [ $missing_critical -gt 0 ]; then
            log_error "CRITICAL CRDs are missing. The cluster requires:"
            echo ""
            echo "1. IBM Spectrum Scale Container Native (CNCF) operator"
            echo "   - Provides: localdisks.scale.spectrum.ibm.com, filesystems.scale.spectrum.ibm.com"
            echo "   - Installation: IBM Spectrum Scale Container Native operator from OperatorHub"
            echo ""
            echo "2. OpenShift Fusion Access operator"
            echo "   - Provides: filesystemclaims.fusion.storage.openshift.io, fusionaccesses.fusion.storage.openshift.io"
            echo "   - Installation: Deploy fusion-access-operator"
            echo ""
            echo "3. Volume Snapshot CRDs"
            echo "   - Provides: volumesnapshotclasses.snapshot.storage.k8s.io"
            echo "   - Installation: Usually included with OpenShift/K8s, or install snapshot-controller"
        fi
        
        if [ $missing_important -gt 0 ]; then
            log_warning "IMPORTANT CRDs are missing but basic functionality may still work"
        fi
    else
        log_success "All critical CRDs are present! ✓"
    fi
    
    # Return status
    if [ $missing_critical -gt 0 ]; then
        return 1  # Critical CRDs missing
    else
        return 0  # All critical CRDs present
    fi
}

# Main function
main() {
    log_header "IBM Spectrum Scale Fusion Access - CRD Validation"
    
    # Validate cluster access first
    if ! validate_cluster_access; then
        exit 2
    fi
    
    # List all CRDs if requested
    if [ "$LIST_ONLY" = "true" ]; then
        list_all_crds
        exit 0
    fi
    
    # Validate required CRDs
    if validate_required_crds; then
        log_success "✅ CRD validation PASSED - All critical CRDs are present"
        exit 0
    else
        if [ "$STRICT_MODE" = "true" ]; then
            log_error "❌ CRD validation FAILED - Critical CRDs are missing"
            exit 1
        else
            log_warning "⚠️ CRD validation completed with warnings - Some CRDs are missing"
            log_info "Use --strict flag to fail on missing CRDs"
            exit 0
        fi
    fi
}

# Run main function
main "$@"
