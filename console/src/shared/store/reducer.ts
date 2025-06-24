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
    case "global/showAlert":
      draft.alert = action.payload;
      break;
    case "global/dismissAlert":
      draft.alert = null;
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
  alert: null,
  cta: {
    isDisabled: true,
    isLoading: false,
  },
};

// const combineReducers = <S, Action>(
//   ...slices: { sliceName: string; reducer: ImmerReducer<unknown, unknown> }[]
// ): ImmerReducer<S, Action> => {
//   return (draft, action) => {
//     const [prefix] = action.type.split("/");
//     if (!prefix) {
//       throw new Error(
//         `unprefixed action "${action.type}". Action names must match the format "slice/action"`
//       );
//     }

//     if (!lookupTable.has(prefix)) {
//       throw new Error(`no slice defined for action with prefix ${prefix}`);
//     }

//     lookupTable.get(prefix)!(draft, action);
//   };
// };
