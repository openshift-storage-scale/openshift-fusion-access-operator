# OpenShift Fusion Access Operator

**Note: This README was written by Cursor and verified by members of the team**

The OpenShift Fusion Access Operator is a Kubernetes operator that enables **IBM Fusion Access for SAN** on OpenShift clusters. Fusion Access for SAN is a cloud-native storage solution designed to help enterprises transition smoothly from traditional virtualization environments to OpenShift while reusing existing SAN infrastructure.

## Overview

Built on IBM Storage Scale technology, Fusion Access provides a consistent, high-performance datastore-like experience with enhanced observability, platform-storage separation, and true storage abstraction. This operator simplifies the deployment and management of Fusion Access components in OpenShift environments.

## Architecture

The operator consists of several key components that work together to provide a complete storage solution:

### Core Components

- **FusionAccess Controller**: The main reconciliation controller that manages the lifecycle of Fusion Access installations
- **Device Finder**: A daemonset that discovers and reports available storage devices on cluster nodes
- **Console Plugin**: A dynamic web UI plugin for the OpenShift console
- **Kernel Module Manager**: Integration with KMM for loading required kernel modules
- **Local Volume Discovery**: Automated discovery of local storage devices

## How It Works

### 1. Custom Resource Management

The operator is controlled through a `FusionAccess` custom resource that defines the desired state:

```yaml
apiVersion: fusion.storage.openshift.io/v1alpha1
kind: FusionAccess
metadata:
  name: fusionaccess-object
  namespace: ibm-fusion-access
spec:
  storageScaleVersion: "v5.2.3.1"
  storageDeviceDiscovery:
    create: true
```

### 2. Installation Process

When a `FusionAccess` resource is created, the operator performs the following steps:

1. **Manifest Application**: Downloads and applies IBM Storage Scale manifests from the official repository
2. **Entitlement Setup**: Creates necessary pull secrets for accessing protected IBM container images
3. **Image Registry Validation**: Verifies OpenShift's internal image registry storage configuration
4. **Kernel Module Management**: Creates KMM (Kernel Module Management) resources for loading required drivers
5. **Console Plugin Deployment**: Deploys and enables the web UI plugin
6. **Device Discovery**: Optionally deploys device discovery daemonsets

### 3. Device Discovery

The device finder component runs as a privileged daemonset on cluster nodes and:

- Scans for available block devices using `lsblk`
- Filters devices based on criteria (size, filesystem, mountpoints, etc.)
- Creates `LocalVolumeDiscoveryResult` resources with discovered device information
- Monitors for hardware changes using udev events

### 4. Console Integration

The operator includes a dynamic console plugin that provides:

- **Fusion Access Home Page**: Overview of the Fusion Access installation
- **Storage Cluster Management**: Interface for creating and managing storage clusters
- **File System Management**: Tools for creating and managing file systems
- **Device Visualization**: Display of discovered storage devices (LUNs)

### 5. Status Monitoring

The operator continuously monitors the system status and reports:

- Manifest application status
- Image pull validation results
- Device discovery results
- Overall system health

## Prerequisites

