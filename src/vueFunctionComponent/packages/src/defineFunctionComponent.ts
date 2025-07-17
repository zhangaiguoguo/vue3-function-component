import {
  type ComponentInternalInstance,
  getCurrentInstance,
  h,
  ref,
  type Slots,
  warn,
  type EmitsOptions,
  type SetupContext,
  type VNode,
  toValue,
  isVNode,
  type ComponentObjectPropsOptions,
  type ExtractPropTypes,
  type DefineProps,
  triggerRef,
} from "vue";
import { extend, isFunction, isObject2 } from "../shared";
import { onUnmounted } from "./lifeCycle";
import { type EffectQueue } from "./hooks/dispatcher";
import { Priority, scheduleTask } from "./scheduler";
import type { LooseRequired, Prettify } from "@vue/shared";

export type DefineFunctionComponentRender<Props = Record<string, any>> = (
  props: Props
) => VueFunctionComponentVnode;

type AsyncComponentResolveResult<T> =
  | T
  | {
      default: T;
    };

export type AsyncComponentLoader<T = any> = () => Promise<
  AsyncComponentResolveResult<T>
>;

type DefineAsyncFunctionComponentErrorRenderProps = {
  error: Error | string | void;
};

interface DefineAsyncFunctionComponentRenderOptions<
  Props = Record<string, any>
> {
  loader: AsyncComponentLoader<DefineFunctionComponentRender<Props>>;
  error?:
    | ExoticComponent<DefineAsyncFunctionComponentErrorRenderProps>
    | ((
        props: DefineAsyncFunctionComponentErrorRenderProps & VnodeJsxProps
      ) => VueFunctionComponentVnode);
  loading?: ExoticComponent | (() => VueFunctionComponentVnode);
}

type DefineFunctionComponentOptionsProps<PropNames extends string = string> =
  | PropNames[]
  | ComponentObjectPropsOptions;

interface DefineFunctionComponentOptions<
  Props = DefineFunctionComponentOptionsProps
> {
  name?: string;
  props?: Props;
  emits?: EmitsOptions;
  slots?: Slots;
}

export interface DefineFunctionComponentInstanceContext {
  parent: DefineFunctionComponentInstanceContext | null;
  instance: ComponentInternalInstance;
  memoizedEffect: {
    queue: EffectQueue | null;
    last: EffectQueue | null;
    prevLast: EffectQueue | null;
  };
  exposed?: Record<string, any>;
  props: ComponentInternalInstance["props"];
  context: SetupContext;
  hooks: DefineFunctionComponentInstanceContextHooks;
  uid: number;
  firstRenderFlag: 0 | 1;
  provides: Map<any, any>;
}

interface DefineFunctionComponentInstanceContextHooks {
  update: () => void;
}

const __v_FC_component = Symbol.for("vue.function.component");

const functionComponentIntanceMap = new WeakMap<
  ComponentInternalInstance,
  DefineFunctionComponentInstanceContext
>();
let currentInstanceContext: DefineFunctionComponentInstanceContext | null =
  null;

export function getCurrentFunctionComponentInstance(): DefineFunctionComponentInstanceContext {
  return currentInstanceContext as DefineFunctionComponentInstanceContext;
}

export function setCurrentFunctionComponentInstance(
  context: DefineFunctionComponentInstanceContext | null
) {
  currentInstanceContext = context ?? null;
}

function createInstanceMemoized(): DefineFunctionComponentInstanceContext["memoizedEffect"] {
  return {
    queue: null,
    prevLast: null,
    last: null,
  };
}

function defineFunctionComponentContext(
  props: DefineFunctionComponentInstanceContext["props"] | null,
  setupContext: SetupContext | null
) {
  const instance = getCurrentInstance() as ComponentInternalInstance;
  if (!instance && process.env.NODE_ENV !== "production") {
    warn(
      "defineFunctionComponentContext",
      "not find current function instance"
    );
    return;
  }
  let context = functionComponentIntanceMap.get(
    instance
  ) as DefineFunctionComponentInstanceContext;
  if (!functionComponentIntanceMap.has(instance)) {
    functionComponentIntanceMap.set(
      instance,
      (context = {
        parent: null,
        instance: instance,
        hooks: {
          update: createCurrentContextUpdateHook(),
        },
        memoizedEffect: createInstanceMemoized(),
        uid: 0,
        firstRenderFlag: 0,
        provides: new Map(),
      } as any)
    );
    currentInstanceContext = context;
    onUnmounted(() => {
      let effect = context.memoizedEffect.queue;
      while (effect) {
        if (effect.hooks?.destroy) {
          effect.hooks.destroy();
        }
        effect = effect.next ?? null;
      }
      instance.uid = 0;
      functionComponentIntanceMap.delete(instance);
      context.provides.clear();
    });
  }
  context.parent = functionComponentIntanceMap.get(instance.parent!) ?? null;
  currentInstanceContext = context;
  currentInstanceContext.context = setupContext as any;
  currentInstanceContext.props = props as any;
}

