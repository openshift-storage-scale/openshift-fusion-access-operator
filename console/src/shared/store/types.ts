import type { AlertProps } from "@patternfly/react-core/dist/esm/components/Alert/Alert";
import type { ActionDef } from "./provider";

export type Actions =
  | ActionDef<"global/updateDocTitle", State["docTitle"]>
  | ActionDef<"global/showAlert", State["alert"]>
  | ActionDef<"global/dismissAlert">
  | ActionDef<"global/updateCta", Partial<State["cta"]>>;

export interface State {
  docTitle: string;
  alert:
    | (Pick<AlertProps, "key" | "variant" | "title"> & {
        description?: string | string[];
        isDismissable?: boolean;
      })
    | null;
  cta: {
    isDisabled?: boolean;
    isLoading?: boolean;
  };
}
