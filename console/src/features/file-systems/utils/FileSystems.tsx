import { SC_PROVISIONER } from "@/constants";
import type { Filesystem } from "@/shared/types/scale-spectrum-ibm-com/v1beta1/Filesystem";
import { type K8sResourceCommon, type StorageClass } from "@openshift-console/dynamic-plugin-sdk";

export const getFileSystemStorageClasses = (
  fileSystem: Filesystem,
  scs: StorageClass[]
) => {
  return scs.filter((sc) => {
    if (sc.provisioner === SC_PROVISIONER) {
      const fsName = (sc.parameters as { volBackendFs?: string })?.volBackendFs;
      return fsName === (fileSystem.metadata as K8sResourceCommon['metadata'])?.name;
    }
    return false;
  });
};
