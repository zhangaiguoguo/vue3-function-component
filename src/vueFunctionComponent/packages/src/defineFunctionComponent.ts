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
} from "vue";
import { isFunction, isObject2 } from "../shared";
import { onMounted, onUnmounted } from "./lifeCycle";
import { type EffectQueue } from "./hooks";

export type DefineFunctionComponentRender = ((
  props: Record<string, any>,
  context: SetupContext
) => VNode | VNode[] | any) & {
  [__v_FC_component]?: boolean;
};

type DefineAsyncFunctionComponentRenderOptions = {
  loader: () => Promise<DefineFunctionComponentRender>;
  error?: (
    props: {
      error: Error | string | void;
    } & ComponentInternalInstance["props"],
    context: SetupContext
  ) => ReturnType<DefineFunctionComponentRender>;
  loading?: DefineFunctionComponentRender;
};

interface DefineFunctionComponentOptions {
  name?: string;
  props?: ComponentInternalInstance["props"];
  emits?: EmitsOptions;
  slots?: Slots;
}

export interface DefineFunctionComponentInstanceContext {
  parent: DefineFunctionComponentInstanceContext | null;
  instance: ComponentInternalInstance | null;
  effect?: EffectQueue | null;
  exposed?: Record<string, any>;
  props: ComponentInternalInstance["props"];
  context: SetupContext;
  hooks: DefineFunctionComponentInstanceContextHooks;
  uid?: number;
}

interface DefineFunctionComponentInstanceContextHooks {
  update: Function;
}

const __v_FC_component = "__v_FC_component";

const functionComponentIntanceMap = new WeakMap<
  ComponentInternalInstance,
  DefineFunctionComponentInstanceContext
>();
let currentInstanceContext: DefineFunctionComponentInstanceContext | null =
  null;

export function getCurrentFunctionComponentInstance() {
  if (!currentInstanceContext && process.env.NODE_ENV !== "production") {
    warn(
      "getCurrentFunctionComponentInstance",
      "not find current function instance"
    );
    return;
  }
  return currentInstanceContext;
}

function defineFunctionComponentContext() {
  const instance = getCurrentInstance() as ComponentInternalInstance;
  if (!instance && process.env.NODE_ENV !== "production") {
    warn(
      "defineFunctionComponentContext",
      "not find current function instance"
    );
    return;
  }
  let flag = false;
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
          update: () => {
            const e = context.instance?.effect;
            if (e) {
              e.dirty = true;
              if (e.scheduler) {
                e.scheduler();
              } else {
                context.instance?.update();
              }
            }
          }
        },
      } as any)
    );
    flag = true;
  }
  context.parent = functionComponentIntanceMap.get(instance.parent!) ?? null;
  currentInstanceContext = context;
  if (flag) {
    onUnmounted(() => {
      functionComponentIntanceMap.delete(instance);
    });
  }
}

enum DefineFunctionComponentRenderType {
  FUNCTION = "function",
  ERROR = "error",
  LOADING = "loading",
  ASYNC_FUNCTION = "asyncFunction",
}

/**
 *
 * @example
 * ```tsx
 * const A = defineFunctionComponent(() => 1)
 *
 * const B = defineFunctionComponent({
 *  loader(){
 *    return Proimse.resolve(() => 2)
 *  },
 *  loading:() => <div>loading...</div>,
 *  error:({error}) => error
 * })
 *
 * const C = defineFunctionComponent((props,{attrs,slots,expose}) => props.msg,{
 *   name:"CustomName",
 *   props:{
 *    msg:{}
 *   }
 * })
 *
 * ```
 *
 * @param render - function or object
 * @returns vueRenderFunction
 */
