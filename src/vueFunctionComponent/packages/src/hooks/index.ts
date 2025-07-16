import dispatcher, {
  type EffectCallback,
  type Dispatch,
  type SetStateAction,
  type AnyActionArg,
  type ActionDispatch,
  type DependencyList,
} from "./dispatcher";

export function useState<S>(
  initialState: S | (() => S)
): [S, Dispatch<SetStateAction<S>>];

export function useState<S = undefined>(): [
  S | undefined,
  Dispatch<SetStateAction<S | undefined>>
];

export function useState<T>(initialState?: T | (() => T)) {
  return dispatcher.useState(initialState);
}

export function useId() {
  return dispatcher.useId();
}

export function useCallback<T extends (...args: any[]) => any>(
  fn: T,
  dependencies: DependencyList
): T {
  return dispatcher.useCallback(fn, dependencies);
}

export function useEffect(
  setup: EffectCallback,
  dependencies?: DependencyList
): void;

export function useEffect(
  setup: EffectCallback,
  dependencies: DependencyList | undefined
) {
  return dispatcher.useEffect(setup, dependencies);
}

export function useLayoutEffect(
  setup: EffectCallback,
  dependencies?: DependencyList
): void;

export function useLayoutEffect(
  setup: EffectCallback,
  dependencies: DependencyList | undefined
) {
  return dispatcher.useLayoutEffect(setup, dependencies);
}

export function useMemo<T>(
  calculateValue: () => T,
  dependencies: DependencyList
): T {
  return dispatcher.useMemo(calculateValue, dependencies);
}

export function useReducer<S, A extends AnyActionArg>(
  reducer: (prevState: S, ...args: A) => S,
  initialState: S
): [S, ActionDispatch<A>];

export function useReducer<S, I, A extends AnyActionArg>(
  reducer: (prevState: S, ...args: A) => S,
  initialArg: I,
  init: (initialArg: I) => S
): [S, ActionDispatch<A>];

export function useReducer<S, I, A extends AnyActionArg>(
  reducer: (prevState: S, ...args: A) => S,
  initialArg: I,
  init?: (initialArg: I) => S
): [S, ActionDispatch<A>] {
  return dispatcher.useReducer(reducer, initialArg, init);
}

export function useSyncExternalStore<Snapshot>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot?: () => Snapshot
): Snapshot {
  return dispatcher.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}

export function useDeferredValue<T>(value: T, initialValue?: T): T {
  return dispatcher.useDeferredValue(value);
}

export function startTransition(scope: () => any): void {
  return dispatcher.startTransition(scope);
}

export function useRef(): { current: void };

export function useRef<T>(initialValue: T): { current: T };

export function useRef<T>(initialValue?: T) {
  return dispatcher.useRef(initialValue);
}

export function useImperativeHandle(
  ref: { current: any },
  createHandle: () => any,
  dependencies?: DependencyList
) {
  return dispatcher.useImperativeHandle(ref, createHandle, dependencies);
}

export function useTransition() {
  return dispatcher.useTransition();
}
