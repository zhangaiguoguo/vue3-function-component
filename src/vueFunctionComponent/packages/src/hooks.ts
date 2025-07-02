import { nextTick, warn } from "vue";
import { hasChanged, isFunction } from "../shared";
import {
  type DefineFunctionComponentInstanceContext,
  getCurrentFunctionComponentInstance,
} from "./defineFunctionComponent";

enum EffectQueueFlag {
  USE_STATE = 1,
  USE_EFFECT = 2,
  USE_ID = 3,
  USE_CALLBACK = 4,
  USE_LAYOUT_EFFECT = 5,
  USE_MEMO = 6,
}

enum EffectFlagName {
  USE_STATE = "useState",
  USE_EFFECT = "useEffect",
  USE_ID = "useId",
  USE_CALLBACK = "useCallback",
  USE_LAYOUT_EFFECT = "useLayoutEffect",
  USE_MEMO = "useMemo",
}

type EffectCallbackAnyFunction = () => any;
type EffectCallback = () => EffectCallbackAnyFunction | any;

export interface EffectQueue<T = any> {
  flag: EffectQueueFlag;
  action?: T;
  next?: EffectQueue<T>;
  create?: EffectCallback;
  deps?: any[] | void | null;
  last?: EffectQueue<T> | null;
  prevLast?: EffectQueue<T> | null;
  dispatch?: Dispatch<SetStateAction<T>>;
  hooks?: EffectHooks;
}

interface EffectHooks {
  destroy?: EffectCallbackAnyFunction | void;
  update?: Function;
}

type SetStateAction<S> = S | ((prevState: S) => S);
type Dispatch<A> = (value: A) => void;

function generateHookError(
  effect: EffectQueue | null,
  current: EffectQueue | null,
  currentInjectEffectFlag: EffectQueueFlag
) {
  const l: (EffectQueue | null)[] = [];
  while (effect && effect !== current) {
    l.push(effect);
    effect = effect.next as EffectQueue;
  }
  l.push(current);
  const c = ["Previous render", 12];
  const error = `The order of Hooks called by the app has changed when rendering. If not fixed, it will cause bugs and errors.

   ${c[0]}${" ".repeat(c[1] as number)}Next render
   ------------------------------------------------------
${l
  .map((a, b) => {
    const name = a ? (EffectFlagName as any)[EffectQueueFlag[a.flag]] : a + "";
    const n = (c[0] as string).length - name.length;
    return `${b + 1}. ${name}${" ".repeat((c[1] as number) + n)}${
      a === current
        ? (EffectFlagName as any)[EffectQueueFlag[currentInjectEffectFlag]]
        : name
    }`;
  })
  .join("\n")}
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 Error Component Stack`;
  return error;
}

function patchInitialState<T>(initialState: T) {
  return isFunction(initialState) ? initialState() : initialState;
}

function defineHookQueue<T>(
  queueFlag: EffectQueueFlag,
  createEffectQueueCallback: (
    ctx: DefineFunctionComponentInstanceContext
  ) => EffectQueue<T>
): EffectQueue<T> {
  const currentInstanceContext = getCurrentFunctionComponentInstance();
  if (currentInstanceContext) {
    let effect = currentInstanceContext.effect as EffectQueue<T>;
    if (effect === void 0) {
      effect = currentInstanceContext.effect = createEffectQueueCallback(
        currentInstanceContext
      );
      effect.last = effect;
    } else if (effect === null) {
      throw new Error(generateHookError(null, null, queueFlag));
    } else {
      if (effect.last && effect.last === effect.prevLast) {
        throw new Error(generateHookError(effect, null, queueFlag));
      }
      if (effect.last) {
        let next = effect.last.next as EffectQueue<T>;
        if (!next) {
          next = effect.last.next = createEffectQueueCallback(
            currentInstanceContext
          );
        } else if (next.flag !== queueFlag) {
          effect.last = effect.prevLast ?? null;
          throw new Error(generateHookError(effect, next, queueFlag));
        } else {
          next.hooks?.update?.();
        }
        effect.last = next;
      } else {
        if (effect.flag !== queueFlag) {
          effect.last = effect.prevLast ?? null;
          throw new Error(generateHookError(effect, effect, queueFlag));
        } else {
          effect.hooks?.update?.();
        }
        effect.last = effect;
      }
    }
    return effect.last;
  } else {
    if (process.env.NODE_ENV !== "production") {
      warn(
        "Invalid hook call. Hooks can only be called inside of the body of a function component."
      );
    }
  }
  return void 0 as unknown as EffectQueue<T>;
}

