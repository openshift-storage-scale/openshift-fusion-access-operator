import { SC_PROVISIONER } from "@/constants";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { type StorageClass } from "@openshift-console/dynamic-plugin-sdk";

export const getFileSystemStorageClasses = (
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
