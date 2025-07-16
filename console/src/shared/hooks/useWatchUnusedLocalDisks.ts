import { useK8sWatchResource } from "@openshift-console/dynamic-plugin-sdk";
import type { LocalDisk } from "@/shared/types/ibm-spectrum-scale/LocalDisk";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";

// TODO(jkilzi): Hard-coded for now, but must handle namespaces dynamically
const NAMESPACE = "ibm-spectrum-scale";

export interface UnusedLocalDisk {
  name: string;
  device: string;
  node: string;
  wwn?: string;
  capacity?: string;
  // Mark as reused disk for UI display
  isReused: boolean;
}

export const useWatchUnusedLocalDisks = () => {
  // Watch all LocalDisks
  const [localDisks, localDisksLoaded, localDisksError] = useK8sWatchResource<LocalDisk[]>({
    isList: true,
    groupVersionKind: {
      group: "scale.spectrum.ibm.com",
      version: "v1beta1",
      kind: "LocalDisk",
    },
    namespace: NAMESPACE,
  });

  // Watch all FileSystems to find which disks are used
  const [fileSystems, fileSystemsLoaded, fileSystemsError] = useK8sWatchResource<FileSystem[]>({
    isList: true,
    groupVersionKind: {
      group: "scale.spectrum.ibm.com",
      version: "v1beta1",
      kind: "Filesystem",
    },
    namespace: NAMESPACE,
  });

  const loaded = localDisksLoaded && fileSystemsLoaded;
  const error = localDisksError || fileSystemsError;

  // Find LocalDisks that are not used by any FileSystem
  const unusedLocalDisks: UnusedLocalDisk[] = [];

  if (loaded && !error) {
    // Get all disk names used by FileSystems
    const usedDiskNames = new Set<string>();
    (fileSystems || []).forEach((fs) => {
      const pools = fs.spec?.local?.pools || [];
      pools.forEach((pool) => {
        (pool.disks || []).forEach((diskName) => {
          usedDiskNames.add(diskName);
        });
      });
    });

    // Filter LocalDisks that are not used
    (localDisks || []).forEach((localDisk) => {
      const diskName = localDisk.metadata?.name;
      if (diskName && !usedDiskNames.has(diskName)) {
        // Extract WWN from the LocalDisk name if possible
        // Assuming name format: "device-wwn" (e.g., "sdb-12345-abcde")
        const nameParts = diskName.split('-');
        let wwn = '';
        if (nameParts.length >= 3) {
          // Take everything after the first part as WWN
          wwn = nameParts.slice(1).join('-');
        }

        const device = localDisk.spec?.device || '';
        const node = localDisk.spec?.node || '';
        
        // Only add if we have required fields
        if (device && node) {
          unusedLocalDisks.push({
            name: diskName,
            device,
            node,
            wwn: wwn || undefined,
            capacity: localDisk.status?.size || undefined,
            isReused: true,
          });
        }
      }
    });
  }

  return {
    data: unusedLocalDisks,
    loaded,
    error,
  };
}; 