function createCurrentContextUpdateHook() {
  const instance = getCurrentInstance();
  return () => {
    const e = instance?.effect;
    if (e) {
      e.dirty = true;
      if (e.scheduler) {
        e.scheduler();
      } else {
        scheduleTask(() => instance?.update(), Priority.TRANSITION);
      }
    } else {
      if (process.env.NODE_ENV !== "production") {
        warn("The current instance has no updatable scheduling");
      }
    }
  };
}

enum DefineFunctionComponentRenderType {
  FUNCTION = "function",
  ERROR = "error",
  LOADING = "loading",
  ASYNC_FUNCTION = "asyncFunction",
}

interface VnodeJsxProps {
  children?: VueFunctionComponentVnode;
}

export interface ExoticComponent<P = {}> {
  (props: P & VnodeJsxProps): VueFunctionComponentVnode;
  readonly $$typeof: symbol;
}

type PatchDefineProps<
  P,
  PropNames extends string = string
> = P extends PropNames[]
  ? Prettify<
      Readonly<{
        [key in P[number]]?: any;
      }>
    >
  : Prettify<Readonly<ExtractPropTypes<P>>>;

type BooleanKey<T, K extends keyof T = keyof T> = K extends any
  ? [T[K]] extends [boolean | undefined]
    ? K
    : never
  : never;

type ExtractProps<Props = DefineFunctionComponentOptionsProps> = Partial<
  Omit<DefineFunctionComponentOptions<Props>, "props">
> & {
  props: Props;
};

export function defineFunctionComponent<
  PropsType,
  PropsData = DefineProps<LooseRequired<PropsType>, BooleanKey<PropsType>>
>(
  renderOptions: DefineAsyncFunctionComponentRenderOptions<PropsData>
): ExoticComponent<PropsData>;

export function defineFunctionComponent<
  PropsType,
  PropsData = DefineProps<LooseRequired<PropsType>, BooleanKey<PropsType>>
>(render: DefineFunctionComponentRender<PropsData>): ExoticComponent<PropsData>;

export function defineFunctionComponent<
  R extends DefineFunctionComponentRender<PropsData>,
  O extends ExtractProps,
  PropsData = PatchDefineProps<O["props"]>
>(
  render: DefineFunctionComponentRender<PropsData>,
  options: O
): ExoticComponent<PropsData>;

export function defineFunctionComponent<
  O extends ExtractProps = ExtractProps,
  PropsData = PatchDefineProps<O["props"]>,
  RO extends DefineAsyncFunctionComponentRenderOptions<PropsData> = DefineAsyncFunctionComponentRenderOptions<PropsData>
>(renderOptions: RO, options: O): ExoticComponent<PropsData>;

export function defineFunctionComponent<
  Props = DefineFunctionComponentOptionsProps,
  PropsData = DefineProps<LooseRequired<Props>, BooleanKey<Props>>,
  O = DefineFunctionComponentOptions<PropsData>
>(
  render: DefineFunctionComponentRender<PropsData>,
  options: O
): ExoticComponent<PropsData>;

export function defineFunctionComponent<
  Props = DefineFunctionComponentOptionsProps,
  PropsData = DefineProps<LooseRequired<Props>, BooleanKey<Props>>,
  O = DefineFunctionComponentOptions<PropsData>
>(
  renderOptions: DefineAsyncFunctionComponentRenderOptions<PropsData>,
  options: O
): ExoticComponent<PropsData>;

/**
 *
 * @example
 * ```tsx
 * const A = defineFunctionComponent<{a:number}>(() => 1)
 *
 * const B = defineFunctionComponent({
 *  loader(){
 *    return Proimse.resolve(() => 2)
 *  },
 *  loading:() => <div>loading...</div>,
 *  error:({error}) => error
 * })
 *
 * const C = defineFunctionComponent((props) => props.msg,{
 *   name:"CustomName",
 *   props:{
 *    msg:{default:1,required:true,type:Number}
 *   }
 * })
 *
 * ```
 *
 * @param render - function or object
 * @returns vueRenderFunction
 */
