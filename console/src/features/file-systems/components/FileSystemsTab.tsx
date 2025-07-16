import React from "react";
import { FileSystemsTable } from "./FileSystemsTable";
import { FileSystemsTableEmptyState } from "./FileSystemsTableEmptyState";
import { DefaultErrorFallback } from "@/shared/components/DefaultErrorFallback";
import { DefaultLoadingFallback } from "@/shared/components/DefaultLoadingFallback";
import { Async } from "@/shared/components/Async";
import { useFileSystemsTableViewModel } from "../hooks/useFileSystemsTableViewModel";

export const FileSystemsTab: React.FC = () => {
  const vm = useFileSystemsTableViewModel();

  return (
    <Async
      loaded={vm.fileSystems.loaded}
      error={vm.fileSystems.error}
      renderErrorFallback={DefaultErrorFallback}
      renderLoadingFallback={DefaultLoadingFallback}
    >
      {(vm.fileSystems.data ?? []).length === 0 ? (
        <FileSystemsTableEmptyState />
      ) : (
        <FileSystemsTable />
      )}
    </Async>
  );
};
FileSystemsTab.displayName = "FileSystemsTab";
