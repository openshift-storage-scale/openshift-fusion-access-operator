import { SC_PROVISIONER } from "@/constants";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import type { IoK8sApiCoreV1PersistentVolumeClaim } from "@/shared/types/kubernetes/1.30/types";
import { type StorageClass } from "@openshift-console/dynamic-plugin-sdk";

export const getFileSystemScs = (
  fileSystem: FileSystem,
  scs: StorageClass[]
) => {
  return scs.filter((sc) => {
    if (sc.provisioner === SC_PROVISIONER) {
      const fsName = (sc.parameters as { volBackendFs?: string })?.volBackendFs;
      return fsName === fileSystem.metadata?.name;
    }
    return false;
  });
};

export const isFilesystemInUse = (
  fileSystem: FileSystem,
  scs: StorageClass[],
  pvcs: IoK8sApiCoreV1PersistentVolumeClaim[]
) => {
  const fsScs = getFileSystemScs(fileSystem, scs).map(
    (sc) => sc.metadata?.name
  );
  return pvcs.some(
    (pvc) =>
      pvc.spec?.storageClassName && fsScs.includes(pvc.spec?.storageClassName)
  );
};
