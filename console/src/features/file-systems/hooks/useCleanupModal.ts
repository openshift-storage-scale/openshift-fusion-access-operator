import {
  type Dispatch,
  type SetStateAction,
  useState,
  useMemo,
  useCallback,
} from "react";
import { immutableStateUpdateHelper } from "@/shared/store/helpers";
import type { CleanupTarget } from "./useCleanupHandler";

interface CleanupModalState {
  target?: CleanupTarget;
  isOpen: boolean;
  isProcessing: boolean;
  errors: string[];
}

interface CleanupModalActions {
  setTarget: Dispatch<SetStateAction<CleanupModalState["target"]>>;
  setIsProcessing: Dispatch<SetStateAction<CleanupModalState["isProcessing"]>>;
  setIsOpen: Dispatch<SetStateAction<CleanupModalState["isOpen"]>>;
  setErrors: Dispatch<SetStateAction<CleanupModalState["errors"]>>;
  handleCleanup: (target: CleanupTarget) => VoidFunction;
  handleClose: VoidFunction;
}

export const useCleanupModal = (
  initialState: CleanupModalState = {
    isOpen: false,
    isProcessing: false,
    errors: [],
  }
): CleanupModalState & CleanupModalActions => {
  const [state, setState] = useState<CleanupModalState>(initialState);

  const setTarget: CleanupModalActions["setTarget"] = (value) =>
    setState(immutableStateUpdateHelper<CleanupModalState>(value, "target"));
  const setIsProcessing: CleanupModalActions["setIsProcessing"] = (value) =>
    setState(immutableStateUpdateHelper<CleanupModalState>(value, "isProcessing"));
  const setIsOpen: CleanupModalActions["setIsOpen"] = (value) =>
    setState(immutableStateUpdateHelper<CleanupModalState>(value, "isOpen"));
  const setErrors: CleanupModalActions["setErrors"] = (value) =>
    setState(immutableStateUpdateHelper<CleanupModalState>(value, "errors"));
  const handleClose = useCallback(() => setIsOpen(false), []);
  const handleCleanup = useCallback(
    (target: CleanupTarget) => () => {
      setState((prevState) => {
        const draft = window.structuredClone(prevState);
        draft.target = target;
        draft.isOpen = true;
        draft.errors = []; // Clear previous errors
        return draft;
      });
    },
    []
  );

  return useMemo(
    () => ({
      ...state,
      handleClose,
      handleCleanup,
      setTarget,
      setIsProcessing,
      setIsOpen,
      setErrors,
    }),
    [handleClose, handleCleanup, state]
  );
}; 