function effectDependenciesDiff(
  dependencies: any[] | void | null,
  effect: EffectQueue
) {
  return dependencies !== effect.deps
    ? dependencies == null ||
        effect.deps == null ||
        dependencies.length !== effect.deps?.length ||
        dependencies.some((v, i) => hasChanged(effect.deps![i], v))
    : dependencies === null || dependencies === void 0;
}

function effectDependenciesDiffBase(
  dependencies: any[] | void | null,
  effect: EffectQueue
) {
  return (
    dependencies !== effect.deps &&
    dependencies &&
    (dependencies.length !== effect.deps?.length ||
      dependencies.some((v, i) => hasChanged(effect.deps![i], v)))
  );
}

let dispatcher = {
  useState<T>(initialState: T) {
    const effectQueue = defineHookQueue(
      EffectQueueFlag.USE_STATE,
      (currentInstanceContext) => {
        return {
          flag: EffectQueueFlag.USE_STATE,
          action: patchInitialState(initialState),
          dispatch: (value) => {
            const prevValue = effectQueue.action;
            effectQueue.action = patchInitialState(value);
            if (hasChanged(prevValue, effectQueue.action)) {
              currentInstanceContext.hooks.update();
            }
          },
        };
      }
    );
    return [effectQueue.action, effectQueue.dispatch];
  },
  useId() {
    const effectQueue = defineHookQueue(EffectQueueFlag.USE_ID, (ctx) => {
      ctx.uid ??= 0;
      const uid = ++ctx.uid;
      return {
        flag: EffectQueueFlag.USE_ID,
        action: `:v${uid}:`,
      };
    });
    return effectQueue.action;
  },
  useCallback<T extends Function>(fn: T, dependencies: Array<any>) {
    const effectQueue = defineHookQueue(EffectQueueFlag.USE_CALLBACK, () => {
      return {
        flag: EffectQueueFlag.USE_CALLBACK,
        action: void 0,
      };
    });
    if (effectDependenciesDiffBase(dependencies, effectQueue)) {
      effectQueue.deps = dependencies;
      effectQueue.action = fn as any;
    }
    return effectQueue.action as unknown as T;
  },
  useEffect(setup: EffectCallback, dependencies: Array<any> | void | null) {
    const effectQueue = defineHookQueue(EffectQueueFlag.USE_EFFECT, () => {
      return {
        flag: EffectQueueFlag.USE_EFFECT,
        fn: setup,
        hooks: {
          destroy: void 0,
        },
      };
    });
    if (effectDependenciesDiff(dependencies, effectQueue)) {
      effectQueue.deps = dependencies;
      if (effectQueue.hooks) {
        if (effectQueue.hooks.destroy) {
          effectQueue.hooks.destroy();
        }
      }
      nextTick(() => {
        effectQueue.hooks!.destroy = setup();
      });
    }
  },
  useMemo<T>(calculateValue: () => T, dependencies: Array<any>) {
    const effectQueue = defineHookQueue<T>(EffectQueueFlag.USE_MEMO, () => {
      return {
        flag: EffectQueueFlag.USE_MEMO,
        action: calculateValue(),
        deps: dependencies,
      };
    });

    if (effectDependenciesDiffBase(dependencies, effectQueue)) {
      effectQueue.deps = dependencies;
      effectQueue.action = calculateValue();
    }
    return effectQueue.action as unknown as T;
  },
};

export function useState<S>(
  initialState: S | (() => S)
): [S, Dispatch<SetStateAction<S>>];

export function useState<S = undefined>(): [
  S | undefined,
  Dispatch<SetStateAction<S | undefined>>
];

export function useState<T>(initialState?: T) {
  return dispatcher.useState(initialState);
}

export function useId() {
  return dispatcher.useId();
}

export function useCallback<T extends Function>(
  fn: T,
  dependencies: Array<any>
): T {
  return dispatcher.useCallback(fn, dependencies);
}

export function useEffect(
  setup: EffectCallback,
  dependencies: Array<any>
): void;
export function useEffect(setup: EffectCallback): void;
export function useEffect(setup: EffectCallback, dependencies: null): void;

export function useEffect(
  setup: EffectCallback,
  dependencies: Array<any> | void | null
) {
  return dispatcher.useEffect(setup, dependencies);
}

export function useMemo<T>(calculateValue: () => T, dependencies: Array<any>) {
  return dispatcher.useMemo(calculateValue, dependencies);
}
