import { VNodeNormalizedChildren, VNodeChild, ComponentObjectPropsOptions, EmitsOptions, Slots, ComponentInternalInstance, SetupContext, DefineProps, ExtractPropTypes } from 'vue';
export { Fragment } from 'vue';
import { LooseRequired, Prettify } from '@vue/shared';

declare enum EffectQueueFlag {
    USE_STATE = 1,
    USE_EFFECT = 2,
    USE_MEMO = 4,
    USE_CALLBACK = 8,
    USE_REDUCER = 16,
    USE_REF = 32,
    USE_LAYOUT_EFFECT = 64,
    USE_TRANSITION = 128,
    USE_ID = 256,
    USE_DEFERRED_VALUE = 512,
    USE_SYNC_EXTERNAL_STORE = 1024,
    USE_IMPERATIVE_HANDLE = 2048,
    USE_CONTEXT = 4096
}

type AnyActionArg = any[];
type ActionDispatch<A extends AnyActionArg> = (...args: A) => void;
type SetStateAction<T> = T | ((prevState: T) => T);
type Dispatch<T> = (value: T) => void;
type EffectCallback = () => void | (() => void);
type StartTransition = (callback: () => any) => any;
type DependencyList = any[];
interface EffectHooks {
    update?: () => void;
    destroy?: () => void;
}
interface EffectQueue<T = any> {
    flag: EffectQueueFlag;
    action?: T;
    next?: EffectQueue<T>;
    create?: EffectCallback;
    deps?: any[] | void | null;
    dispatch?: Dispatch<SetStateAction<T>>;
    hooks?: EffectHooks;
    lane: number;
    memoizedState?: T;
    queue?: EffectQueue[];
    type: 1 | 2;
}

