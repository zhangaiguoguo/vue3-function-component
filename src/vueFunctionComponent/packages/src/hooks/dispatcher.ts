import { toValue, warn } from "vue";
import { EMPTY_OBJ, hasChanged, isFunction, NOOP, NOOP2 } from "../shared";
import {
  type DefineFunctionComponentInstanceContext,
  getCurrentFunctionComponentInstance,
  inject,
} from "../defineFunctionComponent/index";
import { EffectFlagName, EffectQueueFlag } from "./hookFlag";
import { scheduleTask, Priority, cancelDuplicateTask } from "../scheduler";

// === 类型定义===
export type AnyActionArg = any[];
export type ActionDispatch<A extends AnyActionArg> = (...args: A) => void;
export type SetStateAction<T> = T | ((prevState: T) => T);
export type Dispatch<T> = (value: T) => void;
export type EffectCallback = () => void | (() => void);
export type StartTransition = (callback: () => any) => any;

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
  memoizedState?: T;
  queue?: EffectQueue[];
  type: 1 | 2;
}

/**
 * 生成 Hook 调用顺序错误提示
 */
const generateHookOrderError =
  process.env.NODE_ENV !== "production"
    ? function (flag: EffectQueueFlag) {
        const ctx = getCurrentContext();
        const { memoizedEffect } = ctx!;
        let effect = memoizedEffect.queue;
        const current = memoizedEffect.last?.next! ?? null;
        const l: (EffectQueue | null)[] = [];
        while (effect && effect !== current) {
          if (effect.type === 1) l.push(effect);
          effect = effect.next as EffectQueue;
        }
        l.push(current);
        const c = ["Previous render", 12];
        const error = `The order of Hooks called by the app has changed when rendering. If not fixed, it will cause bugs and errors.

   ${c[0]}${" ".repeat(c[1] as number)}Next render
   ------------------------------------------------------
${l
  .map((a, b) => {
    const name = a ? (EffectFlagName as any)[a.flag] : a + "";
    const n = (c[0] as string).length - name.length;
    return `${b + 1}. ${name}${" ".repeat((c[1] as number) + n)}${
      a === current ? (EffectFlagName as any)[flag] : name
    }`;
  })
  .join("\n")}
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 Error Component Stack`;
        return error;
      }
    : NOOP2;

/**
 * 依赖项比较
 */
function areDepsChanged(
  newDeps: unknown[] | void | null,
  lastDeps: unknown[] | void | null
): boolean {
  if (newDeps == null || lastDeps == null) return true;
  if (newDeps === lastDeps) return false;
  if (newDeps.length !== lastDeps.length) return true;

  for (let i = 0; i < newDeps.length; i++) {
    if (hasChanged(newDeps[i], lastDeps[i])) return true;
  }
  return false;
}

/**
 * 获取当前组件上下文
 */
function getCurrentContext(): DefineFunctionComponentInstanceContext {
  const ctx = getCurrentFunctionComponentInstance();
  if (!ctx && process.env.NODE_ENV !== "production") {
    warn("Hooks can only be called inside function components.");
  }
  return ctx as DefineFunctionComponentInstanceContext;
}

