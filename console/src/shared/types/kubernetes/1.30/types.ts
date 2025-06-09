/**
 * BoundObjectReference is a reference to an object that a token is bound to.
 * @export
 * @interface IoK8sApiAuthenticationV1BoundObjectReference
 */
export interface IoK8sApiAuthenticationV1BoundObjectReference {
    /**
     * API version of the referent.
     * @type {string}
     * @memberof IoK8sApiAuthenticationV1BoundObjectReference
     */
    apiVersion?: string;
    /**
     * Kind of the referent. Valid kinds are 'Pod' and 'Secret'.
     * @type {string}
     * @memberof IoK8sApiAuthenticationV1BoundObjectReference
     */
    kind?: string;
    /**
     * Name of the referent.
     * @type {string}
     * @memberof IoK8sApiAuthenticationV1BoundObjectReference
     */
    name?: string;
    /**
     * UID of the referent.
     * @type {string}
     * @memberof IoK8sApiAuthenticationV1BoundObjectReference
     */
    uid?: string;
}
/**
 * TokenRequest requests a token for a given service account.
 * @export
 * @interface IoK8sApiAuthenticationV1TokenRequest
 */
export interface IoK8sApiAuthenticationV1TokenRequest {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiAuthenticationV1TokenRequest
     */
    apiVersion?: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiAuthenticationV1TokenRequest
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiAuthenticationV1TokenRequest
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * Spec holds information about the request being evaluated
     * @type {IoK8sApiAuthenticationV1TokenRequestSpec}
     * @memberof IoK8sApiAuthenticationV1TokenRequest
     */
    spec: IoK8sApiAuthenticationV1TokenRequestSpec;
    /**
     * Status is filled in by the server and indicates whether the token can be authenticated.
     * @type {IoK8sApiAuthenticationV1TokenRequestStatus}
     * @memberof IoK8sApiAuthenticationV1TokenRequest
     */
    status?: IoK8sApiAuthenticationV1TokenRequestStatus;
}
/**
 * TokenRequestSpec contains client provided parameters of a token request.
 * @export
 * @interface IoK8sApiAuthenticationV1TokenRequestSpec
 */
export interface IoK8sApiAuthenticationV1TokenRequestSpec {
    /**
     * Audiences are the intendend audiences of the token. A recipient of a token must identify themself with an identifier in the list of audiences of the token, and otherwise should reject the token. A token issued for multiple audiences may be used to authenticate against any of the audiences listed but implies a high degree of trust between the target audiences.
     * @type {Array<string>}
     * @memberof IoK8sApiAuthenticationV1TokenRequestSpec
     */
    audiences: Array<string>;
    /**
     * BoundObjectRef is a reference to an object that the token will be bound to. The token will only be valid for as long as the bound object exists. NOTE: The API server's TokenReview endpoint will validate the BoundObjectRef, but other audiences may not. Keep ExpirationSeconds small if you want prompt revocation.
     * @type {IoK8sApiAuthenticationV1BoundObjectReference}
     * @memberof IoK8sApiAuthenticationV1TokenRequestSpec
     */
    boundObjectRef?: IoK8sApiAuthenticationV1BoundObjectReference;
    /**
     * ExpirationSeconds is the requested duration of validity of the request. The token issuer may return a token with a different validity duration so a client needs to check the 'expiration' field in a response.
     * @type {number}
     * @memberof IoK8sApiAuthenticationV1TokenRequestSpec
     */
    expirationSeconds?: number;
}
/**
 * TokenRequestStatus is the result of a token request.
 * @export
 * @interface IoK8sApiAuthenticationV1TokenRequestStatus
 */
export interface IoK8sApiAuthenticationV1TokenRequestStatus {
    /**
     * ExpirationTimestamp is the time of expiration of the returned token.
     * @type {string}
     * @memberof IoK8sApiAuthenticationV1TokenRequestStatus
     */
    expirationTimestamp: string;
    /**
     * Token is the opaque bearer token.
     * @type {string}
     * @memberof IoK8sApiAuthenticationV1TokenRequestStatus
     */
    token: string;
}
/**
 * Scale represents a scaling request for a resource.
 * @export
 * @interface IoK8sApiAutoscalingV1Scale
 */
export interface IoK8sApiAutoscalingV1Scale {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiAutoscalingV1Scale
     */
    apiVersion?: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiAutoscalingV1Scale
     */
    kind?: string;
    /**
     * Standard object metadata; More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata.
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiAutoscalingV1Scale
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * spec defines the behavior of the scale. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status.
     * @type {IoK8sApiAutoscalingV1ScaleSpec}
     * @memberof IoK8sApiAutoscalingV1Scale
     */
    spec?: IoK8sApiAutoscalingV1ScaleSpec;
    /**
     * status is the current status of the scale. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status. Read-only.
     * @type {IoK8sApiAutoscalingV1ScaleStatus}
     * @memberof IoK8sApiAutoscalingV1Scale
     */
    status?: IoK8sApiAutoscalingV1ScaleStatus;
}
/**
 * ScaleSpec describes the attributes of a scale subresource.
 * @export
 * @interface IoK8sApiAutoscalingV1ScaleSpec
 */
export interface IoK8sApiAutoscalingV1ScaleSpec {
    /**
     * replicas is the desired number of instances for the scaled object.
     * @type {number}
     * @memberof IoK8sApiAutoscalingV1ScaleSpec
     */
    replicas?: number;
}
/**
 * ScaleStatus represents the current status of a scale subresource.
 * @export
 * @interface IoK8sApiAutoscalingV1ScaleStatus
 */
export interface IoK8sApiAutoscalingV1ScaleStatus {
    /**
     * replicas is the actual number of observed instances of the scaled object.
     * @type {number}
     * @memberof IoK8sApiAutoscalingV1ScaleStatus
     */
    replicas: number;
    /**
     * selector is the label query over pods that should match the replicas count. This is same as the label selector but in the string format to avoid introspection by clients. The string will be in the same format as the query-param syntax. More info about label selectors: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/
     * @type {string}
     * @memberof IoK8sApiAutoscalingV1ScaleStatus
     */
    selector?: string;
}
/**
 * Represents a Persistent Disk resource in AWS.
 * 
 * An AWS EBS disk must exist before mounting to a container. The disk must also be in the same AWS zone as the kubelet. An AWS EBS disk can only be mounted as read/write once. AWS EBS volumes support ownership management and SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1AWSElasticBlockStoreVolumeSource
 */
export interface IoK8sApiCoreV1AWSElasticBlockStoreVolumeSource {
    /**
     * fsType is the filesystem type of the volume that you want to mount. Tip: Ensure that the filesystem type is supported by the host operating system. Examples: "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified. More info: https://kubernetes.io/docs/concepts/storage/volumes#awselasticblockstore
     * @type {string}
     * @memberof IoK8sApiCoreV1AWSElasticBlockStoreVolumeSource
     */
    fsType?: string;
    /**
     * partition is the partition in the volume that you want to mount. If omitted, the default is to mount by volume name. Examples: For volume /dev/sda1, you specify the partition as "1". Similarly, the volume partition for /dev/sda is "0" (or you can leave the property empty).
     * @type {number}
     * @memberof IoK8sApiCoreV1AWSElasticBlockStoreVolumeSource
     */
    partition?: number;
    /**
     * readOnly value true will force the readOnly setting in VolumeMounts. More info: https://kubernetes.io/docs/concepts/storage/volumes#awselasticblockstore
     * @type {boolean}
     * @memberof IoK8sApiCoreV1AWSElasticBlockStoreVolumeSource
     */
    readOnly?: boolean;
    /**
     * volumeID is unique ID of the persistent disk resource in AWS (Amazon EBS volume). More info: https://kubernetes.io/docs/concepts/storage/volumes#awselasticblockstore
     * @type {string}
     * @memberof IoK8sApiCoreV1AWSElasticBlockStoreVolumeSource
     */
    volumeID: string;
}
/**
 * Affinity is a group of affinity scheduling rules.
 * @export
 * @interface IoK8sApiCoreV1Affinity
 */
export interface IoK8sApiCoreV1Affinity {
    /**
     * Describes node affinity scheduling rules for the pod.
     * @type {IoK8sApiCoreV1NodeAffinity}
     * @memberof IoK8sApiCoreV1Affinity
     */
    nodeAffinity?: IoK8sApiCoreV1NodeAffinity;
    /**
     * Describes pod affinity scheduling rules (e.g. co-locate this pod in the same node, zone, etc. as some other pod(s)).
     * @type {IoK8sApiCoreV1PodAffinity}
     * @memberof IoK8sApiCoreV1Affinity
     */
    podAffinity?: IoK8sApiCoreV1PodAffinity;
    /**
     * Describes pod anti-affinity scheduling rules (e.g. avoid putting this pod in the same node, zone, etc. as some other pod(s)).
     * @type {IoK8sApiCoreV1PodAntiAffinity}
     * @memberof IoK8sApiCoreV1Affinity
     */
    podAntiAffinity?: IoK8sApiCoreV1PodAntiAffinity;
}
/**
 * AppArmorProfile defines a pod or container's AppArmor settings.
 * @export
 * @interface IoK8sApiCoreV1AppArmorProfile
 */
export interface IoK8sApiCoreV1AppArmorProfile {
    /**
     * localhostProfile indicates a profile loaded on the node that should be used. The profile must be preconfigured on the node to work. Must match the loaded name of the profile. Must be set if and only if type is "Localhost".
     * @type {string}
     * @memberof IoK8sApiCoreV1AppArmorProfile
     */
    localhostProfile?: string;
    /**
     * type indicates which kind of AppArmor profile will be applied. Valid options are:
     *   Localhost - a profile pre-loaded on the node.
     *   RuntimeDefault - the container runtime's default profile.
     *   Unconfined - no AppArmor enforcement.
     * @type {string}
     * @memberof IoK8sApiCoreV1AppArmorProfile
     */
    type: string;
}
/**
 * AttachedVolume describes a volume attached to a node
 * @export
 * @interface IoK8sApiCoreV1AttachedVolume
 */
export interface IoK8sApiCoreV1AttachedVolume {
    /**
     * DevicePath represents the device path where the volume should be available
     * @type {string}
     * @memberof IoK8sApiCoreV1AttachedVolume
     */
    devicePath: string;
    /**
     * Name of the attached volume
     * @type {string}
     * @memberof IoK8sApiCoreV1AttachedVolume
     */
    name: string;
}
/**
 * AzureDisk represents an Azure Data Disk mount on the host and bind mount to the pod.
 * @export
 * @interface IoK8sApiCoreV1AzureDiskVolumeSource
 */
export interface IoK8sApiCoreV1AzureDiskVolumeSource {
    /**
     * cachingMode is the Host Caching mode: None, Read Only, Read Write.
     * @type {string}
     * @memberof IoK8sApiCoreV1AzureDiskVolumeSource
     */
    cachingMode?: string;
    /**
     * diskName is the Name of the data disk in the blob storage
     * @type {string}
     * @memberof IoK8sApiCoreV1AzureDiskVolumeSource
     */
    diskName: string;
    /**
     * diskURI is the URI of data disk in the blob storage
     * @type {string}
     * @memberof IoK8sApiCoreV1AzureDiskVolumeSource
     */
    diskURI: string;
    /**
     * fsType is Filesystem type to mount. Must be a filesystem type supported by the host operating system. Ex. "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified.
     * @type {string}
     * @memberof IoK8sApiCoreV1AzureDiskVolumeSource
     */
    fsType?: string;
    /**
     * kind expected values are Shared: multiple blob disks per storage account  Dedicated: single blob disk per storage account  Managed: azure managed data disk (only in managed availability set). defaults to shared
     * @type {string}
     * @memberof IoK8sApiCoreV1AzureDiskVolumeSource
     */
    kind?: string;
    /**
     * readOnly Defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1AzureDiskVolumeSource
     */
    readOnly?: boolean;
}
/**
 * AzureFile represents an Azure File Service mount on the host and bind mount to the pod.
 * @export
 * @interface IoK8sApiCoreV1AzureFilePersistentVolumeSource
 */
export interface IoK8sApiCoreV1AzureFilePersistentVolumeSource {
    /**
     * readOnly defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1AzureFilePersistentVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretName is the name of secret that contains Azure Storage Account Name and Key
     * @type {string}
     * @memberof IoK8sApiCoreV1AzureFilePersistentVolumeSource
     */
    secretName: string;
    /**
     * secretNamespace is the namespace of the secret that contains Azure Storage Account Name and Key default is the same as the Pod
     * @type {string}
     * @memberof IoK8sApiCoreV1AzureFilePersistentVolumeSource
     */
    secretNamespace?: string;
    /**
     * shareName is the azure Share Name
     * @type {string}
     * @memberof IoK8sApiCoreV1AzureFilePersistentVolumeSource
     */
    shareName: string;
}
/**
 * AzureFile represents an Azure File Service mount on the host and bind mount to the pod.
 * @export
 * @interface IoK8sApiCoreV1AzureFileVolumeSource
 */
export interface IoK8sApiCoreV1AzureFileVolumeSource {
    /**
     * readOnly defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1AzureFileVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretName is the  name of secret that contains Azure Storage Account Name and Key
     * @type {string}
     * @memberof IoK8sApiCoreV1AzureFileVolumeSource
     */
    secretName: string;
    /**
     * shareName is the azure share Name
     * @type {string}
     * @memberof IoK8sApiCoreV1AzureFileVolumeSource
     */
    shareName: string;
}
/**
 * Binding ties one object to another; for example, a pod is bound to a node by a scheduler. Deprecated in 1.7, please use the bindings subresource of pods instead.
 * @export
 * @interface IoK8sApiCoreV1Binding
 */
export interface IoK8sApiCoreV1Binding {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1Binding
     */
    apiVersion?: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1Binding
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1Binding
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * The target object that you want to bind to the standard object.
     * @type {IoK8sApiCoreV1ObjectReference}
     * @memberof IoK8sApiCoreV1Binding
     */
    target: IoK8sApiCoreV1ObjectReference;
}
/**
 * Represents storage that is managed by an external CSI volume driver (Beta feature)
 * @export
 * @interface IoK8sApiCoreV1CSIPersistentVolumeSource
 */
export interface IoK8sApiCoreV1CSIPersistentVolumeSource {
    /**
     * controllerExpandSecretRef is a reference to the secret object containing sensitive information to pass to the CSI driver to complete the CSI ControllerExpandVolume call. This field is optional, and may be empty if no secret is required. If the secret object contains more than one secret, all secrets are passed.
     * @type {IoK8sApiCoreV1SecretReference}
     * @memberof IoK8sApiCoreV1CSIPersistentVolumeSource
     */
    controllerExpandSecretRef?: IoK8sApiCoreV1SecretReference;
    /**
     * controllerPublishSecretRef is a reference to the secret object containing sensitive information to pass to the CSI driver to complete the CSI ControllerPublishVolume and ControllerUnpublishVolume calls. This field is optional, and may be empty if no secret is required. If the secret object contains more than one secret, all secrets are passed.
     * @type {IoK8sApiCoreV1SecretReference}
     * @memberof IoK8sApiCoreV1CSIPersistentVolumeSource
     */
    controllerPublishSecretRef?: IoK8sApiCoreV1SecretReference;
    /**
     * driver is the name of the driver to use for this volume. Required.
     * @type {string}
     * @memberof IoK8sApiCoreV1CSIPersistentVolumeSource
     */
    driver: string;
    /**
     * fsType to mount. Must be a filesystem type supported by the host operating system. Ex. "ext4", "xfs", "ntfs".
     * @type {string}
     * @memberof IoK8sApiCoreV1CSIPersistentVolumeSource
     */
    fsType?: string;
    /**
     * nodeExpandSecretRef is a reference to the secret object containing sensitive information to pass to the CSI driver to complete the CSI NodeExpandVolume call. This field is optional, may be omitted if no secret is required. If the secret object contains more than one secret, all secrets are passed.
     * @type {IoK8sApiCoreV1SecretReference}
     * @memberof IoK8sApiCoreV1CSIPersistentVolumeSource
     */
    nodeExpandSecretRef?: IoK8sApiCoreV1SecretReference;
    /**
     * nodePublishSecretRef is a reference to the secret object containing sensitive information to pass to the CSI driver to complete the CSI NodePublishVolume and NodeUnpublishVolume calls. This field is optional, and may be empty if no secret is required. If the secret object contains more than one secret, all secrets are passed.
     * @type {IoK8sApiCoreV1SecretReference}
     * @memberof IoK8sApiCoreV1CSIPersistentVolumeSource
     */
    nodePublishSecretRef?: IoK8sApiCoreV1SecretReference;
    /**
     * nodeStageSecretRef is a reference to the secret object containing sensitive information to pass to the CSI driver to complete the CSI NodeStageVolume and NodeStageVolume and NodeUnstageVolume calls. This field is optional, and may be empty if no secret is required. If the secret object contains more than one secret, all secrets are passed.
     * @type {IoK8sApiCoreV1SecretReference}
     * @memberof IoK8sApiCoreV1CSIPersistentVolumeSource
     */
    nodeStageSecretRef?: IoK8sApiCoreV1SecretReference;
    /**
     * readOnly value to pass to ControllerPublishVolumeRequest. Defaults to false (read/write).
     * @type {boolean}
     * @memberof IoK8sApiCoreV1CSIPersistentVolumeSource
     */
    readOnly?: boolean;
    /**
     * volumeAttributes of the volume to publish.
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApiCoreV1CSIPersistentVolumeSource
     */
    volumeAttributes?: { [key: string]: string; };
    /**
     * volumeHandle is the unique volume name returned by the CSI volume plugin’s CreateVolume to refer to the volume on all subsequent calls. Required.
     * @type {string}
     * @memberof IoK8sApiCoreV1CSIPersistentVolumeSource
     */
    volumeHandle: string;
}
/**
 * Represents a source location of a volume to mount, managed by an external CSI driver
 * @export
 * @interface IoK8sApiCoreV1CSIVolumeSource
 */
export interface IoK8sApiCoreV1CSIVolumeSource {
    /**
     * driver is the name of the CSI driver that handles this volume. Consult with your admin for the correct name as registered in the cluster.
     * @type {string}
     * @memberof IoK8sApiCoreV1CSIVolumeSource
     */
    driver: string;
    /**
     * fsType to mount. Ex. "ext4", "xfs", "ntfs". If not provided, the empty value is passed to the associated CSI driver which will determine the default filesystem to apply.
     * @type {string}
     * @memberof IoK8sApiCoreV1CSIVolumeSource
     */
    fsType?: string;
    /**
     * nodePublishSecretRef is a reference to the secret object containing sensitive information to pass to the CSI driver to complete the CSI NodePublishVolume and NodeUnpublishVolume calls. This field is optional, and  may be empty if no secret is required. If the secret object contains more than one secret, all secret references are passed.
     * @type {IoK8sApiCoreV1LocalObjectReference}
     * @memberof IoK8sApiCoreV1CSIVolumeSource
     */
    nodePublishSecretRef?: IoK8sApiCoreV1LocalObjectReference;
    /**
     * readOnly specifies a read-only configuration for the volume. Defaults to false (read/write).
     * @type {boolean}
     * @memberof IoK8sApiCoreV1CSIVolumeSource
     */
    readOnly?: boolean;
    /**
     * volumeAttributes stores driver-specific properties that are passed to the CSI driver. Consult your driver's documentation for supported values.
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApiCoreV1CSIVolumeSource
     */
    volumeAttributes?: { [key: string]: string; };
}
/**
 * Adds and removes POSIX capabilities from running containers.
 * @export
 * @interface IoK8sApiCoreV1Capabilities
 */
export interface IoK8sApiCoreV1Capabilities {
    /**
     * Added capabilities
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1Capabilities
     */
    add?: Array<string>;
    /**
     * Removed capabilities
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1Capabilities
     */
    drop?: Array<string>;
}
/**
 * Represents a Ceph Filesystem mount that lasts the lifetime of a pod Cephfs volumes do not support ownership management or SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1CephFSPersistentVolumeSource
 */
export interface IoK8sApiCoreV1CephFSPersistentVolumeSource {
    /**
     * monitors is Required: Monitors is a collection of Ceph monitors More info: https://examples.k8s.io/volumes/cephfs/README.md#how-to-use-it
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1CephFSPersistentVolumeSource
     */
    monitors: Array<string>;
    /**
     * path is Optional: Used as the mounted root, rather than the full Ceph tree, default is /
     * @type {string}
     * @memberof IoK8sApiCoreV1CephFSPersistentVolumeSource
     */
    path?: string;
    /**
     * readOnly is Optional: Defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts. More info: https://examples.k8s.io/volumes/cephfs/README.md#how-to-use-it
     * @type {boolean}
     * @memberof IoK8sApiCoreV1CephFSPersistentVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretFile is Optional: SecretFile is the path to key ring for User, default is /etc/ceph/user.secret More info: https://examples.k8s.io/volumes/cephfs/README.md#how-to-use-it
     * @type {string}
     * @memberof IoK8sApiCoreV1CephFSPersistentVolumeSource
     */
    secretFile?: string;
    /**
     * secretRef is Optional: SecretRef is reference to the authentication secret for User, default is empty. More info: https://examples.k8s.io/volumes/cephfs/README.md#how-to-use-it
     * @type {IoK8sApiCoreV1SecretReference}
     * @memberof IoK8sApiCoreV1CephFSPersistentVolumeSource
     */
    secretRef?: IoK8sApiCoreV1SecretReference;
    /**
     * user is Optional: User is the rados user name, default is admin More info: https://examples.k8s.io/volumes/cephfs/README.md#how-to-use-it
     * @type {string}
     * @memberof IoK8sApiCoreV1CephFSPersistentVolumeSource
     */
    user?: string;
}
/**
 * Represents a Ceph Filesystem mount that lasts the lifetime of a pod Cephfs volumes do not support ownership management or SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1CephFSVolumeSource
 */
export interface IoK8sApiCoreV1CephFSVolumeSource {
    /**
     * monitors is Required: Monitors is a collection of Ceph monitors More info: https://examples.k8s.io/volumes/cephfs/README.md#how-to-use-it
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1CephFSVolumeSource
     */
    monitors: Array<string>;
    /**
     * path is Optional: Used as the mounted root, rather than the full Ceph tree, default is /
     * @type {string}
     * @memberof IoK8sApiCoreV1CephFSVolumeSource
     */
    path?: string;
    /**
     * readOnly is Optional: Defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts. More info: https://examples.k8s.io/volumes/cephfs/README.md#how-to-use-it
     * @type {boolean}
     * @memberof IoK8sApiCoreV1CephFSVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretFile is Optional: SecretFile is the path to key ring for User, default is /etc/ceph/user.secret More info: https://examples.k8s.io/volumes/cephfs/README.md#how-to-use-it
     * @type {string}
     * @memberof IoK8sApiCoreV1CephFSVolumeSource
     */
    secretFile?: string;
    /**
     * secretRef is Optional: SecretRef is reference to the authentication secret for User, default is empty. More info: https://examples.k8s.io/volumes/cephfs/README.md#how-to-use-it
     * @type {IoK8sApiCoreV1LocalObjectReference}
     * @memberof IoK8sApiCoreV1CephFSVolumeSource
     */
    secretRef?: IoK8sApiCoreV1LocalObjectReference;
    /**
     * user is optional: User is the rados user name, default is admin More info: https://examples.k8s.io/volumes/cephfs/README.md#how-to-use-it
     * @type {string}
     * @memberof IoK8sApiCoreV1CephFSVolumeSource
     */
    user?: string;
}
/**
 * Represents a cinder volume resource in Openstack. A Cinder volume must exist before mounting to a container. The volume must also be in the same region as the kubelet. Cinder volumes support ownership management and SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1CinderPersistentVolumeSource
 */
export interface IoK8sApiCoreV1CinderPersistentVolumeSource {
    /**
     * fsType Filesystem type to mount. Must be a filesystem type supported by the host operating system. Examples: "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified. More info: https://examples.k8s.io/mysql-cinder-pd/README.md
     * @type {string}
     * @memberof IoK8sApiCoreV1CinderPersistentVolumeSource
     */
    fsType?: string;
    /**
     * readOnly is Optional: Defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts. More info: https://examples.k8s.io/mysql-cinder-pd/README.md
     * @type {boolean}
     * @memberof IoK8sApiCoreV1CinderPersistentVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretRef is Optional: points to a secret object containing parameters used to connect to OpenStack.
     * @type {IoK8sApiCoreV1SecretReference}
     * @memberof IoK8sApiCoreV1CinderPersistentVolumeSource
     */
    secretRef?: IoK8sApiCoreV1SecretReference;
    /**
     * volumeID used to identify the volume in cinder. More info: https://examples.k8s.io/mysql-cinder-pd/README.md
     * @type {string}
     * @memberof IoK8sApiCoreV1CinderPersistentVolumeSource
     */
    volumeID: string;
}
/**
 * Represents a cinder volume resource in Openstack. A Cinder volume must exist before mounting to a container. The volume must also be in the same region as the kubelet. Cinder volumes support ownership management and SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1CinderVolumeSource
 */
export interface IoK8sApiCoreV1CinderVolumeSource {
    /**
     * fsType is the filesystem type to mount. Must be a filesystem type supported by the host operating system. Examples: "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified. More info: https://examples.k8s.io/mysql-cinder-pd/README.md
     * @type {string}
     * @memberof IoK8sApiCoreV1CinderVolumeSource
     */
    fsType?: string;
    /**
     * readOnly defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts. More info: https://examples.k8s.io/mysql-cinder-pd/README.md
     * @type {boolean}
     * @memberof IoK8sApiCoreV1CinderVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretRef is optional: points to a secret object containing parameters used to connect to OpenStack.
     * @type {IoK8sApiCoreV1LocalObjectReference}
     * @memberof IoK8sApiCoreV1CinderVolumeSource
     */
    secretRef?: IoK8sApiCoreV1LocalObjectReference;
    /**
     * volumeID used to identify the volume in cinder. More info: https://examples.k8s.io/mysql-cinder-pd/README.md
     * @type {string}
     * @memberof IoK8sApiCoreV1CinderVolumeSource
     */
    volumeID: string;
}
/**
 * ClaimSource describes a reference to a ResourceClaim.
 * 
 * Exactly one of these fields should be set.  Consumers of this type must treat an empty object as if it has an unknown value.
 * @export
 * @interface IoK8sApiCoreV1ClaimSource
 */
export interface IoK8sApiCoreV1ClaimSource {
    /**
     * ResourceClaimName is the name of a ResourceClaim object in the same namespace as this pod.
     * @type {string}
     * @memberof IoK8sApiCoreV1ClaimSource
     */
    resourceClaimName?: string;
    /**
     * ResourceClaimTemplateName is the name of a ResourceClaimTemplate object in the same namespace as this pod.
     * 
     * The template will be used to create a new ResourceClaim, which will be bound to this pod. When this pod is deleted, the ResourceClaim will also be deleted. The pod name and resource name, along with a generated component, will be used to form a unique name for the ResourceClaim, which will be recorded in pod.status.resourceClaimStatuses.
     * 
     * This field is immutable and no changes will be made to the corresponding ResourceClaim by the control plane after creating the ResourceClaim.
     * @type {string}
     * @memberof IoK8sApiCoreV1ClaimSource
     */
    resourceClaimTemplateName?: string;
}
/**
 * ClientIPConfig represents the configurations of Client IP based session affinity.
 * @export
 * @interface IoK8sApiCoreV1ClientIPConfig
 */
export interface IoK8sApiCoreV1ClientIPConfig {
    /**
     * timeoutSeconds specifies the seconds of ClientIP type session sticky time. The value must be >0 && <=86400(for 1 day) if ServiceAffinity == "ClientIP". Default value is 10800(for 3 hours).
     * @type {number}
     * @memberof IoK8sApiCoreV1ClientIPConfig
     */
    timeoutSeconds?: number;
}
/**
 * ClusterTrustBundleProjection describes how to select a set of ClusterTrustBundle objects and project their contents into the pod filesystem.
 * @export
 * @interface IoK8sApiCoreV1ClusterTrustBundleProjection
 */
export interface IoK8sApiCoreV1ClusterTrustBundleProjection {
    /**
     * Select all ClusterTrustBundles that match this label selector.  Only has effect if signerName is set.  Mutually-exclusive with name.  If unset, interpreted as "match nothing".  If set but empty, interpreted as "match everything".
     * @type {IoK8sApimachineryPkgApisMetaV1LabelSelector}
     * @memberof IoK8sApiCoreV1ClusterTrustBundleProjection
     */
    labelSelector?: IoK8sApimachineryPkgApisMetaV1LabelSelector;
    /**
     * Select a single ClusterTrustBundle by object name.  Mutually-exclusive with signerName and labelSelector.
     * @type {string}
     * @memberof IoK8sApiCoreV1ClusterTrustBundleProjection
     */
    name?: string;
    /**
     * If true, don't block pod startup if the referenced ClusterTrustBundle(s) aren't available.  If using name, then the named ClusterTrustBundle is allowed not to exist.  If using signerName, then the combination of signerName and labelSelector is allowed to match zero ClusterTrustBundles.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ClusterTrustBundleProjection
     */
    optional?: boolean;
    /**
     * Relative path from the volume root to write the bundle.
     * @type {string}
     * @memberof IoK8sApiCoreV1ClusterTrustBundleProjection
     */
    path: string;
    /**
     * Select all ClusterTrustBundles that match this signer name. Mutually-exclusive with name.  The contents of all selected ClusterTrustBundles will be unified and deduplicated.
     * @type {string}
     * @memberof IoK8sApiCoreV1ClusterTrustBundleProjection
     */
    signerName?: string;
}
/**
 * Information about the condition of a component.
 * @export
 * @interface IoK8sApiCoreV1ComponentCondition
 */
export interface IoK8sApiCoreV1ComponentCondition {
    /**
     * Condition error code for a component. For example, a health check error code.
     * @type {string}
     * @memberof IoK8sApiCoreV1ComponentCondition
     */
    error?: string;
    /**
     * Message about the condition for a component. For example, information about a health check.
     * @type {string}
     * @memberof IoK8sApiCoreV1ComponentCondition
     */
    message?: string;
    /**
     * Status of the condition for a component. Valid values for "Healthy": "True", "False", or "Unknown".
     * @type {string}
     * @memberof IoK8sApiCoreV1ComponentCondition
     */
    status: string;
    /**
     * Type of condition for a component. Valid value: "Healthy"
     * @type {string}
     * @memberof IoK8sApiCoreV1ComponentCondition
     */
    type: string;
}
/**
 * ComponentStatus (and ComponentStatusList) holds the cluster validation info. Deprecated: This API is deprecated in v1.19+
 * @export
 * @interface IoK8sApiCoreV1ComponentStatus
 */
export interface IoK8sApiCoreV1ComponentStatus {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1ComponentStatus
     */
    apiVersion?: string;
    /**
     * List of component conditions observed
     * @type {Array<IoK8sApiCoreV1ComponentCondition>}
     * @memberof IoK8sApiCoreV1ComponentStatus
     */
    conditions?: Array<IoK8sApiCoreV1ComponentCondition>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1ComponentStatus
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1ComponentStatus
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
}
/**
 * Status of all the conditions for the component as a list of ComponentStatus objects. Deprecated: This API is deprecated in v1.19+
 * @export
 * @interface IoK8sApiCoreV1ComponentStatusList
 */
export interface IoK8sApiCoreV1ComponentStatusList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1ComponentStatusList
     */
    apiVersion?: string;
    /**
     * List of ComponentStatus objects.
     * @type {Array<IoK8sApiCoreV1ComponentStatus>}
     * @memberof IoK8sApiCoreV1ComponentStatusList
     */
    items: Array<IoK8sApiCoreV1ComponentStatus>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1ComponentStatusList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1ComponentStatusList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * ConfigMap holds configuration data for pods to consume.
 * @export
 * @interface IoK8sApiCoreV1ConfigMap
 */
export interface IoK8sApiCoreV1ConfigMap {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1ConfigMap
     */
    apiVersion?: string;
    /**
     * BinaryData contains the binary data. Each key must consist of alphanumeric characters, '-', '_' or '.'. BinaryData can contain byte sequences that are not in the UTF-8 range. The keys stored in BinaryData must not overlap with the ones in the Data field, this is enforced during validation process. Using this field will require 1.10+ apiserver and kubelet.
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApiCoreV1ConfigMap
     */
    binaryData?: { [key: string]: string; };
    /**
     * Data contains the configuration data. Each key must consist of alphanumeric characters, '-', '_' or '.'. Values with non-UTF-8 byte sequences must use the BinaryData field. The keys stored in Data must not overlap with the keys in the BinaryData field, this is enforced during validation process.
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApiCoreV1ConfigMap
     */
    data?: { [key: string]: string; };
    /**
     * Immutable, if set to true, ensures that data stored in the ConfigMap cannot be updated (only object metadata can be modified). If not set to true, the field can be modified at any time. Defaulted to nil.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ConfigMap
     */
    immutable?: boolean;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1ConfigMap
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1ConfigMap
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
}
/**
 * ConfigMapEnvSource selects a ConfigMap to populate the environment variables with.
 * 
 * The contents of the target ConfigMap's Data field will represent the key-value pairs as environment variables.
 * @export
 * @interface IoK8sApiCoreV1ConfigMapEnvSource
 */
export interface IoK8sApiCoreV1ConfigMapEnvSource {
    /**
     * Name of the referent. This field is effectively required, but due to backwards compatibility is allowed to be empty. Instances of this type with an empty value here are almost certainly wrong. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
     * @type {string}
     * @memberof IoK8sApiCoreV1ConfigMapEnvSource
     */
    name?: string;
    /**
     * Specify whether the ConfigMap must be defined
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ConfigMapEnvSource
     */
    optional?: boolean;
}
/**
 * Selects a key from a ConfigMap.
 * @export
 * @interface IoK8sApiCoreV1ConfigMapKeySelector
 */
export interface IoK8sApiCoreV1ConfigMapKeySelector {
    /**
     * The key to select.
     * @type {string}
     * @memberof IoK8sApiCoreV1ConfigMapKeySelector
     */
    key: string;
    /**
     * Name of the referent. This field is effectively required, but due to backwards compatibility is allowed to be empty. Instances of this type with an empty value here are almost certainly wrong. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
     * @type {string}
     * @memberof IoK8sApiCoreV1ConfigMapKeySelector
     */
    name?: string;
    /**
     * Specify whether the ConfigMap or its key must be defined
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ConfigMapKeySelector
     */
    optional?: boolean;
}
/**
 * ConfigMapList is a resource containing a list of ConfigMap objects.
 * @export
 * @interface IoK8sApiCoreV1ConfigMapList
 */
export interface IoK8sApiCoreV1ConfigMapList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1ConfigMapList
     */
    apiVersion?: string;
    /**
     * Items is the list of ConfigMaps.
     * @type {Array<IoK8sApiCoreV1ConfigMap>}
     * @memberof IoK8sApiCoreV1ConfigMapList
     */
    items: Array<IoK8sApiCoreV1ConfigMap>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1ConfigMapList
     */
    kind?: string;
    /**
     * More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1ConfigMapList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * ConfigMapNodeConfigSource contains the information to reference a ConfigMap as a config source for the Node. This API is deprecated since 1.22: https://git.k8s.io/enhancements/keps/sig-node/281-dynamic-kubelet-configuration
 * @export
 * @interface IoK8sApiCoreV1ConfigMapNodeConfigSource
 */
export interface IoK8sApiCoreV1ConfigMapNodeConfigSource {
    /**
     * KubeletConfigKey declares which key of the referenced ConfigMap corresponds to the KubeletConfiguration structure This field is required in all cases.
     * @type {string}
     * @memberof IoK8sApiCoreV1ConfigMapNodeConfigSource
     */
    kubeletConfigKey: string;
    /**
     * Name is the metadata.name of the referenced ConfigMap. This field is required in all cases.
     * @type {string}
     * @memberof IoK8sApiCoreV1ConfigMapNodeConfigSource
     */
    name: string;
    /**
     * Namespace is the metadata.namespace of the referenced ConfigMap. This field is required in all cases.
     * @type {string}
     * @memberof IoK8sApiCoreV1ConfigMapNodeConfigSource
     */
    namespace: string;
    /**
     * ResourceVersion is the metadata.ResourceVersion of the referenced ConfigMap. This field is forbidden in Node.Spec, and required in Node.Status.
     * @type {string}
     * @memberof IoK8sApiCoreV1ConfigMapNodeConfigSource
     */
    resourceVersion?: string;
    /**
     * UID is the metadata.UID of the referenced ConfigMap. This field is forbidden in Node.Spec, and required in Node.Status.
     * @type {string}
     * @memberof IoK8sApiCoreV1ConfigMapNodeConfigSource
     */
    uid?: string;
}
/**
 * Adapts a ConfigMap into a projected volume.
 * 
 * The contents of the target ConfigMap's Data field will be presented in a projected volume as files using the keys in the Data field as the file names, unless the items element is populated with specific mappings of keys to paths. Note that this is identical to a configmap volume source without the default mode.
 * @export
 * @interface IoK8sApiCoreV1ConfigMapProjection
 */
export interface IoK8sApiCoreV1ConfigMapProjection {
    /**
     * items if unspecified, each key-value pair in the Data field of the referenced ConfigMap will be projected into the volume as a file whose name is the key and content is the value. If specified, the listed keys will be projected into the specified paths, and unlisted keys will not be present. If a key is specified which is not present in the ConfigMap, the volume setup will error unless it is marked optional. Paths must be relative and may not contain the '..' path or start with '..'.
     * @type {Array<IoK8sApiCoreV1KeyToPath>}
     * @memberof IoK8sApiCoreV1ConfigMapProjection
     */
    items?: Array<IoK8sApiCoreV1KeyToPath>;
    /**
     * Name of the referent. This field is effectively required, but due to backwards compatibility is allowed to be empty. Instances of this type with an empty value here are almost certainly wrong. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
     * @type {string}
     * @memberof IoK8sApiCoreV1ConfigMapProjection
     */
    name?: string;
    /**
     * optional specify whether the ConfigMap or its keys must be defined
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ConfigMapProjection
     */
    optional?: boolean;
}
/**
 * Adapts a ConfigMap into a volume.
 * 
 * The contents of the target ConfigMap's Data field will be presented in a volume as files using the keys in the Data field as the file names, unless the items element is populated with specific mappings of keys to paths. ConfigMap volumes support ownership management and SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1ConfigMapVolumeSource
 */
export interface IoK8sApiCoreV1ConfigMapVolumeSource {
    /**
     * defaultMode is optional: mode bits used to set permissions on created files by default. Must be an octal value between 0000 and 0777 or a decimal value between 0 and 511. YAML accepts both octal and decimal values, JSON requires decimal values for mode bits. Defaults to 0644. Directories within the path are not affected by this setting. This might be in conflict with other options that affect the file mode, like fsGroup, and the result can be other mode bits set.
     * @type {number}
     * @memberof IoK8sApiCoreV1ConfigMapVolumeSource
     */
    defaultMode?: number;
    /**
     * items if unspecified, each key-value pair in the Data field of the referenced ConfigMap will be projected into the volume as a file whose name is the key and content is the value. If specified, the listed keys will be projected into the specified paths, and unlisted keys will not be present. If a key is specified which is not present in the ConfigMap, the volume setup will error unless it is marked optional. Paths must be relative and may not contain the '..' path or start with '..'.
     * @type {Array<IoK8sApiCoreV1KeyToPath>}
     * @memberof IoK8sApiCoreV1ConfigMapVolumeSource
     */
    items?: Array<IoK8sApiCoreV1KeyToPath>;
    /**
     * Name of the referent. This field is effectively required, but due to backwards compatibility is allowed to be empty. Instances of this type with an empty value here are almost certainly wrong. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
     * @type {string}
     * @memberof IoK8sApiCoreV1ConfigMapVolumeSource
     */
    name?: string;
    /**
     * optional specify whether the ConfigMap or its keys must be defined
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ConfigMapVolumeSource
     */
    optional?: boolean;
}
/**
 * A single application container that you want to run within a pod.
 * @export
 * @interface IoK8sApiCoreV1Container
 */
export interface IoK8sApiCoreV1Container {
    /**
     * Arguments to the entrypoint. The container image's CMD is used if this is not provided. Variable references $(VAR_NAME) are expanded using the container's environment. If a variable cannot be resolved, the reference in the input string will be unchanged. Double $$ are reduced to a single $, which allows for escaping the $(VAR_NAME) syntax: i.e. "$$(VAR_NAME)" will produce the string literal "$(VAR_NAME)". Escaped references will never be expanded, regardless of whether the variable exists or not. Cannot be updated. More info: https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/#running-a-command-in-a-shell
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1Container
     */
    args?: Array<string>;
    /**
     * Entrypoint array. Not executed within a shell. The container image's ENTRYPOINT is used if this is not provided. Variable references $(VAR_NAME) are expanded using the container's environment. If a variable cannot be resolved, the reference in the input string will be unchanged. Double $$ are reduced to a single $, which allows for escaping the $(VAR_NAME) syntax: i.e. "$$(VAR_NAME)" will produce the string literal "$(VAR_NAME)". Escaped references will never be expanded, regardless of whether the variable exists or not. Cannot be updated. More info: https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/#running-a-command-in-a-shell
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1Container
     */
    command?: Array<string>;
    /**
     * List of environment variables to set in the container. Cannot be updated.
     * @type {Array<IoK8sApiCoreV1EnvVar>}
     * @memberof IoK8sApiCoreV1Container
     */
    env?: Array<IoK8sApiCoreV1EnvVar>;
    /**
     * List of sources to populate environment variables in the container. The keys defined within a source must be a C_IDENTIFIER. All invalid keys will be reported as an event when the container is starting. When a key exists in multiple sources, the value associated with the last source will take precedence. Values defined by an Env with a duplicate key will take precedence. Cannot be updated.
     * @type {Array<IoK8sApiCoreV1EnvFromSource>}
     * @memberof IoK8sApiCoreV1Container
     */
    envFrom?: Array<IoK8sApiCoreV1EnvFromSource>;
    /**
     * Container image name. More info: https://kubernetes.io/docs/concepts/containers/images This field is optional to allow higher level config management to default or override container images in workload controllers like Deployments and StatefulSets.
     * @type {string}
     * @memberof IoK8sApiCoreV1Container
     */
    image?: string;
    /**
     * Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. Cannot be updated. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images
     * @type {string}
     * @memberof IoK8sApiCoreV1Container
     */
    imagePullPolicy?: string;
    /**
     * Actions that the management system should take in response to container lifecycle events. Cannot be updated.
     * @type {IoK8sApiCoreV1Lifecycle}
     * @memberof IoK8sApiCoreV1Container
     */
    lifecycle?: IoK8sApiCoreV1Lifecycle;
    /**
     * Periodic probe of container liveness. Container will be restarted if the probe fails. Cannot be updated. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#container-probes
     * @type {IoK8sApiCoreV1Probe}
     * @memberof IoK8sApiCoreV1Container
     */
    livenessProbe?: IoK8sApiCoreV1Probe;
    /**
     * Name of the container specified as a DNS_LABEL. Each container in a pod must have a unique name (DNS_LABEL). Cannot be updated.
     * @type {string}
     * @memberof IoK8sApiCoreV1Container
     */
    name: string;
    /**
     * List of ports to expose from the container. Not specifying a port here DOES NOT prevent that port from being exposed. Any port which is listening on the default "0.0.0.0" address inside a container will be accessible from the network. Modifying this array with strategic merge patch may corrupt the data. For more information See https://github.com/kubernetes/kubernetes/issues/108255. Cannot be updated.
     * @type {Array<IoK8sApiCoreV1ContainerPort>}
     * @memberof IoK8sApiCoreV1Container
     */
    ports?: Array<IoK8sApiCoreV1ContainerPort>;
    /**
     * Periodic probe of container service readiness. Container will be removed from service endpoints if the probe fails. Cannot be updated. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#container-probes
     * @type {IoK8sApiCoreV1Probe}
     * @memberof IoK8sApiCoreV1Container
     */
    readinessProbe?: IoK8sApiCoreV1Probe;
    /**
     * Resources resize policy for the container.
     * @type {Array<IoK8sApiCoreV1ContainerResizePolicy>}
     * @memberof IoK8sApiCoreV1Container
     */
    resizePolicy?: Array<IoK8sApiCoreV1ContainerResizePolicy>;
    /**
     * Compute Resources required by this container. Cannot be updated. More info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
     * @type {IoK8sApiCoreV1ResourceRequirements}
     * @memberof IoK8sApiCoreV1Container
     */
    resources?: IoK8sApiCoreV1ResourceRequirements;
    /**
     * RestartPolicy defines the restart behavior of individual containers in a pod. This field may only be set for init containers, and the only allowed value is "Always". For non-init containers or when this field is not specified, the restart behavior is defined by the Pod's restart policy and the container type. Setting the RestartPolicy as "Always" for the init container will have the following effect: this init container will be continually restarted on exit until all regular containers have terminated. Once all regular containers have completed, all init containers with restartPolicy "Always" will be shut down. This lifecycle differs from normal init containers and is often referred to as a "sidecar" container. Although this init container still starts in the init container sequence, it does not wait for the container to complete before proceeding to the next init container. Instead, the next init container starts immediately after this init container is started, or after any startupProbe has successfully completed.
     * @type {string}
     * @memberof IoK8sApiCoreV1Container
     */
    restartPolicy?: string;
    /**
     * SecurityContext defines the security options the container should be run with. If set, the fields of SecurityContext override the equivalent fields of PodSecurityContext. More info: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/
     * @type {IoK8sApiCoreV1SecurityContext}
     * @memberof IoK8sApiCoreV1Container
     */
    securityContext?: IoK8sApiCoreV1SecurityContext;
    /**
     * StartupProbe indicates that the Pod has successfully initialized. If specified, no other probes are executed until this completes successfully. If this probe fails, the Pod will be restarted, just as if the livenessProbe failed. This can be used to provide different probe parameters at the beginning of a Pod's lifecycle, when it might take a long time to load data or warm a cache, than during steady-state operation. This cannot be updated. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#container-probes
     * @type {IoK8sApiCoreV1Probe}
     * @memberof IoK8sApiCoreV1Container
     */
    startupProbe?: IoK8sApiCoreV1Probe;
    /**
     * Whether this container should allocate a buffer for stdin in the container runtime. If this is not set, reads from stdin in the container will always result in EOF. Default is false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1Container
     */
    stdin?: boolean;
    /**
     * Whether the container runtime should close the stdin channel after it has been opened by a single attach. When stdin is true the stdin stream will remain open across multiple attach sessions. If stdinOnce is set to true, stdin is opened on container start, is empty until the first client attaches to stdin, and then remains open and accepts data until the client disconnects, at which time stdin is closed and remains closed until the container is restarted. If this flag is false, a container processes that reads from stdin will never receive an EOF. Default is false
     * @type {boolean}
     * @memberof IoK8sApiCoreV1Container
     */
    stdinOnce?: boolean;
    /**
     * Optional: Path at which the file to which the container's termination message will be written is mounted into the container's filesystem. Message written is intended to be brief final status, such as an assertion failure message. Will be truncated by the node if greater than 4096 bytes. The total message length across all containers will be limited to 12kb. Defaults to /dev/termination-log. Cannot be updated.
     * @type {string}
     * @memberof IoK8sApiCoreV1Container
     */
    terminationMessagePath?: string;
    /**
     * Indicate how the termination message should be populated. File will use the contents of terminationMessagePath to populate the container status message on both success and failure. FallbackToLogsOnError will use the last chunk of container log output if the termination message file is empty and the container exited with an error. The log output is limited to 2048 bytes or 80 lines, whichever is smaller. Defaults to File. Cannot be updated.
     * @type {string}
     * @memberof IoK8sApiCoreV1Container
     */
    terminationMessagePolicy?: string;
    /**
     * Whether this container should allocate a TTY for itself, also requires 'stdin' to be true. Default is false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1Container
     */
    tty?: boolean;
    /**
     * volumeDevices is the list of block devices to be used by the container.
     * @type {Array<IoK8sApiCoreV1VolumeDevice>}
     * @memberof IoK8sApiCoreV1Container
     */
    volumeDevices?: Array<IoK8sApiCoreV1VolumeDevice>;
    /**
     * Pod volumes to mount into the container's filesystem. Cannot be updated.
     * @type {Array<IoK8sApiCoreV1VolumeMount>}
     * @memberof IoK8sApiCoreV1Container
     */
    volumeMounts?: Array<IoK8sApiCoreV1VolumeMount>;
    /**
     * Container's working directory. If not specified, the container runtime's default will be used, which might be configured in the container image. Cannot be updated.
     * @type {string}
     * @memberof IoK8sApiCoreV1Container
     */
    workingDir?: string;
}
/**
 * Describe a container image
 * @export
 * @interface IoK8sApiCoreV1ContainerImage
 */
export interface IoK8sApiCoreV1ContainerImage {
    /**
     * Names by which this image is known. e.g. ["kubernetes.example/hyperkube:v1.0.7", "cloud-vendor.registry.example/cloud-vendor/hyperkube:v1.0.7"]
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1ContainerImage
     */
    names?: Array<string>;
    /**
     * The size of the image in bytes.
     * @type {number}
     * @memberof IoK8sApiCoreV1ContainerImage
     */
    sizeBytes?: number;
}
/**
 * ContainerPort represents a network port in a single container.
 * @export
 * @interface IoK8sApiCoreV1ContainerPort
 */
export interface IoK8sApiCoreV1ContainerPort {
    /**
     * Number of port to expose on the pod's IP address. This must be a valid port number, 0 < x < 65536.
     * @type {number}
     * @memberof IoK8sApiCoreV1ContainerPort
     */
    containerPort: number;
    /**
     * What host IP to bind the external port to.
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerPort
     */
    hostIP?: string;
    /**
     * Number of port to expose on the host. If specified, this must be a valid port number, 0 < x < 65536. If HostNetwork is specified, this must match ContainerPort. Most containers do not need this.
     * @type {number}
     * @memberof IoK8sApiCoreV1ContainerPort
     */
    hostPort?: number;
    /**
     * If specified, this must be an IANA_SVC_NAME and unique within the pod. Each named port in a pod must have a unique name. Name for the port that can be referred to by services.
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerPort
     */
    name?: string;
    /**
     * Protocol for port. Must be UDP, TCP, or SCTP. Defaults to "TCP".
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerPort
     */
    protocol?: string;
}
/**
 * ContainerResizePolicy represents resource resize policy for the container.
 * @export
 * @interface IoK8sApiCoreV1ContainerResizePolicy
 */
export interface IoK8sApiCoreV1ContainerResizePolicy {
    /**
     * Name of the resource to which this resource resize policy applies. Supported values: cpu, memory.
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerResizePolicy
     */
    resourceName: string;
    /**
     * Restart policy to apply when specified resource is resized. If not specified, it defaults to NotRequired.
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerResizePolicy
     */
    restartPolicy: string;
}
/**
 * ContainerState holds a possible state of container. Only one of its members may be specified. If none of them is specified, the default one is ContainerStateWaiting.
 * @export
 * @interface IoK8sApiCoreV1ContainerState
 */
export interface IoK8sApiCoreV1ContainerState {
    /**
     * Details about a running container
     * @type {IoK8sApiCoreV1ContainerStateRunning}
     * @memberof IoK8sApiCoreV1ContainerState
     */
    running?: IoK8sApiCoreV1ContainerStateRunning;
    /**
     * Details about a terminated container
     * @type {IoK8sApiCoreV1ContainerStateTerminated}
     * @memberof IoK8sApiCoreV1ContainerState
     */
    terminated?: IoK8sApiCoreV1ContainerStateTerminated;
    /**
     * Details about a waiting container
     * @type {IoK8sApiCoreV1ContainerStateWaiting}
     * @memberof IoK8sApiCoreV1ContainerState
     */
    waiting?: IoK8sApiCoreV1ContainerStateWaiting;
}
/**
 * ContainerStateRunning is a running state of a container.
 * @export
 * @interface IoK8sApiCoreV1ContainerStateRunning
 */
export interface IoK8sApiCoreV1ContainerStateRunning {
    /**
     * Time at which the container was last (re-)started
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerStateRunning
     */
    startedAt?: string;
}
/**
 * ContainerStateTerminated is a terminated state of a container.
 * @export
 * @interface IoK8sApiCoreV1ContainerStateTerminated
 */
export interface IoK8sApiCoreV1ContainerStateTerminated {
    /**
     * Container's ID in the format '<type>://<container_id>'
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerStateTerminated
     */
    containerID?: string;
    /**
     * Exit status from the last termination of the container
     * @type {number}
     * @memberof IoK8sApiCoreV1ContainerStateTerminated
     */
    exitCode: number;
    /**
     * Time at which the container last terminated
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerStateTerminated
     */
    finishedAt?: string;
    /**
     * Message regarding the last termination of the container
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerStateTerminated
     */
    message?: string;
    /**
     * (brief) reason from the last termination of the container
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerStateTerminated
     */
    reason?: string;
    /**
     * Signal from the last termination of the container
     * @type {number}
     * @memberof IoK8sApiCoreV1ContainerStateTerminated
     */
    signal?: number;
    /**
     * Time at which previous execution of the container started
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerStateTerminated
     */
    startedAt?: string;
}
/**
 * ContainerStateWaiting is a waiting state of a container.
 * @export
 * @interface IoK8sApiCoreV1ContainerStateWaiting
 */
export interface IoK8sApiCoreV1ContainerStateWaiting {
    /**
     * Message regarding why the container is not yet running.
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerStateWaiting
     */
    message?: string;
    /**
     * (brief) reason the container is not yet running.
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerStateWaiting
     */
    reason?: string;
}
/**
 * ContainerStatus contains details for the current status of this container.
 * @export
 * @interface IoK8sApiCoreV1ContainerStatus
 */
export interface IoK8sApiCoreV1ContainerStatus {
    /**
     * AllocatedResources represents the compute resources allocated for this container by the node. Kubelet sets this value to Container.Resources.Requests upon successful pod admission and after successfully admitting desired pod resize.
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1ContainerStatus
     */
    allocatedResources?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * ContainerID is the ID of the container in the format '<type>://<container_id>'. Where type is a container runtime identifier, returned from Version call of CRI API (for example "containerd").
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerStatus
     */
    containerID?: string;
    /**
     * Image is the name of container image that the container is running. The container image may not match the image used in the PodSpec, as it may have been resolved by the runtime. More info: https://kubernetes.io/docs/concepts/containers/images.
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerStatus
     */
    image: string;
    /**
     * ImageID is the image ID of the container's image. The image ID may not match the image ID of the image used in the PodSpec, as it may have been resolved by the runtime.
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerStatus
     */
    imageID: string;
    /**
     * LastTerminationState holds the last termination state of the container to help debug container crashes and restarts. This field is not populated if the container is still running and RestartCount is 0.
     * @type {IoK8sApiCoreV1ContainerState}
     * @memberof IoK8sApiCoreV1ContainerStatus
     */
    lastState?: IoK8sApiCoreV1ContainerState;
    /**
     * Name is a DNS_LABEL representing the unique name of the container. Each container in a pod must have a unique name across all container types. Cannot be updated.
     * @type {string}
     * @memberof IoK8sApiCoreV1ContainerStatus
     */
    name: string;
    /**
     * Ready specifies whether the container is currently passing its readiness check. The value will change as readiness probes keep executing. If no readiness probes are specified, this field defaults to true once the container is fully started (see Started field).
     * 
     * The value is typically used to determine whether a container is ready to accept traffic.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ContainerStatus
     */
    ready: boolean;
    /**
     * Resources represents the compute resource requests and limits that have been successfully enacted on the running container after it has been started or has been successfully resized.
     * @type {IoK8sApiCoreV1ResourceRequirements}
     * @memberof IoK8sApiCoreV1ContainerStatus
     */
    resources?: IoK8sApiCoreV1ResourceRequirements;
    /**
     * RestartCount holds the number of times the container has been restarted. Kubelet makes an effort to always increment the value, but there are cases when the state may be lost due to node restarts and then the value may be reset to 0. The value is never negative.
     * @type {number}
     * @memberof IoK8sApiCoreV1ContainerStatus
     */
    restartCount: number;
    /**
     * Started indicates whether the container has finished its postStart lifecycle hook and passed its startup probe. Initialized as false, becomes true after startupProbe is considered successful. Resets to false when the container is restarted, or if kubelet loses state temporarily. In both cases, startup probes will run again. Is always true when no startupProbe is defined and container is running and has passed the postStart lifecycle hook. The null value must be treated the same as false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ContainerStatus
     */
    started?: boolean;
    /**
     * State holds details about the container's current condition.
     * @type {IoK8sApiCoreV1ContainerState}
     * @memberof IoK8sApiCoreV1ContainerStatus
     */
    state?: IoK8sApiCoreV1ContainerState;
    /**
     * Status of volume mounts.
     * @type {Array<IoK8sApiCoreV1VolumeMountStatus>}
     * @memberof IoK8sApiCoreV1ContainerStatus
     */
    volumeMounts?: Array<IoK8sApiCoreV1VolumeMountStatus>;
}
/**
 * DaemonEndpoint contains information about a single Daemon endpoint.
 * @export
 * @interface IoK8sApiCoreV1DaemonEndpoint
 */
export interface IoK8sApiCoreV1DaemonEndpoint {
    /**
     * Port number of the given endpoint.
     * @type {number}
     * @memberof IoK8sApiCoreV1DaemonEndpoint
     */
    port: number;
}
/**
 * Represents downward API info for projecting into a projected volume. Note that this is identical to a downwardAPI volume source without the default mode.
 * @export
 * @interface IoK8sApiCoreV1DownwardAPIProjection
 */
export interface IoK8sApiCoreV1DownwardAPIProjection {
    /**
     * Items is a list of DownwardAPIVolume file
     * @type {Array<IoK8sApiCoreV1DownwardAPIVolumeFile>}
     * @memberof IoK8sApiCoreV1DownwardAPIProjection
     */
    items?: Array<IoK8sApiCoreV1DownwardAPIVolumeFile>;
}
/**
 * DownwardAPIVolumeFile represents information to create the file containing the pod field
 * @export
 * @interface IoK8sApiCoreV1DownwardAPIVolumeFile
 */
export interface IoK8sApiCoreV1DownwardAPIVolumeFile {
    /**
     * Required: Selects a field of the pod: only annotations, labels, name, namespace and uid are supported.
     * @type {IoK8sApiCoreV1ObjectFieldSelector}
     * @memberof IoK8sApiCoreV1DownwardAPIVolumeFile
     */
    fieldRef?: IoK8sApiCoreV1ObjectFieldSelector;
    /**
     * Optional: mode bits used to set permissions on this file, must be an octal value between 0000 and 0777 or a decimal value between 0 and 511. YAML accepts both octal and decimal values, JSON requires decimal values for mode bits. If not specified, the volume defaultMode will be used. This might be in conflict with other options that affect the file mode, like fsGroup, and the result can be other mode bits set.
     * @type {number}
     * @memberof IoK8sApiCoreV1DownwardAPIVolumeFile
     */
    mode?: number;
    /**
     * Required: Path is  the relative path name of the file to be created. Must not be absolute or contain the '..' path. Must be utf-8 encoded. The first item of the relative path must not start with '..'
     * @type {string}
     * @memberof IoK8sApiCoreV1DownwardAPIVolumeFile
     */
    path: string;
    /**
     * Selects a resource of the container: only resources limits and requests (limits.cpu, limits.memory, requests.cpu and requests.memory) are currently supported.
     * @type {IoK8sApiCoreV1ResourceFieldSelector}
     * @memberof IoK8sApiCoreV1DownwardAPIVolumeFile
     */
    resourceFieldRef?: IoK8sApiCoreV1ResourceFieldSelector;
}
/**
 * DownwardAPIVolumeSource represents a volume containing downward API info. Downward API volumes support ownership management and SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1DownwardAPIVolumeSource
 */
export interface IoK8sApiCoreV1DownwardAPIVolumeSource {
    /**
     * Optional: mode bits to use on created files by default. Must be a Optional: mode bits used to set permissions on created files by default. Must be an octal value between 0000 and 0777 or a decimal value between 0 and 511. YAML accepts both octal and decimal values, JSON requires decimal values for mode bits. Defaults to 0644. Directories within the path are not affected by this setting. This might be in conflict with other options that affect the file mode, like fsGroup, and the result can be other mode bits set.
     * @type {number}
     * @memberof IoK8sApiCoreV1DownwardAPIVolumeSource
     */
    defaultMode?: number;
    /**
     * Items is a list of downward API volume file
     * @type {Array<IoK8sApiCoreV1DownwardAPIVolumeFile>}
     * @memberof IoK8sApiCoreV1DownwardAPIVolumeSource
     */
    items?: Array<IoK8sApiCoreV1DownwardAPIVolumeFile>;
}
/**
 * Represents an empty directory for a pod. Empty directory volumes support ownership management and SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1EmptyDirVolumeSource
 */
export interface IoK8sApiCoreV1EmptyDirVolumeSource {
    /**
     * medium represents what type of storage medium should back this directory. The default is "" which means to use the node's default medium. Must be an empty string (default) or Memory. More info: https://kubernetes.io/docs/concepts/storage/volumes#emptydir
     * @type {string}
     * @memberof IoK8sApiCoreV1EmptyDirVolumeSource
     */
    medium?: string;
    /**
     * sizeLimit is the total amount of local storage required for this EmptyDir volume. The size limit is also applicable for memory medium. The maximum usage on memory medium EmptyDir would be the minimum value between the SizeLimit specified here and the sum of memory limits of all containers in a pod. The default is nil which means that the limit is undefined. More info: https://kubernetes.io/docs/concepts/storage/volumes#emptydir
     * @type {IoK8sApimachineryPkgApiResourceQuantity}
     * @memberof IoK8sApiCoreV1EmptyDirVolumeSource
     */
    sizeLimit?: IoK8sApimachineryPkgApiResourceQuantity;
}
/**
 * EndpointAddress is a tuple that describes single IP address.
 * @export
 * @interface IoK8sApiCoreV1EndpointAddress
 */
export interface IoK8sApiCoreV1EndpointAddress {
    /**
     * The Hostname of this endpoint
     * @type {string}
     * @memberof IoK8sApiCoreV1EndpointAddress
     */
    hostname?: string;
    /**
     * The IP of this endpoint. May not be loopback (127.0.0.0/8 or ::1), link-local (169.254.0.0/16 or fe80::/10), or link-local multicast (224.0.0.0/24 or ff02::/16).
     * @type {string}
     * @memberof IoK8sApiCoreV1EndpointAddress
     */
    ip: string;
    /**
     * Optional: Node hosting this endpoint. This can be used to determine endpoints local to a node.
     * @type {string}
     * @memberof IoK8sApiCoreV1EndpointAddress
     */
    nodeName?: string;
    /**
     * Reference to object providing the endpoint.
     * @type {IoK8sApiCoreV1ObjectReference}
     * @memberof IoK8sApiCoreV1EndpointAddress
     */
    targetRef?: IoK8sApiCoreV1ObjectReference;
}
/**
 * EndpointPort is a tuple that describes a single port.
 * @export
 * @interface IoK8sApiCoreV1EndpointPort
 */
export interface IoK8sApiCoreV1EndpointPort {
    /**
     * The application protocol for this port. This is used as a hint for implementations to offer richer behavior for protocols that they understand. This field follows standard Kubernetes label syntax. Valid values are either:
     * 
     * * Un-prefixed protocol names - reserved for IANA standard service names (as per RFC-6335 and https://www.iana.org/assignments/service-names).
     * 
     * * Kubernetes-defined prefixed names:
     *   * 'kubernetes.io/h2c' - HTTP/2 prior knowledge over cleartext as described in https://www.rfc-editor.org/rfc/rfc9113.html#name-starting-http-2-with-prior-
     *   * 'kubernetes.io/ws'  - WebSocket over cleartext as described in https://www.rfc-editor.org/rfc/rfc6455
     *   * 'kubernetes.io/wss' - WebSocket over TLS as described in https://www.rfc-editor.org/rfc/rfc6455
     * 
     * * Other protocols should use implementation-defined prefixed names such as mycompany.com/my-custom-protocol.
     * @type {string}
     * @memberof IoK8sApiCoreV1EndpointPort
     */
    appProtocol?: string;
    /**
     * The name of this port.  This must match the 'name' field in the corresponding ServicePort. Must be a DNS_LABEL. Optional only if one port is defined.
     * @type {string}
     * @memberof IoK8sApiCoreV1EndpointPort
     */
    name?: string;
    /**
     * The port number of the endpoint.
     * @type {number}
     * @memberof IoK8sApiCoreV1EndpointPort
     */
    port: number;
    /**
     * The IP protocol for this port. Must be UDP, TCP, or SCTP. Default is TCP.
     * @type {string}
     * @memberof IoK8sApiCoreV1EndpointPort
     */
    protocol?: string;
}
/**
 * EndpointSubset is a group of addresses with a common set of ports. The expanded set of endpoints is the Cartesian product of Addresses x Ports. For example, given:
 * 
 * 	{
 * 	  Addresses: [{"ip": "10.10.1.1"}, {"ip": "10.10.2.2"}],
 * 	  Ports:     [{"name": "a", "port": 8675}, {"name": "b", "port": 309}]
 * 	}
 * 
 * The resulting set of endpoints can be viewed as:
 * 
 * 	a: [ 10.10.1.1:8675, 10.10.2.2:8675 ],
 * 	b: [ 10.10.1.1:309, 10.10.2.2:309 ]
 * @export
 * @interface IoK8sApiCoreV1EndpointSubset
 */
export interface IoK8sApiCoreV1EndpointSubset {
    /**
     * IP addresses which offer the related ports that are marked as ready. These endpoints should be considered safe for load balancers and clients to utilize.
     * @type {Array<IoK8sApiCoreV1EndpointAddress>}
     * @memberof IoK8sApiCoreV1EndpointSubset
     */
    addresses?: Array<IoK8sApiCoreV1EndpointAddress>;
    /**
     * IP addresses which offer the related ports but are not currently marked as ready because they have not yet finished starting, have recently failed a readiness check, or have recently failed a liveness check.
     * @type {Array<IoK8sApiCoreV1EndpointAddress>}
     * @memberof IoK8sApiCoreV1EndpointSubset
     */
    notReadyAddresses?: Array<IoK8sApiCoreV1EndpointAddress>;
    /**
     * Port numbers available on the related IP addresses.
     * @type {Array<IoK8sApiCoreV1EndpointPort>}
     * @memberof IoK8sApiCoreV1EndpointSubset
     */
    ports?: Array<IoK8sApiCoreV1EndpointPort>;
}
/**
 * Endpoints is a collection of endpoints that implement the actual service. Example:
 * 
 * 	 Name: "mysvc",
 * 	 Subsets: [
 * 	   {
 * 	     Addresses: [{"ip": "10.10.1.1"}, {"ip": "10.10.2.2"}],
 * 	     Ports: [{"name": "a", "port": 8675}, {"name": "b", "port": 309}]
 * 	   },
 * 	   {
 * 	     Addresses: [{"ip": "10.10.3.3"}],
 * 	     Ports: [{"name": "a", "port": 93}, {"name": "b", "port": 76}]
 * 	   },
 * 	]
 * @export
 * @interface IoK8sApiCoreV1Endpoints
 */
export interface IoK8sApiCoreV1Endpoints {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1Endpoints
     */
    apiVersion?: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1Endpoints
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1Endpoints
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * The set of all endpoints is the union of all subsets. Addresses are placed into subsets according to the IPs they share. A single address with multiple ports, some of which are ready and some of which are not (because they come from different containers) will result in the address being displayed in different subsets for the different ports. No address will appear in both Addresses and NotReadyAddresses in the same subset. Sets of addresses and ports that comprise a service.
     * @type {Array<IoK8sApiCoreV1EndpointSubset>}
     * @memberof IoK8sApiCoreV1Endpoints
     */
    subsets?: Array<IoK8sApiCoreV1EndpointSubset>;
}
/**
 * EndpointsList is a list of endpoints.
 * @export
 * @interface IoK8sApiCoreV1EndpointsList
 */
export interface IoK8sApiCoreV1EndpointsList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1EndpointsList
     */
    apiVersion?: string;
    /**
     * List of endpoints.
     * @type {Array<IoK8sApiCoreV1Endpoints>}
     * @memberof IoK8sApiCoreV1EndpointsList
     */
    items: Array<IoK8sApiCoreV1Endpoints>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1EndpointsList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1EndpointsList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * EnvFromSource represents the source of a set of ConfigMaps
 * @export
 * @interface IoK8sApiCoreV1EnvFromSource
 */
export interface IoK8sApiCoreV1EnvFromSource {
    /**
     * The ConfigMap to select from
     * @type {IoK8sApiCoreV1ConfigMapEnvSource}
     * @memberof IoK8sApiCoreV1EnvFromSource
     */
    configMapRef?: IoK8sApiCoreV1ConfigMapEnvSource;
    /**
     * An optional identifier to prepend to each key in the ConfigMap. Must be a C_IDENTIFIER.
     * @type {string}
     * @memberof IoK8sApiCoreV1EnvFromSource
     */
    prefix?: string;
    /**
     * The Secret to select from
     * @type {IoK8sApiCoreV1SecretEnvSource}
     * @memberof IoK8sApiCoreV1EnvFromSource
     */
    secretRef?: IoK8sApiCoreV1SecretEnvSource;
}
/**
 * EnvVar represents an environment variable present in a Container.
 * @export
 * @interface IoK8sApiCoreV1EnvVar
 */
export interface IoK8sApiCoreV1EnvVar {
    /**
     * Name of the environment variable. Must be a C_IDENTIFIER.
     * @type {string}
     * @memberof IoK8sApiCoreV1EnvVar
     */
    name: string;
    /**
     * Variable references $(VAR_NAME) are expanded using the previously defined environment variables in the container and any service environment variables. If a variable cannot be resolved, the reference in the input string will be unchanged. Double $$ are reduced to a single $, which allows for escaping the $(VAR_NAME) syntax: i.e. "$$(VAR_NAME)" will produce the string literal "$(VAR_NAME)". Escaped references will never be expanded, regardless of whether the variable exists or not. Defaults to "".
     * @type {string}
     * @memberof IoK8sApiCoreV1EnvVar
     */
    value?: string;
    /**
     * Source for the environment variable's value. Cannot be used if value is not empty.
     * @type {IoK8sApiCoreV1EnvVarSource}
     * @memberof IoK8sApiCoreV1EnvVar
     */
    valueFrom?: IoK8sApiCoreV1EnvVarSource;
}
/**
 * EnvVarSource represents a source for the value of an EnvVar.
 * @export
 * @interface IoK8sApiCoreV1EnvVarSource
 */
export interface IoK8sApiCoreV1EnvVarSource {
    /**
     * Selects a key of a ConfigMap.
     * @type {IoK8sApiCoreV1ConfigMapKeySelector}
     * @memberof IoK8sApiCoreV1EnvVarSource
     */
    configMapKeyRef?: IoK8sApiCoreV1ConfigMapKeySelector;
    /**
     * Selects a field of the pod: supports metadata.name, metadata.namespace, `metadata.labels['<KEY>']`, `metadata.annotations['<KEY>']`, spec.nodeName, spec.serviceAccountName, status.hostIP, status.podIP, status.podIPs.
     * @type {IoK8sApiCoreV1ObjectFieldSelector}
     * @memberof IoK8sApiCoreV1EnvVarSource
     */
    fieldRef?: IoK8sApiCoreV1ObjectFieldSelector;
    /**
     * Selects a resource of the container: only resources limits and requests (limits.cpu, limits.memory, limits.ephemeral-storage, requests.cpu, requests.memory and requests.ephemeral-storage) are currently supported.
     * @type {IoK8sApiCoreV1ResourceFieldSelector}
     * @memberof IoK8sApiCoreV1EnvVarSource
     */
    resourceFieldRef?: IoK8sApiCoreV1ResourceFieldSelector;
    /**
     * Selects a key of a secret in the pod's namespace
     * @type {IoK8sApiCoreV1SecretKeySelector}
     * @memberof IoK8sApiCoreV1EnvVarSource
     */
    secretKeyRef?: IoK8sApiCoreV1SecretKeySelector;
}
/**
 * An EphemeralContainer is a temporary container that you may add to an existing Pod for user-initiated activities such as debugging. Ephemeral containers have no resource or scheduling guarantees, and they will not be restarted when they exit or when a Pod is removed or restarted. The kubelet may evict a Pod if an ephemeral container causes the Pod to exceed its resource allocation.
 * 
 * To add an ephemeral container, use the ephemeralcontainers subresource of an existing Pod. Ephemeral containers may not be removed or restarted.
 * @export
 * @interface IoK8sApiCoreV1EphemeralContainer
 */
export interface IoK8sApiCoreV1EphemeralContainer {
    /**
     * Arguments to the entrypoint. The image's CMD is used if this is not provided. Variable references $(VAR_NAME) are expanded using the container's environment. If a variable cannot be resolved, the reference in the input string will be unchanged. Double $$ are reduced to a single $, which allows for escaping the $(VAR_NAME) syntax: i.e. "$$(VAR_NAME)" will produce the string literal "$(VAR_NAME)". Escaped references will never be expanded, regardless of whether the variable exists or not. Cannot be updated. More info: https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/#running-a-command-in-a-shell
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    args?: Array<string>;
    /**
     * Entrypoint array. Not executed within a shell. The image's ENTRYPOINT is used if this is not provided. Variable references $(VAR_NAME) are expanded using the container's environment. If a variable cannot be resolved, the reference in the input string will be unchanged. Double $$ are reduced to a single $, which allows for escaping the $(VAR_NAME) syntax: i.e. "$$(VAR_NAME)" will produce the string literal "$(VAR_NAME)". Escaped references will never be expanded, regardless of whether the variable exists or not. Cannot be updated. More info: https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/#running-a-command-in-a-shell
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    command?: Array<string>;
    /**
     * List of environment variables to set in the container. Cannot be updated.
     * @type {Array<IoK8sApiCoreV1EnvVar>}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    env?: Array<IoK8sApiCoreV1EnvVar>;
    /**
     * List of sources to populate environment variables in the container. The keys defined within a source must be a C_IDENTIFIER. All invalid keys will be reported as an event when the container is starting. When a key exists in multiple sources, the value associated with the last source will take precedence. Values defined by an Env with a duplicate key will take precedence. Cannot be updated.
     * @type {Array<IoK8sApiCoreV1EnvFromSource>}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    envFrom?: Array<IoK8sApiCoreV1EnvFromSource>;
    /**
     * Container image name. More info: https://kubernetes.io/docs/concepts/containers/images
     * @type {string}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    image?: string;
    /**
     * Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. Cannot be updated. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images
     * @type {string}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    imagePullPolicy?: string;
    /**
     * Lifecycle is not allowed for ephemeral containers.
     * @type {IoK8sApiCoreV1Lifecycle}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    lifecycle?: IoK8sApiCoreV1Lifecycle;
    /**
     * Probes are not allowed for ephemeral containers.
     * @type {IoK8sApiCoreV1Probe}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    livenessProbe?: IoK8sApiCoreV1Probe;
    /**
     * Name of the ephemeral container specified as a DNS_LABEL. This name must be unique among all containers, init containers and ephemeral containers.
     * @type {string}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    name: string;
    /**
     * Ports are not allowed for ephemeral containers.
     * @type {Array<IoK8sApiCoreV1ContainerPort>}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    ports?: Array<IoK8sApiCoreV1ContainerPort>;
    /**
     * Probes are not allowed for ephemeral containers.
     * @type {IoK8sApiCoreV1Probe}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    readinessProbe?: IoK8sApiCoreV1Probe;
    /**
     * Resources resize policy for the container.
     * @type {Array<IoK8sApiCoreV1ContainerResizePolicy>}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    resizePolicy?: Array<IoK8sApiCoreV1ContainerResizePolicy>;
    /**
     * Resources are not allowed for ephemeral containers. Ephemeral containers use spare resources already allocated to the pod.
     * @type {IoK8sApiCoreV1ResourceRequirements}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    resources?: IoK8sApiCoreV1ResourceRequirements;
    /**
     * Restart policy for the container to manage the restart behavior of each container within a pod. This may only be set for init containers. You cannot set this field on ephemeral containers.
     * @type {string}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    restartPolicy?: string;
    /**
     * Optional: SecurityContext defines the security options the ephemeral container should be run with. If set, the fields of SecurityContext override the equivalent fields of PodSecurityContext.
     * @type {IoK8sApiCoreV1SecurityContext}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    securityContext?: IoK8sApiCoreV1SecurityContext;
    /**
     * Probes are not allowed for ephemeral containers.
     * @type {IoK8sApiCoreV1Probe}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    startupProbe?: IoK8sApiCoreV1Probe;
    /**
     * Whether this container should allocate a buffer for stdin in the container runtime. If this is not set, reads from stdin in the container will always result in EOF. Default is false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    stdin?: boolean;
    /**
     * Whether the container runtime should close the stdin channel after it has been opened by a single attach. When stdin is true the stdin stream will remain open across multiple attach sessions. If stdinOnce is set to true, stdin is opened on container start, is empty until the first client attaches to stdin, and then remains open and accepts data until the client disconnects, at which time stdin is closed and remains closed until the container is restarted. If this flag is false, a container processes that reads from stdin will never receive an EOF. Default is false
     * @type {boolean}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    stdinOnce?: boolean;
    /**
     * If set, the name of the container from PodSpec that this ephemeral container targets. The ephemeral container will be run in the namespaces (IPC, PID, etc) of this container. If not set then the ephemeral container uses the namespaces configured in the Pod spec.
     * 
     * The container runtime must implement support for this feature. If the runtime does not support namespace targeting then the result of setting this field is undefined.
     * @type {string}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    targetContainerName?: string;
    /**
     * Optional: Path at which the file to which the container's termination message will be written is mounted into the container's filesystem. Message written is intended to be brief final status, such as an assertion failure message. Will be truncated by the node if greater than 4096 bytes. The total message length across all containers will be limited to 12kb. Defaults to /dev/termination-log. Cannot be updated.
     * @type {string}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    terminationMessagePath?: string;
    /**
     * Indicate how the termination message should be populated. File will use the contents of terminationMessagePath to populate the container status message on both success and failure. FallbackToLogsOnError will use the last chunk of container log output if the termination message file is empty and the container exited with an error. The log output is limited to 2048 bytes or 80 lines, whichever is smaller. Defaults to File. Cannot be updated.
     * @type {string}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    terminationMessagePolicy?: string;
    /**
     * Whether this container should allocate a TTY for itself, also requires 'stdin' to be true. Default is false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    tty?: boolean;
    /**
     * volumeDevices is the list of block devices to be used by the container.
     * @type {Array<IoK8sApiCoreV1VolumeDevice>}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    volumeDevices?: Array<IoK8sApiCoreV1VolumeDevice>;
    /**
     * Pod volumes to mount into the container's filesystem. Subpath mounts are not allowed for ephemeral containers. Cannot be updated.
     * @type {Array<IoK8sApiCoreV1VolumeMount>}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    volumeMounts?: Array<IoK8sApiCoreV1VolumeMount>;
    /**
     * Container's working directory. If not specified, the container runtime's default will be used, which might be configured in the container image. Cannot be updated.
     * @type {string}
     * @memberof IoK8sApiCoreV1EphemeralContainer
     */
    workingDir?: string;
}
/**
 * Represents an ephemeral volume that is handled by a normal storage driver.
 * @export
 * @interface IoK8sApiCoreV1EphemeralVolumeSource
 */
export interface IoK8sApiCoreV1EphemeralVolumeSource {
    /**
     * Will be used to create a stand-alone PVC to provision the volume. The pod in which this EphemeralVolumeSource is embedded will be the owner of the PVC, i.e. the PVC will be deleted together with the pod.  The name of the PVC will be `<pod name>-<volume name>` where `<volume name>` is the name from the `PodSpec.Volumes` array entry. Pod validation will reject the pod if the concatenated name is not valid for a PVC (for example, too long).
     * 
     * An existing PVC with that name that is not owned by the pod will *not* be used for the pod to avoid using an unrelated volume by mistake. Starting the pod is then blocked until the unrelated PVC is removed. If such a pre-created PVC is meant to be used by the pod, the PVC has to updated with an owner reference to the pod once the pod exists. Normally this should not be necessary, but it may be useful when manually reconstructing a broken cluster.
     * 
     * This field is read-only and no changes will be made by Kubernetes to the PVC after it has been created.
     * 
     * Required, must not be nil.
     * @type {IoK8sApiCoreV1PersistentVolumeClaimTemplate}
     * @memberof IoK8sApiCoreV1EphemeralVolumeSource
     */
    volumeClaimTemplate?: IoK8sApiCoreV1PersistentVolumeClaimTemplate;
}
/**
 * Event is a report of an event somewhere in the cluster.  Events have a limited retention time and triggers and messages may evolve with time.  Event consumers should not rely on the timing of an event with a given Reason reflecting a consistent underlying trigger, or the continued existence of events with that Reason.  Events should be treated as informative, best-effort, supplemental data.
 * @export
 * @interface IoK8sApiCoreV1Event
 */
export interface IoK8sApiCoreV1Event {
    /**
     * What action was taken/failed regarding to the Regarding object.
     * @type {string}
     * @memberof IoK8sApiCoreV1Event
     */
    action?: string;
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1Event
     */
    apiVersion?: string;
    /**
     * The number of times this event has occurred.
     * @type {number}
     * @memberof IoK8sApiCoreV1Event
     */
    count?: number;
    /**
     * Time when this Event was first observed.
     * @type {string}
     * @memberof IoK8sApiCoreV1Event
     */
    eventTime?: string;
    /**
     * The time at which the event was first recorded. (Time of server receipt is in TypeMeta.)
     * @type {string}
     * @memberof IoK8sApiCoreV1Event
     */
    firstTimestamp?: string;
    /**
     * The object that this event is about.
     * @type {IoK8sApiCoreV1ObjectReference}
     * @memberof IoK8sApiCoreV1Event
     */
    involvedObject: IoK8sApiCoreV1ObjectReference;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1Event
     */
    kind?: string;
    /**
     * The time at which the most recent occurrence of this event was recorded.
     * @type {string}
     * @memberof IoK8sApiCoreV1Event
     */
    lastTimestamp?: string;
    /**
     * A human-readable description of the status of this operation.
     * @type {string}
     * @memberof IoK8sApiCoreV1Event
     */
    message?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1Event
     */
    metadata: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * This should be a short, machine understandable string that gives the reason for the transition into the object's current status.
     * @type {string}
     * @memberof IoK8sApiCoreV1Event
     */
    reason?: string;
    /**
     * Optional secondary object for more complex actions.
     * @type {IoK8sApiCoreV1ObjectReference}
     * @memberof IoK8sApiCoreV1Event
     */
    related?: IoK8sApiCoreV1ObjectReference;
    /**
     * Name of the controller that emitted this Event, e.g. `kubernetes.io/kubelet`.
     * @type {string}
     * @memberof IoK8sApiCoreV1Event
     */
    reportingComponent?: string;
    /**
     * ID of the controller instance, e.g. `kubelet-xyzf`.
     * @type {string}
     * @memberof IoK8sApiCoreV1Event
     */
    reportingInstance?: string;
    /**
     * Data about the Event series this event represents or nil if it's a singleton Event.
     * @type {IoK8sApiCoreV1EventSeries}
     * @memberof IoK8sApiCoreV1Event
     */
    series?: IoK8sApiCoreV1EventSeries;
    /**
     * The component reporting this event. Should be a short machine understandable string.
     * @type {IoK8sApiCoreV1EventSource}
     * @memberof IoK8sApiCoreV1Event
     */
    source?: IoK8sApiCoreV1EventSource;
    /**
     * Type of this event (Normal, Warning), new types could be added in the future
     * @type {string}
     * @memberof IoK8sApiCoreV1Event
     */
    type?: string;
}
/**
 * EventList is a list of events.
 * @export
 * @interface IoK8sApiCoreV1EventList
 */
export interface IoK8sApiCoreV1EventList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1EventList
     */
    apiVersion?: string;
    /**
     * List of events
     * @type {Array<IoK8sApiCoreV1Event>}
     * @memberof IoK8sApiCoreV1EventList
     */
    items: Array<IoK8sApiCoreV1Event>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1EventList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1EventList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * EventSeries contain information on series of events, i.e. thing that was/is happening continuously for some time.
 * @export
 * @interface IoK8sApiCoreV1EventSeries
 */
export interface IoK8sApiCoreV1EventSeries {
    /**
     * Number of occurrences in this series up to the last heartbeat time
     * @type {number}
     * @memberof IoK8sApiCoreV1EventSeries
     */
    count?: number;
    /**
     * Time of the last occurrence observed
     * @type {string}
     * @memberof IoK8sApiCoreV1EventSeries
     */
    lastObservedTime?: string;
}
/**
 * EventSource contains information for an event.
 * @export
 * @interface IoK8sApiCoreV1EventSource
 */
export interface IoK8sApiCoreV1EventSource {
    /**
     * Component from which the event is generated.
     * @type {string}
     * @memberof IoK8sApiCoreV1EventSource
     */
    component?: string;
    /**
     * Node name on which the event is generated.
     * @type {string}
     * @memberof IoK8sApiCoreV1EventSource
     */
    host?: string;
}
/**
 * ExecAction describes a "run in container" action.
 * @export
 * @interface IoK8sApiCoreV1ExecAction
 */
export interface IoK8sApiCoreV1ExecAction {
    /**
     * Command is the command line to execute inside the container, the working directory for the command  is root ('/') in the container's filesystem. The command is simply exec'd, it is not run inside a shell, so traditional shell instructions ('|', etc) won't work. To use a shell, you need to explicitly call out to that shell. Exit status of 0 is treated as live/healthy and non-zero is unhealthy.
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1ExecAction
     */
    command?: Array<string>;
}
/**
 * Represents a Fibre Channel volume. Fibre Channel volumes can only be mounted as read/write once. Fibre Channel volumes support ownership management and SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1FCVolumeSource
 */
export interface IoK8sApiCoreV1FCVolumeSource {
    /**
     * fsType is the filesystem type to mount. Must be a filesystem type supported by the host operating system. Ex. "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified.
     * @type {string}
     * @memberof IoK8sApiCoreV1FCVolumeSource
     */
    fsType?: string;
    /**
     * lun is Optional: FC target lun number
     * @type {number}
     * @memberof IoK8sApiCoreV1FCVolumeSource
     */
    lun?: number;
    /**
     * readOnly is Optional: Defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1FCVolumeSource
     */
    readOnly?: boolean;
    /**
     * targetWWNs is Optional: FC target worldwide names (WWNs)
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1FCVolumeSource
     */
    targetWWNs?: Array<string>;
    /**
     * wwids Optional: FC volume world wide identifiers (wwids) Either wwids or combination of targetWWNs and lun must be set, but not both simultaneously.
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1FCVolumeSource
     */
    wwids?: Array<string>;
}
/**
 * FlexPersistentVolumeSource represents a generic persistent volume resource that is provisioned/attached using an exec based plugin.
 * @export
 * @interface IoK8sApiCoreV1FlexPersistentVolumeSource
 */
export interface IoK8sApiCoreV1FlexPersistentVolumeSource {
    /**
     * driver is the name of the driver to use for this volume.
     * @type {string}
     * @memberof IoK8sApiCoreV1FlexPersistentVolumeSource
     */
    driver: string;
    /**
     * fsType is the Filesystem type to mount. Must be a filesystem type supported by the host operating system. Ex. "ext4", "xfs", "ntfs". The default filesystem depends on FlexVolume script.
     * @type {string}
     * @memberof IoK8sApiCoreV1FlexPersistentVolumeSource
     */
    fsType?: string;
    /**
     * options is Optional: this field holds extra command options if any.
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApiCoreV1FlexPersistentVolumeSource
     */
    options?: { [key: string]: string; };
    /**
     * readOnly is Optional: defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1FlexPersistentVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretRef is Optional: SecretRef is reference to the secret object containing sensitive information to pass to the plugin scripts. This may be empty if no secret object is specified. If the secret object contains more than one secret, all secrets are passed to the plugin scripts.
     * @type {IoK8sApiCoreV1SecretReference}
     * @memberof IoK8sApiCoreV1FlexPersistentVolumeSource
     */
    secretRef?: IoK8sApiCoreV1SecretReference;
}
/**
 * FlexVolume represents a generic volume resource that is provisioned/attached using an exec based plugin.
 * @export
 * @interface IoK8sApiCoreV1FlexVolumeSource
 */
export interface IoK8sApiCoreV1FlexVolumeSource {
    /**
     * driver is the name of the driver to use for this volume.
     * @type {string}
     * @memberof IoK8sApiCoreV1FlexVolumeSource
     */
    driver: string;
    /**
     * fsType is the filesystem type to mount. Must be a filesystem type supported by the host operating system. Ex. "ext4", "xfs", "ntfs". The default filesystem depends on FlexVolume script.
     * @type {string}
     * @memberof IoK8sApiCoreV1FlexVolumeSource
     */
    fsType?: string;
    /**
     * options is Optional: this field holds extra command options if any.
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApiCoreV1FlexVolumeSource
     */
    options?: { [key: string]: string; };
    /**
     * readOnly is Optional: defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1FlexVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretRef is Optional: secretRef is reference to the secret object containing sensitive information to pass to the plugin scripts. This may be empty if no secret object is specified. If the secret object contains more than one secret, all secrets are passed to the plugin scripts.
     * @type {IoK8sApiCoreV1LocalObjectReference}
     * @memberof IoK8sApiCoreV1FlexVolumeSource
     */
    secretRef?: IoK8sApiCoreV1LocalObjectReference;
}
/**
 * Represents a Flocker volume mounted by the Flocker agent. One and only one of datasetName and datasetUUID should be set. Flocker volumes do not support ownership management or SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1FlockerVolumeSource
 */
export interface IoK8sApiCoreV1FlockerVolumeSource {
    /**
     * datasetName is Name of the dataset stored as metadata -> name on the dataset for Flocker should be considered as deprecated
     * @type {string}
     * @memberof IoK8sApiCoreV1FlockerVolumeSource
     */
    datasetName?: string;
    /**
     * datasetUUID is the UUID of the dataset. This is unique identifier of a Flocker dataset
     * @type {string}
     * @memberof IoK8sApiCoreV1FlockerVolumeSource
     */
    datasetUUID?: string;
}
/**
 * Represents a Persistent Disk resource in Google Compute Engine.
 * 
 * A GCE PD must exist before mounting to a container. The disk must also be in the same GCE project and zone as the kubelet. A GCE PD can only be mounted as read/write once or read-only many times. GCE PDs support ownership management and SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1GCEPersistentDiskVolumeSource
 */
export interface IoK8sApiCoreV1GCEPersistentDiskVolumeSource {
    /**
     * fsType is filesystem type of the volume that you want to mount. Tip: Ensure that the filesystem type is supported by the host operating system. Examples: "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified. More info: https://kubernetes.io/docs/concepts/storage/volumes#gcepersistentdisk
     * @type {string}
     * @memberof IoK8sApiCoreV1GCEPersistentDiskVolumeSource
     */
    fsType?: string;
    /**
     * partition is the partition in the volume that you want to mount. If omitted, the default is to mount by volume name. Examples: For volume /dev/sda1, you specify the partition as "1". Similarly, the volume partition for /dev/sda is "0" (or you can leave the property empty). More info: https://kubernetes.io/docs/concepts/storage/volumes#gcepersistentdisk
     * @type {number}
     * @memberof IoK8sApiCoreV1GCEPersistentDiskVolumeSource
     */
    partition?: number;
    /**
     * pdName is unique name of the PD resource in GCE. Used to identify the disk in GCE. More info: https://kubernetes.io/docs/concepts/storage/volumes#gcepersistentdisk
     * @type {string}
     * @memberof IoK8sApiCoreV1GCEPersistentDiskVolumeSource
     */
    pdName: string;
    /**
     * readOnly here will force the ReadOnly setting in VolumeMounts. Defaults to false. More info: https://kubernetes.io/docs/concepts/storage/volumes#gcepersistentdisk
     * @type {boolean}
     * @memberof IoK8sApiCoreV1GCEPersistentDiskVolumeSource
     */
    readOnly?: boolean;
}
/**
 * 
 * @export
 * @interface IoK8sApiCoreV1GRPCAction
 */
export interface IoK8sApiCoreV1GRPCAction {
    /**
     * Port number of the gRPC service. Number must be in the range 1 to 65535.
     * @type {number}
     * @memberof IoK8sApiCoreV1GRPCAction
     */
    port: number;
    /**
     * Service is the name of the service to place in the gRPC HealthCheckRequest (see https://github.com/grpc/grpc/blob/master/doc/health-checking.md).
     * 
     * If this is not specified, the default behavior is defined by gRPC.
     * @type {string}
     * @memberof IoK8sApiCoreV1GRPCAction
     */
    service?: string;
}
/**
 * Represents a volume that is populated with the contents of a git repository. Git repo volumes do not support ownership management. Git repo volumes support SELinux relabeling.
 * 
 * DEPRECATED: GitRepo is deprecated. To provision a container with a git repo, mount an EmptyDir into an InitContainer that clones the repo using git, then mount the EmptyDir into the Pod's container.
 * @export
 * @interface IoK8sApiCoreV1GitRepoVolumeSource
 */
export interface IoK8sApiCoreV1GitRepoVolumeSource {
    /**
     * directory is the target directory name. Must not contain or start with '..'.  If '.' is supplied, the volume directory will be the git repository.  Otherwise, if specified, the volume will contain the git repository in the subdirectory with the given name.
     * @type {string}
     * @memberof IoK8sApiCoreV1GitRepoVolumeSource
     */
    directory?: string;
    /**
     * repository is the URL
     * @type {string}
     * @memberof IoK8sApiCoreV1GitRepoVolumeSource
     */
    repository: string;
    /**
     * revision is the commit hash for the specified revision.
     * @type {string}
     * @memberof IoK8sApiCoreV1GitRepoVolumeSource
     */
    revision?: string;
}
/**
 * Represents a Glusterfs mount that lasts the lifetime of a pod. Glusterfs volumes do not support ownership management or SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1GlusterfsPersistentVolumeSource
 */
export interface IoK8sApiCoreV1GlusterfsPersistentVolumeSource {
    /**
     * endpoints is the endpoint name that details Glusterfs topology. More info: https://examples.k8s.io/volumes/glusterfs/README.md#create-a-pod
     * @type {string}
     * @memberof IoK8sApiCoreV1GlusterfsPersistentVolumeSource
     */
    endpoints: string;
    /**
     * endpointsNamespace is the namespace that contains Glusterfs endpoint. If this field is empty, the EndpointNamespace defaults to the same namespace as the bound PVC. More info: https://examples.k8s.io/volumes/glusterfs/README.md#create-a-pod
     * @type {string}
     * @memberof IoK8sApiCoreV1GlusterfsPersistentVolumeSource
     */
    endpointsNamespace?: string;
    /**
     * path is the Glusterfs volume path. More info: https://examples.k8s.io/volumes/glusterfs/README.md#create-a-pod
     * @type {string}
     * @memberof IoK8sApiCoreV1GlusterfsPersistentVolumeSource
     */
    path: string;
    /**
     * readOnly here will force the Glusterfs volume to be mounted with read-only permissions. Defaults to false. More info: https://examples.k8s.io/volumes/glusterfs/README.md#create-a-pod
     * @type {boolean}
     * @memberof IoK8sApiCoreV1GlusterfsPersistentVolumeSource
     */
    readOnly?: boolean;
}
/**
 * Represents a Glusterfs mount that lasts the lifetime of a pod. Glusterfs volumes do not support ownership management or SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1GlusterfsVolumeSource
 */
export interface IoK8sApiCoreV1GlusterfsVolumeSource {
    /**
     * endpoints is the endpoint name that details Glusterfs topology. More info: https://examples.k8s.io/volumes/glusterfs/README.md#create-a-pod
     * @type {string}
     * @memberof IoK8sApiCoreV1GlusterfsVolumeSource
     */
    endpoints: string;
    /**
     * path is the Glusterfs volume path. More info: https://examples.k8s.io/volumes/glusterfs/README.md#create-a-pod
     * @type {string}
     * @memberof IoK8sApiCoreV1GlusterfsVolumeSource
     */
    path: string;
    /**
     * readOnly here will force the Glusterfs volume to be mounted with read-only permissions. Defaults to false. More info: https://examples.k8s.io/volumes/glusterfs/README.md#create-a-pod
     * @type {boolean}
     * @memberof IoK8sApiCoreV1GlusterfsVolumeSource
     */
    readOnly?: boolean;
}
/**
 * HTTPGetAction describes an action based on HTTP Get requests.
 * @export
 * @interface IoK8sApiCoreV1HTTPGetAction
 */
export interface IoK8sApiCoreV1HTTPGetAction {
    /**
     * Host name to connect to, defaults to the pod IP. You probably want to set "Host" in httpHeaders instead.
     * @type {string}
     * @memberof IoK8sApiCoreV1HTTPGetAction
     */
    host?: string;
    /**
     * Custom headers to set in the request. HTTP allows repeated headers.
     * @type {Array<IoK8sApiCoreV1HTTPHeader>}
     * @memberof IoK8sApiCoreV1HTTPGetAction
     */
    httpHeaders?: Array<IoK8sApiCoreV1HTTPHeader>;
    /**
     * Path to access on the HTTP server.
     * @type {string}
     * @memberof IoK8sApiCoreV1HTTPGetAction
     */
    path?: string;
    /**
     * Name or number of the port to access on the container. Number must be in the range 1 to 65535. Name must be an IANA_SVC_NAME.
     * @type {IoK8sApimachineryPkgUtilIntstrIntOrString}
     * @memberof IoK8sApiCoreV1HTTPGetAction
     */
    port: IoK8sApimachineryPkgUtilIntstrIntOrString;
    /**
     * Scheme to use for connecting to the host. Defaults to HTTP.
     * @type {string}
     * @memberof IoK8sApiCoreV1HTTPGetAction
     */
    scheme?: string;
}
/**
 * HTTPHeader describes a custom header to be used in HTTP probes
 * @export
 * @interface IoK8sApiCoreV1HTTPHeader
 */
export interface IoK8sApiCoreV1HTTPHeader {
    /**
     * The header field name. This will be canonicalized upon output, so case-variant names will be understood as the same header.
     * @type {string}
     * @memberof IoK8sApiCoreV1HTTPHeader
     */
    name: string;
    /**
     * The header field value
     * @type {string}
     * @memberof IoK8sApiCoreV1HTTPHeader
     */
    value: string;
}
/**
 * HostAlias holds the mapping between IP and hostnames that will be injected as an entry in the pod's hosts file.
 * @export
 * @interface IoK8sApiCoreV1HostAlias
 */
export interface IoK8sApiCoreV1HostAlias {
    /**
     * Hostnames for the above IP address.
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1HostAlias
     */
    hostnames?: Array<string>;
    /**
     * IP address of the host file entry.
     * @type {string}
     * @memberof IoK8sApiCoreV1HostAlias
     */
    ip: string;
}
/**
 * HostIP represents a single IP address allocated to the host.
 * @export
 * @interface IoK8sApiCoreV1HostIP
 */
export interface IoK8sApiCoreV1HostIP {
    /**
     * IP is the IP address assigned to the host
     * @type {string}
     * @memberof IoK8sApiCoreV1HostIP
     */
    ip: string;
}
/**
 * Represents a host path mapped into a pod. Host path volumes do not support ownership management or SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1HostPathVolumeSource
 */
export interface IoK8sApiCoreV1HostPathVolumeSource {
    /**
     * path of the directory on the host. If the path is a symlink, it will follow the link to the real path. More info: https://kubernetes.io/docs/concepts/storage/volumes#hostpath
     * @type {string}
     * @memberof IoK8sApiCoreV1HostPathVolumeSource
     */
    path: string;
    /**
     * type for HostPath Volume Defaults to "" More info: https://kubernetes.io/docs/concepts/storage/volumes#hostpath
     * @type {string}
     * @memberof IoK8sApiCoreV1HostPathVolumeSource
     */
    type?: string;
}
/**
 * ISCSIPersistentVolumeSource represents an ISCSI disk. ISCSI volumes can only be mounted as read/write once. ISCSI volumes support ownership management and SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1ISCSIPersistentVolumeSource
 */
export interface IoK8sApiCoreV1ISCSIPersistentVolumeSource {
    /**
     * chapAuthDiscovery defines whether support iSCSI Discovery CHAP authentication
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ISCSIPersistentVolumeSource
     */
    chapAuthDiscovery?: boolean;
    /**
     * chapAuthSession defines whether support iSCSI Session CHAP authentication
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ISCSIPersistentVolumeSource
     */
    chapAuthSession?: boolean;
    /**
     * fsType is the filesystem type of the volume that you want to mount. Tip: Ensure that the filesystem type is supported by the host operating system. Examples: "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified. More info: https://kubernetes.io/docs/concepts/storage/volumes#iscsi
     * @type {string}
     * @memberof IoK8sApiCoreV1ISCSIPersistentVolumeSource
     */
    fsType?: string;
    /**
     * initiatorName is the custom iSCSI Initiator Name. If initiatorName is specified with iscsiInterface simultaneously, new iSCSI interface <target portal>:<volume name> will be created for the connection.
     * @type {string}
     * @memberof IoK8sApiCoreV1ISCSIPersistentVolumeSource
     */
    initiatorName?: string;
    /**
     * iqn is Target iSCSI Qualified Name.
     * @type {string}
     * @memberof IoK8sApiCoreV1ISCSIPersistentVolumeSource
     */
    iqn: string;
    /**
     * iscsiInterface is the interface Name that uses an iSCSI transport. Defaults to 'default' (tcp).
     * @type {string}
     * @memberof IoK8sApiCoreV1ISCSIPersistentVolumeSource
     */
    iscsiInterface?: string;
    /**
     * lun is iSCSI Target Lun number.
     * @type {number}
     * @memberof IoK8sApiCoreV1ISCSIPersistentVolumeSource
     */
    lun: number;
    /**
     * portals is the iSCSI Target Portal List. The Portal is either an IP or ip_addr:port if the port is other than default (typically TCP ports 860 and 3260).
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1ISCSIPersistentVolumeSource
     */
    portals?: Array<string>;
    /**
     * readOnly here will force the ReadOnly setting in VolumeMounts. Defaults to false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ISCSIPersistentVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretRef is the CHAP Secret for iSCSI target and initiator authentication
     * @type {IoK8sApiCoreV1SecretReference}
     * @memberof IoK8sApiCoreV1ISCSIPersistentVolumeSource
     */
    secretRef?: IoK8sApiCoreV1SecretReference;
    /**
     * targetPortal is iSCSI Target Portal. The Portal is either an IP or ip_addr:port if the port is other than default (typically TCP ports 860 and 3260).
     * @type {string}
     * @memberof IoK8sApiCoreV1ISCSIPersistentVolumeSource
     */
    targetPortal: string;
}
/**
 * Represents an ISCSI disk. ISCSI volumes can only be mounted as read/write once. ISCSI volumes support ownership management and SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1ISCSIVolumeSource
 */
export interface IoK8sApiCoreV1ISCSIVolumeSource {
    /**
     * chapAuthDiscovery defines whether support iSCSI Discovery CHAP authentication
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ISCSIVolumeSource
     */
    chapAuthDiscovery?: boolean;
    /**
     * chapAuthSession defines whether support iSCSI Session CHAP authentication
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ISCSIVolumeSource
     */
    chapAuthSession?: boolean;
    /**
     * fsType is the filesystem type of the volume that you want to mount. Tip: Ensure that the filesystem type is supported by the host operating system. Examples: "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified. More info: https://kubernetes.io/docs/concepts/storage/volumes#iscsi
     * @type {string}
     * @memberof IoK8sApiCoreV1ISCSIVolumeSource
     */
    fsType?: string;
    /**
     * initiatorName is the custom iSCSI Initiator Name. If initiatorName is specified with iscsiInterface simultaneously, new iSCSI interface <target portal>:<volume name> will be created for the connection.
     * @type {string}
     * @memberof IoK8sApiCoreV1ISCSIVolumeSource
     */
    initiatorName?: string;
    /**
     * iqn is the target iSCSI Qualified Name.
     * @type {string}
     * @memberof IoK8sApiCoreV1ISCSIVolumeSource
     */
    iqn: string;
    /**
     * iscsiInterface is the interface Name that uses an iSCSI transport. Defaults to 'default' (tcp).
     * @type {string}
     * @memberof IoK8sApiCoreV1ISCSIVolumeSource
     */
    iscsiInterface?: string;
    /**
     * lun represents iSCSI Target Lun number.
     * @type {number}
     * @memberof IoK8sApiCoreV1ISCSIVolumeSource
     */
    lun: number;
    /**
     * portals is the iSCSI Target Portal List. The portal is either an IP or ip_addr:port if the port is other than default (typically TCP ports 860 and 3260).
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1ISCSIVolumeSource
     */
    portals?: Array<string>;
    /**
     * readOnly here will force the ReadOnly setting in VolumeMounts. Defaults to false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ISCSIVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretRef is the CHAP Secret for iSCSI target and initiator authentication
     * @type {IoK8sApiCoreV1LocalObjectReference}
     * @memberof IoK8sApiCoreV1ISCSIVolumeSource
     */
    secretRef?: IoK8sApiCoreV1LocalObjectReference;
    /**
     * targetPortal is iSCSI Target Portal. The Portal is either an IP or ip_addr:port if the port is other than default (typically TCP ports 860 and 3260).
     * @type {string}
     * @memberof IoK8sApiCoreV1ISCSIVolumeSource
     */
    targetPortal: string;
}
/**
 * Maps a string key to a path within a volume.
 * @export
 * @interface IoK8sApiCoreV1KeyToPath
 */
export interface IoK8sApiCoreV1KeyToPath {
    /**
     * key is the key to project.
     * @type {string}
     * @memberof IoK8sApiCoreV1KeyToPath
     */
    key: string;
    /**
     * mode is Optional: mode bits used to set permissions on this file. Must be an octal value between 0000 and 0777 or a decimal value between 0 and 511. YAML accepts both octal and decimal values, JSON requires decimal values for mode bits. If not specified, the volume defaultMode will be used. This might be in conflict with other options that affect the file mode, like fsGroup, and the result can be other mode bits set.
     * @type {number}
     * @memberof IoK8sApiCoreV1KeyToPath
     */
    mode?: number;
    /**
     * path is the relative path of the file to map the key to. May not be an absolute path. May not contain the path element '..'. May not start with the string '..'.
     * @type {string}
     * @memberof IoK8sApiCoreV1KeyToPath
     */
    path: string;
}
/**
 * Lifecycle describes actions that the management system should take in response to container lifecycle events. For the PostStart and PreStop lifecycle handlers, management of the container blocks until the action is complete, unless the container process fails, in which case the handler is aborted.
 * @export
 * @interface IoK8sApiCoreV1Lifecycle
 */
export interface IoK8sApiCoreV1Lifecycle {
    /**
     * PostStart is called immediately after a container is created. If the handler fails, the container is terminated and restarted according to its restart policy. Other management of the container blocks until the hook completes. More info: https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/#container-hooks
     * @type {IoK8sApiCoreV1LifecycleHandler}
     * @memberof IoK8sApiCoreV1Lifecycle
     */
    postStart?: IoK8sApiCoreV1LifecycleHandler;
    /**
     * PreStop is called immediately before a container is terminated due to an API request or management event such as liveness/startup probe failure, preemption, resource contention, etc. The handler is not called if the container crashes or exits. The Pod's termination grace period countdown begins before the PreStop hook is executed. Regardless of the outcome of the handler, the container will eventually terminate within the Pod's termination grace period (unless delayed by finalizers). Other management of the container blocks until the hook completes or until the termination grace period is reached. More info: https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/#container-hooks
     * @type {IoK8sApiCoreV1LifecycleHandler}
     * @memberof IoK8sApiCoreV1Lifecycle
     */
    preStop?: IoK8sApiCoreV1LifecycleHandler;
}
/**
 * LifecycleHandler defines a specific action that should be taken in a lifecycle hook. One and only one of the fields, except TCPSocket must be specified.
 * @export
 * @interface IoK8sApiCoreV1LifecycleHandler
 */
export interface IoK8sApiCoreV1LifecycleHandler {
    /**
     * Exec specifies the action to take.
     * @type {IoK8sApiCoreV1ExecAction}
     * @memberof IoK8sApiCoreV1LifecycleHandler
     */
    exec?: IoK8sApiCoreV1ExecAction;
    /**
     * HTTPGet specifies the http request to perform.
     * @type {IoK8sApiCoreV1HTTPGetAction}
     * @memberof IoK8sApiCoreV1LifecycleHandler
     */
    httpGet?: IoK8sApiCoreV1HTTPGetAction;
    /**
     * Sleep represents the duration that the container should sleep before being terminated.
     * @type {IoK8sApiCoreV1SleepAction}
     * @memberof IoK8sApiCoreV1LifecycleHandler
     */
    sleep?: IoK8sApiCoreV1SleepAction;
    /**
     * Deprecated. TCPSocket is NOT supported as a LifecycleHandler and kept for the backward compatibility. There are no validation of this field and lifecycle hooks will fail in runtime when tcp handler is specified.
     * @type {IoK8sApiCoreV1TCPSocketAction}
     * @memberof IoK8sApiCoreV1LifecycleHandler
     */
    tcpSocket?: IoK8sApiCoreV1TCPSocketAction;
}
/**
 * LimitRange sets resource usage limits for each kind of resource in a Namespace.
 * @export
 * @interface IoK8sApiCoreV1LimitRange
 */
export interface IoK8sApiCoreV1LimitRange {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1LimitRange
     */
    apiVersion?: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1LimitRange
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1LimitRange
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * Spec defines the limits enforced. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1LimitRangeSpec}
     * @memberof IoK8sApiCoreV1LimitRange
     */
    spec?: IoK8sApiCoreV1LimitRangeSpec;
}
/**
 * LimitRangeItem defines a min/max usage limit for any resource that matches on kind.
 * @export
 * @interface IoK8sApiCoreV1LimitRangeItem
 */
export interface IoK8sApiCoreV1LimitRangeItem {
    /**
     * Default resource requirement limit value by resource name if resource limit is omitted.
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1LimitRangeItem
     */
    _default?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * DefaultRequest is the default resource requirement request value by resource name if resource request is omitted.
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1LimitRangeItem
     */
    defaultRequest?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * Max usage constraints on this kind by resource name.
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1LimitRangeItem
     */
    max?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * MaxLimitRequestRatio if specified, the named resource must have a request and limit that are both non-zero where limit divided by request is less than or equal to the enumerated value; this represents the max burst for the named resource.
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1LimitRangeItem
     */
    maxLimitRequestRatio?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * Min usage constraints on this kind by resource name.
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1LimitRangeItem
     */
    min?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * Type of resource that this limit applies to.
     * @type {string}
     * @memberof IoK8sApiCoreV1LimitRangeItem
     */
    type: string;
}
/**
 * LimitRangeList is a list of LimitRange items.
 * @export
 * @interface IoK8sApiCoreV1LimitRangeList
 */
export interface IoK8sApiCoreV1LimitRangeList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1LimitRangeList
     */
    apiVersion?: string;
    /**
     * Items is a list of LimitRange objects. More info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
     * @type {Array<IoK8sApiCoreV1LimitRange>}
     * @memberof IoK8sApiCoreV1LimitRangeList
     */
    items: Array<IoK8sApiCoreV1LimitRange>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1LimitRangeList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1LimitRangeList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * LimitRangeSpec defines a min/max usage limit for resources that match on kind.
 * @export
 * @interface IoK8sApiCoreV1LimitRangeSpec
 */
export interface IoK8sApiCoreV1LimitRangeSpec {
    /**
     * Limits is the list of LimitRangeItem objects that are enforced.
     * @type {Array<IoK8sApiCoreV1LimitRangeItem>}
     * @memberof IoK8sApiCoreV1LimitRangeSpec
     */
    limits: Array<IoK8sApiCoreV1LimitRangeItem>;
}
/**
 * LoadBalancerIngress represents the status of a load-balancer ingress point: traffic intended for the service should be sent to an ingress point.
 * @export
 * @interface IoK8sApiCoreV1LoadBalancerIngress
 */
export interface IoK8sApiCoreV1LoadBalancerIngress {
    /**
     * Hostname is set for load-balancer ingress points that are DNS based (typically AWS load-balancers)
     * @type {string}
     * @memberof IoK8sApiCoreV1LoadBalancerIngress
     */
    hostname?: string;
    /**
     * IP is set for load-balancer ingress points that are IP based (typically GCE or OpenStack load-balancers)
     * @type {string}
     * @memberof IoK8sApiCoreV1LoadBalancerIngress
     */
    ip?: string;
    /**
     * IPMode specifies how the load-balancer IP behaves, and may only be specified when the ip field is specified. Setting this to "VIP" indicates that traffic is delivered to the node with the destination set to the load-balancer's IP and port. Setting this to "Proxy" indicates that traffic is delivered to the node or pod with the destination set to the node's IP and node port or the pod's IP and port. Service implementations may use this information to adjust traffic routing.
     * @type {string}
     * @memberof IoK8sApiCoreV1LoadBalancerIngress
     */
    ipMode?: string;
    /**
     * Ports is a list of records of service ports If used, every port defined in the service should have an entry in it
     * @type {Array<IoK8sApiCoreV1PortStatus>}
     * @memberof IoK8sApiCoreV1LoadBalancerIngress
     */
    ports?: Array<IoK8sApiCoreV1PortStatus>;
}
/**
 * LoadBalancerStatus represents the status of a load-balancer.
 * @export
 * @interface IoK8sApiCoreV1LoadBalancerStatus
 */
export interface IoK8sApiCoreV1LoadBalancerStatus {
    /**
     * Ingress is a list containing ingress points for the load-balancer. Traffic intended for the service should be sent to these ingress points.
     * @type {Array<IoK8sApiCoreV1LoadBalancerIngress>}
     * @memberof IoK8sApiCoreV1LoadBalancerStatus
     */
    ingress?: Array<IoK8sApiCoreV1LoadBalancerIngress>;
}
/**
 * LocalObjectReference contains enough information to let you locate the referenced object inside the same namespace.
 * @export
 * @interface IoK8sApiCoreV1LocalObjectReference
 */
export interface IoK8sApiCoreV1LocalObjectReference {
    /**
     * Name of the referent. This field is effectively required, but due to backwards compatibility is allowed to be empty. Instances of this type with an empty value here are almost certainly wrong. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
     * @type {string}
     * @memberof IoK8sApiCoreV1LocalObjectReference
     */
    name?: string;
}
/**
 * Local represents directly-attached storage with node affinity (Beta feature)
 * @export
 * @interface IoK8sApiCoreV1LocalVolumeSource
 */
export interface IoK8sApiCoreV1LocalVolumeSource {
    /**
     * fsType is the filesystem type to mount. It applies only when the Path is a block device. Must be a filesystem type supported by the host operating system. Ex. "ext4", "xfs", "ntfs". The default value is to auto-select a filesystem if unspecified.
     * @type {string}
     * @memberof IoK8sApiCoreV1LocalVolumeSource
     */
    fsType?: string;
    /**
     * path of the full path to the volume on the node. It can be either a directory or block device (disk, partition, ...).
     * @type {string}
     * @memberof IoK8sApiCoreV1LocalVolumeSource
     */
    path: string;
}
/**
 * ModifyVolumeStatus represents the status object of ControllerModifyVolume operation
 * @export
 * @interface IoK8sApiCoreV1ModifyVolumeStatus
 */
export interface IoK8sApiCoreV1ModifyVolumeStatus {
    /**
     * status is the status of the ControllerModifyVolume operation. It can be in any of following states:
     *  - Pending
     *    Pending indicates that the PersistentVolumeClaim cannot be modified due to unmet requirements, such as
     *    the specified VolumeAttributesClass not existing.
     *  - InProgress
     *    InProgress indicates that the volume is being modified.
     *  - Infeasible
     *   Infeasible indicates that the request has been rejected as invalid by the CSI driver. To
     * 	  resolve the error, a valid VolumeAttributesClass needs to be specified.
     * Note: New statuses can be added in the future. Consumers should check for unknown statuses and fail appropriately.
     * @type {string}
     * @memberof IoK8sApiCoreV1ModifyVolumeStatus
     */
    status: string;
    /**
     * targetVolumeAttributesClassName is the name of the VolumeAttributesClass the PVC currently being reconciled
     * @type {string}
     * @memberof IoK8sApiCoreV1ModifyVolumeStatus
     */
    targetVolumeAttributesClassName?: string;
}
/**
 * Represents an NFS mount that lasts the lifetime of a pod. NFS volumes do not support ownership management or SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1NFSVolumeSource
 */
export interface IoK8sApiCoreV1NFSVolumeSource {
    /**
     * path that is exported by the NFS server. More info: https://kubernetes.io/docs/concepts/storage/volumes#nfs
     * @type {string}
     * @memberof IoK8sApiCoreV1NFSVolumeSource
     */
    path: string;
    /**
     * readOnly here will force the NFS export to be mounted with read-only permissions. Defaults to false. More info: https://kubernetes.io/docs/concepts/storage/volumes#nfs
     * @type {boolean}
     * @memberof IoK8sApiCoreV1NFSVolumeSource
     */
    readOnly?: boolean;
    /**
     * server is the hostname or IP address of the NFS server. More info: https://kubernetes.io/docs/concepts/storage/volumes#nfs
     * @type {string}
     * @memberof IoK8sApiCoreV1NFSVolumeSource
     */
    server: string;
}
/**
 * Namespace provides a scope for Names. Use of multiple namespaces is optional.
 * @export
 * @interface IoK8sApiCoreV1Namespace
 */
export interface IoK8sApiCoreV1Namespace {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1Namespace
     */
    apiVersion?: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1Namespace
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1Namespace
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * Spec defines the behavior of the Namespace. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1NamespaceSpec}
     * @memberof IoK8sApiCoreV1Namespace
     */
    spec?: IoK8sApiCoreV1NamespaceSpec;
    /**
     * Status describes the current status of a Namespace. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1NamespaceStatus}
     * @memberof IoK8sApiCoreV1Namespace
     */
    status?: IoK8sApiCoreV1NamespaceStatus;
}
/**
 * NamespaceCondition contains details about state of namespace.
 * @export
 * @interface IoK8sApiCoreV1NamespaceCondition
 */
export interface IoK8sApiCoreV1NamespaceCondition {
    /**
     * Time is a wrapper around time.Time which supports correct marshaling to YAML and JSON.  Wrappers are provided for many of the factory methods that the time package offers.
     * @type {string}
     * @memberof IoK8sApiCoreV1NamespaceCondition
     */
    lastTransitionTime?: string;
    /**
     * 
     * @type {string}
     * @memberof IoK8sApiCoreV1NamespaceCondition
     */
    message?: string;
    /**
     * 
     * @type {string}
     * @memberof IoK8sApiCoreV1NamespaceCondition
     */
    reason?: string;
    /**
     * Status of the condition, one of True, False, Unknown.
     * @type {string}
     * @memberof IoK8sApiCoreV1NamespaceCondition
     */
    status: string;
    /**
     * Type of namespace controller condition.
     * @type {string}
     * @memberof IoK8sApiCoreV1NamespaceCondition
     */
    type: string;
}
/**
 * NamespaceList is a list of Namespaces.
 * @export
 * @interface IoK8sApiCoreV1NamespaceList
 */
export interface IoK8sApiCoreV1NamespaceList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1NamespaceList
     */
    apiVersion?: string;
    /**
     * Items is the list of Namespace objects in the list. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/
     * @type {Array<IoK8sApiCoreV1Namespace>}
     * @memberof IoK8sApiCoreV1NamespaceList
     */
    items: Array<IoK8sApiCoreV1Namespace>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1NamespaceList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1NamespaceList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * NamespaceSpec describes the attributes on a Namespace.
 * @export
 * @interface IoK8sApiCoreV1NamespaceSpec
 */
export interface IoK8sApiCoreV1NamespaceSpec {
    /**
     * Finalizers is an opaque list of values that must be empty to permanently remove object from storage. More info: https://kubernetes.io/docs/tasks/administer-cluster/namespaces/
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1NamespaceSpec
     */
    finalizers?: Array<string>;
}
/**
 * NamespaceStatus is information about the current status of a Namespace.
 * @export
 * @interface IoK8sApiCoreV1NamespaceStatus
 */
export interface IoK8sApiCoreV1NamespaceStatus {
    /**
     * Represents the latest available observations of a namespace's current state.
     * @type {Array<IoK8sApiCoreV1NamespaceCondition>}
     * @memberof IoK8sApiCoreV1NamespaceStatus
     */
    conditions?: Array<IoK8sApiCoreV1NamespaceCondition>;
    /**
     * Phase is the current lifecycle phase of the namespace. More info: https://kubernetes.io/docs/tasks/administer-cluster/namespaces/
     * @type {string}
     * @memberof IoK8sApiCoreV1NamespaceStatus
     */
    phase?: string;
}
/**
 * Node is a worker node in Kubernetes. Each node will have a unique identifier in the cache (i.e. in etcd).
 * @export
 * @interface IoK8sApiCoreV1Node
 */
export interface IoK8sApiCoreV1Node {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1Node
     */
    apiVersion?: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1Node
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1Node
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * Spec defines the behavior of a node. https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1NodeSpec}
     * @memberof IoK8sApiCoreV1Node
     */
    spec?: IoK8sApiCoreV1NodeSpec;
    /**
     * Most recently observed status of the node. Populated by the system. Read-only. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1NodeStatus}
     * @memberof IoK8sApiCoreV1Node
     */
    status?: IoK8sApiCoreV1NodeStatus;
}
/**
 * NodeAddress contains information for the node's address.
 * @export
 * @interface IoK8sApiCoreV1NodeAddress
 */
export interface IoK8sApiCoreV1NodeAddress {
    /**
     * The node address.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeAddress
     */
    address: string;
    /**
     * Node address type, one of Hostname, ExternalIP or InternalIP.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeAddress
     */
    type: string;
}
/**
 * Node affinity is a group of node affinity scheduling rules.
 * @export
 * @interface IoK8sApiCoreV1NodeAffinity
 */
export interface IoK8sApiCoreV1NodeAffinity {
    /**
     * The scheduler will prefer to schedule pods to nodes that satisfy the affinity expressions specified by this field, but it may choose a node that violates one or more of the expressions. The node that is most preferred is the one with the greatest sum of weights, i.e. for each node that meets all of the scheduling requirements (resource request, requiredDuringScheduling affinity expressions, etc.), compute a sum by iterating through the elements of this field and adding "weight" to the sum if the node matches the corresponding matchExpressions; the node(s) with the highest sum are the most preferred.
     * @type {Array<IoK8sApiCoreV1PreferredSchedulingTerm>}
     * @memberof IoK8sApiCoreV1NodeAffinity
     */
    preferredDuringSchedulingIgnoredDuringExecution?: Array<IoK8sApiCoreV1PreferredSchedulingTerm>;
    /**
     * If the affinity requirements specified by this field are not met at scheduling time, the pod will not be scheduled onto the node. If the affinity requirements specified by this field cease to be met at some point during pod execution (e.g. due to an update), the system may or may not try to eventually evict the pod from its node.
     * @type {IoK8sApiCoreV1NodeSelector}
     * @memberof IoK8sApiCoreV1NodeAffinity
     */
    requiredDuringSchedulingIgnoredDuringExecution?: IoK8sApiCoreV1NodeSelector;
}
/**
 * NodeCondition contains condition information for a node.
 * @export
 * @interface IoK8sApiCoreV1NodeCondition
 */
export interface IoK8sApiCoreV1NodeCondition {
    /**
     * Last time we got an update on a given condition.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeCondition
     */
    lastHeartbeatTime?: string;
    /**
     * Last time the condition transit from one status to another.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeCondition
     */
    lastTransitionTime?: string;
    /**
     * Human readable message indicating details about last transition.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeCondition
     */
    message?: string;
    /**
     * (brief) reason for the condition's last transition.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeCondition
     */
    reason?: string;
    /**
     * Status of the condition, one of True, False, Unknown.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeCondition
     */
    status: string;
    /**
     * Type of node condition.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeCondition
     */
    type: string;
}
/**
 * NodeConfigSource specifies a source of node configuration. Exactly one subfield (excluding metadata) must be non-nil. This API is deprecated since 1.22
 * @export
 * @interface IoK8sApiCoreV1NodeConfigSource
 */
export interface IoK8sApiCoreV1NodeConfigSource {
    /**
     * ConfigMap is a reference to a Node's ConfigMap
     * @type {IoK8sApiCoreV1ConfigMapNodeConfigSource}
     * @memberof IoK8sApiCoreV1NodeConfigSource
     */
    configMap?: IoK8sApiCoreV1ConfigMapNodeConfigSource;
}
/**
 * NodeConfigStatus describes the status of the config assigned by Node.Spec.ConfigSource.
 * @export
 * @interface IoK8sApiCoreV1NodeConfigStatus
 */
export interface IoK8sApiCoreV1NodeConfigStatus {
    /**
     * Active reports the checkpointed config the node is actively using. Active will represent either the current version of the Assigned config, or the current LastKnownGood config, depending on whether attempting to use the Assigned config results in an error.
     * @type {IoK8sApiCoreV1NodeConfigSource}
     * @memberof IoK8sApiCoreV1NodeConfigStatus
     */
    active?: IoK8sApiCoreV1NodeConfigSource;
    /**
     * Assigned reports the checkpointed config the node will try to use. When Node.Spec.ConfigSource is updated, the node checkpoints the associated config payload to local disk, along with a record indicating intended config. The node refers to this record to choose its config checkpoint, and reports this record in Assigned. Assigned only updates in the status after the record has been checkpointed to disk. When the Kubelet is restarted, it tries to make the Assigned config the Active config by loading and validating the checkpointed payload identified by Assigned.
     * @type {IoK8sApiCoreV1NodeConfigSource}
     * @memberof IoK8sApiCoreV1NodeConfigStatus
     */
    assigned?: IoK8sApiCoreV1NodeConfigSource;
    /**
     * Error describes any problems reconciling the Spec.ConfigSource to the Active config. Errors may occur, for example, attempting to checkpoint Spec.ConfigSource to the local Assigned record, attempting to checkpoint the payload associated with Spec.ConfigSource, attempting to load or validate the Assigned config, etc. Errors may occur at different points while syncing config. Earlier errors (e.g. download or checkpointing errors) will not result in a rollback to LastKnownGood, and may resolve across Kubelet retries. Later errors (e.g. loading or validating a checkpointed config) will result in a rollback to LastKnownGood. In the latter case, it is usually possible to resolve the error by fixing the config assigned in Spec.ConfigSource. You can find additional information for debugging by searching the error message in the Kubelet log. Error is a human-readable description of the error state; machines can check whether or not Error is empty, but should not rely on the stability of the Error text across Kubelet versions.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeConfigStatus
     */
    error?: string;
    /**
     * LastKnownGood reports the checkpointed config the node will fall back to when it encounters an error attempting to use the Assigned config. The Assigned config becomes the LastKnownGood config when the node determines that the Assigned config is stable and correct. This is currently implemented as a 10-minute soak period starting when the local record of Assigned config is updated. If the Assigned config is Active at the end of this period, it becomes the LastKnownGood. Note that if Spec.ConfigSource is reset to nil (use local defaults), the LastKnownGood is also immediately reset to nil, because the local default config is always assumed good. You should not make assumptions about the node's method of determining config stability and correctness, as this may change or become configurable in the future.
     * @type {IoK8sApiCoreV1NodeConfigSource}
     * @memberof IoK8sApiCoreV1NodeConfigStatus
     */
    lastKnownGood?: IoK8sApiCoreV1NodeConfigSource;
}
/**
 * NodeDaemonEndpoints lists ports opened by daemons running on the Node.
 * @export
 * @interface IoK8sApiCoreV1NodeDaemonEndpoints
 */
export interface IoK8sApiCoreV1NodeDaemonEndpoints {
    /**
     * Endpoint on which Kubelet is listening.
     * @type {IoK8sApiCoreV1DaemonEndpoint}
     * @memberof IoK8sApiCoreV1NodeDaemonEndpoints
     */
    kubeletEndpoint?: IoK8sApiCoreV1DaemonEndpoint;
}
/**
 * NodeList is the whole list of all Nodes which have been registered with master.
 * @export
 * @interface IoK8sApiCoreV1NodeList
 */
export interface IoK8sApiCoreV1NodeList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeList
     */
    apiVersion?: string;
    /**
     * List of nodes
     * @type {Array<IoK8sApiCoreV1Node>}
     * @memberof IoK8sApiCoreV1NodeList
     */
    items: Array<IoK8sApiCoreV1Node>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1NodeList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * NodeRuntimeHandler is a set of runtime handler information.
 * @export
 * @interface IoK8sApiCoreV1NodeRuntimeHandler
 */
export interface IoK8sApiCoreV1NodeRuntimeHandler {
    /**
     * Supported features.
     * @type {IoK8sApiCoreV1NodeRuntimeHandlerFeatures}
     * @memberof IoK8sApiCoreV1NodeRuntimeHandler
     */
    features?: IoK8sApiCoreV1NodeRuntimeHandlerFeatures;
    /**
     * Runtime handler name. Empty for the default runtime handler.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeRuntimeHandler
     */
    name?: string;
}
/**
 * NodeRuntimeHandlerFeatures is a set of runtime features.
 * @export
 * @interface IoK8sApiCoreV1NodeRuntimeHandlerFeatures
 */
export interface IoK8sApiCoreV1NodeRuntimeHandlerFeatures {
    /**
     * RecursiveReadOnlyMounts is set to true if the runtime handler supports RecursiveReadOnlyMounts.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1NodeRuntimeHandlerFeatures
     */
    recursiveReadOnlyMounts?: boolean;
}
/**
 * A node selector represents the union of the results of one or more label queries over a set of nodes; that is, it represents the OR of the selectors represented by the node selector terms.
 * @export
 * @interface IoK8sApiCoreV1NodeSelector
 */
export interface IoK8sApiCoreV1NodeSelector {
    /**
     * Required. A list of node selector terms. The terms are ORed.
     * @type {Array<IoK8sApiCoreV1NodeSelectorTerm>}
     * @memberof IoK8sApiCoreV1NodeSelector
     */
    nodeSelectorTerms: Array<IoK8sApiCoreV1NodeSelectorTerm>;
}
/**
 * A node selector requirement is a selector that contains values, a key, and an operator that relates the key and values.
 * @export
 * @interface IoK8sApiCoreV1NodeSelectorRequirement
 */
export interface IoK8sApiCoreV1NodeSelectorRequirement {
    /**
     * The label key that the selector applies to.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSelectorRequirement
     */
    key: string;
    /**
     * Represents a key's relationship to a set of values. Valid operators are In, NotIn, Exists, DoesNotExist. Gt, and Lt.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSelectorRequirement
     */
    operator: string;
    /**
     * An array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. If the operator is Gt or Lt, the values array must have a single element, which will be interpreted as an integer. This array is replaced during a strategic merge patch.
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1NodeSelectorRequirement
     */
    values?: Array<string>;
}
/**
 * A null or empty node selector term matches no objects. The requirements of them are ANDed. The TopologySelectorTerm type implements a subset of the NodeSelectorTerm.
 * @export
 * @interface IoK8sApiCoreV1NodeSelectorTerm
 */
export interface IoK8sApiCoreV1NodeSelectorTerm {
    /**
     * A list of node selector requirements by node's labels.
     * @type {Array<IoK8sApiCoreV1NodeSelectorRequirement>}
     * @memberof IoK8sApiCoreV1NodeSelectorTerm
     */
    matchExpressions?: Array<IoK8sApiCoreV1NodeSelectorRequirement>;
    /**
     * A list of node selector requirements by node's fields.
     * @type {Array<IoK8sApiCoreV1NodeSelectorRequirement>}
     * @memberof IoK8sApiCoreV1NodeSelectorTerm
     */
    matchFields?: Array<IoK8sApiCoreV1NodeSelectorRequirement>;
}
/**
 * NodeSpec describes the attributes that a node is created with.
 * @export
 * @interface IoK8sApiCoreV1NodeSpec
 */
export interface IoK8sApiCoreV1NodeSpec {
    /**
     * Deprecated: Previously used to specify the source of the node's configuration for the DynamicKubeletConfig feature. This feature is removed.
     * @type {IoK8sApiCoreV1NodeConfigSource}
     * @memberof IoK8sApiCoreV1NodeSpec
     */
    configSource?: IoK8sApiCoreV1NodeConfigSource;
    /**
     * Deprecated. Not all kubelets will set this field. Remove field after 1.13. see: https://issues.k8s.io/61966
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSpec
     */
    externalID?: string;
    /**
     * PodCIDR represents the pod IP range assigned to the node.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSpec
     */
    podCIDR?: string;
    /**
     * podCIDRs represents the IP ranges assigned to the node for usage by Pods on that node. If this field is specified, the 0th entry must match the podCIDR field. It may contain at most 1 value for each of IPv4 and IPv6.
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1NodeSpec
     */
    podCIDRs?: Array<string>;
    /**
     * ID of the node assigned by the cloud provider in the format: <ProviderName>://<ProviderSpecificNodeID>
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSpec
     */
    providerID?: string;
    /**
     * If specified, the node's taints.
     * @type {Array<IoK8sApiCoreV1Taint>}
     * @memberof IoK8sApiCoreV1NodeSpec
     */
    taints?: Array<IoK8sApiCoreV1Taint>;
    /**
     * Unschedulable controls node schedulability of new pods. By default, node is schedulable. More info: https://kubernetes.io/docs/concepts/nodes/node/#manual-node-administration
     * @type {boolean}
     * @memberof IoK8sApiCoreV1NodeSpec
     */
    unschedulable?: boolean;
}
/**
 * NodeStatus is information about the current status of a node.
 * @export
 * @interface IoK8sApiCoreV1NodeStatus
 */
export interface IoK8sApiCoreV1NodeStatus {
    /**
     * List of addresses reachable to the node. Queried from cloud provider, if available. More info: https://kubernetes.io/docs/concepts/nodes/node/#addresses Note: This field is declared as mergeable, but the merge key is not sufficiently unique, which can cause data corruption when it is merged. Callers should instead use a full-replacement patch. See https://pr.k8s.io/79391 for an example. Consumers should assume that addresses can change during the lifetime of a Node. However, there are some exceptions where this may not be possible, such as Pods that inherit a Node's address in its own status or consumers of the downward API (status.hostIP).
     * @type {Array<IoK8sApiCoreV1NodeAddress>}
     * @memberof IoK8sApiCoreV1NodeStatus
     */
    addresses?: Array<IoK8sApiCoreV1NodeAddress>;
    /**
     * Allocatable represents the resources of a node that are available for scheduling. Defaults to Capacity.
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1NodeStatus
     */
    allocatable?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * Capacity represents the total resources of a node. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#capacity
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1NodeStatus
     */
    capacity?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * Conditions is an array of current observed node conditions. More info: https://kubernetes.io/docs/concepts/nodes/node/#condition
     * @type {Array<IoK8sApiCoreV1NodeCondition>}
     * @memberof IoK8sApiCoreV1NodeStatus
     */
    conditions?: Array<IoK8sApiCoreV1NodeCondition>;
    /**
     * Status of the config assigned to the node via the dynamic Kubelet config feature.
     * @type {IoK8sApiCoreV1NodeConfigStatus}
     * @memberof IoK8sApiCoreV1NodeStatus
     */
    config?: IoK8sApiCoreV1NodeConfigStatus;
    /**
     * Endpoints of daemons running on the Node.
     * @type {IoK8sApiCoreV1NodeDaemonEndpoints}
     * @memberof IoK8sApiCoreV1NodeStatus
     */
    daemonEndpoints?: IoK8sApiCoreV1NodeDaemonEndpoints;
    /**
     * List of container images on this node
     * @type {Array<IoK8sApiCoreV1ContainerImage>}
     * @memberof IoK8sApiCoreV1NodeStatus
     */
    images?: Array<IoK8sApiCoreV1ContainerImage>;
    /**
     * Set of ids/uuids to uniquely identify the node. More info: https://kubernetes.io/docs/concepts/nodes/node/#info
     * @type {IoK8sApiCoreV1NodeSystemInfo}
     * @memberof IoK8sApiCoreV1NodeStatus
     */
    nodeInfo?: IoK8sApiCoreV1NodeSystemInfo;
    /**
     * NodePhase is the recently observed lifecycle phase of the node. More info: https://kubernetes.io/docs/concepts/nodes/node/#phase The field is never populated, and now is deprecated.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeStatus
     */
    phase?: string;
    /**
     * The available runtime handlers.
     * @type {Array<IoK8sApiCoreV1NodeRuntimeHandler>}
     * @memberof IoK8sApiCoreV1NodeStatus
     */
    runtimeHandlers?: Array<IoK8sApiCoreV1NodeRuntimeHandler>;
    /**
     * List of volumes that are attached to the node.
     * @type {Array<IoK8sApiCoreV1AttachedVolume>}
     * @memberof IoK8sApiCoreV1NodeStatus
     */
    volumesAttached?: Array<IoK8sApiCoreV1AttachedVolume>;
    /**
     * List of attachable volumes in use (mounted) by the node.
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1NodeStatus
     */
    volumesInUse?: Array<string>;
}
/**
 * NodeSystemInfo is a set of ids/uuids to uniquely identify the node.
 * @export
 * @interface IoK8sApiCoreV1NodeSystemInfo
 */
export interface IoK8sApiCoreV1NodeSystemInfo {
    /**
     * The Architecture reported by the node
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSystemInfo
     */
    architecture: string;
    /**
     * Boot ID reported by the node.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSystemInfo
     */
    bootID: string;
    /**
     * ContainerRuntime Version reported by the node through runtime remote API (e.g. containerd://1.4.2).
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSystemInfo
     */
    containerRuntimeVersion: string;
    /**
     * Kernel Version reported by the node from 'uname -r' (e.g. 3.16.0-0.bpo.4-amd64).
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSystemInfo
     */
    kernelVersion: string;
    /**
     * KubeProxy Version reported by the node.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSystemInfo
     */
    kubeProxyVersion: string;
    /**
     * Kubelet Version reported by the node.
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSystemInfo
     */
    kubeletVersion: string;
    /**
     * MachineID reported by the node. For unique machine identification in the cluster this field is preferred. Learn more from man(5) machine-id: http://man7.org/linux/man-pages/man5/machine-id.5.html
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSystemInfo
     */
    machineID: string;
    /**
     * The Operating System reported by the node
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSystemInfo
     */
    operatingSystem: string;
    /**
     * OS Image reported by the node from /etc/os-release (e.g. Debian GNU/Linux 7 (wheezy)).
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSystemInfo
     */
    osImage: string;
    /**
     * SystemUUID reported by the node. For unique machine identification MachineID is preferred. This field is specific to Red Hat hosts https://access.redhat.com/documentation/en-us/red_hat_subscription_management/1/html/rhsm/uuid
     * @type {string}
     * @memberof IoK8sApiCoreV1NodeSystemInfo
     */
    systemUUID: string;
}
/**
 * ObjectFieldSelector selects an APIVersioned field of an object.
 * @export
 * @interface IoK8sApiCoreV1ObjectFieldSelector
 */
export interface IoK8sApiCoreV1ObjectFieldSelector {
    /**
     * Version of the schema the FieldPath is written in terms of, defaults to "v1".
     * @type {string}
     * @memberof IoK8sApiCoreV1ObjectFieldSelector
     */
    apiVersion?: string;
    /**
     * Path of the field to select in the specified API version.
     * @type {string}
     * @memberof IoK8sApiCoreV1ObjectFieldSelector
     */
    fieldPath: string;
}
/**
 * ObjectReference contains enough information to let you inspect or modify the referred object.
 * @export
 * @interface IoK8sApiCoreV1ObjectReference
 */
export interface IoK8sApiCoreV1ObjectReference {
    /**
     * API version of the referent.
     * @type {string}
     * @memberof IoK8sApiCoreV1ObjectReference
     */
    apiVersion?: string;
    /**
     * If referring to a piece of an object instead of an entire object, this string should contain a valid JSON/Go field access statement, such as desiredState.manifest.containers[2]. For example, if the object reference is to a container within a pod, this would take on a value like: "spec.containers{name}" (where "name" refers to the name of the container that triggered the event) or if no container name is specified "spec.containers[2]" (container with index 2 in this pod). This syntax is chosen only to have some well-defined way of referencing a part of an object.
     * @type {string}
     * @memberof IoK8sApiCoreV1ObjectReference
     */
    fieldPath?: string;
    /**
     * Kind of the referent. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1ObjectReference
     */
    kind?: string;
    /**
     * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
     * @type {string}
     * @memberof IoK8sApiCoreV1ObjectReference
     */
    name?: string;
    /**
     * Namespace of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/
     * @type {string}
     * @memberof IoK8sApiCoreV1ObjectReference
     */
    namespace?: string;
    /**
     * Specific resourceVersion to which this reference is made, if any. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#concurrency-control-and-consistency
     * @type {string}
     * @memberof IoK8sApiCoreV1ObjectReference
     */
    resourceVersion?: string;
    /**
     * UID of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#uids
     * @type {string}
     * @memberof IoK8sApiCoreV1ObjectReference
     */
    uid?: string;
}
/**
 * PersistentVolume (PV) is a storage resource provisioned by an administrator. It is analogous to a node. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes
 * @export
 * @interface IoK8sApiCoreV1PersistentVolume
 */
export interface IoK8sApiCoreV1PersistentVolume {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolume
     */
    apiVersion?: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolume
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1PersistentVolume
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * spec defines a specification of a persistent volume owned by the cluster. Provisioned by an administrator. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#persistent-volumes
     * @type {IoK8sApiCoreV1PersistentVolumeSpec}
     * @memberof IoK8sApiCoreV1PersistentVolume
     */
    spec?: IoK8sApiCoreV1PersistentVolumeSpec;
    /**
     * status represents the current information/status for the persistent volume. Populated by the system. Read-only. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#persistent-volumes
     * @type {IoK8sApiCoreV1PersistentVolumeStatus}
     * @memberof IoK8sApiCoreV1PersistentVolume
     */
    status?: IoK8sApiCoreV1PersistentVolumeStatus;
}
/**
 * PersistentVolumeClaim is a user's request for and claim to a persistent volume
 * @export
 * @interface IoK8sApiCoreV1PersistentVolumeClaim
 */
export interface IoK8sApiCoreV1PersistentVolumeClaim {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaim
     */
    apiVersion?: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaim
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaim
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * spec defines the desired characteristics of a volume requested by a pod author. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#persistentvolumeclaims
     * @type {IoK8sApiCoreV1PersistentVolumeClaimSpec}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaim
     */
    spec?: IoK8sApiCoreV1PersistentVolumeClaimSpec;
    /**
     * status represents the current information/status of a persistent volume claim. Read-only. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#persistentvolumeclaims
     * @type {IoK8sApiCoreV1PersistentVolumeClaimStatus}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaim
     */
    status?: IoK8sApiCoreV1PersistentVolumeClaimStatus;
}
/**
 * PersistentVolumeClaimCondition contains details about state of pvc
 * @export
 * @interface IoK8sApiCoreV1PersistentVolumeClaimCondition
 */
export interface IoK8sApiCoreV1PersistentVolumeClaimCondition {
    /**
     * lastProbeTime is the time we probed the condition.
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimCondition
     */
    lastProbeTime?: string;
    /**
     * lastTransitionTime is the time the condition transitioned from one status to another.
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimCondition
     */
    lastTransitionTime?: string;
    /**
     * message is the human-readable message indicating details about last transition.
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimCondition
     */
    message?: string;
    /**
     * reason is a unique, this should be a short, machine understandable string that gives the reason for condition's last transition. If it reports "Resizing" that means the underlying persistent volume is being resized.
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimCondition
     */
    reason?: string;
    /**
     * 
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimCondition
     */
    status: string;
    /**
     * 
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimCondition
     */
    type: string;
}
/**
 * PersistentVolumeClaimList is a list of PersistentVolumeClaim items.
 * @export
 * @interface IoK8sApiCoreV1PersistentVolumeClaimList
 */
export interface IoK8sApiCoreV1PersistentVolumeClaimList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimList
     */
    apiVersion?: string;
    /**
     * items is a list of persistent volume claims. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#persistentvolumeclaims
     * @type {Array<IoK8sApiCoreV1PersistentVolumeClaim>}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimList
     */
    items: Array<IoK8sApiCoreV1PersistentVolumeClaim>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * PersistentVolumeClaimSpec describes the common attributes of storage devices and allows a Source for provider-specific attributes
 * @export
 * @interface IoK8sApiCoreV1PersistentVolumeClaimSpec
 */
export interface IoK8sApiCoreV1PersistentVolumeClaimSpec {
    /**
     * accessModes contains the desired access modes the volume should have. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#access-modes-1
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimSpec
     */
    accessModes?: Array<string>;
    /**
     * dataSource field can be used to specify either: * An existing VolumeSnapshot object (snapshot.storage.k8s.io/VolumeSnapshot) * An existing PVC (PersistentVolumeClaim) If the provisioner or an external controller can support the specified data source, it will create a new volume based on the contents of the specified data source. When the AnyVolumeDataSource feature gate is enabled, dataSource contents will be copied to dataSourceRef, and dataSourceRef contents will be copied to dataSource when dataSourceRef.namespace is not specified. If the namespace is specified, then dataSourceRef will not be copied to dataSource.
     * @type {IoK8sApiCoreV1TypedLocalObjectReference}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimSpec
     */
    dataSource?: IoK8sApiCoreV1TypedLocalObjectReference;
    /**
     * dataSourceRef specifies the object from which to populate the volume with data, if a non-empty volume is desired. This may be any object from a non-empty API group (non core object) or a PersistentVolumeClaim object. When this field is specified, volume binding will only succeed if the type of the specified object matches some installed volume populator or dynamic provisioner. This field will replace the functionality of the dataSource field and as such if both fields are non-empty, they must have the same value. For backwards compatibility, when namespace isn't specified in dataSourceRef, both fields (dataSource and dataSourceRef) will be set to the same value automatically if one of them is empty and the other is non-empty. When namespace is specified in dataSourceRef, dataSource isn't set to the same value and must be empty. There are three important differences between dataSource and dataSourceRef: * While dataSource only allows two specific types of objects, dataSourceRef
     *   allows any non-core object, as well as PersistentVolumeClaim objects.
     * * While dataSource ignores disallowed values (dropping them), dataSourceRef
     *   preserves all values, and generates an error if a disallowed value is
     *   specified.
     * * While dataSource only allows local objects, dataSourceRef allows objects
     *   in any namespaces.
     * (Beta) Using this field requires the AnyVolumeDataSource feature gate to be enabled. (Alpha) Using the namespace field of dataSourceRef requires the CrossNamespaceVolumeDataSource feature gate to be enabled.
     * @type {IoK8sApiCoreV1TypedObjectReference}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimSpec
     */
    dataSourceRef?: IoK8sApiCoreV1TypedObjectReference;
    /**
     * resources represents the minimum resources the volume should have. If RecoverVolumeExpansionFailure feature is enabled users are allowed to specify resource requirements that are lower than previous value but must still be higher than capacity recorded in the status field of the claim. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#resources
     * @type {IoK8sApiCoreV1VolumeResourceRequirements}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimSpec
     */
    resources?: IoK8sApiCoreV1VolumeResourceRequirements;
    /**
     * selector is a label query over volumes to consider for binding.
     * @type {IoK8sApimachineryPkgApisMetaV1LabelSelector}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimSpec
     */
    selector?: IoK8sApimachineryPkgApisMetaV1LabelSelector;
    /**
     * storageClassName is the name of the StorageClass required by the claim. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#class-1
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimSpec
     */
    storageClassName?: string;
    /**
     * volumeAttributesClassName may be used to set the VolumeAttributesClass used by this claim. If specified, the CSI driver will create or update the volume with the attributes defined in the corresponding VolumeAttributesClass. This has a different purpose than storageClassName, it can be changed after the claim is created. An empty string value means that no VolumeAttributesClass will be applied to the claim but it's not allowed to reset this field to empty string once it is set. If unspecified and the PersistentVolumeClaim is unbound, the default VolumeAttributesClass will be set by the persistentvolume controller if it exists. If the resource referred to by volumeAttributesClass does not exist, this PersistentVolumeClaim will be set to a Pending state, as reflected by the modifyVolumeStatus field, until such as a resource exists. More info: https://kubernetes.io/docs/concepts/storage/volume-attributes-classes/ (Alpha) Using this field requires the VolumeAttributesClass feature gate to be enabled.
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimSpec
     */
    volumeAttributesClassName?: string;
    /**
     * volumeMode defines what type of volume is required by the claim. Value of Filesystem is implied when not included in claim spec.
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimSpec
     */
    volumeMode?: string;
    /**
     * volumeName is the binding reference to the PersistentVolume backing this claim.
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimSpec
     */
    volumeName?: string;
}
/**
 * PersistentVolumeClaimStatus is the current status of a persistent volume claim.
 * @export
 * @interface IoK8sApiCoreV1PersistentVolumeClaimStatus
 */
export interface IoK8sApiCoreV1PersistentVolumeClaimStatus {
    /**
     * accessModes contains the actual access modes the volume backing the PVC has. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#access-modes-1
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimStatus
     */
    accessModes?: Array<string>;
    /**
     * allocatedResourceStatuses stores status of resource being resized for the given PVC. Key names follow standard Kubernetes label syntax. Valid values are either:
     * 	* Un-prefixed keys:
     * 		- storage - the capacity of the volume.
     * 	* Custom resources must use implementation-defined prefixed names such as "example.com/my-custom-resource"
     * Apart from above values - keys that are unprefixed or have kubernetes.io prefix are considered reserved and hence may not be used.
     * 
     * ClaimResourceStatus can be in any of following states:
     * 	- ControllerResizeInProgress:
     * 		State set when resize controller starts resizing the volume in control-plane.
     * 	- ControllerResizeFailed:
     * 		State set when resize has failed in resize controller with a terminal error.
     * 	- NodeResizePending:
     * 		State set when resize controller has finished resizing the volume but further resizing of
     * 		volume is needed on the node.
     * 	- NodeResizeInProgress:
     * 		State set when kubelet starts resizing the volume.
     * 	- NodeResizeFailed:
     * 		State set when resizing has failed in kubelet with a terminal error. Transient errors don't set
     * 		NodeResizeFailed.
     * For example: if expanding a PVC for more capacity - this field can be one of the following states:
     * 	- pvc.status.allocatedResourceStatus['storage'] = "ControllerResizeInProgress"
     *      - pvc.status.allocatedResourceStatus['storage'] = "ControllerResizeFailed"
     *      - pvc.status.allocatedResourceStatus['storage'] = "NodeResizePending"
     *      - pvc.status.allocatedResourceStatus['storage'] = "NodeResizeInProgress"
     *      - pvc.status.allocatedResourceStatus['storage'] = "NodeResizeFailed"
     * When this field is not set, it means that no resize operation is in progress for the given PVC.
     * 
     * A controller that receives PVC update with previously unknown resourceName or ClaimResourceStatus should ignore the update for the purpose it was designed. For example - a controller that only is responsible for resizing capacity of the volume, should ignore PVC updates that change other valid resources associated with PVC.
     * 
     * This is an alpha field and requires enabling RecoverVolumeExpansionFailure feature.
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimStatus
     */
    allocatedResourceStatuses?: { [key: string]: string; };
    /**
     * allocatedResources tracks the resources allocated to a PVC including its capacity. Key names follow standard Kubernetes label syntax. Valid values are either:
     * 	* Un-prefixed keys:
     * 		- storage - the capacity of the volume.
     * 	* Custom resources must use implementation-defined prefixed names such as "example.com/my-custom-resource"
     * Apart from above values - keys that are unprefixed or have kubernetes.io prefix are considered reserved and hence may not be used.
     * 
     * Capacity reported here may be larger than the actual capacity when a volume expansion operation is requested. For storage quota, the larger value from allocatedResources and PVC.spec.resources is used. If allocatedResources is not set, PVC.spec.resources alone is used for quota calculation. If a volume expansion capacity request is lowered, allocatedResources is only lowered if there are no expansion operations in progress and if the actual volume capacity is equal or lower than the requested capacity.
     * 
     * A controller that receives PVC update with previously unknown resourceName should ignore the update for the purpose it was designed. For example - a controller that only is responsible for resizing capacity of the volume, should ignore PVC updates that change other valid resources associated with PVC.
     * 
     * This is an alpha field and requires enabling RecoverVolumeExpansionFailure feature.
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimStatus
     */
    allocatedResources?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * capacity represents the actual resources of the underlying volume.
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimStatus
     */
    capacity?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * conditions is the current Condition of persistent volume claim. If underlying persistent volume is being resized then the Condition will be set to 'Resizing'.
     * @type {Array<IoK8sApiCoreV1PersistentVolumeClaimCondition>}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimStatus
     */
    conditions?: Array<IoK8sApiCoreV1PersistentVolumeClaimCondition>;
    /**
     * currentVolumeAttributesClassName is the current name of the VolumeAttributesClass the PVC is using. When unset, there is no VolumeAttributeClass applied to this PersistentVolumeClaim This is an alpha field and requires enabling VolumeAttributesClass feature.
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimStatus
     */
    currentVolumeAttributesClassName?: string;
    /**
     * ModifyVolumeStatus represents the status object of ControllerModifyVolume operation. When this is unset, there is no ModifyVolume operation being attempted. This is an alpha field and requires enabling VolumeAttributesClass feature.
     * @type {IoK8sApiCoreV1ModifyVolumeStatus}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimStatus
     */
    modifyVolumeStatus?: IoK8sApiCoreV1ModifyVolumeStatus;
    /**
     * phase represents the current phase of PersistentVolumeClaim.
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimStatus
     */
    phase?: string;
}
/**
 * PersistentVolumeClaimTemplate is used to produce PersistentVolumeClaim objects as part of an EphemeralVolumeSource.
 * @export
 * @interface IoK8sApiCoreV1PersistentVolumeClaimTemplate
 */
export interface IoK8sApiCoreV1PersistentVolumeClaimTemplate {
    /**
     * May contain labels and annotations that will be copied into the PVC when creating it. No other fields are allowed and will be rejected during validation.
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimTemplate
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * The specification for the PersistentVolumeClaim. The entire content is copied unchanged into the PVC that gets created from this template. The same fields as in a PersistentVolumeClaim are also valid here.
     * @type {IoK8sApiCoreV1PersistentVolumeClaimSpec}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimTemplate
     */
    spec: IoK8sApiCoreV1PersistentVolumeClaimSpec;
}
/**
 * PersistentVolumeClaimVolumeSource references the user's PVC in the same namespace. This volume finds the bound PV and mounts that volume for the pod. A PersistentVolumeClaimVolumeSource is, essentially, a wrapper around another type of volume that is owned by someone else (the system).
 * @export
 * @interface IoK8sApiCoreV1PersistentVolumeClaimVolumeSource
 */
export interface IoK8sApiCoreV1PersistentVolumeClaimVolumeSource {
    /**
     * claimName is the name of a PersistentVolumeClaim in the same namespace as the pod using this volume. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#persistentvolumeclaims
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimVolumeSource
     */
    claimName: string;
    /**
     * readOnly Will force the ReadOnly setting in VolumeMounts. Default false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1PersistentVolumeClaimVolumeSource
     */
    readOnly?: boolean;
}
/**
 * PersistentVolumeList is a list of PersistentVolume items.
 * @export
 * @interface IoK8sApiCoreV1PersistentVolumeList
 */
export interface IoK8sApiCoreV1PersistentVolumeList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeList
     */
    apiVersion?: string;
    /**
     * items is a list of persistent volumes. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes
     * @type {Array<IoK8sApiCoreV1PersistentVolume>}
     * @memberof IoK8sApiCoreV1PersistentVolumeList
     */
    items: Array<IoK8sApiCoreV1PersistentVolume>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1PersistentVolumeList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * PersistentVolumeSpec is the specification of a persistent volume.
 * @export
 * @interface IoK8sApiCoreV1PersistentVolumeSpec
 */
export interface IoK8sApiCoreV1PersistentVolumeSpec {
    /**
     * accessModes contains all ways the volume can be mounted. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#access-modes
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    accessModes?: Array<string>;
    /**
     * awsElasticBlockStore represents an AWS Disk resource that is attached to a kubelet's host machine and then exposed to the pod. More info: https://kubernetes.io/docs/concepts/storage/volumes#awselasticblockstore
     * @type {IoK8sApiCoreV1AWSElasticBlockStoreVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    awsElasticBlockStore?: IoK8sApiCoreV1AWSElasticBlockStoreVolumeSource;
    /**
     * azureDisk represents an Azure Data Disk mount on the host and bind mount to the pod.
     * @type {IoK8sApiCoreV1AzureDiskVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    azureDisk?: IoK8sApiCoreV1AzureDiskVolumeSource;
    /**
     * azureFile represents an Azure File Service mount on the host and bind mount to the pod.
     * @type {IoK8sApiCoreV1AzureFilePersistentVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    azureFile?: IoK8sApiCoreV1AzureFilePersistentVolumeSource;
    /**
     * capacity is the description of the persistent volume's resources and capacity. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#capacity
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    capacity?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * cephFS represents a Ceph FS mount on the host that shares a pod's lifetime
     * @type {IoK8sApiCoreV1CephFSPersistentVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    cephfs?: IoK8sApiCoreV1CephFSPersistentVolumeSource;
    /**
     * cinder represents a cinder volume attached and mounted on kubelets host machine. More info: https://examples.k8s.io/mysql-cinder-pd/README.md
     * @type {IoK8sApiCoreV1CinderPersistentVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    cinder?: IoK8sApiCoreV1CinderPersistentVolumeSource;
    /**
     * claimRef is part of a bi-directional binding between PersistentVolume and PersistentVolumeClaim. Expected to be non-nil when bound. claim.VolumeName is the authoritative bind between PV and PVC. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#binding
     * @type {IoK8sApiCoreV1ObjectReference}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    claimRef?: IoK8sApiCoreV1ObjectReference;
    /**
     * csi represents storage that is handled by an external CSI driver (Beta feature).
     * @type {IoK8sApiCoreV1CSIPersistentVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    csi?: IoK8sApiCoreV1CSIPersistentVolumeSource;
    /**
     * fc represents a Fibre Channel resource that is attached to a kubelet's host machine and then exposed to the pod.
     * @type {IoK8sApiCoreV1FCVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    fc?: IoK8sApiCoreV1FCVolumeSource;
    /**
     * flexVolume represents a generic volume resource that is provisioned/attached using an exec based plugin.
     * @type {IoK8sApiCoreV1FlexPersistentVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    flexVolume?: IoK8sApiCoreV1FlexPersistentVolumeSource;
    /**
     * flocker represents a Flocker volume attached to a kubelet's host machine and exposed to the pod for its usage. This depends on the Flocker control service being running
     * @type {IoK8sApiCoreV1FlockerVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    flocker?: IoK8sApiCoreV1FlockerVolumeSource;
    /**
     * gcePersistentDisk represents a GCE Disk resource that is attached to a kubelet's host machine and then exposed to the pod. Provisioned by an admin. More info: https://kubernetes.io/docs/concepts/storage/volumes#gcepersistentdisk
     * @type {IoK8sApiCoreV1GCEPersistentDiskVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    gcePersistentDisk?: IoK8sApiCoreV1GCEPersistentDiskVolumeSource;
    /**
     * glusterfs represents a Glusterfs volume that is attached to a host and exposed to the pod. Provisioned by an admin. More info: https://examples.k8s.io/volumes/glusterfs/README.md
     * @type {IoK8sApiCoreV1GlusterfsPersistentVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    glusterfs?: IoK8sApiCoreV1GlusterfsPersistentVolumeSource;
    /**
     * hostPath represents a directory on the host. Provisioned by a developer or tester. This is useful for single-node development and testing only! On-host storage is not supported in any way and WILL NOT WORK in a multi-node cluster. More info: https://kubernetes.io/docs/concepts/storage/volumes#hostpath
     * @type {IoK8sApiCoreV1HostPathVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    hostPath?: IoK8sApiCoreV1HostPathVolumeSource;
    /**
     * iscsi represents an ISCSI Disk resource that is attached to a kubelet's host machine and then exposed to the pod. Provisioned by an admin.
     * @type {IoK8sApiCoreV1ISCSIPersistentVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    iscsi?: IoK8sApiCoreV1ISCSIPersistentVolumeSource;
    /**
     * local represents directly-attached storage with node affinity
     * @type {IoK8sApiCoreV1LocalVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    local?: IoK8sApiCoreV1LocalVolumeSource;
    /**
     * mountOptions is the list of mount options, e.g. ["ro", "soft"]. Not validated - mount will simply fail if one is invalid. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes/#mount-options
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    mountOptions?: Array<string>;
    /**
     * nfs represents an NFS mount on the host. Provisioned by an admin. More info: https://kubernetes.io/docs/concepts/storage/volumes#nfs
     * @type {IoK8sApiCoreV1NFSVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    nfs?: IoK8sApiCoreV1NFSVolumeSource;
    /**
     * nodeAffinity defines constraints that limit what nodes this volume can be accessed from. This field influences the scheduling of pods that use this volume.
     * @type {IoK8sApiCoreV1VolumeNodeAffinity}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    nodeAffinity?: IoK8sApiCoreV1VolumeNodeAffinity;
    /**
     * persistentVolumeReclaimPolicy defines what happens to a persistent volume when released from its claim. Valid options are Retain (default for manually created PersistentVolumes), Delete (default for dynamically provisioned PersistentVolumes), and Recycle (deprecated). Recycle must be supported by the volume plugin underlying this PersistentVolume. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#reclaiming
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    persistentVolumeReclaimPolicy?: string;
    /**
     * photonPersistentDisk represents a PhotonController persistent disk attached and mounted on kubelets host machine
     * @type {IoK8sApiCoreV1PhotonPersistentDiskVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    photonPersistentDisk?: IoK8sApiCoreV1PhotonPersistentDiskVolumeSource;
    /**
     * portworxVolume represents a portworx volume attached and mounted on kubelets host machine
     * @type {IoK8sApiCoreV1PortworxVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    portworxVolume?: IoK8sApiCoreV1PortworxVolumeSource;
    /**
     * quobyte represents a Quobyte mount on the host that shares a pod's lifetime
     * @type {IoK8sApiCoreV1QuobyteVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    quobyte?: IoK8sApiCoreV1QuobyteVolumeSource;
    /**
     * rbd represents a Rados Block Device mount on the host that shares a pod's lifetime. More info: https://examples.k8s.io/volumes/rbd/README.md
     * @type {IoK8sApiCoreV1RBDPersistentVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    rbd?: IoK8sApiCoreV1RBDPersistentVolumeSource;
    /**
     * scaleIO represents a ScaleIO persistent volume attached and mounted on Kubernetes nodes.
     * @type {IoK8sApiCoreV1ScaleIOPersistentVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    scaleIO?: IoK8sApiCoreV1ScaleIOPersistentVolumeSource;
    /**
     * storageClassName is the name of StorageClass to which this persistent volume belongs. Empty value means that this volume does not belong to any StorageClass.
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    storageClassName?: string;
    /**
     * storageOS represents a StorageOS volume that is attached to the kubelet's host machine and mounted into the pod More info: https://examples.k8s.io/volumes/storageos/README.md
     * @type {IoK8sApiCoreV1StorageOSPersistentVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    storageos?: IoK8sApiCoreV1StorageOSPersistentVolumeSource;
    /**
     * Name of VolumeAttributesClass to which this persistent volume belongs. Empty value is not allowed. When this field is not set, it indicates that this volume does not belong to any VolumeAttributesClass. This field is mutable and can be changed by the CSI driver after a volume has been updated successfully to a new class. For an unbound PersistentVolume, the volumeAttributesClassName will be matched with unbound PersistentVolumeClaims during the binding process. This is an alpha field and requires enabling VolumeAttributesClass feature.
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    volumeAttributesClassName?: string;
    /**
     * volumeMode defines if a volume is intended to be used with a formatted filesystem or to remain in raw block state. Value of Filesystem is implied when not included in spec.
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    volumeMode?: string;
    /**
     * vsphereVolume represents a vSphere volume attached and mounted on kubelets host machine
     * @type {IoK8sApiCoreV1VsphereVirtualDiskVolumeSource}
     * @memberof IoK8sApiCoreV1PersistentVolumeSpec
     */
    vsphereVolume?: IoK8sApiCoreV1VsphereVirtualDiskVolumeSource;
}
/**
 * PersistentVolumeStatus is the current status of a persistent volume.
 * @export
 * @interface IoK8sApiCoreV1PersistentVolumeStatus
 */
export interface IoK8sApiCoreV1PersistentVolumeStatus {
    /**
     * lastPhaseTransitionTime is the time the phase transitioned from one to another and automatically resets to current time everytime a volume phase transitions. This is a beta field and requires the PersistentVolumeLastPhaseTransitionTime feature to be enabled (enabled by default).
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeStatus
     */
    lastPhaseTransitionTime?: string;
    /**
     * message is a human-readable message indicating details about why the volume is in this state.
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeStatus
     */
    message?: string;
    /**
     * phase indicates if a volume is available, bound to a claim, or released by a claim. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#phase
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeStatus
     */
    phase?: string;
    /**
     * reason is a brief CamelCase string that describes any failure and is meant for machine parsing and tidy display in the CLI.
     * @type {string}
     * @memberof IoK8sApiCoreV1PersistentVolumeStatus
     */
    reason?: string;
}
/**
 * Represents a Photon Controller persistent disk resource.
 * @export
 * @interface IoK8sApiCoreV1PhotonPersistentDiskVolumeSource
 */
export interface IoK8sApiCoreV1PhotonPersistentDiskVolumeSource {
    /**
     * fsType is the filesystem type to mount. Must be a filesystem type supported by the host operating system. Ex. "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified.
     * @type {string}
     * @memberof IoK8sApiCoreV1PhotonPersistentDiskVolumeSource
     */
    fsType?: string;
    /**
     * pdID is the ID that identifies Photon Controller persistent disk
     * @type {string}
     * @memberof IoK8sApiCoreV1PhotonPersistentDiskVolumeSource
     */
    pdID: string;
}
/**
 * Pod is a collection of containers that can run on a host. This resource is created by clients and scheduled onto hosts.
 * @export
 * @interface IoK8sApiCoreV1Pod
 */
export interface IoK8sApiCoreV1Pod {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1Pod
     */
    apiVersion?: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1Pod
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1Pod
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * Specification of the desired behavior of the pod. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1PodSpec}
     * @memberof IoK8sApiCoreV1Pod
     */
    spec?: IoK8sApiCoreV1PodSpec;
    /**
     * Most recently observed status of the pod. This data may not be up to date. Populated by the system. Read-only. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1PodStatus}
     * @memberof IoK8sApiCoreV1Pod
     */
    status?: IoK8sApiCoreV1PodStatus;
}
/**
 * Pod affinity is a group of inter pod affinity scheduling rules.
 * @export
 * @interface IoK8sApiCoreV1PodAffinity
 */
export interface IoK8sApiCoreV1PodAffinity {
    /**
     * The scheduler will prefer to schedule pods to nodes that satisfy the affinity expressions specified by this field, but it may choose a node that violates one or more of the expressions. The node that is most preferred is the one with the greatest sum of weights, i.e. for each node that meets all of the scheduling requirements (resource request, requiredDuringScheduling affinity expressions, etc.), compute a sum by iterating through the elements of this field and adding "weight" to the sum if the node has pods which matches the corresponding podAffinityTerm; the node(s) with the highest sum are the most preferred.
     * @type {Array<IoK8sApiCoreV1WeightedPodAffinityTerm>}
     * @memberof IoK8sApiCoreV1PodAffinity
     */
    preferredDuringSchedulingIgnoredDuringExecution?: Array<IoK8sApiCoreV1WeightedPodAffinityTerm>;
    /**
     * If the affinity requirements specified by this field are not met at scheduling time, the pod will not be scheduled onto the node. If the affinity requirements specified by this field cease to be met at some point during pod execution (e.g. due to a pod label update), the system may or may not try to eventually evict the pod from its node. When there are multiple elements, the lists of nodes corresponding to each podAffinityTerm are intersected, i.e. all terms must be satisfied.
     * @type {Array<IoK8sApiCoreV1PodAffinityTerm>}
     * @memberof IoK8sApiCoreV1PodAffinity
     */
    requiredDuringSchedulingIgnoredDuringExecution?: Array<IoK8sApiCoreV1PodAffinityTerm>;
}
/**
 * Defines a set of pods (namely those matching the labelSelector relative to the given namespace(s)) that this pod should be co-located (affinity) or not co-located (anti-affinity) with, where co-located is defined as running on a node whose value of the label with key <topologyKey> matches that of any node on which a pod of the set of pods is running
 * @export
 * @interface IoK8sApiCoreV1PodAffinityTerm
 */
export interface IoK8sApiCoreV1PodAffinityTerm {
    /**
     * A label query over a set of resources, in this case pods. If it's null, this PodAffinityTerm matches with no Pods.
     * @type {IoK8sApimachineryPkgApisMetaV1LabelSelector}
     * @memberof IoK8sApiCoreV1PodAffinityTerm
     */
    labelSelector?: IoK8sApimachineryPkgApisMetaV1LabelSelector;
    /**
     * MatchLabelKeys is a set of pod label keys to select which pods will be taken into consideration. The keys are used to lookup values from the incoming pod labels, those key-value labels are merged with `labelSelector` as `key in (value)` to select the group of existing pods which pods will be taken into consideration for the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming pod labels will be ignored. The default value is empty. The same key is forbidden to exist in both matchLabelKeys and labelSelector. Also, matchLabelKeys cannot be set when labelSelector isn't set. This is an alpha field and requires enabling MatchLabelKeysInPodAffinity feature gate.
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1PodAffinityTerm
     */
    matchLabelKeys?: Array<string>;
    /**
     * MismatchLabelKeys is a set of pod label keys to select which pods will be taken into consideration. The keys are used to lookup values from the incoming pod labels, those key-value labels are merged with `labelSelector` as `key notin (value)` to select the group of existing pods which pods will be taken into consideration for the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming pod labels will be ignored. The default value is empty. The same key is forbidden to exist in both mismatchLabelKeys and labelSelector. Also, mismatchLabelKeys cannot be set when labelSelector isn't set. This is an alpha field and requires enabling MatchLabelKeysInPodAffinity feature gate.
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1PodAffinityTerm
     */
    mismatchLabelKeys?: Array<string>;
    /**
     * A label query over the set of namespaces that the term applies to. The term is applied to the union of the namespaces selected by this field and the ones listed in the namespaces field. null selector and null or empty namespaces list means "this pod's namespace". An empty selector ({}) matches all namespaces.
     * @type {IoK8sApimachineryPkgApisMetaV1LabelSelector}
     * @memberof IoK8sApiCoreV1PodAffinityTerm
     */
    namespaceSelector?: IoK8sApimachineryPkgApisMetaV1LabelSelector;
    /**
     * namespaces specifies a static list of namespace names that the term applies to. The term is applied to the union of the namespaces listed in this field and the ones selected by namespaceSelector. null or empty namespaces list and null namespaceSelector means "this pod's namespace".
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1PodAffinityTerm
     */
    namespaces?: Array<string>;
    /**
     * This pod should be co-located (affinity) or not co-located (anti-affinity) with the pods matching the labelSelector in the specified namespaces, where co-located is defined as running on a node whose value of the label with key topologyKey matches that of any node on which any of the selected pods is running. Empty topologyKey is not allowed.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodAffinityTerm
     */
    topologyKey: string;
}
/**
 * Pod anti affinity is a group of inter pod anti affinity scheduling rules.
 * @export
 * @interface IoK8sApiCoreV1PodAntiAffinity
 */
export interface IoK8sApiCoreV1PodAntiAffinity {
    /**
     * The scheduler will prefer to schedule pods to nodes that satisfy the anti-affinity expressions specified by this field, but it may choose a node that violates one or more of the expressions. The node that is most preferred is the one with the greatest sum of weights, i.e. for each node that meets all of the scheduling requirements (resource request, requiredDuringScheduling anti-affinity expressions, etc.), compute a sum by iterating through the elements of this field and adding "weight" to the sum if the node has pods which matches the corresponding podAffinityTerm; the node(s) with the highest sum are the most preferred.
     * @type {Array<IoK8sApiCoreV1WeightedPodAffinityTerm>}
     * @memberof IoK8sApiCoreV1PodAntiAffinity
     */
    preferredDuringSchedulingIgnoredDuringExecution?: Array<IoK8sApiCoreV1WeightedPodAffinityTerm>;
    /**
     * If the anti-affinity requirements specified by this field are not met at scheduling time, the pod will not be scheduled onto the node. If the anti-affinity requirements specified by this field cease to be met at some point during pod execution (e.g. due to a pod label update), the system may or may not try to eventually evict the pod from its node. When there are multiple elements, the lists of nodes corresponding to each podAffinityTerm are intersected, i.e. all terms must be satisfied.
     * @type {Array<IoK8sApiCoreV1PodAffinityTerm>}
     * @memberof IoK8sApiCoreV1PodAntiAffinity
     */
    requiredDuringSchedulingIgnoredDuringExecution?: Array<IoK8sApiCoreV1PodAffinityTerm>;
}
/**
 * PodCondition contains details for the current condition of this pod.
 * @export
 * @interface IoK8sApiCoreV1PodCondition
 */
export interface IoK8sApiCoreV1PodCondition {
    /**
     * Last time we probed the condition.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodCondition
     */
    lastProbeTime?: string;
    /**
     * Last time the condition transitioned from one status to another.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodCondition
     */
    lastTransitionTime?: string;
    /**
     * Human-readable message indicating details about last transition.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodCondition
     */
    message?: string;
    /**
     * Unique, one-word, CamelCase reason for the condition's last transition.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodCondition
     */
    reason?: string;
    /**
     * Status is the status of the condition. Can be True, False, Unknown. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#pod-conditions
     * @type {string}
     * @memberof IoK8sApiCoreV1PodCondition
     */
    status: string;
    /**
     * Type is the type of the condition. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#pod-conditions
     * @type {string}
     * @memberof IoK8sApiCoreV1PodCondition
     */
    type: string;
}
/**
 * PodDNSConfig defines the DNS parameters of a pod in addition to those generated from DNSPolicy.
 * @export
 * @interface IoK8sApiCoreV1PodDNSConfig
 */
export interface IoK8sApiCoreV1PodDNSConfig {
    /**
     * A list of DNS name server IP addresses. This will be appended to the base nameservers generated from DNSPolicy. Duplicated nameservers will be removed.
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1PodDNSConfig
     */
    nameservers?: Array<string>;
    /**
     * A list of DNS resolver options. This will be merged with the base options generated from DNSPolicy. Duplicated entries will be removed. Resolution options given in Options will override those that appear in the base DNSPolicy.
     * @type {Array<IoK8sApiCoreV1PodDNSConfigOption>}
     * @memberof IoK8sApiCoreV1PodDNSConfig
     */
    options?: Array<IoK8sApiCoreV1PodDNSConfigOption>;
    /**
     * A list of DNS search domains for host-name lookup. This will be appended to the base search paths generated from DNSPolicy. Duplicated search paths will be removed.
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1PodDNSConfig
     */
    searches?: Array<string>;
}
/**
 * PodDNSConfigOption defines DNS resolver options of a pod.
 * @export
 * @interface IoK8sApiCoreV1PodDNSConfigOption
 */
export interface IoK8sApiCoreV1PodDNSConfigOption {
    /**
     * Required.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodDNSConfigOption
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof IoK8sApiCoreV1PodDNSConfigOption
     */
    value?: string;
}
/**
 * PodIP represents a single IP address allocated to the pod.
 * @export
 * @interface IoK8sApiCoreV1PodIP
 */
export interface IoK8sApiCoreV1PodIP {
    /**
     * IP is the IP address assigned to the pod
     * @type {string}
     * @memberof IoK8sApiCoreV1PodIP
     */
    ip: string;
}
/**
 * PodList is a list of Pods.
 * @export
 * @interface IoK8sApiCoreV1PodList
 */
export interface IoK8sApiCoreV1PodList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1PodList
     */
    apiVersion?: string;
    /**
     * List of pods. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md
     * @type {Array<IoK8sApiCoreV1Pod>}
     * @memberof IoK8sApiCoreV1PodList
     */
    items: Array<IoK8sApiCoreV1Pod>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1PodList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1PodList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * PodOS defines the OS parameters of a pod.
 * @export
 * @interface IoK8sApiCoreV1PodOS
 */
export interface IoK8sApiCoreV1PodOS {
    /**
     * Name is the name of the operating system. The currently supported values are linux and windows. Additional value may be defined in future and can be one of: https://github.com/opencontainers/runtime-spec/blob/master/config.md#platform-specific-configuration Clients should expect to handle additional values and treat unrecognized values in this field as os: null
     * @type {string}
     * @memberof IoK8sApiCoreV1PodOS
     */
    name: string;
}
/**
 * PodReadinessGate contains the reference to a pod condition
 * @export
 * @interface IoK8sApiCoreV1PodReadinessGate
 */
export interface IoK8sApiCoreV1PodReadinessGate {
    /**
     * ConditionType refers to a condition in the pod's condition list with matching type.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodReadinessGate
     */
    conditionType: string;
}
/**
 * PodResourceClaim references exactly one ResourceClaim through a ClaimSource. It adds a name to it that uniquely identifies the ResourceClaim inside the Pod. Containers that need access to the ResourceClaim reference it with this name.
 * @export
 * @interface IoK8sApiCoreV1PodResourceClaim
 */
export interface IoK8sApiCoreV1PodResourceClaim {
    /**
     * Name uniquely identifies this resource claim inside the pod. This must be a DNS_LABEL.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodResourceClaim
     */
    name: string;
    /**
     * Source describes where to find the ResourceClaim.
     * @type {IoK8sApiCoreV1ClaimSource}
     * @memberof IoK8sApiCoreV1PodResourceClaim
     */
    source?: IoK8sApiCoreV1ClaimSource;
}
/**
 * PodResourceClaimStatus is stored in the PodStatus for each PodResourceClaim which references a ResourceClaimTemplate. It stores the generated name for the corresponding ResourceClaim.
 * @export
 * @interface IoK8sApiCoreV1PodResourceClaimStatus
 */
export interface IoK8sApiCoreV1PodResourceClaimStatus {
    /**
     * Name uniquely identifies this resource claim inside the pod. This must match the name of an entry in pod.spec.resourceClaims, which implies that the string must be a DNS_LABEL.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodResourceClaimStatus
     */
    name: string;
    /**
     * ResourceClaimName is the name of the ResourceClaim that was generated for the Pod in the namespace of the Pod. It this is unset, then generating a ResourceClaim was not necessary. The pod.spec.resourceClaims entry can be ignored in this case.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodResourceClaimStatus
     */
    resourceClaimName?: string;
}
/**
 * PodSchedulingGate is associated to a Pod to guard its scheduling.
 * @export
 * @interface IoK8sApiCoreV1PodSchedulingGate
 */
export interface IoK8sApiCoreV1PodSchedulingGate {
    /**
     * Name of the scheduling gate. Each scheduling gate must have a unique name field.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodSchedulingGate
     */
    name: string;
}
/**
 * PodSecurityContext holds pod-level security attributes and common container settings. Some fields are also present in container.securityContext.  Field values of container.securityContext take precedence over field values of PodSecurityContext.
 * @export
 * @interface IoK8sApiCoreV1PodSecurityContext
 */
export interface IoK8sApiCoreV1PodSecurityContext {
    /**
     * appArmorProfile is the AppArmor options to use by the containers in this pod. Note that this field cannot be set when spec.os.name is windows.
     * @type {IoK8sApiCoreV1AppArmorProfile}
     * @memberof IoK8sApiCoreV1PodSecurityContext
     */
    appArmorProfile?: IoK8sApiCoreV1AppArmorProfile;
    /**
     * A special supplemental group that applies to all containers in a pod. Some volume types allow the Kubelet to change the ownership of that volume to be owned by the pod:
     * 
     * 1. The owning GID will be the FSGroup 2. The setgid bit is set (new files created in the volume will be owned by FSGroup) 3. The permission bits are OR'd with rw-rw----
     * 
     * If unset, the Kubelet will not modify the ownership and permissions of any volume. Note that this field cannot be set when spec.os.name is windows.
     * @type {number}
     * @memberof IoK8sApiCoreV1PodSecurityContext
     */
    fsGroup?: number;
    /**
     * fsGroupChangePolicy defines behavior of changing ownership and permission of the volume before being exposed inside Pod. This field will only apply to volume types which support fsGroup based ownership(and permissions). It will have no effect on ephemeral volume types such as: secret, configmaps and emptydir. Valid values are "OnRootMismatch" and "Always". If not specified, "Always" is used. Note that this field cannot be set when spec.os.name is windows.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodSecurityContext
     */
    fsGroupChangePolicy?: string;
    /**
     * The GID to run the entrypoint of the container process. Uses runtime default if unset. May also be set in SecurityContext.  If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence for that container. Note that this field cannot be set when spec.os.name is windows.
     * @type {number}
     * @memberof IoK8sApiCoreV1PodSecurityContext
     */
    runAsGroup?: number;
    /**
     * Indicates that the container must run as a non-root user. If true, the Kubelet will validate the image at runtime to ensure that it does not run as UID 0 (root) and fail to start the container if it does. If unset or false, no such validation will be performed. May also be set in SecurityContext.  If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1PodSecurityContext
     */
    runAsNonRoot?: boolean;
    /**
     * The UID to run the entrypoint of the container process. Defaults to user specified in image metadata if unspecified. May also be set in SecurityContext.  If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence for that container. Note that this field cannot be set when spec.os.name is windows.
     * @type {number}
     * @memberof IoK8sApiCoreV1PodSecurityContext
     */
    runAsUser?: number;
    /**
     * The SELinux context to be applied to all containers. If unspecified, the container runtime will allocate a random SELinux context for each container.  May also be set in SecurityContext.  If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence for that container. Note that this field cannot be set when spec.os.name is windows.
     * @type {IoK8sApiCoreV1SELinuxOptions}
     * @memberof IoK8sApiCoreV1PodSecurityContext
     */
    seLinuxOptions?: IoK8sApiCoreV1SELinuxOptions;
    /**
     * The seccomp options to use by the containers in this pod. Note that this field cannot be set when spec.os.name is windows.
     * @type {IoK8sApiCoreV1SeccompProfile}
     * @memberof IoK8sApiCoreV1PodSecurityContext
     */
    seccompProfile?: IoK8sApiCoreV1SeccompProfile;
    /**
     * A list of groups applied to the first process run in each container, in addition to the container's primary GID, the fsGroup (if specified), and group memberships defined in the container image for the uid of the container process. If unspecified, no additional groups are added to any container. Note that group memberships defined in the container image for the uid of the container process are still effective, even if they are not included in this list. Note that this field cannot be set when spec.os.name is windows.
     * @type {Array<number>}
     * @memberof IoK8sApiCoreV1PodSecurityContext
     */
    supplementalGroups?: Array<number>;
    /**
     * Sysctls hold a list of namespaced sysctls used for the pod. Pods with unsupported sysctls (by the container runtime) might fail to launch. Note that this field cannot be set when spec.os.name is windows.
     * @type {Array<IoK8sApiCoreV1Sysctl>}
     * @memberof IoK8sApiCoreV1PodSecurityContext
     */
    sysctls?: Array<IoK8sApiCoreV1Sysctl>;
    /**
     * The Windows specific settings applied to all containers. If unspecified, the options within a container's SecurityContext will be used. If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence. Note that this field cannot be set when spec.os.name is linux.
     * @type {IoK8sApiCoreV1WindowsSecurityContextOptions}
     * @memberof IoK8sApiCoreV1PodSecurityContext
     */
    windowsOptions?: IoK8sApiCoreV1WindowsSecurityContextOptions;
}
/**
 * PodSpec is a description of a pod.
 * @export
 * @interface IoK8sApiCoreV1PodSpec
 */
export interface IoK8sApiCoreV1PodSpec {
    /**
     * Optional duration in seconds the pod may be active on the node relative to StartTime before the system will actively try to mark it failed and kill associated containers. Value must be a positive integer.
     * @type {number}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    activeDeadlineSeconds?: number;
    /**
     * If specified, the pod's scheduling constraints
     * @type {IoK8sApiCoreV1Affinity}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    affinity?: IoK8sApiCoreV1Affinity;
    /**
     * AutomountServiceAccountToken indicates whether a service account token should be automatically mounted.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    automountServiceAccountToken?: boolean;
    /**
     * List of containers belonging to the pod. Containers cannot currently be added or removed. There must be at least one container in a Pod. Cannot be updated.
     * @type {Array<IoK8sApiCoreV1Container>}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    containers: Array<IoK8sApiCoreV1Container>;
    /**
     * Specifies the DNS parameters of a pod. Parameters specified here will be merged to the generated DNS configuration based on DNSPolicy.
     * @type {IoK8sApiCoreV1PodDNSConfig}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    dnsConfig?: IoK8sApiCoreV1PodDNSConfig;
    /**
     * Set DNS policy for the pod. Defaults to "ClusterFirst". Valid values are 'ClusterFirstWithHostNet', 'ClusterFirst', 'Default' or 'None'. DNS parameters given in DNSConfig will be merged with the policy selected with DNSPolicy. To have DNS options set along with hostNetwork, you have to specify DNS policy explicitly to 'ClusterFirstWithHostNet'.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    dnsPolicy?: string;
    /**
     * EnableServiceLinks indicates whether information about services should be injected into pod's environment variables, matching the syntax of Docker links. Optional: Defaults to true.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    enableServiceLinks?: boolean;
    /**
     * List of ephemeral containers run in this pod. Ephemeral containers may be run in an existing pod to perform user-initiated actions such as debugging. This list cannot be specified when creating a pod, and it cannot be modified by updating the pod spec. In order to add an ephemeral container to an existing pod, use the pod's ephemeralcontainers subresource.
     * @type {Array<IoK8sApiCoreV1EphemeralContainer>}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    ephemeralContainers?: Array<IoK8sApiCoreV1EphemeralContainer>;
    /**
     * HostAliases is an optional list of hosts and IPs that will be injected into the pod's hosts file if specified.
     * @type {Array<IoK8sApiCoreV1HostAlias>}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    hostAliases?: Array<IoK8sApiCoreV1HostAlias>;
    /**
     * Use the host's ipc namespace. Optional: Default to false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    hostIPC?: boolean;
    /**
     * Host networking requested for this pod. Use the host's network namespace. If this option is set, the ports that will be used must be specified. Default to false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    hostNetwork?: boolean;
    /**
     * Use the host's pid namespace. Optional: Default to false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    hostPID?: boolean;
    /**
     * Use the host's user namespace. Optional: Default to true. If set to true or not present, the pod will be run in the host user namespace, useful for when the pod needs a feature only available to the host user namespace, such as loading a kernel module with CAP_SYS_MODULE. When set to false, a new userns is created for the pod. Setting false is useful for mitigating container breakout vulnerabilities even allowing users to run their containers as root without actually having root privileges on the host. This field is alpha-level and is only honored by servers that enable the UserNamespacesSupport feature.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    hostUsers?: boolean;
    /**
     * Specifies the hostname of the Pod If not specified, the pod's hostname will be set to a system-defined value.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    hostname?: string;
    /**
     * ImagePullSecrets is an optional list of references to secrets in the same namespace to use for pulling any of the images used by this PodSpec. If specified, these secrets will be passed to individual puller implementations for them to use. More info: https://kubernetes.io/docs/concepts/containers/images#specifying-imagepullsecrets-on-a-pod
     * @type {Array<IoK8sApiCoreV1LocalObjectReference>}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    imagePullSecrets?: Array<IoK8sApiCoreV1LocalObjectReference>;
    /**
     * List of initialization containers belonging to the pod. Init containers are executed in order prior to containers being started. If any init container fails, the pod is considered to have failed and is handled according to its restartPolicy. The name for an init container or normal container must be unique among all containers. Init containers may not have Lifecycle actions, Readiness probes, Liveness probes, or Startup probes. The resourceRequirements of an init container are taken into account during scheduling by finding the highest request/limit for each resource type, and then using the max of of that value or the sum of the normal containers. Limits are applied to init containers in a similar fashion. Init containers cannot currently be added or removed. Cannot be updated. More info: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/
     * @type {Array<IoK8sApiCoreV1Container>}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    initContainers?: Array<IoK8sApiCoreV1Container>;
    /**
     * NodeName is a request to schedule this pod onto a specific node. If it is non-empty, the scheduler simply schedules this pod onto that node, assuming that it fits resource requirements.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    nodeName?: string;
    /**
     * NodeSelector is a selector which must be true for the pod to fit on a node. Selector which must match a node's labels for the pod to be scheduled on that node. More info: https://kubernetes.io/docs/concepts/configuration/assign-pod-node/
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    nodeSelector?: { [key: string]: string; };
    /**
     * Specifies the OS of the containers in the pod. Some pod and container fields are restricted if this is set.
     * 
     * If the OS field is set to linux, the following fields must be unset: -securityContext.windowsOptions
     * 
     * If the OS field is set to windows, following fields must be unset: - spec.hostPID - spec.hostIPC - spec.hostUsers - spec.securityContext.appArmorProfile - spec.securityContext.seLinuxOptions - spec.securityContext.seccompProfile - spec.securityContext.fsGroup - spec.securityContext.fsGroupChangePolicy - spec.securityContext.sysctls - spec.shareProcessNamespace - spec.securityContext.runAsUser - spec.securityContext.runAsGroup - spec.securityContext.supplementalGroups - spec.containers[*].securityContext.appArmorProfile - spec.containers[*].securityContext.seLinuxOptions - spec.containers[*].securityContext.seccompProfile - spec.containers[*].securityContext.capabilities - spec.containers[*].securityContext.readOnlyRootFilesystem - spec.containers[*].securityContext.privileged - spec.containers[*].securityContext.allowPrivilegeEscalation - spec.containers[*].securityContext.procMount - spec.containers[*].securityContext.runAsUser - spec.containers[*].securityContext.runAsGroup
     * @type {IoK8sApiCoreV1PodOS}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    os?: IoK8sApiCoreV1PodOS;
    /**
     * Overhead represents the resource overhead associated with running a pod for a given RuntimeClass. This field will be autopopulated at admission time by the RuntimeClass admission controller. If the RuntimeClass admission controller is enabled, overhead must not be set in Pod create requests. The RuntimeClass admission controller will reject Pod create requests which have the overhead already set. If RuntimeClass is configured and selected in the PodSpec, Overhead will be set to the value defined in the corresponding RuntimeClass, otherwise it will remain unset and treated as zero. More info: https://git.k8s.io/enhancements/keps/sig-node/688-pod-overhead/README.md
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    overhead?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * PreemptionPolicy is the Policy for preempting pods with lower priority. One of Never, PreemptLowerPriority. Defaults to PreemptLowerPriority if unset.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    preemptionPolicy?: string;
    /**
     * The priority value. Various system components use this field to find the priority of the pod. When Priority Admission Controller is enabled, it prevents users from setting this field. The admission controller populates this field from PriorityClassName. The higher the value, the higher the priority.
     * @type {number}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    priority?: number;
    /**
     * If specified, indicates the pod's priority. "system-node-critical" and "system-cluster-critical" are two special keywords which indicate the highest priorities with the former being the highest priority. Any other name must be defined by creating a PriorityClass object with that name. If not specified, the pod priority will be default or zero if there is no default.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    priorityClassName?: string;
    /**
     * If specified, all readiness gates will be evaluated for pod readiness. A pod is ready when all its containers are ready AND all conditions specified in the readiness gates have status equal to "True" More info: https://git.k8s.io/enhancements/keps/sig-network/580-pod-readiness-gates
     * @type {Array<IoK8sApiCoreV1PodReadinessGate>}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    readinessGates?: Array<IoK8sApiCoreV1PodReadinessGate>;
    /**
     * ResourceClaims defines which ResourceClaims must be allocated and reserved before the Pod is allowed to start. The resources will be made available to those containers which consume them by name.
     * 
     * This is an alpha field and requires enabling the DynamicResourceAllocation feature gate.
     * 
     * This field is immutable.
     * @type {Array<IoK8sApiCoreV1PodResourceClaim>}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    resourceClaims?: Array<IoK8sApiCoreV1PodResourceClaim>;
    /**
     * Restart policy for all containers within the pod. One of Always, OnFailure, Never. In some contexts, only a subset of those values may be permitted. Default to Always. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#restart-policy
     * @type {string}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    restartPolicy?: string;
    /**
     * RuntimeClassName refers to a RuntimeClass object in the node.k8s.io group, which should be used to run this pod.  If no RuntimeClass resource matches the named class, the pod will not be run. If unset or empty, the "legacy" RuntimeClass will be used, which is an implicit class with an empty definition that uses the default runtime handler. More info: https://git.k8s.io/enhancements/keps/sig-node/585-runtime-class
     * @type {string}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    runtimeClassName?: string;
    /**
     * If specified, the pod will be dispatched by specified scheduler. If not specified, the pod will be dispatched by default scheduler.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    schedulerName?: string;
    /**
     * SchedulingGates is an opaque list of values that if specified will block scheduling the pod. If schedulingGates is not empty, the pod will stay in the SchedulingGated state and the scheduler will not attempt to schedule the pod.
     * 
     * SchedulingGates can only be set at pod creation time, and be removed only afterwards.
     * @type {Array<IoK8sApiCoreV1PodSchedulingGate>}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    schedulingGates?: Array<IoK8sApiCoreV1PodSchedulingGate>;
    /**
     * SecurityContext holds pod-level security attributes and common container settings. Optional: Defaults to empty.  See type description for default values of each field.
     * @type {IoK8sApiCoreV1PodSecurityContext}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    securityContext?: IoK8sApiCoreV1PodSecurityContext;
    /**
     * DeprecatedServiceAccount is a deprecated alias for ServiceAccountName. Deprecated: Use serviceAccountName instead.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    serviceAccount?: string;
    /**
     * ServiceAccountName is the name of the ServiceAccount to use to run this pod. More info: https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/
     * @type {string}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    serviceAccountName?: string;
    /**
     * If true the pod's hostname will be configured as the pod's FQDN, rather than the leaf name (the default). In Linux containers, this means setting the FQDN in the hostname field of the kernel (the nodename field of struct utsname). In Windows containers, this means setting the registry value of hostname for the registry key HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters to FQDN. If a pod does not have FQDN, this has no effect. Default to false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    setHostnameAsFQDN?: boolean;
    /**
     * Share a single process namespace between all of the containers in a pod. When this is set containers will be able to view and signal processes from other containers in the same pod, and the first process in each container will not be assigned PID 1. HostPID and ShareProcessNamespace cannot both be set. Optional: Default to false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    shareProcessNamespace?: boolean;
    /**
     * If specified, the fully qualified Pod hostname will be "<hostname>.<subdomain>.<pod namespace>.svc.<cluster domain>". If not specified, the pod will not have a domainname at all.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    subdomain?: string;
    /**
     * Optional duration in seconds the pod needs to terminate gracefully. May be decreased in delete request. Value must be non-negative integer. The value zero indicates stop immediately via the kill signal (no opportunity to shut down). If this value is nil, the default grace period will be used instead. The grace period is the duration in seconds after the processes running in the pod are sent a termination signal and the time when the processes are forcibly halted with a kill signal. Set this value longer than the expected cleanup time for your process. Defaults to 30 seconds.
     * @type {number}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    terminationGracePeriodSeconds?: number;
    /**
     * If specified, the pod's tolerations.
     * @type {Array<IoK8sApiCoreV1Toleration>}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    tolerations?: Array<IoK8sApiCoreV1Toleration>;
    /**
     * TopologySpreadConstraints describes how a group of pods ought to spread across topology domains. Scheduler will schedule pods in a way which abides by the constraints. All topologySpreadConstraints are ANDed.
     * @type {Array<IoK8sApiCoreV1TopologySpreadConstraint>}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    topologySpreadConstraints?: Array<IoK8sApiCoreV1TopologySpreadConstraint>;
    /**
     * List of volumes that can be mounted by containers belonging to the pod. More info: https://kubernetes.io/docs/concepts/storage/volumes
     * @type {Array<IoK8sApiCoreV1Volume>}
     * @memberof IoK8sApiCoreV1PodSpec
     */
    volumes?: Array<IoK8sApiCoreV1Volume>;
}
/**
 * PodStatus represents information about the status of a pod. Status may trail the actual state of a system, especially if the node that hosts the pod cannot contact the control plane.
 * @export
 * @interface IoK8sApiCoreV1PodStatus
 */
export interface IoK8sApiCoreV1PodStatus {
    /**
     * Current service state of pod. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#pod-conditions
     * @type {Array<IoK8sApiCoreV1PodCondition>}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    conditions?: Array<IoK8sApiCoreV1PodCondition>;
    /**
     * The list has one entry per container in the manifest. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#pod-and-container-status
     * @type {Array<IoK8sApiCoreV1ContainerStatus>}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    containerStatuses?: Array<IoK8sApiCoreV1ContainerStatus>;
    /**
     * Status for any ephemeral containers that have run in this pod.
     * @type {Array<IoK8sApiCoreV1ContainerStatus>}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    ephemeralContainerStatuses?: Array<IoK8sApiCoreV1ContainerStatus>;
    /**
     * hostIP holds the IP address of the host to which the pod is assigned. Empty if the pod has not started yet. A pod can be assigned to a node that has a problem in kubelet which in turns mean that HostIP will not be updated even if there is a node is assigned to pod
     * @type {string}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    hostIP?: string;
    /**
     * hostIPs holds the IP addresses allocated to the host. If this field is specified, the first entry must match the hostIP field. This list is empty if the pod has not started yet. A pod can be assigned to a node that has a problem in kubelet which in turns means that HostIPs will not be updated even if there is a node is assigned to this pod.
     * @type {Array<IoK8sApiCoreV1HostIP>}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    hostIPs?: Array<IoK8sApiCoreV1HostIP>;
    /**
     * The list has one entry per init container in the manifest. The most recent successful init container will have ready = true, the most recently started container will have startTime set. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#pod-and-container-status
     * @type {Array<IoK8sApiCoreV1ContainerStatus>}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    initContainerStatuses?: Array<IoK8sApiCoreV1ContainerStatus>;
    /**
     * A human readable message indicating details about why the pod is in this condition.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    message?: string;
    /**
     * nominatedNodeName is set only when this pod preempts other pods on the node, but it cannot be scheduled right away as preemption victims receive their graceful termination periods. This field does not guarantee that the pod will be scheduled on this node. Scheduler may decide to place the pod elsewhere if other nodes become available sooner. Scheduler may also decide to give the resources on this node to a higher priority pod that is created after preemption. As a result, this field may be different than PodSpec.nodeName when the pod is scheduled.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    nominatedNodeName?: string;
    /**
     * The phase of a Pod is a simple, high-level summary of where the Pod is in its lifecycle. The conditions array, the reason and message fields, and the individual container status arrays contain more detail about the pod's status. There are five possible phase values:
     * 
     * Pending: The pod has been accepted by the Kubernetes system, but one or more of the container images has not been created. This includes time before being scheduled as well as time spent downloading images over the network, which could take a while. Running: The pod has been bound to a node, and all of the containers have been created. At least one container is still running, or is in the process of starting or restarting. Succeeded: All containers in the pod have terminated in success, and will not be restarted. Failed: All containers in the pod have terminated, and at least one container has terminated in failure. The container either exited with non-zero status or was terminated by the system. Unknown: For some reason the state of the pod could not be obtained, typically due to an error in communicating with the host of the pod.
     * 
     * More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#pod-phase
     * @type {string}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    phase?: string;
    /**
     * podIP address allocated to the pod. Routable at least within the cluster. Empty if not yet allocated.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    podIP?: string;
    /**
     * podIPs holds the IP addresses allocated to the pod. If this field is specified, the 0th entry must match the podIP field. Pods may be allocated at most 1 value for each of IPv4 and IPv6. This list is empty if no IPs have been allocated yet.
     * @type {Array<IoK8sApiCoreV1PodIP>}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    podIPs?: Array<IoK8sApiCoreV1PodIP>;
    /**
     * The Quality of Service (QOS) classification assigned to the pod based on resource requirements See PodQOSClass type for available QOS classes More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/#quality-of-service-classes
     * @type {string}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    qosClass?: string;
    /**
     * A brief CamelCase message indicating details about why the pod is in this state. e.g. 'Evicted'
     * @type {string}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    reason?: string;
    /**
     * Status of resources resize desired for pod's containers. It is empty if no resources resize is pending. Any changes to container resources will automatically set this to "Proposed"
     * @type {string}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    resize?: string;
    /**
     * Status of resource claims.
     * @type {Array<IoK8sApiCoreV1PodResourceClaimStatus>}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    resourceClaimStatuses?: Array<IoK8sApiCoreV1PodResourceClaimStatus>;
    /**
     * RFC 3339 date and time at which the object was acknowledged by the Kubelet. This is before the Kubelet pulled the container image(s) for the pod.
     * @type {string}
     * @memberof IoK8sApiCoreV1PodStatus
     */
    startTime?: string;
}
/**
 * PodTemplate describes a template for creating copies of a predefined pod.
 * @export
 * @interface IoK8sApiCoreV1PodTemplate
 */
export interface IoK8sApiCoreV1PodTemplate {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1PodTemplate
     */
    apiVersion?: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1PodTemplate
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1PodTemplate
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * Template defines the pods that will be created from this pod template. https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1PodTemplateSpec}
     * @memberof IoK8sApiCoreV1PodTemplate
     */
    template?: IoK8sApiCoreV1PodTemplateSpec;
}
/**
 * PodTemplateList is a list of PodTemplates.
 * @export
 * @interface IoK8sApiCoreV1PodTemplateList
 */
export interface IoK8sApiCoreV1PodTemplateList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1PodTemplateList
     */
    apiVersion?: string;
    /**
     * List of pod templates
     * @type {Array<IoK8sApiCoreV1PodTemplate>}
     * @memberof IoK8sApiCoreV1PodTemplateList
     */
    items: Array<IoK8sApiCoreV1PodTemplate>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1PodTemplateList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1PodTemplateList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * PodTemplateSpec describes the data a pod should have when created from a template
 * @export
 * @interface IoK8sApiCoreV1PodTemplateSpec
 */
export interface IoK8sApiCoreV1PodTemplateSpec {
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1PodTemplateSpec
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * Specification of the desired behavior of the pod. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1PodSpec}
     * @memberof IoK8sApiCoreV1PodTemplateSpec
     */
    spec?: IoK8sApiCoreV1PodSpec;
}
/**
 * 
 * @export
 * @interface IoK8sApiCoreV1PortStatus
 */
export interface IoK8sApiCoreV1PortStatus {
    /**
     * Error is to record the problem with the service port The format of the error shall comply with the following rules: - built-in error values shall be specified in this file and those shall use
     *   CamelCase names
     * - cloud provider specific error values must have names that comply with the
     *   format foo.example.com/CamelCase.
     * @type {string}
     * @memberof IoK8sApiCoreV1PortStatus
     */
    error?: string;
    /**
     * Port is the port number of the service port of which status is recorded here
     * @type {number}
     * @memberof IoK8sApiCoreV1PortStatus
     */
    port: number;
    /**
     * Protocol is the protocol of the service port of which status is recorded here The supported values are: "TCP", "UDP", "SCTP"
     * @type {string}
     * @memberof IoK8sApiCoreV1PortStatus
     */
    protocol: string;
}
/**
 * PortworxVolumeSource represents a Portworx volume resource.
 * @export
 * @interface IoK8sApiCoreV1PortworxVolumeSource
 */
export interface IoK8sApiCoreV1PortworxVolumeSource {
    /**
     * fSType represents the filesystem type to mount Must be a filesystem type supported by the host operating system. Ex. "ext4", "xfs". Implicitly inferred to be "ext4" if unspecified.
     * @type {string}
     * @memberof IoK8sApiCoreV1PortworxVolumeSource
     */
    fsType?: string;
    /**
     * readOnly defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1PortworxVolumeSource
     */
    readOnly?: boolean;
    /**
     * volumeID uniquely identifies a Portworx volume
     * @type {string}
     * @memberof IoK8sApiCoreV1PortworxVolumeSource
     */
    volumeID: string;
}
/**
 * An empty preferred scheduling term matches all objects with implicit weight 0 (i.e. it's a no-op). A null preferred scheduling term matches no objects (i.e. is also a no-op).
 * @export
 * @interface IoK8sApiCoreV1PreferredSchedulingTerm
 */
export interface IoK8sApiCoreV1PreferredSchedulingTerm {
    /**
     * A node selector term, associated with the corresponding weight.
     * @type {IoK8sApiCoreV1NodeSelectorTerm}
     * @memberof IoK8sApiCoreV1PreferredSchedulingTerm
     */
    preference: IoK8sApiCoreV1NodeSelectorTerm;
    /**
     * Weight associated with matching the corresponding nodeSelectorTerm, in the range 1-100.
     * @type {number}
     * @memberof IoK8sApiCoreV1PreferredSchedulingTerm
     */
    weight: number;
}
/**
 * Probe describes a health check to be performed against a container to determine whether it is alive or ready to receive traffic.
 * @export
 * @interface IoK8sApiCoreV1Probe
 */
export interface IoK8sApiCoreV1Probe {
    /**
     * Exec specifies the action to take.
     * @type {IoK8sApiCoreV1ExecAction}
     * @memberof IoK8sApiCoreV1Probe
     */
    exec?: IoK8sApiCoreV1ExecAction;
    /**
     * Minimum consecutive failures for the probe to be considered failed after having succeeded. Defaults to 3. Minimum value is 1.
     * @type {number}
     * @memberof IoK8sApiCoreV1Probe
     */
    failureThreshold?: number;
    /**
     * GRPC specifies an action involving a GRPC port.
     * @type {IoK8sApiCoreV1GRPCAction}
     * @memberof IoK8sApiCoreV1Probe
     */
    grpc?: IoK8sApiCoreV1GRPCAction;
    /**
     * HTTPGet specifies the http request to perform.
     * @type {IoK8sApiCoreV1HTTPGetAction}
     * @memberof IoK8sApiCoreV1Probe
     */
    httpGet?: IoK8sApiCoreV1HTTPGetAction;
    /**
     * Number of seconds after the container has started before liveness probes are initiated. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#container-probes
     * @type {number}
     * @memberof IoK8sApiCoreV1Probe
     */
    initialDelaySeconds?: number;
    /**
     * How often (in seconds) to perform the probe. Default to 10 seconds. Minimum value is 1.
     * @type {number}
     * @memberof IoK8sApiCoreV1Probe
     */
    periodSeconds?: number;
    /**
     * Minimum consecutive successes for the probe to be considered successful after having failed. Defaults to 1. Must be 1 for liveness and startup. Minimum value is 1.
     * @type {number}
     * @memberof IoK8sApiCoreV1Probe
     */
    successThreshold?: number;
    /**
     * TCPSocket specifies an action involving a TCP port.
     * @type {IoK8sApiCoreV1TCPSocketAction}
     * @memberof IoK8sApiCoreV1Probe
     */
    tcpSocket?: IoK8sApiCoreV1TCPSocketAction;
    /**
     * Optional duration in seconds the pod needs to terminate gracefully upon probe failure. The grace period is the duration in seconds after the processes running in the pod are sent a termination signal and the time when the processes are forcibly halted with a kill signal. Set this value longer than the expected cleanup time for your process. If this value is nil, the pod's terminationGracePeriodSeconds will be used. Otherwise, this value overrides the value provided by the pod spec. Value must be non-negative integer. The value zero indicates stop immediately via the kill signal (no opportunity to shut down). This is a beta field and requires enabling ProbeTerminationGracePeriod feature gate. Minimum value is 1. spec.terminationGracePeriodSeconds is used if unset.
     * @type {number}
     * @memberof IoK8sApiCoreV1Probe
     */
    terminationGracePeriodSeconds?: number;
    /**
     * Number of seconds after which the probe times out. Defaults to 1 second. Minimum value is 1. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#container-probes
     * @type {number}
     * @memberof IoK8sApiCoreV1Probe
     */
    timeoutSeconds?: number;
}
/**
 * Represents a projected volume source
 * @export
 * @interface IoK8sApiCoreV1ProjectedVolumeSource
 */
export interface IoK8sApiCoreV1ProjectedVolumeSource {
    /**
     * defaultMode are the mode bits used to set permissions on created files by default. Must be an octal value between 0000 and 0777 or a decimal value between 0 and 511. YAML accepts both octal and decimal values, JSON requires decimal values for mode bits. Directories within the path are not affected by this setting. This might be in conflict with other options that affect the file mode, like fsGroup, and the result can be other mode bits set.
     * @type {number}
     * @memberof IoK8sApiCoreV1ProjectedVolumeSource
     */
    defaultMode?: number;
    /**
     * sources is the list of volume projections
     * @type {Array<IoK8sApiCoreV1VolumeProjection>}
     * @memberof IoK8sApiCoreV1ProjectedVolumeSource
     */
    sources?: Array<IoK8sApiCoreV1VolumeProjection>;
}
/**
 * Represents a Quobyte mount that lasts the lifetime of a pod. Quobyte volumes do not support ownership management or SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1QuobyteVolumeSource
 */
export interface IoK8sApiCoreV1QuobyteVolumeSource {
    /**
     * group to map volume access to Default is no group
     * @type {string}
     * @memberof IoK8sApiCoreV1QuobyteVolumeSource
     */
    group?: string;
    /**
     * readOnly here will force the Quobyte volume to be mounted with read-only permissions. Defaults to false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1QuobyteVolumeSource
     */
    readOnly?: boolean;
    /**
     * registry represents a single or multiple Quobyte Registry services specified as a string as host:port pair (multiple entries are separated with commas) which acts as the central registry for volumes
     * @type {string}
     * @memberof IoK8sApiCoreV1QuobyteVolumeSource
     */
    registry: string;
    /**
     * tenant owning the given Quobyte volume in the Backend Used with dynamically provisioned Quobyte volumes, value is set by the plugin
     * @type {string}
     * @memberof IoK8sApiCoreV1QuobyteVolumeSource
     */
    tenant?: string;
    /**
     * user to map volume access to Defaults to serivceaccount user
     * @type {string}
     * @memberof IoK8sApiCoreV1QuobyteVolumeSource
     */
    user?: string;
    /**
     * volume is a string that references an already created Quobyte volume by name.
     * @type {string}
     * @memberof IoK8sApiCoreV1QuobyteVolumeSource
     */
    volume: string;
}
/**
 * Represents a Rados Block Device mount that lasts the lifetime of a pod. RBD volumes support ownership management and SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1RBDPersistentVolumeSource
 */
export interface IoK8sApiCoreV1RBDPersistentVolumeSource {
    /**
     * fsType is the filesystem type of the volume that you want to mount. Tip: Ensure that the filesystem type is supported by the host operating system. Examples: "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified. More info: https://kubernetes.io/docs/concepts/storage/volumes#rbd
     * @type {string}
     * @memberof IoK8sApiCoreV1RBDPersistentVolumeSource
     */
    fsType?: string;
    /**
     * image is the rados image name. More info: https://examples.k8s.io/volumes/rbd/README.md#how-to-use-it
     * @type {string}
     * @memberof IoK8sApiCoreV1RBDPersistentVolumeSource
     */
    image: string;
    /**
     * keyring is the path to key ring for RBDUser. Default is /etc/ceph/keyring. More info: https://examples.k8s.io/volumes/rbd/README.md#how-to-use-it
     * @type {string}
     * @memberof IoK8sApiCoreV1RBDPersistentVolumeSource
     */
    keyring?: string;
    /**
     * monitors is a collection of Ceph monitors. More info: https://examples.k8s.io/volumes/rbd/README.md#how-to-use-it
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1RBDPersistentVolumeSource
     */
    monitors: Array<string>;
    /**
     * pool is the rados pool name. Default is rbd. More info: https://examples.k8s.io/volumes/rbd/README.md#how-to-use-it
     * @type {string}
     * @memberof IoK8sApiCoreV1RBDPersistentVolumeSource
     */
    pool?: string;
    /**
     * readOnly here will force the ReadOnly setting in VolumeMounts. Defaults to false. More info: https://examples.k8s.io/volumes/rbd/README.md#how-to-use-it
     * @type {boolean}
     * @memberof IoK8sApiCoreV1RBDPersistentVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretRef is name of the authentication secret for RBDUser. If provided overrides keyring. Default is nil. More info: https://examples.k8s.io/volumes/rbd/README.md#how-to-use-it
     * @type {IoK8sApiCoreV1SecretReference}
     * @memberof IoK8sApiCoreV1RBDPersistentVolumeSource
     */
    secretRef?: IoK8sApiCoreV1SecretReference;
    /**
     * user is the rados user name. Default is admin. More info: https://examples.k8s.io/volumes/rbd/README.md#how-to-use-it
     * @type {string}
     * @memberof IoK8sApiCoreV1RBDPersistentVolumeSource
     */
    user?: string;
}
/**
 * Represents a Rados Block Device mount that lasts the lifetime of a pod. RBD volumes support ownership management and SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1RBDVolumeSource
 */
export interface IoK8sApiCoreV1RBDVolumeSource {
    /**
     * fsType is the filesystem type of the volume that you want to mount. Tip: Ensure that the filesystem type is supported by the host operating system. Examples: "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified. More info: https://kubernetes.io/docs/concepts/storage/volumes#rbd
     * @type {string}
     * @memberof IoK8sApiCoreV1RBDVolumeSource
     */
    fsType?: string;
    /**
     * image is the rados image name. More info: https://examples.k8s.io/volumes/rbd/README.md#how-to-use-it
     * @type {string}
     * @memberof IoK8sApiCoreV1RBDVolumeSource
     */
    image: string;
    /**
     * keyring is the path to key ring for RBDUser. Default is /etc/ceph/keyring. More info: https://examples.k8s.io/volumes/rbd/README.md#how-to-use-it
     * @type {string}
     * @memberof IoK8sApiCoreV1RBDVolumeSource
     */
    keyring?: string;
    /**
     * monitors is a collection of Ceph monitors. More info: https://examples.k8s.io/volumes/rbd/README.md#how-to-use-it
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1RBDVolumeSource
     */
    monitors: Array<string>;
    /**
     * pool is the rados pool name. Default is rbd. More info: https://examples.k8s.io/volumes/rbd/README.md#how-to-use-it
     * @type {string}
     * @memberof IoK8sApiCoreV1RBDVolumeSource
     */
    pool?: string;
    /**
     * readOnly here will force the ReadOnly setting in VolumeMounts. Defaults to false. More info: https://examples.k8s.io/volumes/rbd/README.md#how-to-use-it
     * @type {boolean}
     * @memberof IoK8sApiCoreV1RBDVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretRef is name of the authentication secret for RBDUser. If provided overrides keyring. Default is nil. More info: https://examples.k8s.io/volumes/rbd/README.md#how-to-use-it
     * @type {IoK8sApiCoreV1LocalObjectReference}
     * @memberof IoK8sApiCoreV1RBDVolumeSource
     */
    secretRef?: IoK8sApiCoreV1LocalObjectReference;
    /**
     * user is the rados user name. Default is admin. More info: https://examples.k8s.io/volumes/rbd/README.md#how-to-use-it
     * @type {string}
     * @memberof IoK8sApiCoreV1RBDVolumeSource
     */
    user?: string;
}
/**
 * ReplicationController represents the configuration of a replication controller.
 * @export
 * @interface IoK8sApiCoreV1ReplicationController
 */
export interface IoK8sApiCoreV1ReplicationController {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1ReplicationController
     */
    apiVersion?: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1ReplicationController
     */
    kind?: string;
    /**
     * If the Labels of a ReplicationController are empty, they are defaulted to be the same as the Pod(s) that the replication controller manages. Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1ReplicationController
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * Spec defines the specification of the desired behavior of the replication controller. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1ReplicationControllerSpec}
     * @memberof IoK8sApiCoreV1ReplicationController
     */
    spec?: IoK8sApiCoreV1ReplicationControllerSpec;
    /**
     * Status is the most recently observed status of the replication controller. This data may be out of date by some window of time. Populated by the system. Read-only. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1ReplicationControllerStatus}
     * @memberof IoK8sApiCoreV1ReplicationController
     */
    status?: IoK8sApiCoreV1ReplicationControllerStatus;
}
/**
 * ReplicationControllerCondition describes the state of a replication controller at a certain point.
 * @export
 * @interface IoK8sApiCoreV1ReplicationControllerCondition
 */
export interface IoK8sApiCoreV1ReplicationControllerCondition {
    /**
     * The last time the condition transitioned from one status to another.
     * @type {string}
     * @memberof IoK8sApiCoreV1ReplicationControllerCondition
     */
    lastTransitionTime?: string;
    /**
     * A human readable message indicating details about the transition.
     * @type {string}
     * @memberof IoK8sApiCoreV1ReplicationControllerCondition
     */
    message?: string;
    /**
     * The reason for the condition's last transition.
     * @type {string}
     * @memberof IoK8sApiCoreV1ReplicationControllerCondition
     */
    reason?: string;
    /**
     * Status of the condition, one of True, False, Unknown.
     * @type {string}
     * @memberof IoK8sApiCoreV1ReplicationControllerCondition
     */
    status: string;
    /**
     * Type of replication controller condition.
     * @type {string}
     * @memberof IoK8sApiCoreV1ReplicationControllerCondition
     */
    type: string;
}
/**
 * ReplicationControllerList is a collection of replication controllers.
 * @export
 * @interface IoK8sApiCoreV1ReplicationControllerList
 */
export interface IoK8sApiCoreV1ReplicationControllerList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1ReplicationControllerList
     */
    apiVersion?: string;
    /**
     * List of replication controllers. More info: https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller
     * @type {Array<IoK8sApiCoreV1ReplicationController>}
     * @memberof IoK8sApiCoreV1ReplicationControllerList
     */
    items: Array<IoK8sApiCoreV1ReplicationController>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1ReplicationControllerList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1ReplicationControllerList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * ReplicationControllerSpec is the specification of a replication controller.
 * @export
 * @interface IoK8sApiCoreV1ReplicationControllerSpec
 */
export interface IoK8sApiCoreV1ReplicationControllerSpec {
    /**
     * Minimum number of seconds for which a newly created pod should be ready without any of its container crashing, for it to be considered available. Defaults to 0 (pod will be considered available as soon as it is ready)
     * @type {number}
     * @memberof IoK8sApiCoreV1ReplicationControllerSpec
     */
    minReadySeconds?: number;
    /**
     * Replicas is the number of desired replicas. This is a pointer to distinguish between explicit zero and unspecified. Defaults to 1. More info: https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller#what-is-a-replicationcontroller
     * @type {number}
     * @memberof IoK8sApiCoreV1ReplicationControllerSpec
     */
    replicas?: number;
    /**
     * Selector is a label query over pods that should match the Replicas count. If Selector is empty, it is defaulted to the labels present on the Pod template. Label keys and values that must match in order to be controlled by this replication controller, if empty defaulted to labels on Pod template. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApiCoreV1ReplicationControllerSpec
     */
    selector?: { [key: string]: string; };
    /**
     * Template is the object that describes the pod that will be created if insufficient replicas are detected. This takes precedence over a TemplateRef. The only allowed template.spec.restartPolicy value is "Always". More info: https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller#pod-template
     * @type {IoK8sApiCoreV1PodTemplateSpec}
     * @memberof IoK8sApiCoreV1ReplicationControllerSpec
     */
    template?: IoK8sApiCoreV1PodTemplateSpec;
}
/**
 * ReplicationControllerStatus represents the current status of a replication controller.
 * @export
 * @interface IoK8sApiCoreV1ReplicationControllerStatus
 */
export interface IoK8sApiCoreV1ReplicationControllerStatus {
    /**
     * The number of available replicas (ready for at least minReadySeconds) for this replication controller.
     * @type {number}
     * @memberof IoK8sApiCoreV1ReplicationControllerStatus
     */
    availableReplicas?: number;
    /**
     * Represents the latest available observations of a replication controller's current state.
     * @type {Array<IoK8sApiCoreV1ReplicationControllerCondition>}
     * @memberof IoK8sApiCoreV1ReplicationControllerStatus
     */
    conditions?: Array<IoK8sApiCoreV1ReplicationControllerCondition>;
    /**
     * The number of pods that have labels matching the labels of the pod template of the replication controller.
     * @type {number}
     * @memberof IoK8sApiCoreV1ReplicationControllerStatus
     */
    fullyLabeledReplicas?: number;
    /**
     * ObservedGeneration reflects the generation of the most recently observed replication controller.
     * @type {number}
     * @memberof IoK8sApiCoreV1ReplicationControllerStatus
     */
    observedGeneration?: number;
    /**
     * The number of ready replicas for this replication controller.
     * @type {number}
     * @memberof IoK8sApiCoreV1ReplicationControllerStatus
     */
    readyReplicas?: number;
    /**
     * Replicas is the most recently observed number of replicas. More info: https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller#what-is-a-replicationcontroller
     * @type {number}
     * @memberof IoK8sApiCoreV1ReplicationControllerStatus
     */
    replicas: number;
}
/**
 * ResourceClaim references one entry in PodSpec.ResourceClaims.
 * @export
 * @interface IoK8sApiCoreV1ResourceClaim
 */
export interface IoK8sApiCoreV1ResourceClaim {
    /**
     * Name must match the name of one entry in pod.spec.resourceClaims of the Pod where this field is used. It makes that resource available inside a container.
     * @type {string}
     * @memberof IoK8sApiCoreV1ResourceClaim
     */
    name: string;
}
/**
 * ResourceFieldSelector represents container resources (cpu, memory) and their output format
 * @export
 * @interface IoK8sApiCoreV1ResourceFieldSelector
 */
export interface IoK8sApiCoreV1ResourceFieldSelector {
    /**
     * Container name: required for volumes, optional for env vars
     * @type {string}
     * @memberof IoK8sApiCoreV1ResourceFieldSelector
     */
    containerName?: string;
    /**
     * Specifies the output format of the exposed resources, defaults to "1"
     * @type {IoK8sApimachineryPkgApiResourceQuantity}
     * @memberof IoK8sApiCoreV1ResourceFieldSelector
     */
    divisor?: IoK8sApimachineryPkgApiResourceQuantity;
    /**
     * Required: resource to select
     * @type {string}
     * @memberof IoK8sApiCoreV1ResourceFieldSelector
     */
    resource: string;
}
/**
 * ResourceQuota sets aggregate quota restrictions enforced per namespace
 * @export
 * @interface IoK8sApiCoreV1ResourceQuota
 */
export interface IoK8sApiCoreV1ResourceQuota {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1ResourceQuota
     */
    apiVersion?: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1ResourceQuota
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1ResourceQuota
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * Spec defines the desired quota. https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1ResourceQuotaSpec}
     * @memberof IoK8sApiCoreV1ResourceQuota
     */
    spec?: IoK8sApiCoreV1ResourceQuotaSpec;
    /**
     * Status defines the actual enforced quota and its current usage. https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1ResourceQuotaStatus}
     * @memberof IoK8sApiCoreV1ResourceQuota
     */
    status?: IoK8sApiCoreV1ResourceQuotaStatus;
}
/**
 * ResourceQuotaList is a list of ResourceQuota items.
 * @export
 * @interface IoK8sApiCoreV1ResourceQuotaList
 */
export interface IoK8sApiCoreV1ResourceQuotaList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1ResourceQuotaList
     */
    apiVersion?: string;
    /**
     * Items is a list of ResourceQuota objects. More info: https://kubernetes.io/docs/concepts/policy/resource-quotas/
     * @type {Array<IoK8sApiCoreV1ResourceQuota>}
     * @memberof IoK8sApiCoreV1ResourceQuotaList
     */
    items: Array<IoK8sApiCoreV1ResourceQuota>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1ResourceQuotaList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1ResourceQuotaList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * ResourceQuotaSpec defines the desired hard limits to enforce for Quota.
 * @export
 * @interface IoK8sApiCoreV1ResourceQuotaSpec
 */
export interface IoK8sApiCoreV1ResourceQuotaSpec {
    /**
     * hard is the set of desired hard limits for each named resource. More info: https://kubernetes.io/docs/concepts/policy/resource-quotas/
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1ResourceQuotaSpec
     */
    hard?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * scopeSelector is also a collection of filters like scopes that must match each object tracked by a quota but expressed using ScopeSelectorOperator in combination with possible values. For a resource to match, both scopes AND scopeSelector (if specified in spec), must be matched.
     * @type {IoK8sApiCoreV1ScopeSelector}
     * @memberof IoK8sApiCoreV1ResourceQuotaSpec
     */
    scopeSelector?: IoK8sApiCoreV1ScopeSelector;
    /**
     * A collection of filters that must match each object tracked by a quota. If not specified, the quota matches all objects.
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1ResourceQuotaSpec
     */
    scopes?: Array<string>;
}
/**
 * ResourceQuotaStatus defines the enforced hard limits and observed use.
 * @export
 * @interface IoK8sApiCoreV1ResourceQuotaStatus
 */
export interface IoK8sApiCoreV1ResourceQuotaStatus {
    /**
     * Hard is the set of enforced hard limits for each named resource. More info: https://kubernetes.io/docs/concepts/policy/resource-quotas/
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1ResourceQuotaStatus
     */
    hard?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * Used is the current observed total usage of the resource in the namespace.
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1ResourceQuotaStatus
     */
    used?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
}
/**
 * ResourceRequirements describes the compute resource requirements.
 * @export
 * @interface IoK8sApiCoreV1ResourceRequirements
 */
export interface IoK8sApiCoreV1ResourceRequirements {
    /**
     * Claims lists the names of resources, defined in spec.resourceClaims, that are used by this container.
     * 
     * This is an alpha field and requires enabling the DynamicResourceAllocation feature gate.
     * 
     * This field is immutable. It can only be set for containers.
     * @type {Array<IoK8sApiCoreV1ResourceClaim>}
     * @memberof IoK8sApiCoreV1ResourceRequirements
     */
    claims?: Array<IoK8sApiCoreV1ResourceClaim>;
    /**
     * Limits describes the maximum amount of compute resources allowed. More info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1ResourceRequirements
     */
    limits?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * Requests describes the minimum amount of compute resources required. If Requests is omitted for a container, it defaults to Limits if that is explicitly specified, otherwise to an implementation-defined value. Requests cannot exceed Limits. More info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1ResourceRequirements
     */
    requests?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
}
/**
 * SELinuxOptions are the labels to be applied to the container
 * @export
 * @interface IoK8sApiCoreV1SELinuxOptions
 */
export interface IoK8sApiCoreV1SELinuxOptions {
    /**
     * Level is SELinux level label that applies to the container.
     * @type {string}
     * @memberof IoK8sApiCoreV1SELinuxOptions
     */
    level?: string;
    /**
     * Role is a SELinux role label that applies to the container.
     * @type {string}
     * @memberof IoK8sApiCoreV1SELinuxOptions
     */
    role?: string;
    /**
     * Type is a SELinux type label that applies to the container.
     * @type {string}
     * @memberof IoK8sApiCoreV1SELinuxOptions
     */
    type?: string;
    /**
     * User is a SELinux user label that applies to the container.
     * @type {string}
     * @memberof IoK8sApiCoreV1SELinuxOptions
     */
    user?: string;
}
/**
 * ScaleIOPersistentVolumeSource represents a persistent ScaleIO volume
 * @export
 * @interface IoK8sApiCoreV1ScaleIOPersistentVolumeSource
 */
export interface IoK8sApiCoreV1ScaleIOPersistentVolumeSource {
    /**
     * fsType is the filesystem type to mount. Must be a filesystem type supported by the host operating system. Ex. "ext4", "xfs", "ntfs". Default is "xfs"
     * @type {string}
     * @memberof IoK8sApiCoreV1ScaleIOPersistentVolumeSource
     */
    fsType?: string;
    /**
     * gateway is the host address of the ScaleIO API Gateway.
     * @type {string}
     * @memberof IoK8sApiCoreV1ScaleIOPersistentVolumeSource
     */
    gateway: string;
    /**
     * protectionDomain is the name of the ScaleIO Protection Domain for the configured storage.
     * @type {string}
     * @memberof IoK8sApiCoreV1ScaleIOPersistentVolumeSource
     */
    protectionDomain?: string;
    /**
     * readOnly defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ScaleIOPersistentVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretRef references to the secret for ScaleIO user and other sensitive information. If this is not provided, Login operation will fail.
     * @type {IoK8sApiCoreV1SecretReference}
     * @memberof IoK8sApiCoreV1ScaleIOPersistentVolumeSource
     */
    secretRef: IoK8sApiCoreV1SecretReference;
    /**
     * sslEnabled is the flag to enable/disable SSL communication with Gateway, default false
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ScaleIOPersistentVolumeSource
     */
    sslEnabled?: boolean;
    /**
     * storageMode indicates whether the storage for a volume should be ThickProvisioned or ThinProvisioned. Default is ThinProvisioned.
     * @type {string}
     * @memberof IoK8sApiCoreV1ScaleIOPersistentVolumeSource
     */
    storageMode?: string;
    /**
     * storagePool is the ScaleIO Storage Pool associated with the protection domain.
     * @type {string}
     * @memberof IoK8sApiCoreV1ScaleIOPersistentVolumeSource
     */
    storagePool?: string;
    /**
     * system is the name of the storage system as configured in ScaleIO.
     * @type {string}
     * @memberof IoK8sApiCoreV1ScaleIOPersistentVolumeSource
     */
    system: string;
    /**
     * volumeName is the name of a volume already created in the ScaleIO system that is associated with this volume source.
     * @type {string}
     * @memberof IoK8sApiCoreV1ScaleIOPersistentVolumeSource
     */
    volumeName?: string;
}
/**
 * ScaleIOVolumeSource represents a persistent ScaleIO volume
 * @export
 * @interface IoK8sApiCoreV1ScaleIOVolumeSource
 */
export interface IoK8sApiCoreV1ScaleIOVolumeSource {
    /**
     * fsType is the filesystem type to mount. Must be a filesystem type supported by the host operating system. Ex. "ext4", "xfs", "ntfs". Default is "xfs".
     * @type {string}
     * @memberof IoK8sApiCoreV1ScaleIOVolumeSource
     */
    fsType?: string;
    /**
     * gateway is the host address of the ScaleIO API Gateway.
     * @type {string}
     * @memberof IoK8sApiCoreV1ScaleIOVolumeSource
     */
    gateway: string;
    /**
     * protectionDomain is the name of the ScaleIO Protection Domain for the configured storage.
     * @type {string}
     * @memberof IoK8sApiCoreV1ScaleIOVolumeSource
     */
    protectionDomain?: string;
    /**
     * readOnly Defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ScaleIOVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretRef references to the secret for ScaleIO user and other sensitive information. If this is not provided, Login operation will fail.
     * @type {IoK8sApiCoreV1LocalObjectReference}
     * @memberof IoK8sApiCoreV1ScaleIOVolumeSource
     */
    secretRef: IoK8sApiCoreV1LocalObjectReference;
    /**
     * sslEnabled Flag enable/disable SSL communication with Gateway, default false
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ScaleIOVolumeSource
     */
    sslEnabled?: boolean;
    /**
     * storageMode indicates whether the storage for a volume should be ThickProvisioned or ThinProvisioned. Default is ThinProvisioned.
     * @type {string}
     * @memberof IoK8sApiCoreV1ScaleIOVolumeSource
     */
    storageMode?: string;
    /**
     * storagePool is the ScaleIO Storage Pool associated with the protection domain.
     * @type {string}
     * @memberof IoK8sApiCoreV1ScaleIOVolumeSource
     */
    storagePool?: string;
    /**
     * system is the name of the storage system as configured in ScaleIO.
     * @type {string}
     * @memberof IoK8sApiCoreV1ScaleIOVolumeSource
     */
    system: string;
    /**
     * volumeName is the name of a volume already created in the ScaleIO system that is associated with this volume source.
     * @type {string}
     * @memberof IoK8sApiCoreV1ScaleIOVolumeSource
     */
    volumeName?: string;
}
/**
 * A scope selector represents the AND of the selectors represented by the scoped-resource selector requirements.
 * @export
 * @interface IoK8sApiCoreV1ScopeSelector
 */
export interface IoK8sApiCoreV1ScopeSelector {
    /**
     * A list of scope selector requirements by scope of the resources.
     * @type {Array<IoK8sApiCoreV1ScopedResourceSelectorRequirement>}
     * @memberof IoK8sApiCoreV1ScopeSelector
     */
    matchExpressions?: Array<IoK8sApiCoreV1ScopedResourceSelectorRequirement>;
}
/**
 * A scoped-resource selector requirement is a selector that contains values, a scope name, and an operator that relates the scope name and values.
 * @export
 * @interface IoK8sApiCoreV1ScopedResourceSelectorRequirement
 */
export interface IoK8sApiCoreV1ScopedResourceSelectorRequirement {
    /**
     * Represents a scope's relationship to a set of values. Valid operators are In, NotIn, Exists, DoesNotExist.
     * @type {string}
     * @memberof IoK8sApiCoreV1ScopedResourceSelectorRequirement
     */
    operator: string;
    /**
     * The name of the scope that the selector applies to.
     * @type {string}
     * @memberof IoK8sApiCoreV1ScopedResourceSelectorRequirement
     */
    scopeName: string;
    /**
     * An array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. This array is replaced during a strategic merge patch.
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1ScopedResourceSelectorRequirement
     */
    values?: Array<string>;
}
/**
 * SeccompProfile defines a pod/container's seccomp profile settings. Only one profile source may be set.
 * @export
 * @interface IoK8sApiCoreV1SeccompProfile
 */
export interface IoK8sApiCoreV1SeccompProfile {
    /**
     * localhostProfile indicates a profile defined in a file on the node should be used. The profile must be preconfigured on the node to work. Must be a descending path, relative to the kubelet's configured seccomp profile location. Must be set if type is "Localhost". Must NOT be set for any other type.
     * @type {string}
     * @memberof IoK8sApiCoreV1SeccompProfile
     */
    localhostProfile?: string;
    /**
     * type indicates which kind of seccomp profile will be applied. Valid options are:
     * 
     * Localhost - a profile defined in a file on the node should be used. RuntimeDefault - the container runtime default profile should be used. Unconfined - no profile should be applied.
     * @type {string}
     * @memberof IoK8sApiCoreV1SeccompProfile
     */
    type: string;
}
/**
 * Secret holds secret data of a certain type. The total bytes of the values in the Data field must be less than MaxSecretSize bytes.
 * @export
 * @interface IoK8sApiCoreV1Secret
 */
export interface IoK8sApiCoreV1Secret {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1Secret
     */
    apiVersion?: string;
    /**
     * Data contains the secret data. Each key must consist of alphanumeric characters, '-', '_' or '.'. The serialized form of the secret data is a base64 encoded string, representing the arbitrary (possibly non-string) data value here. Described in https://tools.ietf.org/html/rfc4648#section-4
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApiCoreV1Secret
     */
    data?: { [key: string]: string; };
    /**
     * Immutable, if set to true, ensures that data stored in the Secret cannot be updated (only object metadata can be modified). If not set to true, the field can be modified at any time. Defaulted to nil.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1Secret
     */
    immutable?: boolean;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1Secret
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1Secret
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * stringData allows specifying non-binary secret data in string form. It is provided as a write-only input field for convenience. All keys and values are merged into the data field on write, overwriting any existing values. The stringData field is never output when reading from the API.
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApiCoreV1Secret
     */
    stringData?: { [key: string]: string; };
    /**
     * Used to facilitate programmatic handling of secret data. More info: https://kubernetes.io/docs/concepts/configuration/secret/#secret-types
     * @type {string}
     * @memberof IoK8sApiCoreV1Secret
     */
    type?: string;
}
/**
 * SecretEnvSource selects a Secret to populate the environment variables with.
 * 
 * The contents of the target Secret's Data field will represent the key-value pairs as environment variables.
 * @export
 * @interface IoK8sApiCoreV1SecretEnvSource
 */
export interface IoK8sApiCoreV1SecretEnvSource {
    /**
     * Name of the referent. This field is effectively required, but due to backwards compatibility is allowed to be empty. Instances of this type with an empty value here are almost certainly wrong. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
     * @type {string}
     * @memberof IoK8sApiCoreV1SecretEnvSource
     */
    name?: string;
    /**
     * Specify whether the Secret must be defined
     * @type {boolean}
     * @memberof IoK8sApiCoreV1SecretEnvSource
     */
    optional?: boolean;
}
/**
 * SecretKeySelector selects a key of a Secret.
 * @export
 * @interface IoK8sApiCoreV1SecretKeySelector
 */
export interface IoK8sApiCoreV1SecretKeySelector {
    /**
     * The key of the secret to select from.  Must be a valid secret key.
     * @type {string}
     * @memberof IoK8sApiCoreV1SecretKeySelector
     */
    key: string;
    /**
     * Name of the referent. This field is effectively required, but due to backwards compatibility is allowed to be empty. Instances of this type with an empty value here are almost certainly wrong. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
     * @type {string}
     * @memberof IoK8sApiCoreV1SecretKeySelector
     */
    name?: string;
    /**
     * Specify whether the Secret or its key must be defined
     * @type {boolean}
     * @memberof IoK8sApiCoreV1SecretKeySelector
     */
    optional?: boolean;
}
/**
 * SecretList is a list of Secret.
 * @export
 * @interface IoK8sApiCoreV1SecretList
 */
export interface IoK8sApiCoreV1SecretList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1SecretList
     */
    apiVersion?: string;
    /**
     * Items is a list of secret objects. More info: https://kubernetes.io/docs/concepts/configuration/secret
     * @type {Array<IoK8sApiCoreV1Secret>}
     * @memberof IoK8sApiCoreV1SecretList
     */
    items: Array<IoK8sApiCoreV1Secret>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1SecretList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1SecretList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * Adapts a secret into a projected volume.
 * 
 * The contents of the target Secret's Data field will be presented in a projected volume as files using the keys in the Data field as the file names. Note that this is identical to a secret volume source without the default mode.
 * @export
 * @interface IoK8sApiCoreV1SecretProjection
 */
export interface IoK8sApiCoreV1SecretProjection {
    /**
     * items if unspecified, each key-value pair in the Data field of the referenced Secret will be projected into the volume as a file whose name is the key and content is the value. If specified, the listed keys will be projected into the specified paths, and unlisted keys will not be present. If a key is specified which is not present in the Secret, the volume setup will error unless it is marked optional. Paths must be relative and may not contain the '..' path or start with '..'.
     * @type {Array<IoK8sApiCoreV1KeyToPath>}
     * @memberof IoK8sApiCoreV1SecretProjection
     */
    items?: Array<IoK8sApiCoreV1KeyToPath>;
    /**
     * Name of the referent. This field is effectively required, but due to backwards compatibility is allowed to be empty. Instances of this type with an empty value here are almost certainly wrong. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
     * @type {string}
     * @memberof IoK8sApiCoreV1SecretProjection
     */
    name?: string;
    /**
     * optional field specify whether the Secret or its key must be defined
     * @type {boolean}
     * @memberof IoK8sApiCoreV1SecretProjection
     */
    optional?: boolean;
}
/**
 * SecretReference represents a Secret Reference. It has enough information to retrieve secret in any namespace
 * @export
 * @interface IoK8sApiCoreV1SecretReference
 */
export interface IoK8sApiCoreV1SecretReference {
    /**
     * name is unique within a namespace to reference a secret resource.
     * @type {string}
     * @memberof IoK8sApiCoreV1SecretReference
     */
    name?: string;
    /**
     * namespace defines the space within which the secret name must be unique.
     * @type {string}
     * @memberof IoK8sApiCoreV1SecretReference
     */
    namespace?: string;
}
/**
 * Adapts a Secret into a volume.
 * 
 * The contents of the target Secret's Data field will be presented in a volume as files using the keys in the Data field as the file names. Secret volumes support ownership management and SELinux relabeling.
 * @export
 * @interface IoK8sApiCoreV1SecretVolumeSource
 */
export interface IoK8sApiCoreV1SecretVolumeSource {
    /**
     * defaultMode is Optional: mode bits used to set permissions on created files by default. Must be an octal value between 0000 and 0777 or a decimal value between 0 and 511. YAML accepts both octal and decimal values, JSON requires decimal values for mode bits. Defaults to 0644. Directories within the path are not affected by this setting. This might be in conflict with other options that affect the file mode, like fsGroup, and the result can be other mode bits set.
     * @type {number}
     * @memberof IoK8sApiCoreV1SecretVolumeSource
     */
    defaultMode?: number;
    /**
     * items If unspecified, each key-value pair in the Data field of the referenced Secret will be projected into the volume as a file whose name is the key and content is the value. If specified, the listed keys will be projected into the specified paths, and unlisted keys will not be present. If a key is specified which is not present in the Secret, the volume setup will error unless it is marked optional. Paths must be relative and may not contain the '..' path or start with '..'.
     * @type {Array<IoK8sApiCoreV1KeyToPath>}
     * @memberof IoK8sApiCoreV1SecretVolumeSource
     */
    items?: Array<IoK8sApiCoreV1KeyToPath>;
    /**
     * optional field specify whether the Secret or its keys must be defined
     * @type {boolean}
     * @memberof IoK8sApiCoreV1SecretVolumeSource
     */
    optional?: boolean;
    /**
     * secretName is the name of the secret in the pod's namespace to use. More info: https://kubernetes.io/docs/concepts/storage/volumes#secret
     * @type {string}
     * @memberof IoK8sApiCoreV1SecretVolumeSource
     */
    secretName?: string;
}
/**
 * SecurityContext holds security configuration that will be applied to a container. Some fields are present in both SecurityContext and PodSecurityContext.  When both are set, the values in SecurityContext take precedence.
 * @export
 * @interface IoK8sApiCoreV1SecurityContext
 */
export interface IoK8sApiCoreV1SecurityContext {
    /**
     * AllowPrivilegeEscalation controls whether a process can gain more privileges than its parent process. This bool directly controls if the no_new_privs flag will be set on the container process. AllowPrivilegeEscalation is true always when the container is: 1) run as Privileged 2) has CAP_SYS_ADMIN Note that this field cannot be set when spec.os.name is windows.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1SecurityContext
     */
    allowPrivilegeEscalation?: boolean;
    /**
     * appArmorProfile is the AppArmor options to use by this container. If set, this profile overrides the pod's appArmorProfile. Note that this field cannot be set when spec.os.name is windows.
     * @type {IoK8sApiCoreV1AppArmorProfile}
     * @memberof IoK8sApiCoreV1SecurityContext
     */
    appArmorProfile?: IoK8sApiCoreV1AppArmorProfile;
    /**
     * The capabilities to add/drop when running containers. Defaults to the default set of capabilities granted by the container runtime. Note that this field cannot be set when spec.os.name is windows.
     * @type {IoK8sApiCoreV1Capabilities}
     * @memberof IoK8sApiCoreV1SecurityContext
     */
    capabilities?: IoK8sApiCoreV1Capabilities;
    /**
     * Run container in privileged mode. Processes in privileged containers are essentially equivalent to root on the host. Defaults to false. Note that this field cannot be set when spec.os.name is windows.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1SecurityContext
     */
    privileged?: boolean;
    /**
     * procMount denotes the type of proc mount to use for the containers. The default is DefaultProcMount which uses the container runtime defaults for readonly paths and masked paths. This requires the ProcMountType feature flag to be enabled. Note that this field cannot be set when spec.os.name is windows.
     * @type {string}
     * @memberof IoK8sApiCoreV1SecurityContext
     */
    procMount?: string;
    /**
     * Whether this container has a read-only root filesystem. Default is false. Note that this field cannot be set when spec.os.name is windows.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1SecurityContext
     */
    readOnlyRootFilesystem?: boolean;
    /**
     * The GID to run the entrypoint of the container process. Uses runtime default if unset. May also be set in PodSecurityContext.  If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence. Note that this field cannot be set when spec.os.name is windows.
     * @type {number}
     * @memberof IoK8sApiCoreV1SecurityContext
     */
    runAsGroup?: number;
    /**
     * Indicates that the container must run as a non-root user. If true, the Kubelet will validate the image at runtime to ensure that it does not run as UID 0 (root) and fail to start the container if it does. If unset or false, no such validation will be performed. May also be set in PodSecurityContext.  If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1SecurityContext
     */
    runAsNonRoot?: boolean;
    /**
     * The UID to run the entrypoint of the container process. Defaults to user specified in image metadata if unspecified. May also be set in PodSecurityContext.  If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence. Note that this field cannot be set when spec.os.name is windows.
     * @type {number}
     * @memberof IoK8sApiCoreV1SecurityContext
     */
    runAsUser?: number;
    /**
     * The SELinux context to be applied to the container. If unspecified, the container runtime will allocate a random SELinux context for each container.  May also be set in PodSecurityContext.  If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence. Note that this field cannot be set when spec.os.name is windows.
     * @type {IoK8sApiCoreV1SELinuxOptions}
     * @memberof IoK8sApiCoreV1SecurityContext
     */
    seLinuxOptions?: IoK8sApiCoreV1SELinuxOptions;
    /**
     * The seccomp options to use by this container. If seccomp options are provided at both the pod & container level, the container options override the pod options. Note that this field cannot be set when spec.os.name is windows.
     * @type {IoK8sApiCoreV1SeccompProfile}
     * @memberof IoK8sApiCoreV1SecurityContext
     */
    seccompProfile?: IoK8sApiCoreV1SeccompProfile;
    /**
     * The Windows specific settings applied to all containers. If unspecified, the options from the PodSecurityContext will be used. If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence. Note that this field cannot be set when spec.os.name is linux.
     * @type {IoK8sApiCoreV1WindowsSecurityContextOptions}
     * @memberof IoK8sApiCoreV1SecurityContext
     */
    windowsOptions?: IoK8sApiCoreV1WindowsSecurityContextOptions;
}
/**
 * Service is a named abstraction of software service (for example, mysql) consisting of local port (for example 3306) that the proxy listens on, and the selector that determines which pods will answer requests sent through the proxy.
 * @export
 * @interface IoK8sApiCoreV1Service
 */
export interface IoK8sApiCoreV1Service {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1Service
     */
    apiVersion?: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1Service
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1Service
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * Spec defines the behavior of a service. https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1ServiceSpec}
     * @memberof IoK8sApiCoreV1Service
     */
    spec?: IoK8sApiCoreV1ServiceSpec;
    /**
     * Most recently observed status of the service. Populated by the system. Read-only. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {IoK8sApiCoreV1ServiceStatus}
     * @memberof IoK8sApiCoreV1Service
     */
    status?: IoK8sApiCoreV1ServiceStatus;
}
/**
 * ServiceAccount binds together: * a name, understood by users, and perhaps by peripheral systems, for an identity * a principal that can be authenticated and authorized * a set of secrets
 * @export
 * @interface IoK8sApiCoreV1ServiceAccount
 */
export interface IoK8sApiCoreV1ServiceAccount {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceAccount
     */
    apiVersion?: string;
    /**
     * AutomountServiceAccountToken indicates whether pods running as this service account should have an API token automatically mounted. Can be overridden at the pod level.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ServiceAccount
     */
    automountServiceAccountToken?: boolean;
    /**
     * ImagePullSecrets is a list of references to secrets in the same namespace to use for pulling any images in pods that reference this ServiceAccount. ImagePullSecrets are distinct from Secrets because Secrets can be mounted in the pod, but ImagePullSecrets are only accessed by the kubelet. More info: https://kubernetes.io/docs/concepts/containers/images/#specifying-imagepullsecrets-on-a-pod
     * @type {Array<IoK8sApiCoreV1LocalObjectReference>}
     * @memberof IoK8sApiCoreV1ServiceAccount
     */
    imagePullSecrets?: Array<IoK8sApiCoreV1LocalObjectReference>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceAccount
     */
    kind?: string;
    /**
     * Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiCoreV1ServiceAccount
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
    /**
     * Secrets is a list of the secrets in the same namespace that pods running using this ServiceAccount are allowed to use. Pods are only limited to this list if this service account has a "kubernetes.io/enforce-mountable-secrets" annotation set to "true". This field should not be used to find auto-generated service account token secrets for use outside of pods. Instead, tokens can be requested directly using the TokenRequest API, or service account token secrets can be manually created. More info: https://kubernetes.io/docs/concepts/configuration/secret
     * @type {Array<IoK8sApiCoreV1ObjectReference>}
     * @memberof IoK8sApiCoreV1ServiceAccount
     */
    secrets?: Array<IoK8sApiCoreV1ObjectReference>;
}
/**
 * ServiceAccountList is a list of ServiceAccount objects
 * @export
 * @interface IoK8sApiCoreV1ServiceAccountList
 */
export interface IoK8sApiCoreV1ServiceAccountList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceAccountList
     */
    apiVersion?: string;
    /**
     * List of ServiceAccounts. More info: https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/
     * @type {Array<IoK8sApiCoreV1ServiceAccount>}
     * @memberof IoK8sApiCoreV1ServiceAccountList
     */
    items: Array<IoK8sApiCoreV1ServiceAccount>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceAccountList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1ServiceAccountList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * ServiceAccountTokenProjection represents a projected service account token volume. This projection can be used to insert a service account token into the pods runtime filesystem for use against APIs (Kubernetes API Server or otherwise).
 * @export
 * @interface IoK8sApiCoreV1ServiceAccountTokenProjection
 */
export interface IoK8sApiCoreV1ServiceAccountTokenProjection {
    /**
     * audience is the intended audience of the token. A recipient of a token must identify itself with an identifier specified in the audience of the token, and otherwise should reject the token. The audience defaults to the identifier of the apiserver.
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceAccountTokenProjection
     */
    audience?: string;
    /**
     * expirationSeconds is the requested duration of validity of the service account token. As the token approaches expiration, the kubelet volume plugin will proactively rotate the service account token. The kubelet will start trying to rotate the token if the token is older than 80 percent of its time to live or if the token is older than 24 hours.Defaults to 1 hour and must be at least 10 minutes.
     * @type {number}
     * @memberof IoK8sApiCoreV1ServiceAccountTokenProjection
     */
    expirationSeconds?: number;
    /**
     * path is the path relative to the mount point of the file to project the token into.
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceAccountTokenProjection
     */
    path: string;
}
/**
 * ServiceList holds a list of services.
 * @export
 * @interface IoK8sApiCoreV1ServiceList
 */
export interface IoK8sApiCoreV1ServiceList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceList
     */
    apiVersion?: string;
    /**
     * List of services
     * @type {Array<IoK8sApiCoreV1Service>}
     * @memberof IoK8sApiCoreV1ServiceList
     */
    items: Array<IoK8sApiCoreV1Service>;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceList
     */
    kind?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApiCoreV1ServiceList
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
}
/**
 * ServicePort contains information on service's port.
 * @export
 * @interface IoK8sApiCoreV1ServicePort
 */
export interface IoK8sApiCoreV1ServicePort {
    /**
     * The application protocol for this port. This is used as a hint for implementations to offer richer behavior for protocols that they understand. This field follows standard Kubernetes label syntax. Valid values are either:
     * 
     * * Un-prefixed protocol names - reserved for IANA standard service names (as per RFC-6335 and https://www.iana.org/assignments/service-names).
     * 
     * * Kubernetes-defined prefixed names:
     *   * 'kubernetes.io/h2c' - HTTP/2 prior knowledge over cleartext as described in https://www.rfc-editor.org/rfc/rfc9113.html#name-starting-http-2-with-prior-
     *   * 'kubernetes.io/ws'  - WebSocket over cleartext as described in https://www.rfc-editor.org/rfc/rfc6455
     *   * 'kubernetes.io/wss' - WebSocket over TLS as described in https://www.rfc-editor.org/rfc/rfc6455
     * 
     * * Other protocols should use implementation-defined prefixed names such as mycompany.com/my-custom-protocol.
     * @type {string}
     * @memberof IoK8sApiCoreV1ServicePort
     */
    appProtocol?: string;
    /**
     * The name of this port within the service. This must be a DNS_LABEL. All ports within a ServiceSpec must have unique names. When considering the endpoints for a Service, this must match the 'name' field in the EndpointPort. Optional if only one ServicePort is defined on this service.
     * @type {string}
     * @memberof IoK8sApiCoreV1ServicePort
     */
    name?: string;
    /**
     * The port on each node on which this service is exposed when type is NodePort or LoadBalancer.  Usually assigned by the system. If a value is specified, in-range, and not in use it will be used, otherwise the operation will fail.  If not specified, a port will be allocated if this Service requires one.  If this field is specified when creating a Service which does not need it, creation will fail. This field will be wiped when updating a Service to no longer need it (e.g. changing type from NodePort to ClusterIP). More info: https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport
     * @type {number}
     * @memberof IoK8sApiCoreV1ServicePort
     */
    nodePort?: number;
    /**
     * The port that will be exposed by this service.
     * @type {number}
     * @memberof IoK8sApiCoreV1ServicePort
     */
    port: number;
    /**
     * The IP protocol for this port. Supports "TCP", "UDP", and "SCTP". Default is TCP.
     * @type {string}
     * @memberof IoK8sApiCoreV1ServicePort
     */
    protocol?: string;
    /**
     * Number or name of the port to access on the pods targeted by the service. Number must be in the range 1 to 65535. Name must be an IANA_SVC_NAME. If this is a string, it will be looked up as a named port in the target Pod's container ports. If this is not specified, the value of the 'port' field is used (an identity map). This field is ignored for services with clusterIP=None, and should be omitted or set equal to the 'port' field. More info: https://kubernetes.io/docs/concepts/services-networking/service/#defining-a-service
     * @type {IoK8sApimachineryPkgUtilIntstrIntOrString}
     * @memberof IoK8sApiCoreV1ServicePort
     */
    targetPort?: IoK8sApimachineryPkgUtilIntstrIntOrString;
}
/**
 * ServiceSpec describes the attributes that a user creates on a service.
 * @export
 * @interface IoK8sApiCoreV1ServiceSpec
 */
export interface IoK8sApiCoreV1ServiceSpec {
    /**
     * allocateLoadBalancerNodePorts defines if NodePorts will be automatically allocated for services with type LoadBalancer.  Default is "true". It may be set to "false" if the cluster load-balancer does not rely on NodePorts.  If the caller requests specific NodePorts (by specifying a value), those requests will be respected, regardless of this field. This field may only be set for services with type LoadBalancer and will be cleared if the type is changed to any other type.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    allocateLoadBalancerNodePorts?: boolean;
    /**
     * clusterIP is the IP address of the service and is usually assigned randomly. If an address is specified manually, is in-range (as per system configuration), and is not in use, it will be allocated to the service; otherwise creation of the service will fail. This field may not be changed through updates unless the type field is also being changed to ExternalName (which requires this field to be blank) or the type field is being changed from ExternalName (in which case this field may optionally be specified, as describe above).  Valid values are "None", empty string (""), or a valid IP address. Setting this to "None" makes a "headless service" (no virtual IP), which is useful when direct endpoint connections are preferred and proxying is not required.  Only applies to types ClusterIP, NodePort, and LoadBalancer. If this field is specified when creating a Service of type ExternalName, creation will fail. This field will be wiped when updating a Service to type ExternalName. More info: https://kubernetes.io/docs/concepts/services-networking/service/#virtual-ips-and-service-proxies
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    clusterIP?: string;
    /**
     * ClusterIPs is a list of IP addresses assigned to this service, and are usually assigned randomly.  If an address is specified manually, is in-range (as per system configuration), and is not in use, it will be allocated to the service; otherwise creation of the service will fail. This field may not be changed through updates unless the type field is also being changed to ExternalName (which requires this field to be empty) or the type field is being changed from ExternalName (in which case this field may optionally be specified, as describe above).  Valid values are "None", empty string (""), or a valid IP address.  Setting this to "None" makes a "headless service" (no virtual IP), which is useful when direct endpoint connections are preferred and proxying is not required.  Only applies to types ClusterIP, NodePort, and LoadBalancer. If this field is specified when creating a Service of type ExternalName, creation will fail. This field will be wiped when updating a Service to type ExternalName.  If this field is not specified, it will be initialized from the clusterIP field.  If this field is specified, clients must ensure that clusterIPs[0] and clusterIP have the same value.
     * 
     * This field may hold a maximum of two entries (dual-stack IPs, in either order). These IPs must correspond to the values of the ipFamilies field. Both clusterIPs and ipFamilies are governed by the ipFamilyPolicy field. More info: https://kubernetes.io/docs/concepts/services-networking/service/#virtual-ips-and-service-proxies
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    clusterIPs?: Array<string>;
    /**
     * externalIPs is a list of IP addresses for which nodes in the cluster will also accept traffic for this service.  These IPs are not managed by Kubernetes.  The user is responsible for ensuring that traffic arrives at a node with this IP.  A common example is external load-balancers that are not part of the Kubernetes system.
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    externalIPs?: Array<string>;
    /**
     * externalName is the external reference that discovery mechanisms will return as an alias for this service (e.g. a DNS CNAME record). No proxying will be involved.  Must be a lowercase RFC-1123 hostname (https://tools.ietf.org/html/rfc1123) and requires `type` to be "ExternalName".
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    externalName?: string;
    /**
     * externalTrafficPolicy describes how nodes distribute service traffic they receive on one of the Service's "externally-facing" addresses (NodePorts, ExternalIPs, and LoadBalancer IPs). If set to "Local", the proxy will configure the service in a way that assumes that external load balancers will take care of balancing the service traffic between nodes, and so each node will deliver traffic only to the node-local endpoints of the service, without masquerading the client source IP. (Traffic mistakenly sent to a node with no endpoints will be dropped.) The default value, "Cluster", uses the standard behavior of routing to all endpoints evenly (possibly modified by topology and other features). Note that traffic sent to an External IP or LoadBalancer IP from within the cluster will always get "Cluster" semantics, but clients sending to a NodePort from within the cluster may need to take traffic policy into account when picking a node.
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    externalTrafficPolicy?: string;
    /**
     * healthCheckNodePort specifies the healthcheck nodePort for the service. This only applies when type is set to LoadBalancer and externalTrafficPolicy is set to Local. If a value is specified, is in-range, and is not in use, it will be used.  If not specified, a value will be automatically allocated.  External systems (e.g. load-balancers) can use this port to determine if a given node holds endpoints for this service or not.  If this field is specified when creating a Service which does not need it, creation will fail. This field will be wiped when updating a Service to no longer need it (e.g. changing type). This field cannot be updated once set.
     * @type {number}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    healthCheckNodePort?: number;
    /**
     * InternalTrafficPolicy describes how nodes distribute service traffic they receive on the ClusterIP. If set to "Local", the proxy will assume that pods only want to talk to endpoints of the service on the same node as the pod, dropping the traffic if there are no local endpoints. The default value, "Cluster", uses the standard behavior of routing to all endpoints evenly (possibly modified by topology and other features).
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    internalTrafficPolicy?: string;
    /**
     * IPFamilies is a list of IP families (e.g. IPv4, IPv6) assigned to this service. This field is usually assigned automatically based on cluster configuration and the ipFamilyPolicy field. If this field is specified manually, the requested family is available in the cluster, and ipFamilyPolicy allows it, it will be used; otherwise creation of the service will fail. This field is conditionally mutable: it allows for adding or removing a secondary IP family, but it does not allow changing the primary IP family of the Service. Valid values are "IPv4" and "IPv6".  This field only applies to Services of types ClusterIP, NodePort, and LoadBalancer, and does apply to "headless" services. This field will be wiped when updating a Service to type ExternalName.
     * 
     * This field may hold a maximum of two entries (dual-stack families, in either order).  These families must correspond to the values of the clusterIPs field, if specified. Both clusterIPs and ipFamilies are governed by the ipFamilyPolicy field.
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    ipFamilies?: Array<string>;
    /**
     * IPFamilyPolicy represents the dual-stack-ness requested or required by this Service. If there is no value provided, then this field will be set to SingleStack. Services can be "SingleStack" (a single IP family), "PreferDualStack" (two IP families on dual-stack configured clusters or a single IP family on single-stack clusters), or "RequireDualStack" (two IP families on dual-stack configured clusters, otherwise fail). The ipFamilies and clusterIPs fields depend on the value of this field. This field will be wiped when updating a service to type ExternalName.
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    ipFamilyPolicy?: string;
    /**
     * loadBalancerClass is the class of the load balancer implementation this Service belongs to. If specified, the value of this field must be a label-style identifier, with an optional prefix, e.g. "internal-vip" or "example.com/internal-vip". Unprefixed names are reserved for end-users. This field can only be set when the Service type is 'LoadBalancer'. If not set, the default load balancer implementation is used, today this is typically done through the cloud provider integration, but should apply for any default implementation. If set, it is assumed that a load balancer implementation is watching for Services with a matching class. Any default load balancer implementation (e.g. cloud providers) should ignore Services that set this field. This field can only be set when creating or updating a Service to type 'LoadBalancer'. Once set, it can not be changed. This field will be wiped when a service is updated to a non 'LoadBalancer' type.
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    loadBalancerClass?: string;
    /**
     * Only applies to Service Type: LoadBalancer. This feature depends on whether the underlying cloud-provider supports specifying the loadBalancerIP when a load balancer is created. This field will be ignored if the cloud-provider does not support the feature. Deprecated: This field was under-specified and its meaning varies across implementations. Using it is non-portable and it may not support dual-stack. Users are encouraged to use implementation-specific annotations when available.
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    loadBalancerIP?: string;
    /**
     * If specified and supported by the platform, this will restrict traffic through the cloud-provider load-balancer will be restricted to the specified client IPs. This field will be ignored if the cloud-provider does not support the feature." More info: https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    loadBalancerSourceRanges?: Array<string>;
    /**
     * The list of ports that are exposed by this service. More info: https://kubernetes.io/docs/concepts/services-networking/service/#virtual-ips-and-service-proxies
     * @type {Array<IoK8sApiCoreV1ServicePort>}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    ports?: Array<IoK8sApiCoreV1ServicePort>;
    /**
     * publishNotReadyAddresses indicates that any agent which deals with endpoints for this Service should disregard any indications of ready/not-ready. The primary use case for setting this field is for a StatefulSet's Headless Service to propagate SRV DNS records for its Pods for the purpose of peer discovery. The Kubernetes controllers that generate Endpoints and EndpointSlice resources for Services interpret this to mean that all endpoints are considered "ready" even if the Pods themselves are not. Agents which consume only Kubernetes generated endpoints through the Endpoints or EndpointSlice resources can safely assume this behavior.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    publishNotReadyAddresses?: boolean;
    /**
     * Route service traffic to pods with label keys and values matching this selector. If empty or not present, the service is assumed to have an external process managing its endpoints, which Kubernetes will not modify. Only applies to types ClusterIP, NodePort, and LoadBalancer. Ignored if type is ExternalName. More info: https://kubernetes.io/docs/concepts/services-networking/service/
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    selector?: { [key: string]: string; };
    /**
     * Supports "ClientIP" and "None". Used to maintain session affinity. Enable client IP based session affinity. Must be ClientIP or None. Defaults to None. More info: https://kubernetes.io/docs/concepts/services-networking/service/#virtual-ips-and-service-proxies
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    sessionAffinity?: string;
    /**
     * sessionAffinityConfig contains the configurations of session affinity.
     * @type {IoK8sApiCoreV1SessionAffinityConfig}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    sessionAffinityConfig?: IoK8sApiCoreV1SessionAffinityConfig;
    /**
     * TrafficDistribution offers a way to express preferences for how traffic is distributed to Service endpoints. Implementations can use this field as a hint, but are not required to guarantee strict adherence. If the field is not set, the implementation will apply its default routing strategy. If set to "PreferClose", implementations should prioritize endpoints that are topologically close (e.g., same zone). This is an alpha field and requires enabling ServiceTrafficDistribution feature.
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    trafficDistribution?: string;
    /**
     * type determines how the Service is exposed. Defaults to ClusterIP. Valid options are ExternalName, ClusterIP, NodePort, and LoadBalancer. "ClusterIP" allocates a cluster-internal IP address for load-balancing to endpoints. Endpoints are determined by the selector or if that is not specified, by manual construction of an Endpoints object or EndpointSlice objects. If clusterIP is "None", no virtual IP is allocated and the endpoints are published as a set of endpoints rather than a virtual IP. "NodePort" builds on ClusterIP and allocates a port on every node which routes to the same endpoints as the clusterIP. "LoadBalancer" builds on NodePort and creates an external load-balancer (if supported in the current cloud) which routes to the same endpoints as the clusterIP. "ExternalName" aliases this service to the specified externalName. Several other fields do not apply to ExternalName services. More info: https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types
     * @type {string}
     * @memberof IoK8sApiCoreV1ServiceSpec
     */
    type?: string;
}
/**
 * ServiceStatus represents the current status of a service.
 * @export
 * @interface IoK8sApiCoreV1ServiceStatus
 */
export interface IoK8sApiCoreV1ServiceStatus {
    /**
     * Current service state
     * @type {Array<IoK8sApimachineryPkgApisMetaV1Condition>}
     * @memberof IoK8sApiCoreV1ServiceStatus
     */
    conditions?: Array<IoK8sApimachineryPkgApisMetaV1Condition>;
    /**
     * LoadBalancer contains the current status of the load-balancer, if one is present.
     * @type {IoK8sApiCoreV1LoadBalancerStatus}
     * @memberof IoK8sApiCoreV1ServiceStatus
     */
    loadBalancer?: IoK8sApiCoreV1LoadBalancerStatus;
}
/**
 * SessionAffinityConfig represents the configurations of session affinity.
 * @export
 * @interface IoK8sApiCoreV1SessionAffinityConfig
 */
export interface IoK8sApiCoreV1SessionAffinityConfig {
    /**
     * clientIP contains the configurations of Client IP based session affinity.
     * @type {IoK8sApiCoreV1ClientIPConfig}
     * @memberof IoK8sApiCoreV1SessionAffinityConfig
     */
    clientIP?: IoK8sApiCoreV1ClientIPConfig;
}
/**
 * SleepAction describes a "sleep" action.
 * @export
 * @interface IoK8sApiCoreV1SleepAction
 */
export interface IoK8sApiCoreV1SleepAction {
    /**
     * Seconds is the number of seconds to sleep.
     * @type {number}
     * @memberof IoK8sApiCoreV1SleepAction
     */
    seconds: number;
}
/**
 * Represents a StorageOS persistent volume resource.
 * @export
 * @interface IoK8sApiCoreV1StorageOSPersistentVolumeSource
 */
export interface IoK8sApiCoreV1StorageOSPersistentVolumeSource {
    /**
     * fsType is the filesystem type to mount. Must be a filesystem type supported by the host operating system. Ex. "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified.
     * @type {string}
     * @memberof IoK8sApiCoreV1StorageOSPersistentVolumeSource
     */
    fsType?: string;
    /**
     * readOnly defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1StorageOSPersistentVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretRef specifies the secret to use for obtaining the StorageOS API credentials.  If not specified, default values will be attempted.
     * @type {IoK8sApiCoreV1ObjectReference}
     * @memberof IoK8sApiCoreV1StorageOSPersistentVolumeSource
     */
    secretRef?: IoK8sApiCoreV1ObjectReference;
    /**
     * volumeName is the human-readable name of the StorageOS volume.  Volume names are only unique within a namespace.
     * @type {string}
     * @memberof IoK8sApiCoreV1StorageOSPersistentVolumeSource
     */
    volumeName?: string;
    /**
     * volumeNamespace specifies the scope of the volume within StorageOS.  If no namespace is specified then the Pod's namespace will be used.  This allows the Kubernetes name scoping to be mirrored within StorageOS for tighter integration. Set VolumeName to any name to override the default behaviour. Set to "default" if you are not using namespaces within StorageOS. Namespaces that do not pre-exist within StorageOS will be created.
     * @type {string}
     * @memberof IoK8sApiCoreV1StorageOSPersistentVolumeSource
     */
    volumeNamespace?: string;
}
/**
 * Represents a StorageOS persistent volume resource.
 * @export
 * @interface IoK8sApiCoreV1StorageOSVolumeSource
 */
export interface IoK8sApiCoreV1StorageOSVolumeSource {
    /**
     * fsType is the filesystem type to mount. Must be a filesystem type supported by the host operating system. Ex. "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified.
     * @type {string}
     * @memberof IoK8sApiCoreV1StorageOSVolumeSource
     */
    fsType?: string;
    /**
     * readOnly defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1StorageOSVolumeSource
     */
    readOnly?: boolean;
    /**
     * secretRef specifies the secret to use for obtaining the StorageOS API credentials.  If not specified, default values will be attempted.
     * @type {IoK8sApiCoreV1LocalObjectReference}
     * @memberof IoK8sApiCoreV1StorageOSVolumeSource
     */
    secretRef?: IoK8sApiCoreV1LocalObjectReference;
    /**
     * volumeName is the human-readable name of the StorageOS volume.  Volume names are only unique within a namespace.
     * @type {string}
     * @memberof IoK8sApiCoreV1StorageOSVolumeSource
     */
    volumeName?: string;
    /**
     * volumeNamespace specifies the scope of the volume within StorageOS.  If no namespace is specified then the Pod's namespace will be used.  This allows the Kubernetes name scoping to be mirrored within StorageOS for tighter integration. Set VolumeName to any name to override the default behaviour. Set to "default" if you are not using namespaces within StorageOS. Namespaces that do not pre-exist within StorageOS will be created.
     * @type {string}
     * @memberof IoK8sApiCoreV1StorageOSVolumeSource
     */
    volumeNamespace?: string;
}
/**
 * Sysctl defines a kernel parameter to be set
 * @export
 * @interface IoK8sApiCoreV1Sysctl
 */
export interface IoK8sApiCoreV1Sysctl {
    /**
     * Name of a property to set
     * @type {string}
     * @memberof IoK8sApiCoreV1Sysctl
     */
    name: string;
    /**
     * Value of a property to set
     * @type {string}
     * @memberof IoK8sApiCoreV1Sysctl
     */
    value: string;
}
/**
 * TCPSocketAction describes an action based on opening a socket
 * @export
 * @interface IoK8sApiCoreV1TCPSocketAction
 */
export interface IoK8sApiCoreV1TCPSocketAction {
    /**
     * Optional: Host name to connect to, defaults to the pod IP.
     * @type {string}
     * @memberof IoK8sApiCoreV1TCPSocketAction
     */
    host?: string;
    /**
     * Number or name of the port to access on the container. Number must be in the range 1 to 65535. Name must be an IANA_SVC_NAME.
     * @type {IoK8sApimachineryPkgUtilIntstrIntOrString}
     * @memberof IoK8sApiCoreV1TCPSocketAction
     */
    port: IoK8sApimachineryPkgUtilIntstrIntOrString;
}
/**
 * The node this Taint is attached to has the "effect" on any pod that does not tolerate the Taint.
 * @export
 * @interface IoK8sApiCoreV1Taint
 */
export interface IoK8sApiCoreV1Taint {
    /**
     * Required. The effect of the taint on pods that do not tolerate the taint. Valid effects are NoSchedule, PreferNoSchedule and NoExecute.
     * @type {string}
     * @memberof IoK8sApiCoreV1Taint
     */
    effect: string;
    /**
     * Required. The taint key to be applied to a node.
     * @type {string}
     * @memberof IoK8sApiCoreV1Taint
     */
    key: string;
    /**
     * TimeAdded represents the time at which the taint was added. It is only written for NoExecute taints.
     * @type {string}
     * @memberof IoK8sApiCoreV1Taint
     */
    timeAdded?: string;
    /**
     * The taint value corresponding to the taint key.
     * @type {string}
     * @memberof IoK8sApiCoreV1Taint
     */
    value?: string;
}
/**
 * The pod this Toleration is attached to tolerates any taint that matches the triple <key,value,effect> using the matching operator <operator>.
 * @export
 * @interface IoK8sApiCoreV1Toleration
 */
export interface IoK8sApiCoreV1Toleration {
    /**
     * Effect indicates the taint effect to match. Empty means match all taint effects. When specified, allowed values are NoSchedule, PreferNoSchedule and NoExecute.
     * @type {string}
     * @memberof IoK8sApiCoreV1Toleration
     */
    effect?: string;
    /**
     * Key is the taint key that the toleration applies to. Empty means match all taint keys. If the key is empty, operator must be Exists; this combination means to match all values and all keys.
     * @type {string}
     * @memberof IoK8sApiCoreV1Toleration
     */
    key?: string;
    /**
     * Operator represents a key's relationship to the value. Valid operators are Exists and Equal. Defaults to Equal. Exists is equivalent to wildcard for value, so that a pod can tolerate all taints of a particular category.
     * @type {string}
     * @memberof IoK8sApiCoreV1Toleration
     */
    operator?: string;
    /**
     * TolerationSeconds represents the period of time the toleration (which must be of effect NoExecute, otherwise this field is ignored) tolerates the taint. By default, it is not set, which means tolerate the taint forever (do not evict). Zero and negative values will be treated as 0 (evict immediately) by the system.
     * @type {number}
     * @memberof IoK8sApiCoreV1Toleration
     */
    tolerationSeconds?: number;
    /**
     * Value is the taint value the toleration matches to. If the operator is Exists, the value should be empty, otherwise just a regular string.
     * @type {string}
     * @memberof IoK8sApiCoreV1Toleration
     */
    value?: string;
}
/**
 * TopologySpreadConstraint specifies how to spread matching pods among the given topology.
 * @export
 * @interface IoK8sApiCoreV1TopologySpreadConstraint
 */
export interface IoK8sApiCoreV1TopologySpreadConstraint {
    /**
     * LabelSelector is used to find matching pods. Pods that match this label selector are counted to determine the number of pods in their corresponding topology domain.
     * @type {IoK8sApimachineryPkgApisMetaV1LabelSelector}
     * @memberof IoK8sApiCoreV1TopologySpreadConstraint
     */
    labelSelector?: IoK8sApimachineryPkgApisMetaV1LabelSelector;
    /**
     * MatchLabelKeys is a set of pod label keys to select the pods over which spreading will be calculated. The keys are used to lookup values from the incoming pod labels, those key-value labels are ANDed with labelSelector to select the group of existing pods over which spreading will be calculated for the incoming pod. The same key is forbidden to exist in both MatchLabelKeys and LabelSelector. MatchLabelKeys cannot be set when LabelSelector isn't set. Keys that don't exist in the incoming pod labels will be ignored. A null or empty list means only match against labelSelector.
     * 
     * This is a beta field and requires the MatchLabelKeysInPodTopologySpread feature gate to be enabled (enabled by default).
     * @type {Array<string>}
     * @memberof IoK8sApiCoreV1TopologySpreadConstraint
     */
    matchLabelKeys?: Array<string>;
    /**
     * MaxSkew describes the degree to which pods may be unevenly distributed. When `whenUnsatisfiable=DoNotSchedule`, it is the maximum permitted difference between the number of matching pods in the target topology and the global minimum. The global minimum is the minimum number of matching pods in an eligible domain or zero if the number of eligible domains is less than MinDomains. For example, in a 3-zone cluster, MaxSkew is set to 1, and pods with the same labelSelector spread as 2/2/1: In this case, the global minimum is 1. | zone1 | zone2 | zone3 | |  P P  |  P P  |   P   | - if MaxSkew is 1, incoming pod can only be scheduled to zone3 to become 2/2/2; scheduling it onto zone1(zone2) would make the ActualSkew(3-1) on zone1(zone2) violate MaxSkew(1). - if MaxSkew is 2, incoming pod can be scheduled onto any zone. When `whenUnsatisfiable=ScheduleAnyway`, it is used to give higher precedence to topologies that satisfy it. It's a required field. Default value is 1 and 0 is not allowed.
     * @type {number}
     * @memberof IoK8sApiCoreV1TopologySpreadConstraint
     */
    maxSkew: number;
    /**
     * MinDomains indicates a minimum number of eligible domains. When the number of eligible domains with matching topology keys is less than minDomains, Pod Topology Spread treats "global minimum" as 0, and then the calculation of Skew is performed. And when the number of eligible domains with matching topology keys equals or greater than minDomains, this value has no effect on scheduling. As a result, when the number of eligible domains is less than minDomains, scheduler won't schedule more than maxSkew Pods to those domains. If value is nil, the constraint behaves as if MinDomains is equal to 1. Valid values are integers greater than 0. When value is not nil, WhenUnsatisfiable must be DoNotSchedule.
     * 
     * For example, in a 3-zone cluster, MaxSkew is set to 2, MinDomains is set to 5 and pods with the same labelSelector spread as 2/2/2: | zone1 | zone2 | zone3 | |  P P  |  P P  |  P P  | The number of domains is less than 5(MinDomains), so "global minimum" is treated as 0. In this situation, new pod with the same labelSelector cannot be scheduled, because computed skew will be 3(3 - 0) if new Pod is scheduled to any of the three zones, it will violate MaxSkew.
     * @type {number}
     * @memberof IoK8sApiCoreV1TopologySpreadConstraint
     */
    minDomains?: number;
    /**
     * NodeAffinityPolicy indicates how we will treat Pod's nodeAffinity/nodeSelector when calculating pod topology spread skew. Options are: - Honor: only nodes matching nodeAffinity/nodeSelector are included in the calculations. - Ignore: nodeAffinity/nodeSelector are ignored. All nodes are included in the calculations.
     * 
     * If this value is nil, the behavior is equivalent to the Honor policy. This is a beta-level feature default enabled by the NodeInclusionPolicyInPodTopologySpread feature flag.
     * @type {string}
     * @memberof IoK8sApiCoreV1TopologySpreadConstraint
     */
    nodeAffinityPolicy?: string;
    /**
     * NodeTaintsPolicy indicates how we will treat node taints when calculating pod topology spread skew. Options are: - Honor: nodes without taints, along with tainted nodes for which the incoming pod has a toleration, are included. - Ignore: node taints are ignored. All nodes are included.
     * 
     * If this value is nil, the behavior is equivalent to the Ignore policy. This is a beta-level feature default enabled by the NodeInclusionPolicyInPodTopologySpread feature flag.
     * @type {string}
     * @memberof IoK8sApiCoreV1TopologySpreadConstraint
     */
    nodeTaintsPolicy?: string;
    /**
     * TopologyKey is the key of node labels. Nodes that have a label with this key and identical values are considered to be in the same topology. We consider each <key, value> as a "bucket", and try to put balanced number of pods into each bucket. We define a domain as a particular instance of a topology. Also, we define an eligible domain as a domain whose nodes meet the requirements of nodeAffinityPolicy and nodeTaintsPolicy. e.g. If TopologyKey is "kubernetes.io/hostname", each Node is a domain of that topology. And, if TopologyKey is "topology.kubernetes.io/zone", each zone is a domain of that topology. It's a required field.
     * @type {string}
     * @memberof IoK8sApiCoreV1TopologySpreadConstraint
     */
    topologyKey: string;
    /**
     * WhenUnsatisfiable indicates how to deal with a pod if it doesn't satisfy the spread constraint. - DoNotSchedule (default) tells the scheduler not to schedule it. - ScheduleAnyway tells the scheduler to schedule the pod in any location,
     *   but giving higher precedence to topologies that would help reduce the
     *   skew.
     * A constraint is considered "Unsatisfiable" for an incoming pod if and only if every possible node assignment for that pod would violate "MaxSkew" on some topology. For example, in a 3-zone cluster, MaxSkew is set to 1, and pods with the same labelSelector spread as 3/1/1: | zone1 | zone2 | zone3 | | P P P |   P   |   P   | If WhenUnsatisfiable is set to DoNotSchedule, incoming pod can only be scheduled to zone2(zone3) to become 3/2/1(3/1/2) as ActualSkew(2-1) on zone2(zone3) satisfies MaxSkew(1). In other words, the cluster can still be imbalanced, but scheduler won't make it *more* imbalanced. It's a required field.
     * @type {string}
     * @memberof IoK8sApiCoreV1TopologySpreadConstraint
     */
    whenUnsatisfiable: string;
}
/**
 * TypedLocalObjectReference contains enough information to let you locate the typed referenced object inside the same namespace.
 * @export
 * @interface IoK8sApiCoreV1TypedLocalObjectReference
 */
export interface IoK8sApiCoreV1TypedLocalObjectReference {
    /**
     * APIGroup is the group for the resource being referenced. If APIGroup is not specified, the specified Kind must be in the core API group. For any other third-party types, APIGroup is required.
     * @type {string}
     * @memberof IoK8sApiCoreV1TypedLocalObjectReference
     */
    apiGroup?: string;
    /**
     * Kind is the type of resource being referenced
     * @type {string}
     * @memberof IoK8sApiCoreV1TypedLocalObjectReference
     */
    kind: string;
    /**
     * Name is the name of resource being referenced
     * @type {string}
     * @memberof IoK8sApiCoreV1TypedLocalObjectReference
     */
    name: string;
}
/**
 * 
 * @export
 * @interface IoK8sApiCoreV1TypedObjectReference
 */
export interface IoK8sApiCoreV1TypedObjectReference {
    /**
     * APIGroup is the group for the resource being referenced. If APIGroup is not specified, the specified Kind must be in the core API group. For any other third-party types, APIGroup is required.
     * @type {string}
     * @memberof IoK8sApiCoreV1TypedObjectReference
     */
    apiGroup?: string;
    /**
     * Kind is the type of resource being referenced
     * @type {string}
     * @memberof IoK8sApiCoreV1TypedObjectReference
     */
    kind: string;
    /**
     * Name is the name of resource being referenced
     * @type {string}
     * @memberof IoK8sApiCoreV1TypedObjectReference
     */
    name: string;
    /**
     * Namespace is the namespace of resource being referenced Note that when a namespace is specified, a gateway.networking.k8s.io/ReferenceGrant object is required in the referent namespace to allow that namespace's owner to accept the reference. See the ReferenceGrant documentation for details. (Alpha) This field requires the CrossNamespaceVolumeDataSource feature gate to be enabled.
     * @type {string}
     * @memberof IoK8sApiCoreV1TypedObjectReference
     */
    namespace?: string;
}
/**
 * Volume represents a named volume in a pod that may be accessed by any container in the pod.
 * @export
 * @interface IoK8sApiCoreV1Volume
 */
export interface IoK8sApiCoreV1Volume {
    /**
     * awsElasticBlockStore represents an AWS Disk resource that is attached to a kubelet's host machine and then exposed to the pod. More info: https://kubernetes.io/docs/concepts/storage/volumes#awselasticblockstore
     * @type {IoK8sApiCoreV1AWSElasticBlockStoreVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    awsElasticBlockStore?: IoK8sApiCoreV1AWSElasticBlockStoreVolumeSource;
    /**
     * azureDisk represents an Azure Data Disk mount on the host and bind mount to the pod.
     * @type {IoK8sApiCoreV1AzureDiskVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    azureDisk?: IoK8sApiCoreV1AzureDiskVolumeSource;
    /**
     * azureFile represents an Azure File Service mount on the host and bind mount to the pod.
     * @type {IoK8sApiCoreV1AzureFileVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    azureFile?: IoK8sApiCoreV1AzureFileVolumeSource;
    /**
     * cephFS represents a Ceph FS mount on the host that shares a pod's lifetime
     * @type {IoK8sApiCoreV1CephFSVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    cephfs?: IoK8sApiCoreV1CephFSVolumeSource;
    /**
     * cinder represents a cinder volume attached and mounted on kubelets host machine. More info: https://examples.k8s.io/mysql-cinder-pd/README.md
     * @type {IoK8sApiCoreV1CinderVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    cinder?: IoK8sApiCoreV1CinderVolumeSource;
    /**
     * configMap represents a configMap that should populate this volume
     * @type {IoK8sApiCoreV1ConfigMapVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    configMap?: IoK8sApiCoreV1ConfigMapVolumeSource;
    /**
     * csi (Container Storage Interface) represents ephemeral storage that is handled by certain external CSI drivers (Beta feature).
     * @type {IoK8sApiCoreV1CSIVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    csi?: IoK8sApiCoreV1CSIVolumeSource;
    /**
     * downwardAPI represents downward API about the pod that should populate this volume
     * @type {IoK8sApiCoreV1DownwardAPIVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    downwardAPI?: IoK8sApiCoreV1DownwardAPIVolumeSource;
    /**
     * emptyDir represents a temporary directory that shares a pod's lifetime. More info: https://kubernetes.io/docs/concepts/storage/volumes#emptydir
     * @type {IoK8sApiCoreV1EmptyDirVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    emptyDir?: IoK8sApiCoreV1EmptyDirVolumeSource;
    /**
     * ephemeral represents a volume that is handled by a cluster storage driver. The volume's lifecycle is tied to the pod that defines it - it will be created before the pod starts, and deleted when the pod is removed.
     * 
     * Use this if: a) the volume is only needed while the pod runs, b) features of normal volumes like restoring from snapshot or capacity
     *    tracking are needed,
     * c) the storage driver is specified through a storage class, and d) the storage driver supports dynamic volume provisioning through
     *    a PersistentVolumeClaim (see EphemeralVolumeSource for more
     *    information on the connection between this volume type
     *    and PersistentVolumeClaim).
     * 
     * Use PersistentVolumeClaim or one of the vendor-specific APIs for volumes that persist for longer than the lifecycle of an individual pod.
     * 
     * Use CSI for light-weight local ephemeral volumes if the CSI driver is meant to be used that way - see the documentation of the driver for more information.
     * 
     * A pod can use both types of ephemeral volumes and persistent volumes at the same time.
     * @type {IoK8sApiCoreV1EphemeralVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    ephemeral?: IoK8sApiCoreV1EphemeralVolumeSource;
    /**
     * fc represents a Fibre Channel resource that is attached to a kubelet's host machine and then exposed to the pod.
     * @type {IoK8sApiCoreV1FCVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    fc?: IoK8sApiCoreV1FCVolumeSource;
    /**
     * flexVolume represents a generic volume resource that is provisioned/attached using an exec based plugin.
     * @type {IoK8sApiCoreV1FlexVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    flexVolume?: IoK8sApiCoreV1FlexVolumeSource;
    /**
     * flocker represents a Flocker volume attached to a kubelet's host machine. This depends on the Flocker control service being running
     * @type {IoK8sApiCoreV1FlockerVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    flocker?: IoK8sApiCoreV1FlockerVolumeSource;
    /**
     * gcePersistentDisk represents a GCE Disk resource that is attached to a kubelet's host machine and then exposed to the pod. More info: https://kubernetes.io/docs/concepts/storage/volumes#gcepersistentdisk
     * @type {IoK8sApiCoreV1GCEPersistentDiskVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    gcePersistentDisk?: IoK8sApiCoreV1GCEPersistentDiskVolumeSource;
    /**
     * gitRepo represents a git repository at a particular revision. DEPRECATED: GitRepo is deprecated. To provision a container with a git repo, mount an EmptyDir into an InitContainer that clones the repo using git, then mount the EmptyDir into the Pod's container.
     * @type {IoK8sApiCoreV1GitRepoVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    gitRepo?: IoK8sApiCoreV1GitRepoVolumeSource;
    /**
     * glusterfs represents a Glusterfs mount on the host that shares a pod's lifetime. More info: https://examples.k8s.io/volumes/glusterfs/README.md
     * @type {IoK8sApiCoreV1GlusterfsVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    glusterfs?: IoK8sApiCoreV1GlusterfsVolumeSource;
    /**
     * hostPath represents a pre-existing file or directory on the host machine that is directly exposed to the container. This is generally used for system agents or other privileged things that are allowed to see the host machine. Most containers will NOT need this. More info: https://kubernetes.io/docs/concepts/storage/volumes#hostpath
     * @type {IoK8sApiCoreV1HostPathVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    hostPath?: IoK8sApiCoreV1HostPathVolumeSource;
    /**
     * iscsi represents an ISCSI Disk resource that is attached to a kubelet's host machine and then exposed to the pod. More info: https://examples.k8s.io/volumes/iscsi/README.md
     * @type {IoK8sApiCoreV1ISCSIVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    iscsi?: IoK8sApiCoreV1ISCSIVolumeSource;
    /**
     * name of the volume. Must be a DNS_LABEL and unique within the pod. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
     * @type {string}
     * @memberof IoK8sApiCoreV1Volume
     */
    name: string;
    /**
     * nfs represents an NFS mount on the host that shares a pod's lifetime More info: https://kubernetes.io/docs/concepts/storage/volumes#nfs
     * @type {IoK8sApiCoreV1NFSVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    nfs?: IoK8sApiCoreV1NFSVolumeSource;
    /**
     * persistentVolumeClaimVolumeSource represents a reference to a PersistentVolumeClaim in the same namespace. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#persistentvolumeclaims
     * @type {IoK8sApiCoreV1PersistentVolumeClaimVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    persistentVolumeClaim?: IoK8sApiCoreV1PersistentVolumeClaimVolumeSource;
    /**
     * photonPersistentDisk represents a PhotonController persistent disk attached and mounted on kubelets host machine
     * @type {IoK8sApiCoreV1PhotonPersistentDiskVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    photonPersistentDisk?: IoK8sApiCoreV1PhotonPersistentDiskVolumeSource;
    /**
     * portworxVolume represents a portworx volume attached and mounted on kubelets host machine
     * @type {IoK8sApiCoreV1PortworxVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    portworxVolume?: IoK8sApiCoreV1PortworxVolumeSource;
    /**
     * projected items for all in one resources secrets, configmaps, and downward API
     * @type {IoK8sApiCoreV1ProjectedVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    projected?: IoK8sApiCoreV1ProjectedVolumeSource;
    /**
     * quobyte represents a Quobyte mount on the host that shares a pod's lifetime
     * @type {IoK8sApiCoreV1QuobyteVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    quobyte?: IoK8sApiCoreV1QuobyteVolumeSource;
    /**
     * rbd represents a Rados Block Device mount on the host that shares a pod's lifetime. More info: https://examples.k8s.io/volumes/rbd/README.md
     * @type {IoK8sApiCoreV1RBDVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    rbd?: IoK8sApiCoreV1RBDVolumeSource;
    /**
     * scaleIO represents a ScaleIO persistent volume attached and mounted on Kubernetes nodes.
     * @type {IoK8sApiCoreV1ScaleIOVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    scaleIO?: IoK8sApiCoreV1ScaleIOVolumeSource;
    /**
     * secret represents a secret that should populate this volume. More info: https://kubernetes.io/docs/concepts/storage/volumes#secret
     * @type {IoK8sApiCoreV1SecretVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    secret?: IoK8sApiCoreV1SecretVolumeSource;
    /**
     * storageOS represents a StorageOS volume attached and mounted on Kubernetes nodes.
     * @type {IoK8sApiCoreV1StorageOSVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    storageos?: IoK8sApiCoreV1StorageOSVolumeSource;
    /**
     * vsphereVolume represents a vSphere volume attached and mounted on kubelets host machine
     * @type {IoK8sApiCoreV1VsphereVirtualDiskVolumeSource}
     * @memberof IoK8sApiCoreV1Volume
     */
    vsphereVolume?: IoK8sApiCoreV1VsphereVirtualDiskVolumeSource;
}
/**
 * volumeDevice describes a mapping of a raw block device within a container.
 * @export
 * @interface IoK8sApiCoreV1VolumeDevice
 */
export interface IoK8sApiCoreV1VolumeDevice {
    /**
     * devicePath is the path inside of the container that the device will be mapped to.
     * @type {string}
     * @memberof IoK8sApiCoreV1VolumeDevice
     */
    devicePath: string;
    /**
     * name must match the name of a persistentVolumeClaim in the pod
     * @type {string}
     * @memberof IoK8sApiCoreV1VolumeDevice
     */
    name: string;
}
/**
 * VolumeMount describes a mounting of a Volume within a container.
 * @export
 * @interface IoK8sApiCoreV1VolumeMount
 */
export interface IoK8sApiCoreV1VolumeMount {
    /**
     * Path within the container at which the volume should be mounted.  Must not contain ':'.
     * @type {string}
     * @memberof IoK8sApiCoreV1VolumeMount
     */
    mountPath: string;
    /**
     * mountPropagation determines how mounts are propagated from the host to container and the other way around. When not set, MountPropagationNone is used. This field is beta in 1.10. When RecursiveReadOnly is set to IfPossible or to Enabled, MountPropagation must be None or unspecified (which defaults to None).
     * @type {string}
     * @memberof IoK8sApiCoreV1VolumeMount
     */
    mountPropagation?: string;
    /**
     * This must match the Name of a Volume.
     * @type {string}
     * @memberof IoK8sApiCoreV1VolumeMount
     */
    name: string;
    /**
     * Mounted read-only if true, read-write otherwise (false or unspecified). Defaults to false.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1VolumeMount
     */
    readOnly?: boolean;
    /**
     * RecursiveReadOnly specifies whether read-only mounts should be handled recursively.
     * 
     * If ReadOnly is false, this field has no meaning and must be unspecified.
     * 
     * If ReadOnly is true, and this field is set to Disabled, the mount is not made recursively read-only.  If this field is set to IfPossible, the mount is made recursively read-only, if it is supported by the container runtime.  If this field is set to Enabled, the mount is made recursively read-only if it is supported by the container runtime, otherwise the pod will not be started and an error will be generated to indicate the reason.
     * 
     * If this field is set to IfPossible or Enabled, MountPropagation must be set to None (or be unspecified, which defaults to None).
     * 
     * If this field is not specified, it is treated as an equivalent of Disabled.
     * @type {string}
     * @memberof IoK8sApiCoreV1VolumeMount
     */
    recursiveReadOnly?: string;
    /**
     * Path within the volume from which the container's volume should be mounted. Defaults to "" (volume's root).
     * @type {string}
     * @memberof IoK8sApiCoreV1VolumeMount
     */
    subPath?: string;
    /**
     * Expanded path within the volume from which the container's volume should be mounted. Behaves similarly to SubPath but environment variable references $(VAR_NAME) are expanded using the container's environment. Defaults to "" (volume's root). SubPathExpr and SubPath are mutually exclusive.
     * @type {string}
     * @memberof IoK8sApiCoreV1VolumeMount
     */
    subPathExpr?: string;
}
/**
 * VolumeMountStatus shows status of volume mounts.
 * @export
 * @interface IoK8sApiCoreV1VolumeMountStatus
 */
export interface IoK8sApiCoreV1VolumeMountStatus {
    /**
     * MountPath corresponds to the original VolumeMount.
     * @type {string}
     * @memberof IoK8sApiCoreV1VolumeMountStatus
     */
    mountPath: string;
    /**
     * Name corresponds to the name of the original VolumeMount.
     * @type {string}
     * @memberof IoK8sApiCoreV1VolumeMountStatus
     */
    name: string;
    /**
     * ReadOnly corresponds to the original VolumeMount.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1VolumeMountStatus
     */
    readOnly?: boolean;
    /**
     * RecursiveReadOnly must be set to Disabled, Enabled, or unspecified (for non-readonly mounts). An IfPossible value in the original VolumeMount must be translated to Disabled or Enabled, depending on the mount result.
     * @type {string}
     * @memberof IoK8sApiCoreV1VolumeMountStatus
     */
    recursiveReadOnly?: string;
}
/**
 * VolumeNodeAffinity defines constraints that limit what nodes this volume can be accessed from.
 * @export
 * @interface IoK8sApiCoreV1VolumeNodeAffinity
 */
export interface IoK8sApiCoreV1VolumeNodeAffinity {
    /**
     * required specifies hard node constraints that must be met.
     * @type {IoK8sApiCoreV1NodeSelector}
     * @memberof IoK8sApiCoreV1VolumeNodeAffinity
     */
    required?: IoK8sApiCoreV1NodeSelector;
}
/**
 * Projection that may be projected along with other supported volume types
 * @export
 * @interface IoK8sApiCoreV1VolumeProjection
 */
export interface IoK8sApiCoreV1VolumeProjection {
    /**
     * ClusterTrustBundle allows a pod to access the `.spec.trustBundle` field of ClusterTrustBundle objects in an auto-updating file.
     * 
     * Alpha, gated by the ClusterTrustBundleProjection feature gate.
     * 
     * ClusterTrustBundle objects can either be selected by name, or by the combination of signer name and a label selector.
     * 
     * Kubelet performs aggressive normalization of the PEM contents written into the pod filesystem.  Esoteric PEM features such as inter-block comments and block headers are stripped.  Certificates are deduplicated. The ordering of certificates within the file is arbitrary, and Kubelet may change the order over time.
     * @type {IoK8sApiCoreV1ClusterTrustBundleProjection}
     * @memberof IoK8sApiCoreV1VolumeProjection
     */
    clusterTrustBundle?: IoK8sApiCoreV1ClusterTrustBundleProjection;
    /**
     * configMap information about the configMap data to project
     * @type {IoK8sApiCoreV1ConfigMapProjection}
     * @memberof IoK8sApiCoreV1VolumeProjection
     */
    configMap?: IoK8sApiCoreV1ConfigMapProjection;
    /**
     * downwardAPI information about the downwardAPI data to project
     * @type {IoK8sApiCoreV1DownwardAPIProjection}
     * @memberof IoK8sApiCoreV1VolumeProjection
     */
    downwardAPI?: IoK8sApiCoreV1DownwardAPIProjection;
    /**
     * secret information about the secret data to project
     * @type {IoK8sApiCoreV1SecretProjection}
     * @memberof IoK8sApiCoreV1VolumeProjection
     */
    secret?: IoK8sApiCoreV1SecretProjection;
    /**
     * serviceAccountToken is information about the serviceAccountToken data to project
     * @type {IoK8sApiCoreV1ServiceAccountTokenProjection}
     * @memberof IoK8sApiCoreV1VolumeProjection
     */
    serviceAccountToken?: IoK8sApiCoreV1ServiceAccountTokenProjection;
}
/**
 * VolumeResourceRequirements describes the storage resource requirements for a volume.
 * @export
 * @interface IoK8sApiCoreV1VolumeResourceRequirements
 */
export interface IoK8sApiCoreV1VolumeResourceRequirements {
    /**
     * Limits describes the maximum amount of compute resources allowed. More info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1VolumeResourceRequirements
     */
    limits?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
    /**
     * Requests describes the minimum amount of compute resources required. If Requests is omitted for a container, it defaults to Limits if that is explicitly specified, otherwise to an implementation-defined value. Requests cannot exceed Limits. More info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
     * @type {{ [key: string]: IoK8sApimachineryPkgApiResourceQuantity; }}
     * @memberof IoK8sApiCoreV1VolumeResourceRequirements
     */
    requests?: { [key: string]: IoK8sApimachineryPkgApiResourceQuantity; };
}
/**
 * Represents a vSphere volume resource.
 * @export
 * @interface IoK8sApiCoreV1VsphereVirtualDiskVolumeSource
 */
export interface IoK8sApiCoreV1VsphereVirtualDiskVolumeSource {
    /**
     * fsType is filesystem type to mount. Must be a filesystem type supported by the host operating system. Ex. "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified.
     * @type {string}
     * @memberof IoK8sApiCoreV1VsphereVirtualDiskVolumeSource
     */
    fsType?: string;
    /**
     * storagePolicyID is the storage Policy Based Management (SPBM) profile ID associated with the StoragePolicyName.
     * @type {string}
     * @memberof IoK8sApiCoreV1VsphereVirtualDiskVolumeSource
     */
    storagePolicyID?: string;
    /**
     * storagePolicyName is the storage Policy Based Management (SPBM) profile name.
     * @type {string}
     * @memberof IoK8sApiCoreV1VsphereVirtualDiskVolumeSource
     */
    storagePolicyName?: string;
    /**
     * volumePath is the path that identifies vSphere volume vmdk
     * @type {string}
     * @memberof IoK8sApiCoreV1VsphereVirtualDiskVolumeSource
     */
    volumePath: string;
}
/**
 * The weights of all of the matched WeightedPodAffinityTerm fields are added per-node to find the most preferred node(s)
 * @export
 * @interface IoK8sApiCoreV1WeightedPodAffinityTerm
 */
export interface IoK8sApiCoreV1WeightedPodAffinityTerm {
    /**
     * Required. A pod affinity term, associated with the corresponding weight.
     * @type {IoK8sApiCoreV1PodAffinityTerm}
     * @memberof IoK8sApiCoreV1WeightedPodAffinityTerm
     */
    podAffinityTerm: IoK8sApiCoreV1PodAffinityTerm;
    /**
     * weight associated with matching the corresponding podAffinityTerm, in the range 1-100.
     * @type {number}
     * @memberof IoK8sApiCoreV1WeightedPodAffinityTerm
     */
    weight: number;
}
/**
 * WindowsSecurityContextOptions contain Windows-specific options and credentials.
 * @export
 * @interface IoK8sApiCoreV1WindowsSecurityContextOptions
 */
export interface IoK8sApiCoreV1WindowsSecurityContextOptions {
    /**
     * GMSACredentialSpec is where the GMSA admission webhook (https://github.com/kubernetes-sigs/windows-gmsa) inlines the contents of the GMSA credential spec named by the GMSACredentialSpecName field.
     * @type {string}
     * @memberof IoK8sApiCoreV1WindowsSecurityContextOptions
     */
    gmsaCredentialSpec?: string;
    /**
     * GMSACredentialSpecName is the name of the GMSA credential spec to use.
     * @type {string}
     * @memberof IoK8sApiCoreV1WindowsSecurityContextOptions
     */
    gmsaCredentialSpecName?: string;
    /**
     * HostProcess determines if a container should be run as a 'Host Process' container. All of a Pod's containers must have the same effective HostProcess value (it is not allowed to have a mix of HostProcess containers and non-HostProcess containers). In addition, if HostProcess is true then HostNetwork must also be set to true.
     * @type {boolean}
     * @memberof IoK8sApiCoreV1WindowsSecurityContextOptions
     */
    hostProcess?: boolean;
    /**
     * The UserName in Windows to run the entrypoint of the container process. Defaults to the user specified in image metadata if unspecified. May also be set in PodSecurityContext. If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence.
     * @type {string}
     * @memberof IoK8sApiCoreV1WindowsSecurityContextOptions
     */
    runAsUserName?: string;
}
/**
 * Eviction evicts a pod from its node subject to certain policies and safety constraints. This is a subresource of Pod.  A request to cause such an eviction is created by POSTing to .../pods/<pod name>/evictions.
 * @export
 * @interface IoK8sApiPolicyV1Eviction
 */
export interface IoK8sApiPolicyV1Eviction {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApiPolicyV1Eviction
     */
    apiVersion?: string;
    /**
     * DeleteOptions may be provided
     * @type {IoK8sApimachineryPkgApisMetaV1DeleteOptions}
     * @memberof IoK8sApiPolicyV1Eviction
     */
    deleteOptions?: IoK8sApimachineryPkgApisMetaV1DeleteOptions;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApiPolicyV1Eviction
     */
    kind?: string;
    /**
     * ObjectMeta describes the pod that is being evicted.
     * @type {IoK8sApimachineryPkgApisMetaV1ObjectMeta}
     * @memberof IoK8sApiPolicyV1Eviction
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ObjectMeta;
}
/**
 * @type IoK8sApimachineryPkgApiResourceQuantity
 * Quantity is a fixed-point representation of a number. It provides convenient marshaling/unmarshaling in JSON and YAML, in addition to String() and AsInt64() accessors.
 * 
 * The serialization format is:
 * 
 * ``` <quantity>        ::= <signedNumber><suffix>
 * 
 * 	(Note that <suffix> may be empty, from the "" case in <decimalSI>.)
 * 
 * <digit>           ::= 0 | 1 | ... | 9 <digits>          ::= <digit> | <digit><digits> <number>          ::= <digits> | <digits>.<digits> | <digits>. | .<digits> <sign>            ::= "+" | "-" <signedNumber>    ::= <number> | <sign><number> <suffix>          ::= <binarySI> | <decimalExponent> | <decimalSI> <binarySI>        ::= Ki | Mi | Gi | Ti | Pi | Ei
 * 
 * 	(International System of units; See: http://physics.nist.gov/cuu/Units/binary.html)
 * 
 * <decimalSI>       ::= m | "" | k | M | G | T | P | E
 * 
 * 	(Note that 1024 = 1Ki but 1000 = 1k; I didn't choose the capitalization.)
 * 
 * <decimalExponent> ::= "e" <signedNumber> | "E" <signedNumber> ```
 * 
 * No matter which of the three exponent forms is used, no quantity may represent a number greater than 2^63-1 in magnitude, nor may it have more than 3 decimal places. Numbers larger or more precise will be capped or rounded up. (E.g.: 0.1m will rounded up to 1m.) This may be extended in the future if we require larger or smaller quantities.
 * 
 * When a Quantity is parsed from a string, it will remember the type of suffix it had, and will use the same type again when it is serialized.
 * 
 * Before serializing, Quantity will be put in "canonical form". This means that Exponent/suffix will be adjusted up or down (with a corresponding increase or decrease in Mantissa) such that:
 * 
 * - No precision is lost - No fractional digits will be emitted - The exponent (or suffix) is as large as possible.
 * 
 * The sign will be omitted unless the number is negative.
 * 
 * Examples:
 * 
 * - 1.5 will be serialized as "1500m" - 1.5Gi will be serialized as "1536Mi"
 * 
 * Note that the quantity will NEVER be internally represented by a floating point number. That is the whole point of this exercise.
 * 
 * Non-canonical values will still parse as long as they are well formed, but will be re-emitted in their canonical form. (So always use canonical form, or don't diff.)
 * 
 * This format is intended to make it difficult to use these numbers without writing some sort of special handling code in the hopes that that will cause implementors to also use a fixed point implementation.
 * @export
 */
export type IoK8sApimachineryPkgApiResourceQuantity = number | string;
/**
 * APIResource specifies the name of a resource and whether it is namespaced.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1APIResource
 */
export interface IoK8sApimachineryPkgApisMetaV1APIResource {
    /**
     * categories is a list of the grouped resources this resource belongs to (e.g. 'all')
     * @type {Array<string>}
     * @memberof IoK8sApimachineryPkgApisMetaV1APIResource
     */
    categories?: Array<string>;
    /**
     * group is the preferred group of the resource.  Empty implies the group of the containing resource list. For subresources, this may have a different value, for example: Scale".
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1APIResource
     */
    group?: string;
    /**
     * kind is the kind for the resource (e.g. 'Foo' is the kind for a resource 'foo')
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1APIResource
     */
    kind: string;
    /**
     * name is the plural name of the resource.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1APIResource
     */
    name: string;
    /**
     * namespaced indicates if a resource is namespaced or not.
     * @type {boolean}
     * @memberof IoK8sApimachineryPkgApisMetaV1APIResource
     */
    namespaced: boolean;
    /**
     * shortNames is a list of suggested short names of the resource.
     * @type {Array<string>}
     * @memberof IoK8sApimachineryPkgApisMetaV1APIResource
     */
    shortNames?: Array<string>;
    /**
     * singularName is the singular name of the resource.  This allows clients to handle plural and singular opaquely. The singularName is more correct for reporting status on a single item and both singular and plural are allowed from the kubectl CLI interface.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1APIResource
     */
    singularName: string;
    /**
     * The hash value of the storage version, the version this resource is converted to when written to the data store. Value must be treated as opaque by clients. Only equality comparison on the value is valid. This is an alpha feature and may change or be removed in the future. The field is populated by the apiserver only if the StorageVersionHash feature gate is enabled. This field will remain optional even if it graduates.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1APIResource
     */
    storageVersionHash?: string;
    /**
     * verbs is a list of supported kube verbs (this includes get, list, watch, create, update, patch, delete, deletecollection, and proxy)
     * @type {Array<string>}
     * @memberof IoK8sApimachineryPkgApisMetaV1APIResource
     */
    verbs: Array<string>;
    /**
     * version is the preferred version of the resource.  Empty implies the version of the containing resource list For subresources, this may have a different value, for example: v1 (while inside a v1beta1 version of the core resource's group)".
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1APIResource
     */
    version?: string;
}
/**
 * APIResourceList is a list of APIResource, it is used to expose the name of the resources supported in a specific group and version, and if the resource is namespaced.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1APIResourceList
 */
export interface IoK8sApimachineryPkgApisMetaV1APIResourceList {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1APIResourceList
     */
    apiVersion?: string;
    /**
     * groupVersion is the group and version this APIResourceList is for.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1APIResourceList
     */
    groupVersion: string;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1APIResourceList
     */
    kind?: string;
    /**
     * resources contains the name of the resources and if they are namespaced.
     * @type {Array<IoK8sApimachineryPkgApisMetaV1APIResource>}
     * @memberof IoK8sApimachineryPkgApisMetaV1APIResourceList
     */
    resources: Array<IoK8sApimachineryPkgApisMetaV1APIResource>;
}
/**
 * Condition contains details for one aspect of the current state of this API Resource.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1Condition
 */
export interface IoK8sApimachineryPkgApisMetaV1Condition {
    /**
     * lastTransitionTime is the last time the condition transitioned from one status to another. This should be when the underlying condition changed.  If that is not known, then using the time when the API field changed is acceptable.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1Condition
     */
    lastTransitionTime: string;
    /**
     * message is a human readable message indicating details about the transition. This may be an empty string.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1Condition
     */
    message: string;
    /**
     * observedGeneration represents the .metadata.generation that the condition was set based upon. For instance, if .metadata.generation is currently 12, but the .status.conditions[x].observedGeneration is 9, the condition is out of date with respect to the current state of the instance.
     * @type {number}
     * @memberof IoK8sApimachineryPkgApisMetaV1Condition
     */
    observedGeneration?: number;
    /**
     * reason contains a programmatic identifier indicating the reason for the condition's last transition. Producers of specific condition types may define expected values and meanings for this field, and whether the values are considered a guaranteed API. The value should be a CamelCase string. This field may not be empty.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1Condition
     */
    reason: string;
    /**
     * status of the condition, one of True, False, Unknown.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1Condition
     */
    status: string;
    /**
     * type of condition in CamelCase or in foo.example.com/CamelCase.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1Condition
     */
    type: string;
}
/**
 * DeleteOptions may be provided when deleting an API object.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1DeleteOptions
 */
export interface IoK8sApimachineryPkgApisMetaV1DeleteOptions {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1DeleteOptions
     */
    apiVersion?: string;
    /**
     * When present, indicates that modifications should not be persisted. An invalid or unrecognized dryRun directive will result in an error response and no further processing of the request. Valid values are: - All: all dry run stages will be processed
     * @type {Array<string>}
     * @memberof IoK8sApimachineryPkgApisMetaV1DeleteOptions
     */
    dryRun?: Array<string>;
    /**
     * The duration in seconds before the object should be deleted. Value must be non-negative integer. The value zero indicates delete immediately. If this value is nil, the default grace period for the specified type will be used. Defaults to a per object value if not specified. zero means delete immediately.
     * @type {number}
     * @memberof IoK8sApimachineryPkgApisMetaV1DeleteOptions
     */
    gracePeriodSeconds?: number;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1DeleteOptions
     */
    kind?: string;
    /**
     * Deprecated: please use the PropagationPolicy, this field will be deprecated in 1.7. Should the dependent objects be orphaned. If true/false, the "orphan" finalizer will be added to/removed from the object's finalizers list. Either this field or PropagationPolicy may be set, but not both.
     * @type {boolean}
     * @memberof IoK8sApimachineryPkgApisMetaV1DeleteOptions
     */
    orphanDependents?: boolean;
    /**
     * Must be fulfilled before a deletion is carried out. If not possible, a 409 Conflict status will be returned.
     * @type {IoK8sApimachineryPkgApisMetaV1Preconditions}
     * @memberof IoK8sApimachineryPkgApisMetaV1DeleteOptions
     */
    preconditions?: IoK8sApimachineryPkgApisMetaV1Preconditions;
    /**
     * Whether and how garbage collection will be performed. Either this field or OrphanDependents may be set, but not both. The default policy is decided by the existing finalizer set in the metadata.finalizers and the resource-specific default policy. Acceptable values are: 'Orphan' - orphan the dependents; 'Background' - allow the garbage collector to delete the dependents in the background; 'Foreground' - a cascading policy that deletes all dependents in the foreground.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1DeleteOptions
     */
    propagationPolicy?: string;
}
/**
 * A label selector is a label query over a set of resources. The result of matchLabels and matchExpressions are ANDed. An empty label selector matches all objects. A null label selector matches no objects.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1LabelSelector
 */
export interface IoK8sApimachineryPkgApisMetaV1LabelSelector {
    /**
     * matchExpressions is a list of label selector requirements. The requirements are ANDed.
     * @type {Array<IoK8sApimachineryPkgApisMetaV1LabelSelectorRequirement>}
     * @memberof IoK8sApimachineryPkgApisMetaV1LabelSelector
     */
    matchExpressions?: Array<IoK8sApimachineryPkgApisMetaV1LabelSelectorRequirement>;
    /**
     * matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels map is equivalent to an element of matchExpressions, whose key field is "key", the operator is "In", and the values array contains only "value". The requirements are ANDed.
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApimachineryPkgApisMetaV1LabelSelector
     */
    matchLabels?: { [key: string]: string; };
}
/**
 * A label selector requirement is a selector that contains values, a key, and an operator that relates the key and values.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1LabelSelectorRequirement
 */
export interface IoK8sApimachineryPkgApisMetaV1LabelSelectorRequirement {
    /**
     * key is the label key that the selector applies to.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1LabelSelectorRequirement
     */
    key: string;
    /**
     * operator represents a key's relationship to a set of values. Valid operators are In, NotIn, Exists and DoesNotExist.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1LabelSelectorRequirement
     */
    operator: string;
    /**
     * values is an array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. This array is replaced during a strategic merge patch.
     * @type {Array<string>}
     * @memberof IoK8sApimachineryPkgApisMetaV1LabelSelectorRequirement
     */
    values?: Array<string>;
}
/**
 * ListMeta describes metadata that synthetic resources must have, including lists and various status objects. A resource may have only one of {ObjectMeta, ListMeta}.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1ListMeta
 */
export interface IoK8sApimachineryPkgApisMetaV1ListMeta {
    /**
     * continue may be set if the user set a limit on the number of items returned, and indicates that the server has more data available. The value is opaque and may be used to issue another request to the endpoint that served this list to retrieve the next set of available objects. Continuing a consistent list may not be possible if the server configuration has changed or more than a few minutes have passed. The resourceVersion field returned when using this continue value will be identical to the value in the first response, unless you have received this token from an error message.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ListMeta
     */
    _continue?: string;
    /**
     * remainingItemCount is the number of subsequent items in the list which are not included in this list response. If the list request contained label or field selectors, then the number of remaining items is unknown and the field will be left unset and omitted during serialization. If the list is complete (either because it is not chunking or because this is the last chunk), then there are no more remaining items and this field will be left unset and omitted during serialization. Servers older than v1.15 do not set this field. The intended use of the remainingItemCount is *estimating* the size of a collection. Clients should not rely on the remainingItemCount to be set or to be exact.
     * @type {number}
     * @memberof IoK8sApimachineryPkgApisMetaV1ListMeta
     */
    remainingItemCount?: number;
    /**
     * String that identifies the server's internal version of this object that can be used by clients to determine when objects have changed. Value must be treated as opaque by clients and passed unmodified back to the server. Populated by the system. Read-only. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#concurrency-control-and-consistency
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ListMeta
     */
    resourceVersion?: string;
    /**
     * Deprecated: selfLink is a legacy read-only field that is no longer populated by the system.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ListMeta
     */
    selfLink?: string;
}
/**
 * ManagedFieldsEntry is a workflow-id, a FieldSet and the group version of the resource that the fieldset applies to.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1ManagedFieldsEntry
 */
export interface IoK8sApimachineryPkgApisMetaV1ManagedFieldsEntry {
    /**
     * APIVersion defines the version of this resource that this field set applies to. The format is "group/version" just like the top-level APIVersion field. It is necessary to track the version of a field set because it cannot be automatically converted.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ManagedFieldsEntry
     */
    apiVersion?: string;
    /**
     * FieldsType is the discriminator for the different fields format and version. There is currently only one possible value: "FieldsV1"
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ManagedFieldsEntry
     */
    fieldsType?: string;
    /**
     * FieldsV1 holds the first JSON version format as described in the "FieldsV1" type.
     * @type {object}
     * @memberof IoK8sApimachineryPkgApisMetaV1ManagedFieldsEntry
     */
    fieldsV1?: object;
    /**
     * Manager is an identifier of the workflow managing these fields.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ManagedFieldsEntry
     */
    manager?: string;
    /**
     * Operation is the type of operation which lead to this ManagedFieldsEntry being created. The only valid values for this field are 'Apply' and 'Update'.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ManagedFieldsEntry
     */
    operation?: string;
    /**
     * Subresource is the name of the subresource used to update that object, or empty string if the object was updated through the main resource. The value of this field is used to distinguish between managers, even if they share the same name. For example, a status update will be distinct from a regular update using the same manager name. Note that the APIVersion field is not related to the Subresource field and it always corresponds to the version of the main resource.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ManagedFieldsEntry
     */
    subresource?: string;
    /**
     * Time is the timestamp of when the ManagedFields entry was added. The timestamp will also be updated if a field is added, the manager changes any of the owned fields value or removes a field. The timestamp does not update when a field is removed from the entry because another manager took it over.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ManagedFieldsEntry
     */
    time?: string;
}
/**
 * ObjectMeta is metadata that all persisted resources must have, which includes all objects users must create.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1ObjectMeta
 */
export interface IoK8sApimachineryPkgApisMetaV1ObjectMeta {
    /**
     * Annotations is an unstructured key value map stored with a resource that may be set by external tools to store and retrieve arbitrary metadata. They are not queryable and should be preserved when modifying objects. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    annotations?: { [key: string]: string; };
    /**
     * CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.
     * 
     * Populated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    creationTimestamp?: string;
    /**
     * Number of seconds allowed for this object to gracefully terminate before it will be removed from the system. Only set when deletionTimestamp is also set. May only be shortened. Read-only.
     * @type {number}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    deletionGracePeriodSeconds?: number;
    /**
     * DeletionTimestamp is RFC 3339 date and time at which this resource will be deleted. This field is set by the server when a graceful deletion is requested by the user, and is not directly settable by a client. The resource is expected to be deleted (no longer visible from resource lists, and not reachable by name) after the time in this field, once the finalizers list is empty. As long as the finalizers list contains items, deletion is blocked. Once the deletionTimestamp is set, this value may not be unset or be set further into the future, although it may be shortened or the resource may be deleted prior to this time. For example, a user may request that a pod is deleted in 30 seconds. The Kubelet will react by sending a graceful termination signal to the containers in the pod. After that 30 seconds, the Kubelet will send a hard termination signal (SIGKILL) to the container and after cleanup, remove the pod from the API. In the presence of network partitions, this object may still exist after this timestamp, until an administrator or automated process can determine the resource is fully terminated. If not set, graceful deletion of the object has not been requested.
     * 
     * Populated by the system when a graceful deletion is requested. Read-only. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    deletionTimestamp?: string;
    /**
     * Must be empty before the object is deleted from the registry. Each entry is an identifier for the responsible component that will remove the entry from the list. If the deletionTimestamp of the object is non-nil, entries in this list can only be removed. Finalizers may be processed and removed in any order.  Order is NOT enforced because it introduces significant risk of stuck finalizers. finalizers is a shared field, any actor with permission can reorder it. If the finalizer list is processed in order, then this can lead to a situation in which the component responsible for the first finalizer in the list is waiting for a signal (field value, external system, or other) produced by a component responsible for a finalizer later in the list, resulting in a deadlock. Without enforced ordering finalizers are free to order amongst themselves and are not vulnerable to ordering changes in the list.
     * @type {Array<string>}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    finalizers?: Array<string>;
    /**
     * GenerateName is an optional prefix, used by the server, to generate a unique name ONLY IF the Name field has not been provided. If this field is used, the name returned to the client will be different than the name passed. This value will also be combined with a unique suffix. The provided value has the same validation rules as the Name field, and may be truncated by the length of the suffix required to make the value unique on the server.
     * 
     * If this field is specified and the generated name exists, the server will return a 409.
     * 
     * Applied only if Name is not specified. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#idempotency
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    generateName?: string;
    /**
     * A sequence number representing a specific generation of the desired state. Populated by the system. Read-only.
     * @type {number}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    generation?: number;
    /**
     * Map of string keys and values that can be used to organize and categorize (scope and select) objects. May match selectors of replication controllers and services. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels
     * @type {{ [key: string]: string; }}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    labels?: { [key: string]: string; };
    /**
     * ManagedFields maps workflow-id and version to the set of fields that are managed by that workflow. This is mostly for internal housekeeping, and users typically shouldn't need to set or understand this field. A workflow can be the user's name, a controller's name, or the name of a specific apply path like "ci-cd". The set of fields is always in the version that the workflow used when modifying the object.
     * @type {Array<IoK8sApimachineryPkgApisMetaV1ManagedFieldsEntry>}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    managedFields?: Array<IoK8sApimachineryPkgApisMetaV1ManagedFieldsEntry>;
    /**
     * Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    name?: string;
    /**
     * Namespace defines the space within which each name must be unique. An empty namespace is equivalent to the "default" namespace, but "default" is the canonical representation. Not all objects are required to be scoped to a namespace - the value of this field for those objects will be empty.
     * 
     * Must be a DNS_LABEL. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    namespace?: string;
    /**
     * List of objects depended by this object. If ALL objects in the list have been deleted, this object will be garbage collected. If this object is managed by a controller, then an entry in this list will point to this controller, with the controller field set to true. There cannot be more than one managing controller.
     * @type {Array<IoK8sApimachineryPkgApisMetaV1OwnerReference>}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    ownerReferences?: Array<IoK8sApimachineryPkgApisMetaV1OwnerReference>;
    /**
     * An opaque value that represents the internal version of this object that can be used by clients to determine when objects have changed. May be used for optimistic concurrency, change detection, and the watch operation on a resource or set of resources. Clients must treat these values as opaque and passed unmodified back to the server. They may only be valid for a particular resource or set of resources.
     * 
     * Populated by the system. Read-only. Value must be treated as opaque by clients and . More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#concurrency-control-and-consistency
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    resourceVersion?: string;
    /**
     * Deprecated: selfLink is a legacy read-only field that is no longer populated by the system.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    selfLink?: string;
    /**
     * UID is the unique in time and space value for this object. It is typically generated by the server on successful creation of a resource and is not allowed to change on PUT operations.
     * 
     * Populated by the system. Read-only. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#uids
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1ObjectMeta
     */
    uid?: string;
}
/**
 * OwnerReference contains enough information to let you identify an owning object. An owning object must be in the same namespace as the dependent, or be cluster-scoped, so there is no namespace field.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1OwnerReference
 */
export interface IoK8sApimachineryPkgApisMetaV1OwnerReference {
    /**
     * API version of the referent.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1OwnerReference
     */
    apiVersion: string;
    /**
     * If true, AND if the owner has the "foregroundDeletion" finalizer, then the owner cannot be deleted from the key-value store until this reference is removed. See https://kubernetes.io/docs/concepts/architecture/garbage-collection/#foreground-deletion for how the garbage collector interacts with this field and enforces the foreground deletion. Defaults to false. To set this field, a user needs "delete" permission of the owner, otherwise 422 (Unprocessable Entity) will be returned.
     * @type {boolean}
     * @memberof IoK8sApimachineryPkgApisMetaV1OwnerReference
     */
    blockOwnerDeletion?: boolean;
    /**
     * If true, this reference points to the managing controller.
     * @type {boolean}
     * @memberof IoK8sApimachineryPkgApisMetaV1OwnerReference
     */
    controller?: boolean;
    /**
     * Kind of the referent. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1OwnerReference
     */
    kind: string;
    /**
     * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1OwnerReference
     */
    name: string;
    /**
     * UID of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#uids
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1OwnerReference
     */
    uid: string;
}
/**
 * Preconditions must be fulfilled before an operation (update, delete, etc.) is carried out.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1Preconditions
 */
export interface IoK8sApimachineryPkgApisMetaV1Preconditions {
    /**
     * Specifies the target ResourceVersion
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1Preconditions
     */
    resourceVersion?: string;
    /**
     * Specifies the target UID.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1Preconditions
     */
    uid?: string;
}
/**
 * Status is a return value for calls that don't return other objects.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1Status
 */
export interface IoK8sApimachineryPkgApisMetaV1Status {
    /**
     * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1Status
     */
    apiVersion?: string;
    /**
     * Suggested HTTP return code for this status, 0 if not set.
     * @type {number}
     * @memberof IoK8sApimachineryPkgApisMetaV1Status
     */
    code?: number;
    /**
     * Extended data associated with the reason.  Each reason may define its own extended details. This field is optional and the data returned is not guaranteed to conform to any schema except that defined by the reason type.
     * @type {IoK8sApimachineryPkgApisMetaV1StatusDetails}
     * @memberof IoK8sApimachineryPkgApisMetaV1Status
     */
    details?: IoK8sApimachineryPkgApisMetaV1StatusDetails;
    /**
     * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1Status
     */
    kind?: string;
    /**
     * A human-readable description of the status of this operation.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1Status
     */
    message?: string;
    /**
     * Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {IoK8sApimachineryPkgApisMetaV1ListMeta}
     * @memberof IoK8sApimachineryPkgApisMetaV1Status
     */
    metadata?: IoK8sApimachineryPkgApisMetaV1ListMeta;
    /**
     * A machine-readable description of why this operation is in the "Failure" status. If this value is empty there is no information available. A Reason clarifies an HTTP status code but does not override it.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1Status
     */
    reason?: string;
    /**
     * Status of the operation. One of: "Success" or "Failure". More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1Status
     */
    status?: string;
}
/**
 * StatusCause provides more information about an api.Status failure, including cases when multiple errors are encountered.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1StatusCause
 */
export interface IoK8sApimachineryPkgApisMetaV1StatusCause {
    /**
     * The field of the resource that has caused this error, as named by its JSON serialization. May include dot and postfix notation for nested attributes. Arrays are zero-indexed.  Fields may appear more than once in an array of causes due to fields having multiple errors. Optional.
     * 
     * Examples:
     *   "name" - the field "name" on the current resource
     *   "items[0].name" - the field "name" on the first array entry in "items"
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1StatusCause
     */
    field?: string;
    /**
     * A human-readable description of the cause of the error.  This field may be presented as-is to a reader.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1StatusCause
     */
    message?: string;
    /**
     * A machine-readable description of the cause of the error. If this value is empty there is no information available.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1StatusCause
     */
    reason?: string;
}
/**
 * StatusDetails is a set of additional properties that MAY be set by the server to provide additional information about a response. The Reason field of a Status object defines what attributes will be set. Clients must ignore fields that do not match the defined type of each attribute, and should assume that any attribute may be empty, invalid, or under defined.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1StatusDetails
 */
export interface IoK8sApimachineryPkgApisMetaV1StatusDetails {
    /**
     * The Causes array includes more details associated with the StatusReason failure. Not all StatusReasons may provide detailed causes.
     * @type {Array<IoK8sApimachineryPkgApisMetaV1StatusCause>}
     * @memberof IoK8sApimachineryPkgApisMetaV1StatusDetails
     */
    causes?: Array<IoK8sApimachineryPkgApisMetaV1StatusCause>;
    /**
     * The group attribute of the resource associated with the status StatusReason.
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1StatusDetails
     */
    group?: string;
    /**
     * The kind attribute of the resource associated with the status StatusReason. On some operations may differ from the requested resource Kind. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1StatusDetails
     */
    kind?: string;
    /**
     * The name attribute of the resource associated with the status StatusReason (when there is a single name which can be described).
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1StatusDetails
     */
    name?: string;
    /**
     * If specified, the time in seconds before the operation should be retried. Some errors may indicate the client must take an alternate action - for those errors this field may indicate how long to wait before taking the alternate action.
     * @type {number}
     * @memberof IoK8sApimachineryPkgApisMetaV1StatusDetails
     */
    retryAfterSeconds?: number;
    /**
     * UID of the resource. (when there is a single resource which can be described). More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#uids
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1StatusDetails
     */
    uid?: string;
}
/**
 * Event represents a single event to a watched resource.
 * @export
 * @interface IoK8sApimachineryPkgApisMetaV1WatchEvent
 */
export interface IoK8sApimachineryPkgApisMetaV1WatchEvent {
    /**
     * Object is:
     *  * If Type is Added or Modified: the new state of the object.
     *  * If Type is Deleted: the state of the object immediately before deletion.
     *  * If Type is Error: *Status is recommended; other types may make sense
     *    depending on context.
     * @type {object}
     * @memberof IoK8sApimachineryPkgApisMetaV1WatchEvent
     */
    object: object;
    /**
     * 
     * @type {string}
     * @memberof IoK8sApimachineryPkgApisMetaV1WatchEvent
     */
    type: string;
}
/**
 * @type IoK8sApimachineryPkgUtilIntstrIntOrString
 * IntOrString is a type that can hold an int32 or a string.  When used in JSON or YAML marshalling and unmarshalling, it produces or consumes the inner type.  This allows you to have, for example, a JSON field that can accept a name or number.
 * @export
 */
export type IoK8sApimachineryPkgUtilIntstrIntOrString = number | string;
