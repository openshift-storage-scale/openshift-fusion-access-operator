import { enableMapSet } from "immer";
import type { ImmerReducer } from "use-immer";
import { t } from "@/shared/hooks/useFusionAccessTranslations";
import type { Actions, State } from "./types";

enableMapSet(); // Enables Map and Set support in immer
// see: https://immerjs.github.io/immer/map-set

export const reducer: ImmerReducer<State, Actions> = (draft, action) => {
  switch (action.type) {
    case "updateGlobal":
      draft.global = { ...draft.global, ...action.payload };
      break;
    case "showAlert":
      draft.alert = action.payload;
      break;
    case "dismissAlert":
      draft.alert = null;
      break;
    case "updateCtas":
      {
        const { createFileSystem, createStorageCluster } = action.payload;
        draft.ctas = {
          createFileSystem: {
            ...draft.ctas.createFileSystem,
            ...createFileSystem,
          },
          createStorageCluster: {
            ...draft.ctas.createStorageCluster,
            ...createStorageCluster,
          },
        };
      }
      break;
    default:
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        `Unhandled action type: ${action.type}. Please check the reducer.`
      );
  }
};

export const initialState: State = {
  global: {
    documentTitle: t("Fusion Access for SAN"),
  },
  alert: null,
  ctas: {
    createStorageCluster: { isDisabled: true, isLoading: false },
    createFileSystem: { isDisabled: true, isLoading: false },
  },
};
