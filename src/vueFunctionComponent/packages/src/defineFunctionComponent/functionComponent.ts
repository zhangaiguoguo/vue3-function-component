import {
  h,
  getCurrentInstance,
  type ComponentInternalInstance,
  type SetupContext,
  warn,
  ExtractPropTypes,
  DefineProps,
  Suspense,
} from "vue";
import { scheduleTask, Priority } from "../scheduler";
import {
  DefineAsyncFunctionComponentRenderOptions,
  DefineFunctionComponentOptionsProps,
  DefineFunctionComponentRender,
  ExoticComponent,
  RenderType,
  RuntimeFlag,
  type DefineFunctionComponentInstanceContext,
  type DefineFunctionComponentOptions,
  type DefineFunctionComponentRenderContext,
} from "./types";
import {
  createInstanceMemoized,
  getComponentDisplayName,
  validateRenderInput,
} from "./utils";
import { isFunction } from "../shared";
import { type LooseRequired, type Prettify } from "@vue/shared";
import { onUnmounted } from "../lifeCycle";

export const isSsr = typeof window === "undefined";

const __v_FC_component = Symbol.for("vue.function.component");
const functionComponentInstanceMap = new WeakMap<
  ComponentInternalInstance,
  DefineFunctionComponentInstanceContext
>();

export let currentInstanceContext: DefineFunctionComponentInstanceContext | null =
    null,
  currentRuntimeRenderInstanceContext: DefineFunctionComponentInstanceContext | null;

export const getCurrentFunctionComponentInstance =
  (): DefineFunctionComponentInstanceContext => {
    return currentRuntimeRenderInstanceContext as DefineFunctionComponentInstanceContext;
  };

export const setCurrentFunctionComponentInstance = (
  context: DefineFunctionComponentInstanceContext | null
) => {
  currentRuntimeRenderInstanceContext = context ?? null;
};

export const defineFunctionComponentContext = (
  props: DefineFunctionComponentInstanceContext["props"] | null,
  setupContext: SetupContext | null
) => {
  const instance = getCurrentInstance() as ComponentInternalInstance;
  if (process.env.NODE_ENV !== "production")
    if (!instance) {
      warn(
        "defineFunctionComponentContext",
        "not find current function instance"
      );
      return;
    }

  let context = functionComponentInstanceMap.get(instance);

  if (!context) {
    context = {
      parent: null,
      instance,
      hooks: {
        update: createCurrentContextUpdateHook(),
      },
      memoizedEffect: createInstanceMemoized(),
      uid: 0,
      firstRenderFlag: 0,
      provides: new Map(),
    } as DefineFunctionComponentInstanceContext;

    functionComponentInstanceMap.set(instance, context);
    currentInstanceContext = context;

    setupUnmountCleanup(instance, context);
  }

  context.parent = functionComponentInstanceMap.get(instance.parent!) ?? null;
  currentInstanceContext = context;
  currentInstanceContext.context = setupContext as any;
  currentInstanceContext.props = props as any;
};

const setupUnmountCleanup = (
  instance: ComponentInternalInstance,
  context: DefineFunctionComponentInstanceContext
) => {
  onUnmounted(() => {
    let effect = context.memoizedEffect.queue;
    while (effect) {
      if (effect.hooks?.destroy) {
        effect.hooks.destroy();
      }
      effect = effect.next ?? null;
    }
    instance.uid = 0;
    functionComponentInstanceMap.delete(instance);
    context.provides.clear();
  });
};

const createCurrentContextUpdateHook = () => {
  const instance = getCurrentInstance();
  return () => {
    const e = instance?.effect;
    if (e) {
      const run = e.run;
      e.run = () => {
        (e as any)._dirty = false;
        run.apply(e);
      };
      try {
        e.dirty = true;
      } catch {}
      (e as any)._dirty = true;
      if (e.scheduler) {
        e.scheduler();
      } else {
        scheduleTask(() => instance?.update(), Priority.TRANSITION);
      }
    } else if (process.env.NODE_ENV !== "production") {
      warn("The current instance has no updatable scheduling");
    }
  };
};

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
export function defineFunctionComponent(render: any, options?: any): any {
  if (!validateRenderInput(render)) {
    return void 0 as any;
  }

  if ((render as any).$$typeof) return render as any;

  const handler = createComponentHandler(render, options);

  handler.$$typeof = __v_FC_component;
  handler.inheritAttrs = false;
  return handler as any;
}