export function defineFunctionComponent(
  render:
    | DefineFunctionComponentRender
    | DefineAsyncFunctionComponentRenderOptions,
  options?: DefineFunctionComponentOptions
) {
  if (
    !isFunction(render) &&
    !isObject2(render) &&
    process.env.NODE_ENV !== "production"
  ) {
    warn(
      "defineFunctionComponent: The first argument should be a render function or an object with a 'functionComponent' property. but Received:",
      render
    );
    return;
  }
  const renderOptions = render as DefineAsyncFunctionComponentRenderOptions;

  let renderFlag = DefineFunctionComponentRenderType.FUNCTION;
  if (typeof render === "object") {
    if (!isFunction(render.loader) && process.env.NODE_ENV !== "production") {
      warn(
        "defineFunctionComponent: The loader function must be a valid function. but Received:",
        render.loader
      );
      return;
    }
    render = renderOptions.loader;
    renderFlag = DefineFunctionComponentRenderType.ASYNC_FUNCTION;
  }

  if (render[__v_FC_component]) return render;

  const componentOptions = (options ?? {
    props: (render as any).props,
    emits: (render as any).emits,
    slots: (render as any).slots,
  }) as DefineFunctionComponentOptions;

  const componentFCName =
    (componentOptions && componentOptions.name) || render.name;

  const instanceRender = ref<DefineFunctionComponentRender | null>(render);

  let renderError: Error | string | void;

  const handlers = {
    [componentFCName](
      props: ComponentInternalInstance["props"],
      context: SetupContext
    ) {
      let renderResult: any = null;
      const prevFunctionIntanceContext =
        currentInstanceContext as DefineFunctionComponentInstanceContext;

      defineFunctionComponentContext();

      console.log(currentInstanceContext);
      if (currentInstanceContext?.effect) {
        currentInstanceContext.effect.prevLast =
          currentInstanceContext.effect.last ?? null;
        currentInstanceContext.effect.last = null;
      }
      const prevEffect = currentInstanceContext!.effect;
      if (currentInstanceContext!.uid !== void 0) {
        currentInstanceContext!.uid = 0;
      }
      try {
        const renderFn = toValue(instanceRender);
        switch (renderFlag) {
          case DefineFunctionComponentRenderType.ERROR:
            if (renderOptions.error) {
              renderResult = h(renderOptions.error as any, {
                error: renderError,
              });
            }
            break;
          case DefineFunctionComponentRenderType.FUNCTION:
            renderResult = renderFn!(props, context);
            break;
          case DefineFunctionComponentRenderType.ASYNC_FUNCTION:
            const promiseRes = Promise.resolve((renderFn as any)());
            renderFlag = DefineFunctionComponentRenderType.LOADING;
            promiseRes
              .then((render: DefineFunctionComponentRender) => {
                if (!isFunction(render)) {
                  if (process.env.NODE_ENV !== "production") {
                    warn(
                      "defineFunctionComponent(asyncComponent): The promise reslove must return a valid render function. but received:",
                      render
                    );
                  }
                  instanceRender.value = null;
                  throw new Error();
                }
                renderFlag = DefineFunctionComponentRenderType.FUNCTION;
                instanceRender.value = render;
              })
              .catch((err: any) => {
                renderError = err;
                renderFlag = DefineFunctionComponentRenderType.ERROR;
                instanceRender.value = null;
                if (
                  !renderOptions.error &&
                  process.env.NODE_ENV !== "production"
                ) {
                  warn(
                    "defineFunctionComponent(asyncComponent) render function error",
                    err.toString()
                  );
                }
              });
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
        if (currentInstanceContext!.effect === void 0) {
          currentInstanceContext!.effect ??= null;
        } else {
          if (prevEffect !== void 0) {
            if (
              currentInstanceContext!.effect?.prevLast !==
              currentInstanceContext!.effect?.last
            ) {
              throw new Error(
                "The hook for rendering is different from expected. This may be caused by an unexpected premature return statement."
              );
            }
          }
        }
      } catch (err: any) {
        if (process.env.NODE_ENV !== "production") {
          warn("defineFunctionComponent render function error", err);
        }
        renderResult = null;
      } finally {
        currentInstanceContext = prevFunctionIntanceContext || null;
      }

      return renderResult;
    },
  };

  const handler = handlers[componentFCName] as DefineFunctionComponentRender;

  handler[__v_FC_component] = true;

  Object.assign(handler, {
    props: componentOptions.props,
    emits: componentOptions.emits,
    slots: componentOptions.slots,
  });
  return handler;
}
