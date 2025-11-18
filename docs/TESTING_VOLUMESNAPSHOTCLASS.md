# Testing VolumeSnapshotClass Feature Locally

This guide explains how to test the VolumeSnapshotClass feature locally during development.

## Prerequisites

### 1. Kubernetes Cluster with Snapshot Support

You need a Kubernetes/OpenShift cluster with VolumeSnapshot CRDs installed:

```bash
# Check if VolumeSnapshotClass CRD exists
kubectl get crd volumesnapshotclasses.snapshot.storage.k8s.io

# If not present, install snapshot CRDs (for vanilla Kubernetes)
kubectl apply -f https://raw.githubusercontent.com/kubernetes-csi/external-snapshotter/master/client/config/crd/snapshot.storage.k8s.io_volumesnapshotclasses.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes-csi/external-snapshotter/master/client/config/crd/snapshot.storage.k8s.io_volumesnapshotcontents.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes-csi/external-snapshotter/master/client/config/crd/snapshot.storage.k8s.io_volumesnapshots.yaml
```

**Note:** OpenShift clusters typically have these CRDs pre-installed.

### 2. IBM Spectrum Scale CSI Driver

The operator expects IBM Spectrum Scale CSI driver to be installed:

```bash
# Check if CSI driver is installed
kubectl get csidriver spectrumscale.csi.ibm.com

# Check CSI driver pods
kubectl get pods -n ibm-spectrum-scale -l app.kubernetes.io/name=ibm-spectrum-scale-csi
```

### 3. Development Tools

```bash
# Required tools
go version  # Go 1.22+
make --version
kubectl version
```

## Local Development Setup

### 1. Build the Operator

```bash
# From the project root
cd /home/nlevanon/workspace/openshift-storage-scale/openshift-fusion-access-operator

# Build the operator binary
make build

# Or build and push container image
make docker-build IMG=<your-registry>/fusion-access-operator:dev
make docker-push IMG=<your-registry>/fusion-access-operator:dev
```

### 2. Run Operator Locally (Out-of-Cluster)

```bash
# Export kubeconfig
export KUBECONFIG=/path/to/your/kubeconfig

# Run operator locally with debug logging
make run ARGS="--zap-log-level=1"

# For more verbose logging (shows V(1) logs)
make run ARGS="--zap-log-level=2 --zap-devel"
```

### 3. Deploy Operator In-Cluster

```bash
# Install CRDs
make install

# Deploy operator
make deploy IMG=<your-registry>/fusion-access-operator:dev

# Check operator logs
kubectl logs -n ibm-spectrum-scale-operator-system deployment/fusion-access-operator-controller-manager -f
```

## Testing VolumeSnapshotClass Creation

### 1. Create a Test FileSystemClaim

Create a test FSC manifest:

```bash
cat <<EOF > test-fsc-with-snapshot.yaml
apiVersion: fusion.storage.openshift.io/v1alpha1
kind: FileSystemClaim
metadata:
  name: test-fsc-snapshot
  namespace: ibm-spectrum-scale
spec:
  devices:
    - /dev/vdb
    - /dev/vdc
EOF

kubectl apply -f test-fsc-with-snapshot.yaml
```

### 2. Monitor Reconciliation Progress

Watch the FSC status and conditions:

```bash
# Watch FSC status
kubectl get fsc test-fsc-snapshot -n ibm-spectrum-scale -w

# Get detailed status
kubectl get fsc test-fsc-snapshot -n ibm-spectrum-scale -o yaml

# Check conditions specifically
kubectl get fsc test-fsc-snapshot -n ibm-spectrum-scale -o jsonpath='{.status.conditions}' | jq
```

### 3. Verify VolumeSnapshotClass Creation

```bash
# Check if VolumeSnapshotClass was created
kubectl get volumesnapshotclass

# Get details
kubectl get volumesnapshotclass test-fsc-snapshot -o yaml

# Verify ownership labels
kubectl get volumesnapshotclass test-fsc-snapshot -o jsonpath='{.metadata.labels}' | jq
```

Expected output:
```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotClass
metadata:
  labels:
    fusion.storage.openshift.io/owned-by-fsc-name: test-fsc-snapshot
    fusion.storage.openshift.io/owned-by-fsc-namespace: ibm-spectrum-scale
  name: test-fsc-snapshot
driver: spectrumscale.csi.ibm.com
deletionPolicy: Delete
```

### 4. Check Operator Logs for Debug Messages

```bash
# If running locally
# Look for these log messages in your terminal

# If running in-cluster
kubectl logs -n ibm-spectrum-scale-operator-system deployment/fusion-access-operator-controller-manager | grep -i volumesnapshot
```

