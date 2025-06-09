import type {
  DiscoveredDevice,
  LocalVolumeDiscoveryResult,
} from "@/shared/types/fusion-access/LocalVolumeDiscoveryResult";

const WWN_PREFIX_LENGTH = "uuid.".length;

export const getWwn = (device: DiscoveredDevice) =>
  device.WWN.slice(WWN_PREFIX_LENGTH);

/**
 * Retrieves the list of discovered devices for a specific node from an array of LocalVolumeDiscoveryResult objects.
 *
 * @param lvdrs - An array of LocalVolumeDiscoveryResult objects to search through.
 * @param nodeName - The name of the node for which to retrieve discovered devices.
 * @returns An array of discovered devices for the specified node, or an empty array if none are found.
 */
export const getDiscoveredDevices = (
  lvdrs: LocalVolumeDiscoveryResult[],
  nodeName: string
) =>
  lvdrs.find((lvdr) => lvdr.spec.nodeName === nodeName)?.status
    ?.discoveredDevices ?? [];
