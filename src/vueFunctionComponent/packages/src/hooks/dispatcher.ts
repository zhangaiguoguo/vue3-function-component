import { warn } from "vue";
import { hasChanged, isFunction } from "../../shared";
import {
  type DefineFunctionComponentInstanceContext,
  getCurrentFunctionComponentInstance,
} from "../defineFunctionComponent";
import { EffectFlagName, EffectQueueFlag } from "./hookFlag";
import {
  scheduleTask,
  Priority,
  cancelDuplicateTask,
  getCurrentPriorityLane,
} from "../scheduler";

// === 类型定义===
export type AnyActionArg = any[];
export type ActionDispatch<A extends AnyActionArg> = (...args: A) => void;
export type SetStateAction<T> = T | ((prevState: T) => T);
export type Dispatch<T> = (value: T) => void;
export type EffectCallback = () => void | (() => void);

type MakePropertiesOptional<T, K extends keyof T> = Partial<Pick<T, K>> &
  Omit<T, K>;

export type DependencyList = any[];

export interface EffectHooks {
  update?: () => void;
  destroy?: () => void;
}

export interface EffectQueue<T = any> {
  flag: EffectQueueFlag;
  action?: T;
  next?: EffectQueue<T>;
  create?: EffectCallback;
  deps?: any[] | void | null;
  dispatch?: Dispatch<SetStateAction<T>>;
  hooks?: EffectHooks;
  lane: number; // 优先级通道
  isConcurrent?: boolean;
  baseState?: T;
  memoizedState?: T;
  queue?: EffectQueue[];
}

/**
 * 生成 Hook 调用顺序错误提示
 */
function generateHookOrderError(
  expectedFlag: EffectQueueFlag,
  actualFlag?: EffectQueueFlag
) {
  const expectedHook = EffectFlagName[expectedFlag] || `Hook(${expectedFlag})`;
  const actualHook = actualFlag
    ? EffectFlagName[actualFlag] || `Hook(${actualFlag})`
    : "null";

  return [
    `Invalid Hook call order:`,
    `- Expected: ${expectedHook}`,
    `- Actual: ${actualHook}`,
    `Hooks must be called in the same order on every render.`,
  ].join("\n");
}

/**
 * 依赖项比较
 */
function areDepsChanged(
  newDeps: unknown[] | void | null,
  lastDeps: unknown[] | void | null
): boolean {
  if (newDeps == null || lastDeps == null) return true;
  if (newDeps.length !== lastDeps.length) return true;

  for (let i = 0; i < newDeps.length; i++) {
    if (!Object.is(newDeps[i], lastDeps[i])) return true;
  }
  return false;
}

/**
 * 获取当前组件上下文
 */
function getCurrentContext(): DefineFunctionComponentInstanceContext | null {
  const ctx = getCurrentFunctionComponentInstance();
  if (!ctx && process.env.NODE_ENV !== "production") {
    warn("Hooks can only be called inside function components.");
  }
  return ctx ?? null;
}

/**
 * 初始化或复用 Hook 队列
 */
function initOrReuseHookQueue<T>(
  queueFlag: EffectQueueFlag,
  create: (
    ctx: DefineFunctionComponentInstanceContext
  ) => MakePropertiesOptional<EffectQueue<T>, "flag">,
  lane: number = Priority.NORMAL
): EffectQueue<T> {
  const ctx = getCurrentContext();
  if (!ctx) return {} as EffectQueue<T>;

  const { memoizedEffect } = ctx;
  let effect = memoizedEffect.queue;

  // 初始化队列
  if (!effect) {
    effect = memoizedEffect.queue = create(ctx) as EffectQueue<T>;
    effect.lane = lane;
    effect.flag = queueFlag;
    effect.isConcurrent = true;
    memoizedEffect.last = effect;
    return effect;
  }

  // 检查 Hook 调用顺序
  if (memoizedEffect.last === memoizedEffect.prevLast) {
    throw new Error(generateHookOrderError(queueFlag));
  }

  // 查找或创建下一个 Hook
  if (memoizedEffect.last) {
    let next = memoizedEffect.last.next as EffectQueue<T>;
    if (!next) {
      next = memoizedEffect.last.next = create(ctx) as EffectQueue<T>;
      next.lane = lane;
      next.flag = queueFlag;
    } else if ((next.flag & queueFlag) !== queueFlag) {
      memoizedEffect.last = memoizedEffect.prevLast ?? null;
      throw new Error(generateHookOrderError(queueFlag, next.flag));
    }
    memoizedEffect.last = next;
    return next;
  }

  if ((effect.flag & queueFlag) !== queueFlag) {
    memoizedEffect.last = memoizedEffect.prevLast ?? null;
    throw new Error(generateHookOrderError(queueFlag, effect.flag));
  }
  memoizedEffect.last = effect;
  return effect;
}

