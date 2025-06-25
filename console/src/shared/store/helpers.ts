export const immutableStateUpdateHelper =
  <S>(value: unknown, prop: keyof S) =>
  (currentState: S) => {
    const draft = window.structuredClone(currentState);
    draft[prop] = typeof value === "function" ? value(draft[prop]) : value;
    return draft;
  };