export function defineFunctionComponent(render: any, options?: any): any {
  if (
    process.env.NODE_ENV !== "production" &&
    !isFunction(render) &&
    !isObject2(render)
  ) {
    warn(
      "The first argument should be a render function or an object with a 'functionComponent' property. but Received:",
      render
    );
    return void 0 as any;
  }
  const renderOptions = render as DefineAsyncFunctionComponentRenderOptions;

  let renderFlag = DefineFunctionComponentRenderType.FUNCTION;
  if (typeof render === "object") {
    if (process.env.NODE_ENV !== "production" && !isFunction(render.loader)) {
      warn(
        "The loader function must be a valid function. but Received:",
        render.loader
      );
      return void 0 as any;
    }
    render = renderOptions.loader as any;
    renderFlag = DefineFunctionComponentRenderType.ASYNC_FUNCTION;
  }

  if ((render as any).$$typeof) return render as any;

  const displayName = (options && options.name) || (render as any).name;

  const instanceRender = ref<any>(render);

  let renderError: Error | string | void;

  const handlers = {
    [displayName](props: any, context: SetupContext) {
      let renderResult: any = null,
        prevQueue,
        memoizedEffect;
      const prevFunctionIntanceContext =
        currentInstanceContext as DefineFunctionComponentInstanceContext;

      if (renderFlag === DefineFunctionComponentRenderType.FUNCTION) {
        defineFunctionComponentContext(props, context);
        console.log(currentInstanceContext);
        memoizedEffect = currentInstanceContext!.memoizedEffect;
        if (memoizedEffect.queue) {
          memoizedEffect.prevLast = memoizedEffect.last ?? null;
          memoizedEffect.last = null;
        }
        prevQueue = memoizedEffect.queue;
      } else {
        currentInstanceContext = null;
      }
      const ctx = currentInstanceContext;
      try {
        const renderFn = toValue(instanceRender);
        const componentInstance = getCurrentInstance()!;
        switch (renderFlag) {
          case DefineFunctionComponentRenderType.ERROR:
            if (renderOptions.error) {
              renderResult = h(renderOptions.error as any, {
                error: renderError,
              });
            }
            break;
          case DefineFunctionComponentRenderType.FUNCTION:
            switch (handler.$$typeof) {
              case void 0:
                renderResult = null;
                break;
              default:
                renderResult = renderFn!(props);
            }
            if (process.env.NODE_ENV !== "production" && prevQueue !== null) {
              if (memoizedEffect!.prevLast !== memoizedEffect!.last) {
                throw new Error(
                  "The hook for rendering is different from expected. This may be caused by an unexpected premature return statement."
                );
              }
            }
            break;
          case DefineFunctionComponentRenderType.ASYNC_FUNCTION:
            let promiseRes;
            try {
              promiseRes = Promise.resolve((renderFn as any)());
              renderFlag = DefineFunctionComponentRenderType.LOADING;
              instanceRender.value = null;
              promiseRes
                .then((comp: any) => {
                  if (componentInstance.isUnmounted) {
                    return;
                  }
                  if (
                    comp &&
                    (comp.__esModule || comp[Symbol.toStringTag] === "Module")
                  ) {
                    comp = comp.default;
                  }
                  if (!isFunction(comp)) {
                    throw new Error(
                      "The reslove must return a valid render function. but received:",
                      {
                        cause: comp,
                      }
                    );
                  }
                  renderFlag = DefineFunctionComponentRenderType.FUNCTION;
                  instanceRender.value = comp;
                })
                .catch((err: Error) => {
                  if (componentInstance.isUnmounted) {
                    return;
                  }
                  renderError = err;
                  renderFlag = DefineFunctionComponentRenderType.ERROR;
                  if (process.env.NODE_ENV !== "production") {
                    warn(
                      "Async component loading failed.",
                      "\nPossible reasons:",
                      "\n1. Network error when importing the module.",
                      "\n2. The exported component is not a valid function.",
                      "\n3. Module system mismatch (e.g., mixing ES Modules).",
                      "\nError details:",
                      err && err.toString(),
                      err.cause ?? ""
                    );
                  }
                  triggerRef(instanceRender);
                });
            } catch (syncError: any) {
              renderError = syncError;
              renderFlag = DefineFunctionComponentRenderType.ERROR;
              if (process.env.NODE_ENV !== "production") {
                warn(
                  "Async component render function threw an error during initialization.",
                  "\nError:",
                  syncError,
                  "\nStack:",
                  syncError.stack
                );
              }
              break;
            }
          case DefineFunctionComponentRenderType.LOADING:
            if (renderFlag === DefineFunctionComponentRenderType.LOADING) {
              if (renderOptions.loading) {
                renderResult = h(renderOptions.loading as any);
              } else {
                renderResult = null;
              }
            }
            break;
        }
      } catch (err: any) {
        renderFlag = DefineFunctionComponentRenderType.ERROR;
        if (process.env.NODE_ENV !== "production") {
          warn("Error during function.component run render :", err);
        }
        renderResult = null;
      } finally {
        if (renderFlag === DefineFunctionComponentRenderType.FUNCTION) {
          ctx!.firstRenderFlag = 1;
        }
        currentInstanceContext = prevFunctionIntanceContext || null;
      }
      return renderResult;
    },
  };

  const handler = handlers[displayName].bind(void 0) as any;

  initOptions(handler, options);

  handler.$$typeof = __v_FC_component;

  return handler as any;
}

