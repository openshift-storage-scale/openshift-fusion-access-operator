import {
  ResourceLink,
  type StorageClass,
} from "@openshift-console/dynamic-plugin-sdk";
import { Stack, StackItem } from "@patternfly/react-core";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { getFileSystemScs } from "@/features/file-systems/utils/filesystem";
import { VALUE_NOT_AVAILABLE } from "@/constants";

type FileSystemStorageClassesProps = {
  fileSystem: FileSystem;
  storageClasses: StorageClass[] | null;
  isNotAvailable?: boolean;
};

export const FileSystemStorageClasses: React.FC<
  FileSystemStorageClassesProps
> = ({ fileSystem, storageClasses, isNotAvailable = false }) => {
  if (!storageClasses || !storageClasses.length || isNotAvailable) {
    return <span className="text-secondary">{VALUE_NOT_AVAILABLE}</span>;
  }

  const scs = getFileSystemScs(fileSystem, storageClasses);
  if (!storageClasses.length || isNotAvailable) {
    return <span className="text-secondary">{VALUE_NOT_AVAILABLE}</span>;
  }

  return (
    <Stack>
      {scs.map((sc) => (
        <StackItem key={sc.metadata?.uid}>
          <ResourceLink
            groupVersionKind={{
              group: "storage.k8s.io",
              version: "v1",
              kind: "StorageClass",
            }}
            name={sc.metadata?.name}
          />
        </StackItem>
      ))}
    </Stack>
  );
};
FileSystemStorageClasses.displayName = "FileSystemStorageClasses";
