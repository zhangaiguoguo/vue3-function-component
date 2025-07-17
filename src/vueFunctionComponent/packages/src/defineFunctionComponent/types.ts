import {
  type ComponentInternalInstance,
  type Slots,
  type EmitsOptions,
  type SetupContext,
  type ComponentObjectPropsOptions,
  type VNodeNormalizedChildren,
  type VNodeChild,
} from "vue";
import type { EffectQueue } from "../hooks/dispatcher";

export type VueFunctionComponentVnode =
  | VNodeNormalizedChildren
  | VNodeChild
  | any;

export type DefineFunctionComponentRender<Props = Record<string, any>> = (
  props: Props
) => VueFunctionComponentVnode;

export type AsyncComponentResolveResult<T> =
  | T
  | {
      default: T;
    };

export type AsyncComponentLoader<T = any> = () => Promise<
  AsyncComponentResolveResult<T>
>;

export type DefineAsyncFunctionComponentErrorRenderProps = {
  error: Error | string | void;
};

export interface DefineAsyncFunctionComponentRenderOptions<
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

// 渲染类型枚举
export enum RenderType {
  FUNCTION = "function",
  ERROR = "error",
  LOADING = "loading",
  ASYNC_FUNCTION = "asyncFunction",
}

export type DefineFunctionComponentRenderContext<Props = Record<string, any>> =
  {
    render: (props: Props) => VueFunctionComponentVnode;
    handleRender: ExoticComponent<Props>;
    displayName: string;
    renderError: DefineAsyncFunctionComponentErrorRenderProps["error"];
    renderResult: VueFunctionComponentVnode;
    renderFlag: RenderType;
  } & DefineAsyncFunctionComponentRenderOptions<Props>;

export type DefineFunctionComponentOptionsProps<
  PropNames extends string = string
> = PropNames[] | ComponentObjectPropsOptions;

export interface DefineFunctionComponentOptions<
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

export interface DefineFunctionComponentInstanceContextHooks {
  update: () => void;
}

export interface ExoticComponent<P = {}> {
  (props: P & VnodeJsxProps): VueFunctionComponentVnode;
  readonly $$typeof: symbol;
}

export interface VnodeJsxProps {
  children?: VueFunctionComponentVnode;
}
