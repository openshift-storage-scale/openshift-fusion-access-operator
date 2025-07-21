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

- OpenShift 4.19 or higher
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
- OpenShift 4.12+
- Architecture: x86_64, ppc64le, s390x

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

The operator is built using:
- Go 1.21+
- Operator SDK
- controller-runtime
- OpenShift APIs

For development setup and contribution guidelines, see the `console/README.md` for frontend development and standard Go development practices for the operator code.

## Support

This operator requires an IBM Fusion Entitlement. For support and additional information:
- IBM Fusion Access: https://access.ibmfusion.eu/
- Red Hat Documentation: https://docs.redhat.com/en/documentation/openshift_container_platform/4.19/html/virtualization/virtualization-with-ibm-fusion-access-for-san

## License

Licensed under the Apache License, Version 2.0. See LICENSE file for details.