- OpenShift 4.19 (Exclusively)
- IBM Fusion Access entitlement (see https://access.ibmfusion.eu/)
- Cluster administrator privileges
- Supported storage hardware

## Installation

The operator is distributed through the OpenShift OperatorHub:

1. Install from OperatorHub in the OpenShift console
2. Create the `ibm-fusion-access` namespace
3. Configure IBM entitlement credentials
4. Create a `FusionAccess` custom resource

## Configuration

### Required Configuration

- **IBM Entitlement Secret**: Named `fusion-pullsecret` containing IBM registry credentials
- **Storage Scale Version**: Must specify a supported IBM Storage Scale version

### Optional Configuration

- **External Manifest URL**: Override default IBM manifest location
- **Device Discovery**: Enable/disable automatic device discovery
- **Image Registry Settings**: Configure internal vs external registry usage

## Supported Versions

The operator currently supports:
- IBM Storage Scale v5.2.3.1
- OpenShift 4.19 (exclusively)
- Architecture: x86_64

## Security Considerations

- The device finder requires privileged access to scan host devices
- Pull secrets must be properly configured for IBM registry access
- Kernel modules are loaded through the Kernel Module Management (KMM) operator
- All communications use TLS encryption

## Troubleshooting

Common issues and solutions:

1. **Image Pull Errors**: Verify IBM entitlement credentials and pull secret configuration
2. **Device Discovery Issues**: Check daemonset logs and node privileges
3. **Console Plugin Not Loading**: Verify plugin is enabled in cluster console configuration
4. **Kernel Module Loading**: Check KMM operator status and node compatibility

## Development

### Prerequisites

- Go 1.21+
- `kubectl` or `oc` CLI
- OpenShift/OCP cluster access (via kubeconfig)
- Operator SDK
- controller-runtime
- OpenShift APIs

### Cluster Access Setup

**Important**: You don't need a separate token! Your `kubeconfig` file already contains all the authentication credentials (certificates and tokens) needed to access your OpenShift cluster.

To set up cluster access:

```bash
# Option 1: Set KUBECONFIG environment variable
export KUBECONFIG=/path/to/your/kubeconfig

# Option 2: Use default location (~/.kube/config)
# If kubeconfig is in default location, no export needed

# Option 3: Login with oc CLI (creates/updates ~/.kube/config)
oc login --server=https://your-cluster:6443 --token=your-token
# OR
oc login --server=https://your-cluster:6443  # Interactive login
```

Verify your connection:
```bash
kubectl cluster-info
# OR
oc cluster-info
```

### Running the Operator Locally (Development Mode)

Running the operator locally allows you to develop and debug without building container images. The operator runs as a local process on your machine but connects to your OpenShift cluster.

#### Quick Start

```bash
DEPLOYMENT_NAMESPACE=ibm-fusion-access \
RELATED_IMAGE_OPENSHIFT_STORAGE_SCALE_OPERATOR_DEVICEFINDER=quay.io/sughosh/openshift-fusion-access-devicefinder:6.6.7 \
ENABLE_WEBHOOKS=false \
make install run
```

#### Step-by-Step Explanation

1. **Install CRDs** (`make install`):
   - Installs Custom Resource Definitions to your cluster
   - Required before the operator can reconcile resources
   - Includes: `FusionAccess`, `FileSystemClaim`, `LocalVolumeDiscovery`, etc.

2. **Run Operator Locally** (`make run`):
   - Compiles and runs the operator using `go run`
   - No container image needed
   - Connects to cluster using your `kubeconfig`
   - Changes to code take effect immediately (restart required)

#### Environment Variables

- **`DEPLOYMENT_NAMESPACE`** (Required): 
  - Namespace where the operator will create resources
  - Example: `ibm-fusion-access`
  - The operator reads this to know where to deploy components

- **`RELATED_IMAGE_OPENSHIFT_STORAGE_SCALE_OPERATOR_DEVICEFINDER`** (Optional):
  - Image URL for the devicefinder daemonset
  - If not set, defaults to: `quay.io/openshift-storage-scale/openshift-fusion-access-devicefinder`
  - Example: `quay.io/sughosh/openshift-fusion-access-devicefinder:6.6.7`

- **`ENABLE_WEBHOOKS`** (Optional):
  - Set to `false` to disable webhook registration
  - Recommended for local development to avoid TLS certificate issues
  - Default: `true` (webhooks enabled)

#### Complete Example

```bash
# 1. Ensure you're connected to your cluster
export KUBECONFIG=/path/to/your/kubeconfig
kubectl cluster-info  # Verify connection

# 2. Create namespace if it doesn't exist
oc create namespace ibm-fusion-access

# 3. Install CRDs and run operator locally
DEPLOYMENT_NAMESPACE=ibm-fusion-access \
RELATED_IMAGE_OPENSHIFT_STORAGE_SCALE_OPERATOR_DEVICEFINDER=quay.io/sughosh/openshift-fusion-access-devicefinder:6.6.7 \
ENABLE_WEBHOOKS=false \
make install run

# 4. In another terminal, verify it's running
oc get pods -n ibm-fusion-access
kubectl get crds | grep fusion.storage.openshift.io
```

#### VS Code Debugging

For debugging with breakpoints in VS Code, use the pre-configured launch configurations in `.vscode/launch.json`:

1. **Install CRDs first** (required before debugging):
   ```bash
   make install
   ```

2. **Select a debug configuration** from the VS Code debug panel:
   - `Launch Operator (gpfs-nick)` - Uses specific kubeconfig path
   - `Launch Operator (Default Kubeconfig)` - Uses default `~/.kube/config`
   - `Launch Operator (Custom Kubeconfig)` - Uses `KUBECONFIG` environment variable

3. **Set breakpoints** in your Go code

4. **Press F5** to start debugging

The launch configurations include all required environment variables:
- `DEPLOYMENT_NAMESPACE`
- `RELATED_IMAGE_OPENSHIFT_STORAGE_SCALE_OPERATOR_DEVICEFINDER`
- `ENABLE_WEBHOOKS=false`
- `KUBECONFIG` (where applicable)

You can customize the configurations in `.vscode/launch.json` to match your environment.

### Building and Deploying Operator

For building container images and deploying the operator to your cluster:

**📖 See [docs/BUILD_AND_DEPLOY.md](docs/BUILD_AND_DEPLOY.md) for complete instructions**

The build documentation covers:
- Automated build and deployment with `fusion-access-operator-build.sh`
- Manual build process step-by-step
- Image registry configuration
- Pull secret setup
- Troubleshooting common build issues
- Build stability improvements and fixes

### Troubleshooting

#### Cannot Connect to Cluster

```bash
# Check kubeconfig
echo $KUBECONFIG
kubectl cluster-info

# Verify permissions
kubectl auth can-i create crds --all-namespaces
```

#### Webhook Certificate Errors

If you see webhook certificate errors:
- Set `ENABLE_WEBHOOKS=false` for local development (recommended)
- Or ensure certificates exist at `/tmp/k8s-webhook-server/serving-certs/`

#### CRDs Not Found

```bash
# Reinstall CRDs
make install

# Verify CRDs are installed
kubectl get crds | grep fusion.storage.openshift.io
```

#### Missing Permissions

Ensure you have cluster-admin or appropriate RBAC permissions:
```bash
oc adm policy who-can create crds
```

### Additional Resources

- Frontend development: See `console/README.md`
- Operator SDK documentation: https://sdk.operatorframework.io/
- controller-runtime: https://pkg.go.dev/sigs.k8s.io/controller-runtime

## Support

This operator requires an IBM Fusion Entitlement. For support and additional information:
- IBM Fusion Access: https://access.ibmfusion.eu/
- Red Hat Documentation: https://docs.redhat.com/en/documentation/openshift_container_platform/4.19/html/virtualization/virtualization-with-ibm-fusion-access-for-san

## License

Licensed under the Apache License, Version 2.0. See LICENSE file for details.