Expected log messages:
- `"Building VolumeSnapshotClass"` - When constructing the VSC
- `"VolumeSnapshotClass not found, creating new one"` - During creation
- `"Successfully created VolumeSnapshotClass"` - After successful creation
- `"VolumeSnapshotClass condition updated to True"` - When condition is set
- `"VolumeSnapshotClass already exists, checking for drift"` - On subsequent reconciliations

### 5. Verify All Conditions

Check that all conditions are True:

```bash
kubectl get fsc test-fsc-snapshot -n ibm-spectrum-scale -o jsonpath='{range .status.conditions[*]}{.type}{"\t"}{.status}{"\t"}{.reason}{"\n"}{end}'
```

Expected output:
```
DeviceValidated                 True    DeviceValidationSucceeded
LocalDiskCreated                True    LocalDiskCreationSucceeded
FileSystemCreated               True    FileSystemCreationSucceeded
StorageClassCreated             True    StorageClassCreationSucceeded
VolumeSnapshotClassCreated      True    VolumeSnapshotClassCreationSucceeded
Ready                           True    ProvisioningSucceeded
```

## Testing VolumeSnapshotClass Drift Detection

### 1. Modify VolumeSnapshotClass Manually

```bash
# Change the deletionPolicy
kubectl patch volumesnapshotclass test-fsc-snapshot --type=merge -p '{"deletionPolicy":"Retain"}'

# Or change labels
kubectl label volumesnapshotclass test-fsc-snapshot custom-label=test
```

### 2. Trigger Reconciliation

```bash
# Add an annotation to trigger reconciliation
kubectl annotate fsc test-fsc-snapshot -n ibm-spectrum-scale test-reconcile=true --overwrite
```

### 3. Verify Drift Correction

```bash
# Check logs for drift detection
kubectl logs -n ibm-spectrum-scale-operator-system deployment/fusion-access-operator-controller-manager | grep -i drift

# Verify VSC was corrected
kubectl get volumesnapshotclass test-fsc-snapshot -o yaml
```

Expected log: `"VolumeSnapshotClass drift detected and corrected"`

## Testing VolumeSnapshotClass Deletion

### 1. Delete the FileSystemClaim

```bash
kubectl delete fsc test-fsc-snapshot -n ibm-spectrum-scale
```

### 2. Monitor Deletion Progress

```bash
# Watch the FSC during deletion
kubectl get fsc test-fsc-snapshot -n ibm-spectrum-scale -o yaml

# Check operator logs
kubectl logs -n ibm-spectrum-scale-operator-system deployment/fusion-access-operator-controller-manager -f
```

Expected log messages:
- `"Starting VolumeSnapshotClass deletion"`
- `"Deleting VolumeSnapshotClass resource"`
- `"Successfully deleted VolumeSnapshotClass"`
- `"VolumeSnapshotClass deletion complete, condition updated to False"`

### 3. Verify VolumeSnapshotClass is Gone

```bash
# VSC should be deleted
kubectl get volumesnapshotclass test-fsc-snapshot
# Should return: Error from server (NotFound)
```

## Testing Watch Events

### 1. Monitor Watch Events

In one terminal, watch operator logs:

```bash
kubectl logs -n ibm-spectrum-scale-operator-system deployment/fusion-access-operator-controller-manager -f | grep -i "volumesnapshotclass.*event"
```

### 2. Trigger Events

In another terminal:

```bash
# Update event
kubectl patch volumesnapshotclass test-fsc-snapshot --type=merge -p '{"metadata":{"annotations":{"test":"value"}}}'

# Delete event
kubectl delete volumesnapshotclass test-fsc-snapshot
```

Expected logs:
- `"VolumeSnapshotClass update event detected"`
- `"Enqueueing FileSystemClaim for VolumeSnapshotClass event"`
- `"VolumeSnapshotClass delete event detected"`

## Testing with Multiple FileSystemClaims

### 1. Create Multiple FSCs

```bash
for i in {1..3}; do
  kubectl apply -f - <<EOF
apiVersion: fusion.storage.openshift.io/v1alpha1
kind: FileSystemClaim
metadata:
  name: test-fsc-$i
  namespace: ibm-spectrum-scale
spec:
  devices:
    - /dev/vd$(printf "%c" $((98+i)))
EOF
done
```

### 2. Verify Each Has Its Own VolumeSnapshotClass

```bash
kubectl get volumesnapshotclass -l fusion.storage.openshift.io/owned-by-fsc-namespace=ibm-spectrum-scale

# Check each one
for i in {1..3}; do
  echo "=== test-fsc-$i ==="
  kubectl get volumesnapshotclass test-fsc-$i -o jsonpath='{.metadata.labels}' | jq
done
```

## Debugging Tips

### 1. Enable Verbose Logging

```bash
# Run operator with debug logging
make run ARGS="--zap-log-level=2 --zap-devel"
```

### 2. Check API Resources

