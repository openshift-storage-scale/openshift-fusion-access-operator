export type ViewModelSlice<S, A = void> = A extends void
  ? {
      state: Readonly<S>;
    }
  : { state: Readonly<S>; actions: A };

export function newViewModelSlice<S>(s: S): ViewModelSlice<S>;
export function newViewModelSlice<S, A>(s: S, a: A): ViewModelSlice<S, A>;
export function newViewModelSlice<S, A>(
  s: S,
  a?: A
): ViewModelSlice<S, A | void> {
  return a
    ? ({ state: s, actions: a } as ViewModelSlice<S, A>)
    : ({ state: s } as ViewModelSlice<S>);
}
