import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { useImmerReducer, type ImmerReducer } from "use-immer";

/**
 * Defines the shape of an action object for use in a reducer-based state management (e.g., Redux).
 *
 * @template T - The type of the action's `type` property, defaults to a string literal of the form `${SliceName}/${ActionName}`.
 * @template P - The type of the action's `payload` property, defaults to `undefined`.
 *
 * If `P` is `undefined`, the action object will only have a `type` property.
 * If `P` is specified, the action object will have both `type` and `payload` properties.
 *
 * @example
 * // Action with only type
 * type MyAction = ActionDef<'user/login'>;
 *
 * // Action with type and payload
 * type MyActionWithPayload = ActionDef<'user/set', { name: string }>;
 */
export type ActionDef<
  T = `${string}/${string}`,
  P = undefined,
> = P extends undefined ? { type: T } : { type: T; payload: P };

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
  const stateRef = useRef(state);
  stateRef.current = state;

  const customDispatch = useCallback<
    React.Dispatch<Thunk<Action, State> | Action>
  >(
    (param) => {
      if (typeof param === "function") {
        const thunk = param as Thunk<Action, State>;
        void thunk(dispatch, stateRef.current);
      } else {
        dispatch(param);
      }
    },
    [dispatch]
  );

  return useMemo(() => [state, customDispatch], [customDispatch, state]);
}

/**
 * Combines multiple Immer reducers into a single reducer function, routing actions
 * to the appropriate slice reducer based on the action type prefix.
 *
 * @template S - The state type managed by the reducers.
 * @template A - The action type, extending ActionDef.
 * @param slicesDef - An object mapping slice names to their respective Immer reducers.
 *                    Each key should correspond to a slice name, and each value should be an ImmerReducer.
 * @returns An ImmerReducer that delegates actions to the appropriate slice reducer based on the action type prefix.
 *
 * @throws {Error} If the action type does not match the "slice/action" format.
 * @throws {Error} If no reducer is defined for the action's slice prefix.
 *
 * @example
 * const rootReducer = combineReducers({
 *   user: userReducer,
 *   posts: postsReducer,
 * });
 * // Handles actions like "user/login" or "posts/add"
 */
export const combineReducers = <S, A extends ActionDef>(
  slicesDef: Record<string, ImmerReducer<S, A>>
): ImmerReducer<S, A> => {
  const lookupTable = new Map(Object.entries(slicesDef));

  return (draft, action) => {
    const [prefix] = action.type.split("/");
    if (!prefix) {
      throw new Error(
        `action "${action.type}" doesn't match the format "slice/action"`
      );
    }

    if (!lookupTable.has(prefix)) {
      throw new Error(`no slice defined for action with prefix ${prefix}`);
    }

    lookupTable.get(prefix)!(draft, action);
  };
};

type StoreContextValue<State, Action> = [State, React.Dispatch<Action>] | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StoreContext = createContext<StoreContextValue<any, any>>(null);

/**
 * Custom React hook to access the store context.
 *
 * @template State - The type of the state managed by the store.
 * @template Action - The type of actions that can be dispatched to the store.
 * @returns {StoreContextValue<State, Action>} The current store context value.
 * @throws {Error} If the hook is used outside of a `<StoreProvider>`.
 *
 * @example
 * const { state, dispatch } = useStore<MyState, MyAction>();
 */
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

/**
 * Provides a context-based state management solution using a reducer and thunk-enabled dispatch.
 *
 * @template State - The type of the state managed by the provider.
 * @template Action - The type of actions that can be dispatched to the reducer.
 * @param props - The properties for the StoreProvider component.
 * @param props.children - The child components that will have access to the store context.
 * @param props.initialState - The initial state value for the reducer.
 * @param props.reducer - The reducer function that manages state transitions.
 * @returns A React context provider that supplies state and dispatch to its descendants.
 */
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
