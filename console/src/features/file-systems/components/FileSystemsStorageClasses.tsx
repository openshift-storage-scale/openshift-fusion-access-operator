import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { getFileSystemScs } from "@/features/file-systems/utils/filesystem";
import {
  ResourceLink,
  type StorageClass,
} from "@openshift-console/dynamic-plugin-sdk";
import { Skeleton, Stack, StackItem } from "@patternfly/react-core";

type FileSystemStorageClassesProps = {
  fileSystem: FileSystem;
  storageClasses: StorageClass[];
  loaded: boolean;
  isDisabled?: boolean;
};

const FileSystemStorageClasses: React.FC<FileSystemStorageClassesProps> = ({
  fileSystem,
  loaded,
  storageClasses,
  isDisabled = false,
}) => {
  const { t } = useFusionAccessTranslations();
  if (!loaded) {
    return <Skeleton screenreaderText={t("Loading storage classes")} />;
  }

  const scs = getFileSystemScs(fileSystem, storageClasses);
  if (!scs.length) {
    return <span className="text-secondary">-</span>;
  }

  return (
    <Stack>
      {scs.map((sc) => (
        <StackItem key={sc.metadata?.uid}>
          <ResourceLink
            {...(isDisabled && { onClick: () => {} })}
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

export default FileSystemStorageClasses;
