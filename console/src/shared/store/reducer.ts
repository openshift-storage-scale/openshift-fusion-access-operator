import { enableMapSet } from "immer";
import type { ImmerReducer } from "use-immer";
import { t } from "@/shared/hooks/useFusionAccessTranslations";
import type { Actions, State } from "./types";

enableMapSet(); // Enables Map and Set support in immer
// see: https://immerjs.github.io/immer/map-set

export const reducer: ImmerReducer<State, Actions> = (draft, action) => {
  switch (action.type) {
    case "global/updateDocTitle":
      draft.docTitle = action.payload;
      break;
    case "global/addAlert":
      if (action.payload.key === "minimum-shared-disks-and-nodes") {
        // If the alert for minimum shared disks and nodes already exists,
        // we don't add it again, but we update the existing one.
        const existingAlertIndex = draft.alerts.findIndex(
          (a) => a.key === "minimum-shared-disks-and-nodes"
        );

        if (existingAlertIndex === -1) {
          // If the alert does not exist, we add it to the front.
          draft.alerts.unshift(action.payload);
        } else if (existingAlertIndex === 0) {
          draft.alerts[existingAlertIndex] = action.payload;
        } else if (existingAlertIndex > 0) {
          // If the alert is not the first one, we move it to the front
          // to ensure it is always visible.
          draft.alerts.splice(existingAlertIndex, 1);
          draft.alerts.unshift(action.payload);
        }
      } else {
        draft.alerts.push(action.payload);
      }
      break;
    case "global/dismissAlert":
      draft.alerts.shift();
      break;
    case "global/updateCta":
      draft.cta = {
        ...draft.cta,
        ...action.payload,
      };
      break;
    default:
      throw new Error(
        `Unhandled action type: ${(action as { type: string }).type}. Please check the reducer.`
      );
  }
};

export const initialState: State = {
  docTitle: t("Fusion Access for SAN"),
  alerts: [],
  cta: {
    isDisabled: true,
    isLoading: false,
  },
};