const createComponentHandler = (render: any, options: any) => {
  let renderContext = {
    runtimeFlag: RuntimeFlag.WAIT,
    renderFlag: RenderType.FUNCTION,
    waitComponents: new Set(),
  } as DefineFunctionComponentRenderContext;

  if (typeof render === "object") {
    if (!isFunction(render.loader)) {
      if (process.env.NODE_ENV !== "production")
        warn(
          "The loader function must be a valid function. but Received:",
          render.loader
        );
      return void 0 as any;
    }
    renderContext.renderFlag = RenderType.ASYNC_FUNCTION;
    renderContext = Object.assign(renderContext, render);
  } else {
    renderContext.render = render;
    renderContext.runtimeFlag = RuntimeFlag.FULFILLED;
  }
  const displayName = (renderContext.displayName = getComponentDisplayName(
    renderContext,
    options
  ));
  renderContext.renderError = void 0;
  const handleRender = {
    [displayName](props: any, context: SetupContext) {
      let prevQueue,
        memoizedEffect,
        renderVnode = null;
      const prevFunctionIntanceContext = currentInstanceContext!,
        prevCurrentRuntimeRenderInstanceContext =
          currentRuntimeRenderInstanceContext!;
      defineFunctionComponentContext(props, context);
      if (__DEV__) {
        console.log(currentInstanceContext);
      }
      if (renderContext.renderFlag === RenderType.FUNCTION) {
        memoizedEffect = currentInstanceContext!.memoizedEffect;
        if (memoizedEffect.queue) {
          memoizedEffect.prevLast = memoizedEffect.last ?? null;
          memoizedEffect.last = null;
        }
        prevQueue = memoizedEffect.queue;
      }
      const ctx = currentInstanceContext!;
      if (renderContext.runtimeFlag === RuntimeFlag.WAIT) {
        if (!renderContext.waitComponents.has(ctx)) {
          onUnmounted(() => {
            renderContext.waitComponents.delete(ctx);
          });
        }
        renderContext.waitComponents.add(ctx);
      }
      try {
        switch (renderContext.renderFlag) {
          case RenderType.ERROR:
            renderVnode = handleErrorRender(renderContext);
            break;

          case RenderType.FUNCTION:
            currentRuntimeRenderInstanceContext = currentInstanceContext;
            renderVnode = handleFunctionRender(renderContext, options);
            if (process.env.NODE_ENV !== "production")
              if (prevQueue !== null) {
                if (memoizedEffect!.prevLast !== memoizedEffect!.last) {
                  throw new Error(
                    "The hook for rendering is different from expected. This may be caused by an unexpected premature return statement."
                  );
                }
              }
            break;

          case RenderType.ASYNC_FUNCTION:
            renderVnode = handleAsyncRender(renderContext, options);

          case RenderType.LOADING:
            if (renderContext.renderFlag === RenderType.LOADING) {
              renderVnode = handleLoadingRender(renderContext);
            }
            break;
        }
      } catch (err: any) {
        renderContext.renderFlag = RenderType.ERROR;
        if (process.env.NODE_ENV !== "production") {
          warn("Error during function.component run render :", err);
        }
      } finally {
        if (renderContext.renderFlag === RenderType.FUNCTION) {
          ctx!.firstRenderFlag = 1;
        }
        currentInstanceContext = prevFunctionIntanceContext || null;
        currentRuntimeRenderInstanceContext =
          prevCurrentRuntimeRenderInstanceContext || null;
      }

      return renderVnode ?? null;
    },
  }[displayName].bind(void 0);
  renderContext.handleRender =
    handleRender as DefineFunctionComponentRenderContext["handleRender"];
  return handleRender;
};

const handleErrorRender = (
  renderContext: DefineFunctionComponentRenderContext
) => {
  if (renderContext.error) {
    return h(renderContext.error as any, {
      error: renderContext.renderError,
    });
  }
};

const handleFunctionRender = (
  renderContext: DefineFunctionComponentRenderContext,
  options: DefineFunctionComponentOptions
) => {
  const ctx = currentInstanceContext!;

  switch (renderContext.handleRender.$$typeof) {
    case void 0:
      break;
    default:
      return renderContext.render!(ctx.props);
  }
};

const handleAsyncRender = async (
  renderContext: DefineFunctionComponentRenderContext,
  options: DefineFunctionComponentOptions
) => {
  let promiseRes,
    componentInstance = getCurrentInstance()!;
  if (isSsr) {
    // renderContext.renderFlag = RenderType.FUNCTION;
    // return h(
    //   Suspense,
    //   {},
    //   {
    //     default: {},
    //   }
    // );
  }
  try {
    promiseRes = Promise.resolve(renderContext.loader());
    renderContext.renderFlag = RenderType.LOADING;
    const comp: any = await promiseRes;
    if (componentInstance.isUnmounted) return;

    const resolvedComp =
      comp && (comp.__esModule || comp[Symbol.toStringTag] === "Module")
        ? comp.default
        : comp;

    if (!isFunction(resolvedComp)) {
      if (process.env.NODE_ENV !== "production")
        throw new Error(
          "The resolve must return a valid render function. but received:",
          {
            cause: resolvedComp,
          }
        );
      else throw new Error();
    }

    renderContext.renderFlag = RenderType.FUNCTION;
    renderContext.runtimeFlag = RuntimeFlag.FULFILLED;
    renderContext.render = resolvedComp;
    runRenderContextWaitComponentsAgainRender(renderContext);
  } catch (err: any) {
    if (componentInstance.isUnmounted) return;
    renderContext.renderError = err;
    renderContext.renderFlag = RenderType.ERROR;
    renderContext.runtimeFlag = RuntimeFlag.REJECTED;
    if (process.env.NODE_ENV !== "production") {
      warn(
        "Async component loading failed.",
        "\nError details:",
        err?.cause ? err.toString() : err,
        err?.cause ?? ""
      );
    }
    runRenderContextWaitComponentsAgainRender(renderContext);
  }
};

function runRenderContextWaitComponentsAgainRender(
  renderContext: DefineFunctionComponentRenderContext,
  clearFlag = true
) {
  for (let ctx of renderContext.waitComponents) {
    ctx.hooks.update();
  }
  if (clearFlag) {
    renderContext.waitComponents.clear();
  }
}

const handleLoadingRender = (
  renderContext: DefineFunctionComponentRenderContext
) => {
  if (renderContext.loading) {
    return h(renderContext.loading as any);
  }
};
