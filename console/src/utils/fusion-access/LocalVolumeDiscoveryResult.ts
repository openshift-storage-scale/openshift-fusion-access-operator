import type {
  DiscoveredDevice,
  LocalVolumeDiscoveryResult,
} from "@/models/fusion-access/LocalVolumeDiscoveryResult";

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

/**
 * Calculates the maximum number of disks (by WWN) shared between the specified node and any other node.
 *
 * @param lvdrs - An array of `LocalVolumeDiscoveryResult` objects representing the discovery results for all nodes.
 * @param nodeName - The name of the node for which to calculate the maximum shared disks count.
 * @returns The maximum number of disks (by WWN) shared between the specified node and any other node. Returns 0 if no disks are discovered on the node.
 */
export const getMaxSharedDisksCount = (
  lvdrs: LocalVolumeDiscoveryResult[],
  nodeName: string
): number => {
  const discoveredDevices = getDiscoveredDevices(lvdrs, nodeName);
  if (discoveredDevices.length === 0) {
    return 0;
  }

  const nodeDisksWwns = new Set(discoveredDevices.map((d) => d.WWN));
  const result = lvdrs
    .filter((lvdr) => lvdr.spec.nodeName !== nodeName)
    .map((lvdr) => lvdr.status?.discoveredDevices ?? [])
    .reduce((acc: number[], disks) => {
      const wwns = new Set(disks.map((d) => d.WWN));
      return acc.concat(nodeDisksWwns.intersection(wwns).size);
    }, []);

  return Math.max(...result);
};
