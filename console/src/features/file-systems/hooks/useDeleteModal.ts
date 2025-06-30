import { type Dispatch, type SetStateAction, useState, useMemo } from "react";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { immutableStateUpdateHelper } from "@/shared/store/helpers";

interface DeleteModalState {
  fileSystem?: FileSystem;
  isOpen: boolean;
  isDeleting: boolean;
  errors: string[];
}

interface DeleteModalActions {
  setFileSystem: Dispatch<SetStateAction<DeleteModalState["fileSystem"]>>;
  setIsDeleting: Dispatch<SetStateAction<DeleteModalState["isDeleting"]>>;
  setIsOpen: Dispatch<SetStateAction<DeleteModalState["isOpen"]>>;
  setErrors: Dispatch<SetStateAction<DeleteModalState["errors"]>>;
}

export const useDeleteModal = (
  initialState: DeleteModalState = {
    isOpen: false,
    isDeleting: false,
    errors: [],
  }
): DeleteModalState & DeleteModalActions => {
  const [state, setState] =
    useState<DeleteModalState>(initialState);

  const setFileSystem: DeleteModalActions["setFileSystem"] = (value) =>
    setState(
      immutableStateUpdateHelper<DeleteModalState>(value, "fileSystem")
    );
  const setIsDeleting: DeleteModalActions["setIsDeleting"] = (value) =>
    setState(
      immutableStateUpdateHelper<DeleteModalState>(value, "isDeleting")
    );
  const setIsOpen: DeleteModalActions["setIsOpen"] = (value) =>
    setState(
      immutableStateUpdateHelper<DeleteModalState>(value, "isOpen")
    );
  const setErrors: DeleteModalActions["setErrors"] = (value) =>
    setState(
      immutableStateUpdateHelper<DeleteModalState>(value, "errors")
    );

  return useMemo(
    () => ({
      ...state,
      setFileSystem,
      setIsDeleting,
      setIsOpen,
      setErrors,
    }),
    [state]
  );
};