type VueFunctionComponentVnode = VNodeNormalizedChildren | VNodeChild | any;
type DefineFunctionComponentRender<Props = Record<string, any>> = (props: Props) => VueFunctionComponentVnode;
type AsyncComponentResolveResult<T> = T | {
    default: T;
};
type AsyncComponentLoader<T = any> = () => Promise<AsyncComponentResolveResult<T>>;
type DefineAsyncFunctionComponentErrorRenderProps = {
    error: Error | string | void;
};
interface DefineAsyncFunctionComponentRenderOptions<Props = Record<string, any>> {
    loader: AsyncComponentLoader<DefineFunctionComponentRender<Props>>;
    error?: ExoticComponent<DefineAsyncFunctionComponentErrorRenderProps> | ((props: DefineAsyncFunctionComponentErrorRenderProps & VnodeJsxProps) => VueFunctionComponentVnode);
    loading?: ExoticComponent | (() => VueFunctionComponentVnode);
}
type DefineFunctionComponentOptionsProps<PropNames extends string = string> = PropNames[] | ComponentObjectPropsOptions;
interface DefineFunctionComponentOptions<Props = DefineFunctionComponentOptionsProps> {
    name?: string;
    props?: Props;
    emits?: EmitsOptions;
    slots?: Slots;
}
interface DefineFunctionComponentInstanceContext {
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
interface ExoticComponent<P = {}> {
    (props: P & VnodeJsxProps): VueFunctionComponentVnode;
    readonly $$typeof: symbol;
}
interface VnodeJsxProps {
    children?: VueFunctionComponentVnode;
}

type PatchDefineProps<P, PropNames extends string = string> = P extends PropNames[] ? Prettify<Readonly<{
    [key in P[number]]?: any;
}>> : Prettify<Readonly<ExtractPropTypes<P>>>;
type BooleanKey<T, K extends keyof T = keyof T> = K extends any ? [T[K]] extends [boolean | undefined] ? K : never : never;
type ExtractProps<Props = DefineFunctionComponentOptionsProps> = Partial<Omit<DefineFunctionComponentOptions<Props>, "props">> & {
    props: Props;
};
declare function defineFunctionComponent<PropsType, PropsData = DefineProps<LooseRequired<PropsType>, BooleanKey<PropsType>>>(renderOptions: DefineAsyncFunctionComponentRenderOptions<PropsData>): ExoticComponent<PropsData>;
declare function defineFunctionComponent<PropsType, PropsData = DefineProps<LooseRequired<PropsType>, BooleanKey<PropsType>>>(render: DefineFunctionComponentRender<PropsData>): ExoticComponent<PropsData>;
declare function defineFunctionComponent<R extends DefineFunctionComponentRender<PropsData>, O extends ExtractProps, PropsData = PatchDefineProps<O["props"]>>(render: DefineFunctionComponentRender<PropsData>, options: O): ExoticComponent<PropsData>;
declare function defineFunctionComponent<O extends ExtractProps = ExtractProps, PropsData = PatchDefineProps<O["props"]>, RO extends DefineAsyncFunctionComponentRenderOptions<PropsData> = DefineAsyncFunctionComponentRenderOptions<PropsData>>(renderOptions: RO, options: O): ExoticComponent<PropsData>;
declare function defineFunctionComponent<Props = DefineFunctionComponentOptionsProps, PropsData = DefineProps<LooseRequired<Props>, BooleanKey<Props>>, O = DefineFunctionComponentOptions<PropsData>>(render: DefineFunctionComponentRender<PropsData>, options: O): ExoticComponent<PropsData>;
declare function defineFunctionComponent<Props = DefineFunctionComponentOptionsProps, PropsData = DefineProps<LooseRequired<Props>, BooleanKey<Props>>, O = DefineFunctionComponentOptions<PropsData>>(renderOptions: DefineAsyncFunctionComponentRenderOptions<PropsData>, options: O): ExoticComponent<PropsData>;

declare function useContext$1(): SetupContext;
declare const useSetupContext: typeof useContext$1;
declare function useSlots(): SetupContext["slots"];
declare function useAttrs(): SetupContext["attrs"];
declare function useProps(): DefineFunctionComponentInstanceContext["props"];

type Slot = (...args: any[]) => VueFunctionComponentVnode;
declare function defineFunctionSlots(slot: VueFunctionComponentVnode): {
    default: Slot;
};
declare function defineFunctionSlots(slot: Slot): {
    default: Slot;
};
declare function defineFunctionSlots(...args: Slot[]): Slots;

interface ProviderProps<T> {
    value: T;
    children?: VueFunctionComponentVnode;
}
interface ConsumerProps<T> {
    children: (value: T) => VueFunctionComponentVnode;
}
interface ProviderExoticComponent<P> extends ExoticComponent<P> {
}
type Consumer<T> = ExoticComponent<ConsumerProps<T>>;
type Provider<T> = ProviderExoticComponent<ProviderProps<T>>;
interface Context<T> extends Provider<T> {
    Provider: Provider<T>;
    Consumer: Consumer<T>;
}
declare function createContext<T>(defaultValue: T): Context<T>;

declare function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
declare function useState<S = undefined>(): [
    S | undefined,
    Dispatch<SetStateAction<S | undefined>>
];
declare function useId(): string;
declare function useCallback<T extends (...args: any[]) => any>(fn: T, dependencies: DependencyList): T;
declare function useEffect(setup: EffectCallback, dependencies?: DependencyList): void;
declare function useLayoutEffect(setup: EffectCallback, dependencies?: DependencyList): void;
declare function useMemo<T>(calculateValue: () => T, dependencies: DependencyList): T;
declare function useReducer<S, A extends AnyActionArg>(reducer: (prevState: S, ...args: A) => S, initialState: S): [S, ActionDispatch<A>];
declare function useReducer<S, I, A extends AnyActionArg>(reducer: (prevState: S, ...args: A) => S, initialArg: I, init: (initialArg: I) => S): [S, ActionDispatch<A>];
declare function useSyncExternalStore<Snapshot>(subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => Snapshot, getServerSnapshot?: () => Snapshot): Snapshot;
declare function useDeferredValue<T>(value: T, initialValue?: T): T;
declare function startTransition(scope: () => any): void;
declare function useRef(): {
    current: void;
};
declare function useRef<T>(initialValue: T): {
    current: T;
};
declare function useImperativeHandle(ref: {
    current: any;
}, createHandle: () => any, dependencies?: DependencyList): void;
declare function useTransition(): [boolean, StartTransition];
declare function useContext<T>(context: Context<T>): T;

declare function onBeforeUnmount(fn: () => any): void;
declare function onUnMounted(fn: () => any): void;

declare function h(type: any, propsOrChildren: any, children: any): any;
declare function createJsxFunctionComponent(type: any, ...args: any[]): any;
declare function markRegularFunctionComponent(type: (...args: any[]) => any): (...args: any[]) => any;

export { createContext, createJsxFunctionComponent, defineFunctionComponent, defineFunctionSlots, h, markRegularFunctionComponent, onBeforeUnmount, onUnMounted, startTransition, useAttrs, useCallback, useContext, useDeferredValue, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useProps, useReducer, useRef, useSetupContext, useSlots, useState, useSyncExternalStore, useTransition };
export type { Context };