function initOrReuseHookQueue<T>(
  queueFlag: EffectQueueFlag,
  create: (
    ctx: DefineFunctionComponentInstanceContext
  ) => MakePropertiesOptional<EffectQueue<T>, "flag" | "lane">,
  lane: number = Priority.NORMAL
): EffectQueue<T> {
  const ctx = getCurrentContext();
  if (!ctx) return {} as EffectQueue<T>;

  const { memoizedEffect } = ctx;
  let effect = memoizedEffect.queue;

  const per =
    process.env.NODE_ENV !== "production"
      ? () => {
          const errorString = generateHookOrderError(queueFlag);
          memoizedEffect.last =
            memoizedEffect.prevLast =
            memoizedEffect.queue =
              null;
          return errorString;
        }
      : NOOP;

  // 检查 Hook 调用顺序
  if (
    process.env.NODE_ENV !== "production" &&
    ctx.instance?.isMounted &&
    ctx.firstRenderFlag === 1 &&
    memoizedEffect.last === memoizedEffect.prevLast
  ) {
    throw new Error(per() as any);
  }

  // 初始化队列
  if (!effect) {
    effect = memoizedEffect.queue = create(ctx) as EffectQueue<T>;
    effect.lane = lane;
    effect.flag = queueFlag;
    memoizedEffect.last = effect;
    return effect;
  }

  // 查找或创建下一个 Hook
  if (memoizedEffect.last) {
    let next = memoizedEffect.last.next as EffectQueue<T>;
    if (!next) {
      next = memoizedEffect.last.next = create(ctx) as EffectQueue<T>;
      next.lane = lane;
      next.flag = queueFlag;
    } else if (
      process.env.NODE_ENV !== "production" &&
      (next.flag & queueFlag) !== queueFlag
    ) {
      throw new Error(per() as any);
    }
    memoizedEffect.last = next;
    return next;
  }

  if (
    process.env.NODE_ENV !== "production" &&
    (effect.flag & queueFlag) !== queueFlag
  ) {
    throw new Error(per() as any);
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
  const update = () => {
    ctx.hooks.update();
  };
  return (value) => {
    const prevValue = effectQueue.action;
    const newValue = isFunction(value) ? value(prevValue as T) : value;

    if (hasChanged(prevValue, newValue)) {
      cancelDuplicateTask(update, lane);

      effectQueue.action = newValue;

      scheduleTask(update, lane);
    }
  };
}

export function useEffectImpl(
  create: EffectCallback,
  deps: any[] | undefined | null,
  flag: EffectQueueFlag,
  lane: number,
  type: EffectQueue["type"] = 1,
  scheduler: (fn: () => any, lane: number) => any = scheduleTask
) {
  const effectQueue = initOrReuseHookQueue(
    flag,
    () => ({
      create,
      deps: void 0,
      lane,
      hooks: { destroy: void 0 },
      type,
    }),
    lane
  );

  if (areDepsChanged(deps, effectQueue.deps)) {
    effectQueue.hooks?.destroy?.();
    effectQueue.create = create;
    effectQueue.deps = deps;

    scheduler(() => {
      effectQueue.hooks!.destroy = create() as () => void;
    }, lane);
  }
}

// === Hooks 实现 ===
export const dispatcher = {
  // === useState ===
  useState<T>(initialState: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
    const ctx = getCurrentContext();
    if (!ctx) return void 0 as any;

    const effectQueue = initOrReuseHookQueue(
      EffectQueueFlag.USE_STATE,
      () => ({
        action: isFunction(initialState) ? initialState() : initialState,
        type: 1,
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
        type: 1,
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
        type: 1,
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
          type: 1,
        };
      },
      Priority.NORMAL
    );

    if (!effectQueue.dispatch) {
      effectQueue.dispatch = ((...action: A) => {
        const newState = reducer(effectQueue.action as S, ...action);
        if (!Object.is(effectQueue.action, newState)) {
          effectQueue.action = newState;
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
        memoizedState: {
          current: initialValue,
          get i() {
            return (
              (effectQueue as any).a ||
              ((effectQueue as any).a = {
                refs: effectQueue.memoizedState,
                setupState: EMPTY_OBJ,
              })
            );
          },
          get r() {
            return "current";
          },
        },
        type: 1,
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
      Priority.USER_INPUT,
      1
    );
  },

  // === 并发控制 ===
  startTransition(callback: () => any) {
    scheduleTask(callback, Priority.TRANSITION);
  },

  // === useDeferredValue ===
  useDeferredValue<T>(value: T): T {
    const [deferredValue, setDeferredValue] = this.useState<T>(value);

    const effectQueue = initOrReuseHookQueue<T>(
      EffectQueueFlag.USE_DEFERRED_VALUE,
      () => ({
        action: value,
        type: 1,
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
          action: `:v${ctx.uid || Math.round(Math.random() * 1e6)}:`,
          type: 1,
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
        type: 1,
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
      Priority.SYNC,
      2
    );

    const snapshot = getSnapshot();
    if (
      !didWarnUncachedGetSnapshot &&
      hasChanged(effectQueue.action, snapshot)
    ) {
      const nextSnapshot = getSnapshot();
      if (hasChanged(snapshot, nextSnapshot)) {
        didWarnUncachedGetSnapshot = true;
        warn(
          "The result of getSnapshot should be cached to avoid an infinite loop"
        );
      }
    }

    if (didWarnUncachedGetSnapshot) {
      didWarnUncachedGetSnapshot = false;
      effectQueue.action = snapshot;
      scheduleTask(() => ctx?.hooks.update(), Priority.SYNC);
    }

    return effectQueue.action as T;
  },

  // === useImperativeHandle ===
  useImperativeHandle(
    ref: { current: any },
    createHandle: () => any,
    dependencies?: DependencyList
  ) {
    if (ref == null) {
      throw new Error(
        "The ref parameter of the useImperativeHandle hook cannot be empty and must be created through useRef"
      );
    }
    const effectQueue = initOrReuseHookQueue(
      EffectQueueFlag.USE_IMPERATIVE_HANDLE,
      () => ({
        create: createHandle as any,
        action: void 0,
        type: 1,
      }),
      Priority.NORMAL
    );

    useEffectImpl(
      () => {
        const result = createHandle();
        effectQueue.action = result;
      },
      dependencies,
      EffectQueueFlag.USE_EFFECT,
      Priority.NORMAL,
      2
    );

    useEffectImpl(
      () => {
        ref.current = effectQueue.action;
        return () => {
          ref.current = void 0;
        };
      },
      [ref, ref.current],
      EffectQueueFlag.USE_EFFECT,
      Priority.NORMAL,
      2
    );
  },

  // === useTransition ===
  useTransition(): [boolean, StartTransition] {
    const effectQueue = initOrReuseHookQueue(
      EffectQueueFlag.USE_TRANSITION,
      (ctx) => ({
        action: false,
        type: 1,
        dispatch: function (callback: () => void) {
          effectQueue.action = true;
          ctx.hooks.update();
          scheduleTask(() => {
            try {
              callback();
            } finally {
              effectQueue.action = false;
              ctx.hooks.update();
            }
          }, Priority.TRANSITION);
        } as any,
      }),
      Priority.NORMAL
    );

    return [
      effectQueue.action as boolean,
      effectQueue.dispatch as StartTransition,
    ];
  },
  // === useContext ===
  useContext(context: any) {
    const ctx = getCurrentFunctionComponentInstance();
    const effectQueue = initOrReuseHookQueue(
      EffectQueueFlag.USE_CONTEXT,
      () => ({
        action: context,
        type: 1,
      }),
      Priority.NORMAL
    );

    useEffectImpl(
      () => {
        let injectResult;
        const currentRenderValue = (context as any)._currentRenderer;
        if (currentRenderValue) {
          effectQueue.memoizedState = currentRenderValue;
        } else if ((injectResult = inject<any>(context, NOOP, true))) {
          if (injectResult) {
            effectQueue.memoizedState = injectResult;
            ctx.provides.set(context, injectResult);
          }
        } else {
          effectQueue.memoizedState = context._currentValue;
        }
        effectQueue.action = context;
      },
      [context, (context as any)._renderCount],
      EffectQueueFlag.USE_EFFECT,
      Priority.SYNC
    );

    useEffectImpl(
      () => {
        return () => {
          ctx.provides.delete(context);
        };
      },
      [context],
      EffectQueueFlag.USE_EFFECT,
      Priority.SYNC
    );

    return toValue(effectQueue.memoizedState);
  },
};

let didWarnUncachedGetSnapshot = false;

export default dispatcher;
