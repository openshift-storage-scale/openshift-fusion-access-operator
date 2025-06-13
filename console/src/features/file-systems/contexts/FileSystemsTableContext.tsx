import { createContext } from "react";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";

type FileSystemTableCtxValue = {
  filesystem: FileSystem | undefined;
  setFileSystem: (fs: FileSystem | undefined) => void;
};

export const FileSystemTableContext = createContext<FileSystemTableCtxValue>({
  filesystem: undefined,
  setFileSystem: () => {},
});
