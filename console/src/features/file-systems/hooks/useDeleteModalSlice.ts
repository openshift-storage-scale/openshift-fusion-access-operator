import { type Dispatch, type SetStateAction, useState, useMemo } from "react";
import type { ViewModelSlice } from "@/internal/types/ViewModelSlice";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";

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

export const useDeleteModalSlice = (
  initialState: DeleteModalState
): ViewModelSlice<DeleteModalState, DeleteModalActions> => {
  const [deleteModalState, setDeleteModalState] =
    useState<DeleteModalState>(initialState);

  const setFileSystem: DeleteModalActions["setFileSystem"] = (value) =>
    setDeleteModalState(
      immutableStateUpdateHelper<DeleteModalState>(value, "fileSystem")
    );
  const setIsDeleting: DeleteModalActions["setIsDeleting"] = (value) =>
    setDeleteModalState(
      immutableStateUpdateHelper<DeleteModalState>(value, "isDeleting")
    );
  const setIsOpen: DeleteModalActions["setIsOpen"] = (value) =>
    setDeleteModalState(
      immutableStateUpdateHelper<DeleteModalState>(value, "isOpen")
    );
  const setErrors: DeleteModalActions["setErrors"] = (value) =>
    setDeleteModalState(
      immutableStateUpdateHelper<DeleteModalState>(value, "errors")
    );

  return useMemo(
    () => ({
      state: deleteModalState,
      actions: {
        setFileSystem,
        setIsDeleting,
        setIsOpen,
        setErrors,
      },
    }),
    [deleteModalState]
  );
};

const immutableStateUpdateHelper =
  <S>(value: unknown, prop: keyof S) =>
  (currentState: S) => {
    const draft = window.structuredClone(currentState);
    draft[prop] = typeof value === "function" ? value(draft[prop]) : value;
    return draft;
  };
