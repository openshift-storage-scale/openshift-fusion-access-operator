import type { AlertProps } from "@patternfly/react-core/dist/esm/components/Alert/Alert";

export type Action<T extends string, P = undefined> = P extends undefined
  ? { type: T }
  : { type: T; payload: P };

export type Actions =
  | Action<"updateGlobal", Partial<State["global"]>>
  | Action<"showAlert", State["alert"]>
  | Action<"dismissAlert">
  | Action<"updateCtas", Partial<State["ctas"]>>;

export interface State {
  global: GlobalSlice;
  alert: AlertSlice;
  ctas: CallToActionsSlice;
}

export interface GlobalSlice {
  documentTitle: string;
}

export type AlertSlice =
  | (Pick<AlertProps, "key" | "variant" | "title"> & {
      description?: string | string[];
      isDismissable?: boolean;
    })
  | null;

export type CallToActionNames = "createStorageCluster" | "createFileSystem";

export interface CallToActionState {
  isDisabled?: boolean;
  isLoading?: boolean;
}

export type CallToActionsSlice = Record<CallToActionNames, CallToActionState>;