```bash
# Verify VolumeSnapshotClass API is available
kubectl api-resources | grep volumesnapshotclass

# Check API version
kubectl explain volumesnapshotclass
```

### 3. Inspect Unstructured Object

If VSC isn't being created properly:

```bash
# Check the raw object in etcd
kubectl get volumesnapshotclass test-fsc-snapshot -o json | jq
```

### 4. Check RBAC Permissions

```bash
# Verify operator has VSC permissions
kubectl auth can-i create volumesnapshotclasses --as=system:serviceaccount:ibm-spectrum-scale-operator-system:fusion-access-operator-controller-manager

kubectl auth can-i delete volumesnapshotclasses --as=system:serviceaccount:ibm-spectrum-scale-operator-system:fusion-access-operator-controller-manager
```

### 5. Common Issues

#### Issue: VolumeSnapshotClass CRD Not Found

```bash
# Error: "no matches for kind VolumeSnapshotClass"
# Solution: Install snapshot CRDs
kubectl apply -f https://raw.githubusercontent.com/kubernetes-csi/external-snapshotter/master/client/config/crd/snapshot.storage.k8s.io_volumesnapshotclasses.yaml
```

#### Issue: VSC Created But Condition Not Updated

```bash
# Check operator logs for errors
kubectl logs -n ibm-spectrum-scale-operator-system deployment/fusion-access-operator-controller-manager | grep -i error

# Check FSC status update permissions
kubectl describe role fusion-access-operator-leader-election-role -n ibm-spectrum-scale-operator-system
```

#### Issue: VSC Not Deleted During FSC Deletion

```bash
# Check if VSC has finalizers
kubectl get volumesnapshotclass test-fsc-snapshot -o jsonpath='{.metadata.finalizers}'

# Check deletion order in logs
kubectl logs -n ibm-spectrum-scale-operator-system deployment/fusion-access-operator-controller-manager | grep -E "(VolumeSnapshotClass|StorageClass|Filesystem).*delet"
```

## Verification Checklist

- [ ] VolumeSnapshotClass CRD exists in cluster
- [ ] Operator has RBAC permissions for VolumeSnapshotClass
- [ ] FSC creates VolumeSnapshotClass after StorageClass
- [ ] VolumeSnapshotClass has correct driver: `spectrumscale.csi.ibm.com`
- [ ] VolumeSnapshotClass has correct deletionPolicy: `Delete`
- [ ] VolumeSnapshotClass has ownership labels
- [ ] `VolumeSnapshotClassCreated` condition set to True
- [ ] `Ready` condition includes VSC check
- [ ] Drift detection and correction works
- [ ] Watch events trigger reconciliation
- [ ] VolumeSnapshotClass deleted before StorageClass during FSC deletion
- [ ] Debug logs visible during all operations

## Quick Test Script

```bash
#!/bin/bash
set -e

echo "=== Testing VolumeSnapshotClass Feature ==="

# 1. Create FSC
echo "Creating FileSystemClaim..."
kubectl apply -f - <<EOF
apiVersion: fusion.storage.openshift.io/v1alpha1
kind: FileSystemClaim
metadata:
  name: test-vsc-feature
  namespace: ibm-spectrum-scale
spec:
  devices:
    - /dev/vdb
EOF

# 2. Wait for Ready
echo "Waiting for FSC to be Ready..."
kubectl wait --for=condition=Ready fsc/test-vsc-feature -n ibm-spectrum-scale --timeout=300s

# 3. Check VSC
echo "Checking VolumeSnapshotClass..."
kubectl get volumesnapshotclass test-vsc-feature -o yaml

# 4. Verify condition
echo "Verifying VolumeSnapshotClassCreated condition..."
kubectl get fsc test-vsc-feature -n ibm-spectrum-scale -o jsonpath='{.status.conditions[?(@.type=="VolumeSnapshotClassCreated")]}' | jq

# 5. Test drift
echo "Testing drift detection..."
kubectl patch volumesnapshotclass test-vsc-feature --type=merge -p '{"deletionPolicy":"Retain"}'
sleep 5
kubectl annotate fsc test-vsc-feature -n ibm-spectrum-scale test=drift --overwrite
sleep 10
kubectl get volumesnapshotclass test-vsc-feature -o jsonpath='{.deletionPolicy}'

# 6. Cleanup
echo "Cleaning up..."
kubectl delete fsc test-vsc-feature -n ibm-spectrum-scale

# 7. Verify VSC deleted
echo "Verifying VolumeSnapshotClass deleted..."
sleep 10
kubectl get volumesnapshotclass test-vsc-feature 2>&1 | grep -q "NotFound" && echo "✓ VSC deleted successfully"

echo "=== Test Complete ==="
```

Save as `test-vsc-feature.sh` and run:

```bash
chmod +x test-vsc-feature.sh
./test-vsc-feature.sh
```