// === 并发安全的 Dispatch ===
function createConcurrentDispatch<T>(
  effectQueue: EffectQueue<T>,
  ctx: DefineFunctionComponentInstanceContext,
  lane: number = Priority.NORMAL
): Dispatch<SetStateAction<T>> {
  return (value) => {
    const prevValue = effectQueue.action;
    const newValue = isFunction(value) ? value(prevValue as T) : value;

    if (hasChanged(prevValue, newValue)) {
      const currentPriority = getCurrentPriorityLane();

      if (lane === Priority.TRANSITION && currentPriority < lane) {
        cancelDuplicateTask(() => {
          effectQueue.action = newValue;
          effectQueue.baseState = prevValue;
          ctx.hooks.update();
        }, lane);
        return;
      }

      effectQueue.action = newValue;
      effectQueue.baseState = prevValue;

      scheduleTask(
        () => ctx.hooks.update(),
        lane === Priority.SYNC ? Priority.SYNC : Priority.NORMAL
      );
    }
  };
}

function useEffectImpl(
  create: EffectCallback,
  deps: any[] | undefined | null,
  flag: EffectQueueFlag,
  lane: number
) {
  const effectQueue = initOrReuseHookQueue(
    flag,
    () => ({
      create,
      deps: void 0,
      lane,
      hooks: { destroy: undefined },
    }),
    lane
  );

  if (areDepsChanged(deps, effectQueue.deps)) {
    effectQueue.hooks?.destroy?.();
    effectQueue.create = create;
    effectQueue.deps = deps;

    scheduleTask(() => {
      effectQueue.hooks!.destroy = create() as () => void;
    }, lane);
  }
}