function initOptions(
  handler: any,
  options: DefineFunctionComponentOptions | void
) {
  if (options) {
    for (let k in options) {
      switch (k) {
        case "name":
          continue;
      }
      handler[k] = (options as any)[k];
    }
  }
}

export type VueFunctionComponentVnode =
  | VNode
  | VNode[]
  | null
  | void
  | string
  | number
  | boolean
  | (Element & any);

type Slot = (...args: any[]) => VueFunctionComponentVnode;

export function defineFunctionSlots(slot: VueFunctionComponentVnode): {
  default: Slot;
};
export function defineFunctionSlots(slot: Slot): { default: Slot };
export function defineFunctionSlots(...args: Slot[]): Slots;

export function defineFunctionSlots(...slots: any): any {
  const slots2: any = {};
  for (let slot of slots) {
    if (isVNode(slot)) {
      slots2.default = () => slot;
    } else if (isFunction(slot)) {
      slots2[slot.name || "default"] = slot;
    } else if (isObject2(slot)) {
      extend(slots2, slot);
    } else {
      slots2.default = () => slot;
    }
  }
  return slots2;
}

function useContext(): SetupContext {
  return getCurrentFunctionComponentInstance()?.context as any;
}

export const useSetupContext = useContext;

export function useSlots(): SetupContext["slots"] {
  return useContext()?.slots;
}

export function useAttrs(): SetupContext["attrs"] {
  return useContext()?.attrs;
}

export function useProps(): DefineFunctionComponentInstanceContext["props"] {
  return getCurrentFunctionComponentInstance()?.props;
}

export function provide<T, K = any>(key: K, value: T): void;
export function provide(key: any, value: any) {
  if (!currentInstanceContext) {
    if (true) {
      warn(`provide() can only be called inside function components.`);
    }
  } else {
    let provides = currentInstanceContext.provides;
    const parentProvides =
      currentInstanceContext.parent && currentInstanceContext.parent.provides;
    if (parentProvides === provides) {
      provides = currentInstanceContext.provides = new Map(parentProvides);
    }
    provides.set(key, value);
  }
}

export function inject<T>(key: any): T | undefined;
export function inject<T>(
  key: any,
  defaultValue: T,
  treatDefaultAsFactory?: false
): T;
export function inject<T>(
  key: any,
  defaultValue: T | (() => T),
  treatDefaultAsFactory: true
): T;
export function inject(
  key: any,
  defaultValue?: any,
  treatDefaultAsFactory = false
) {
  const instanceContext = currentInstanceContext;
  if (instanceContext) {
    let provides: any = null;
    let source: any = instanceContext;
    while (source) {
      let _provides = provides;
      if ((_provides = source.provides) && _provides.has(key)) {
        provides = _provides;
        break;
      }
      source = source.parent;
      if (!source && !provides) {
        source = instanceContext.instance.vnode.appContext;
      }
    }
    if (provides) {
      return provides.get(key);
    } else if (arguments.length > 1) {
      return treatDefaultAsFactory && isFunction(defaultValue)
        ? defaultValue.call(instanceContext && instanceContext.instance.props)
        : defaultValue;
    } else if (process.env.NODE_ENV !== "production") {
      warn(`injection key( `, key, ` ) not found.`);
    }
  } else if (process.env.NODE_ENV !== "production") {
    warn(`inject() can only be called inside function components.`);
  }
}
