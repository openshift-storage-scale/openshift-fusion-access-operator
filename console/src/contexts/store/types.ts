import type { AlertProps } from "@patternfly/react-core/dist/esm/components/Alert/Alert";

export type Action<T extends string, P = undefined> = P extends undefined
  ? { type: T }
  : { type: T; payload: P };

export type Actions =
  | Action<"updateGlobal", Partial<State["global"]>>
  | Action<"addAlert", State["alerts"][number]>
  | Action<"removeAlert", Omit<State["alerts"][number], "title">>
  | Action<"clearAlerts">
  | Action<"updateCtas", Partial<State["ctas"]>>;

export interface State {
  global: GlobalSlice;
  alerts: AlertsSlice;
  ctas: CallToActionsSlice;
}

export interface GlobalSlice {
  documentTitle: string;
}

export type AlertsSlice = Array<
  Pick<AlertProps, "key" | "variant" | "title"> & {
    description?: string | string[];
    isDismissable?: boolean;
  }
>;

export type CallToActionNames =
  | "createStorageCluster"
  | "createFileSystem"
  | "downloadLogs";

export interface CallToActionState {
  isDisabled?: boolean;
  isLoading?: boolean;
}

export type CallToActionsSlice = Record<CallToActionNames, CallToActionState>;
