#!/bin/bash
# Script to monitor the device partition cleanup job
#
# Usage: ./monitor-cleanup-job.sh [--follow]
#   --follow: Follow logs in real-time (like tail -f)

set -e

FOLLOW=false
if [ "$1" = "--follow" ]; then
    FOLLOW=true
fi

export KUBECONFIG="${KUBECONFIG:-/home/nlevanon/aws-gpfs-playground/ocp_install_files/auth/kubeconfig}"

JOB_NAME="clean-device-partitions"
NAMESPACE="ibm-fusion-access"

echo "=== Monitoring Cleanup Job: $JOB_NAME ==="
echo ""

# Wait for pod to be created
echo "Waiting for pod to start..."
for i in {1..30}; do
    POD=$(kubectl get pods -n "$NAMESPACE" -l app=device-cleanup -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -n "$POD" ]; then
        echo "✓ Pod found: $POD"
        break
    fi
    if [ $((i % 5)) -eq 0 ]; then
        echo "  Still waiting... ($i/30)"
    fi
    sleep 2
done

if [ -z "$POD" ]; then
    echo "❌ Pod not found. Checking job status..."
    kubectl describe job "$JOB_NAME" -n "$NAMESPACE" | tail -20
    exit 1
fi

# Show pod status
echo ""
echo "=== Pod Status ==="
kubectl get pod "$POD" -n "$NAMESPACE" -o custom-columns="NAME:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName,STARTED:.status.startTime"

# Monitor job completion
echo ""
echo "=== Monitoring Job Completion ==="
echo "Job typically completes in 10-30 seconds"
echo ""

if [ "$FOLLOW" = "true" ]; then
    echo "Following logs in real-time (Ctrl+C to stop)..."
    echo ""
    kubectl logs -n "$NAMESPACE" "$POD" -f 2>&1
else
    # Poll for completion
    MAX_WAIT=120
    ELAPSED=0
    
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        # Check if pod is completed
        PHASE=$(kubectl get pod "$POD" -n "$NAMESPACE" -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
        
        if [ "$PHASE" = "Succeeded" ]; then
            echo "✓ Job completed successfully!"
            echo ""
            echo "=== Final Logs ==="
            kubectl logs -n "$NAMESPACE" "$POD" 2>&1
            echo ""
            echo "=== Job Status ==="
            kubectl get job "$JOB_NAME" -n "$NAMESPACE" -o jsonpath='{.status}' | jq '.'
            exit 0
        elif [ "$PHASE" = "Failed" ]; then
            echo "❌ Job failed!"
            echo ""
            echo "=== Error Logs ==="
            kubectl logs -n "$NAMESPACE" "$POD" 2>&1
            echo ""
            echo "=== Pod Events ==="
            kubectl describe pod "$POD" -n "$NAMESPACE" | grep -A 10 "Events:"
            exit 1
        fi
        
        if [ $((ELAPSED % 10)) -eq 0 ] && [ $ELAPSED -gt 0 ]; then
            echo "  Still running... (${ELAPSED}s elapsed, status: $PHASE)"
            # Show current logs
            echo "  Current output:"
            kubectl logs -n "$NAMESPACE" "$POD" --tail=5 2>&1 | sed 's/^/    /'
        fi
        
        sleep 5
        ELAPSED=$((ELAPSED + 5))
    done
    
    echo "⚠️  Job did not complete within $MAX_WAIT seconds"
    echo ""
    echo "=== Current Logs ==="
    kubectl logs -n "$NAMESPACE" "$POD" 2>&1
    echo ""
    echo "=== Pod Status ==="
    kubectl get pod "$POD" -n "$NAMESPACE" -o yaml | grep -A 20 "status:"
fi

