import { createContext, useCallback, useContext, useMemo } from "react";
import { useImmerReducer, type ImmerReducer } from "use-immer";

export type ActionDef<T extends `${string}/${string}`, P = undefined> = P extends undefined
  ? { type: T }
  : { type: T; payload: P };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Thunk<Action = any, State = any> = (
  dispatch: React.Dispatch<Action>,
  state: State
) => Promise<void>;

function useReducerWithThunk<State, Action>(
  reducer: ImmerReducer<State, Action>,
  initialState: State
): [State, React.Dispatch<Action>] {
  const [state, dispatch] = useImmerReducer(reducer, initialState);

  const customDispatch = useCallback<
    React.Dispatch<Thunk<Action, State> | Action>
  >(
    (param) => {
      if (typeof param === "function") {
        const thunk = param as Thunk<Action, State>;
        void thunk(dispatch, state);
      } else {
        dispatch(param);
      }
    },
    [dispatch, state]
  );

  return useMemo(() => [state, customDispatch], [customDispatch, state]);
}

type StoreContextValue<State, Action> = [State, React.Dispatch<Action>] | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StoreContext = createContext<StoreContextValue<any, any>>(null);

export function useStore<State = unknown, Action = unknown>() {
  const context = useContext(StoreContext) as StoreContextValue<State, Action>;
  if (!context) {
    throw new Error("useStoreContext hook must be used within <StoreProvider>");
  }

  return context;
}

interface StoreProviderProps<State, Action> {
  reducer: ImmerReducer<State, Action>;
  initialState: State;
}

export function StoreProvider<State = unknown, Action = unknown>(
  props: React.PropsWithChildren<StoreProviderProps<State, Action>>
) {
  const { children, initialState, reducer } = props;
  const stateAndDispatch = useReducerWithThunk(reducer, initialState);

  return (
    <StoreContext.Provider value={stateAndDispatch}>
      {children}
    </StoreContext.Provider>
  );
}
StoreProvider.displayName = "StoreProvider";
