import { createContext, useContext } from "react";
import { useImmerReducer, type ImmerReducer } from "use-immer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StoreContextValue<TState = any, TActions = any> =
  | [TState, React.Dispatch<TActions>]
  | null;

const StoreContext = createContext<StoreContextValue>(null);

export function useStoreContext<TState = unknown, TActions = unknown>() {
  const context = useContext<StoreContextValue<TState, TActions>>(StoreContext);
  if (!context) {
    throw new Error("useStoreContext hook must be used within <StoreProvider>");
  }

  return context;
}

interface StoreProviderProps<TState, TActions> {
  reducer: ImmerReducer<TState, TActions>;
  initialState: TState;
}

export function StoreProvider<TState, TActions>(
  props: React.PropsWithChildren<StoreProviderProps<TState, TActions>>
) {
  const { children, initialState, reducer } = props;
  const stateAndDispatch = useImmerReducer(reducer, initialState);

  return (
    <StoreContext.Provider value={stateAndDispatch}>
      {children}
    </StoreContext.Provider>
  );
}
StoreProvider.displayName = "StoreProvider";