// === Hooks 实现 ===
export const dispatcher = {
  // === useState ===
  useState<T>(initialState: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
    const ctx = getCurrentContext();
    if (!ctx) return [initialState as T, () => {}];

    const effectQueue = initOrReuseHookQueue(
      EffectQueueFlag.USE_STATE,
      () => ({
        action: isFunction(initialState) ? initialState() : initialState,
        lane: Priority.NORMAL,
        baseState: isFunction(initialState) ? initialState() : initialState,
      }),
      Priority.NORMAL
    );

    if (!effectQueue.dispatch) {
      effectQueue.dispatch = createConcurrentDispatch(
        effectQueue,
        ctx,
        Priority.NORMAL
      );
    }

    return [effectQueue.action as T, effectQueue.dispatch];
  },

  // === useEffect ===
  useEffect(create: EffectCallback, deps?: DependencyList | null) {
    useEffectImpl(create, deps, EffectQueueFlag.USE_EFFECT, Priority.NORMAL);
  },

  // === useMemo ===
  useMemo<T>(create: () => T, deps?: DependencyList | null): T {
    const effectQueue = initOrReuseHookQueue(
      EffectQueueFlag.USE_MEMO,
      () => ({
        memoizedState: create(),
        deps,
        lane: Priority.NORMAL,
      }),
      Priority.NORMAL
    );

    if (areDepsChanged(deps, effectQueue.deps)) {
      effectQueue.memoizedState = create();
      effectQueue.deps = deps;
    }

    return effectQueue.memoizedState as T;
  },

  // === useCallback ===
  useCallback<T extends Function>(
    callback: T,
    deps?: DependencyList | null
  ): T {
    const effectQueue = initOrReuseHookQueue(
      EffectQueueFlag.USE_CALLBACK,
      () => ({
        memoizedState: callback,
        deps,
        lane: Priority.NORMAL,
      }),
      Priority.NORMAL
    );

    if (areDepsChanged(deps, effectQueue.deps)) {
      effectQueue.memoizedState = callback;
      effectQueue.deps = deps;
    }

    return effectQueue.memoizedState as T;
  },

  // === useReducer ===
  useReducer<S, I, A extends AnyActionArg>(
    reducer: (prevState: S, ...args: A) => S,
    initialArg: I,
    init?: (i: I) => S
  ): [S, ActionDispatch<A>] {
    const ctx = getCurrentContext();
    const effectQueue = initOrReuseHookQueue<S>(
      EffectQueueFlag.USE_REDUCER,
      () => {
        const initialState = init
          ? init(initialArg)
          : (initialArg as unknown as S);
        return {
          action: initialState,
          memoizedState: initialState,
          lane: Priority.NORMAL,
        };
      },
      Priority.NORMAL
    );

    if (!effectQueue.dispatch) {
      effectQueue.dispatch = ((...action: A) => {
        const newState = reducer(effectQueue.action as S, ...action);
        if (!Object.is(effectQueue.action, newState)) {
          effectQueue.action = newState;
          effectQueue.memoizedState = newState;
          ctx!.hooks.update();
        }
      }) as any;
    }

    return [
      effectQueue.action as S,
      effectQueue.dispatch as unknown as ActionDispatch<A>,
    ];
  },

  // === useRef ===
  useRef<T>(initialValue: T): { current: T } {
    const effectQueue = initOrReuseHookQueue(
      EffectQueueFlag.USE_REF,
      () => ({
        memoizedState: { current: initialValue },
        lane: Priority.NORMAL,
      }),
      Priority.NORMAL
    );

    return effectQueue.memoizedState as { current: T };
  },

  // === useLayoutEffect ===
  useLayoutEffect(create: EffectCallback, deps?: DependencyList | null) {
    useEffectImpl(
      create,
      deps,
      EffectQueueFlag.USE_LAYOUT_EFFECT,
      Priority.USER_INPUT
    );
  },

  // === 并发控制 ===
  startTransition(callback: () => any) {
    scheduleTask(callback, Priority.TRANSITION);
  },

  useDeferredValue<T>(value: T): T {
    const [deferredValue, setDeferredValue] = this.useState<T>(value);

    const effectQueue = initOrReuseHookQueue<T>(
      EffectQueueFlag.USE_DEFERRED_VALUE,
      () => ({
        action: value,
        lane: Priority.TRANSITION,
      }),
      Priority.TRANSITION
    );

    this.useEffect(() => {
      if (!Object.is(effectQueue.action, value)) {
        effectQueue.action = value;
        scheduleTask(() => setDeferredValue(value), Priority.TRANSITION);
      }
    }, [value]);

    return deferredValue;
  },

  // === useId ===
  useId(): string {
    const effectQueue = initOrReuseHookQueue(
      EffectQueueFlag.USE_ID,
      (ctx) => {
        ctx.uid++;
        return {
          action: `:r${ctx.uid || Math.round(Math.random() * 1e6)}:`,
          lane: Priority.SYNC,
        };
      },
      Priority.SYNC
    );

    return effectQueue.action as string;
  },

  // === useSyncExternalStore ===
  useSyncExternalStore<T>(
    subscribe: (callback: () => void) => () => void,
    getSnapshot: () => T,
    getServerSnapshot?: () => T
  ): T {
    const ctx = getCurrentContext();

    const effectQueue = initOrReuseHookQueue<T>(
      EffectQueueFlag.USE_SYNC_EXTERNAL_STORE,
      () => ({
        create: subscribe as any,
        action: getSnapshot(),
        lane: Priority.NORMAL,
      }),
      Priority.NORMAL
    );

    if (getServerSnapshot && !ctx!.instance?.isMounted) {
      return getServerSnapshot();
    }

    useEffectImpl(
      () => {
        const callback = () => {
          const nextSnapshot = getSnapshot();
          if (hasChanged(effectQueue.action, nextSnapshot)) {
            effectQueue.action = nextSnapshot;
            ctx!.hooks.update();
          }
        };

        const unsubscribe = subscribe(callback);
        return unsubscribe;
      },
      [subscribe],
      EffectQueueFlag.USE_EFFECT,
      Priority.SYNC
    );

    const nextSnapshot = getSnapshot();
    if (
      !didWarnUncachedGetSnapshot &&
      hasChanged(effectQueue.action, nextSnapshot)
    ) {
      warn(
        "The result of getSnapshot should be cached to avoid an infinite loop"
      );
      didWarnUncachedGetSnapshot = true;
    }

    if (didWarnUncachedGetSnapshot) {
      didWarnUncachedGetSnapshot = false;
      effectQueue.action = nextSnapshot;
      scheduleTask(() => ctx?.hooks.update(), Priority.SYNC);
    }

    return effectQueue.action as T;
  },
};

let didWarnUncachedGetSnapshot = false;

export default dispatcher;
