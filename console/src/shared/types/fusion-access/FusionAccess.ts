import type { K8sResourceKind } from "@openshift-console/dynamic-plugin-sdk";

export interface FusionAccess extends K8sResourceKind {
  spec?: FusionAccessSpec;
  status?: FusionAccessStatus;
}

/**
 * FusionAccessSpec defines the desired state of FusionAccess
 */
interface FusionAccessSpec {
  /**
   * @format uri
   */
  externalManifestURL?: string;

  storageDeviceDiscovery?: {
    /**
     * @default true
     */
    create?: boolean;
  };

  /**
   * Version of IBMs installation manifests found at https://github.com/IBM/ibm-spectrum-scale-container-native
   */
  storageScaleVersion?: "v5.2.3.1";
}

/**
 * FusionAccessStatus defines the observed state of FusionAccess
 */
interface FusionAccessStatus {
  /**
   * INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
   * Important: Run "make" to regenerate code after modifying this file
   * Conditions is a list of conditions and their status.
   */
  conditions?: Condition[];

  /**
   * observedGeneration is the last generation change the
   * operator has dealt with
   * @format int64
   */
  observedGeneration?: number;

  /**
   * Show the general status of the fusion access object (this
   * can be shown nicely on ocp console UI)
   */
  status?: string; // This refers to the 'status.status' field

  /**
   * TotalProvisionedDeviceCount is the count of the total
   * devices over which the PVs has been provisioned
   * @format int32
   */
  totalProvisionedDeviceCount?: number;
}

/**
 * Condition contains details for one aspect of the current
 * state of this API Resource.
 */
interface Condition {
  /**
   * lastTransitionTime is the last time the condition transitioned from one status to another.
   * This should be when the underlying condition changed.  If that is not known, then using the time when the API field changed is acceptable.
   * @format date-time
   */
  lastTransitionTime: string;

  /**
   * message is a human readable message indicating details about the transition.
   * This may be an empty string.
   * @maxLength 32768
   */
  message: string;

  /**
   * observedGeneration represents the .metadata.generation that the condition was set based upon.
   * For instance, if .metadata.generation is currently 12, but the .status.conditions[x].observedGeneration is 9, the condition is out of date
   * with respect to the current state of the instance.
   * @format int64
   * @minimum 0
   */
  observedGeneration?: number;

  /**
   * reason contains a programmatic identifier indicating the reason for the condition's last transition.
   * Producers of specific condition types may define expected values and meanings for this field,
   * and whether the values are considered a guaranteed API.
   * The value should be a CamelCase string.
   * This field may not be empty.
   * @maxLength 1024
   * @minLength 1
   * @pattern `^[A-Za-z]([A-Za-z0-9_,:]*[A-Za-z0-9_])?$`
   */
  reason: string;

  /**
   * status of the condition, one of True, False, Unknown.
   */
  status: "True" | "False" | "Unknown";

  /**
   * type of condition in CamelCase or in foo.example.com/CamelCase.
   * @maxLength 316
   * @pattern `^([a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*\/)?(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])$`
   */
  type: string;
}
