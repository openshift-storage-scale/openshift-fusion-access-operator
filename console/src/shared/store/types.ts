import type { Alert } from "@/shared/components/ListPageAlert";
import type { ActionDef } from "./provider";

export type Actions =
  | ActionDef<"global/updateDocTitle", State["docTitle"]>
  | ActionDef<"global/addAlert", Alert>
  | ActionDef<"global/dismissAlert">
  | ActionDef<"global/updateCta", Partial<State["cta"]>>;

export interface State {
  docTitle: string;
  alerts: Array<Alert>;
  cta: {
    isDisabled?: boolean;
    isLoading?: boolean;
  };
}
