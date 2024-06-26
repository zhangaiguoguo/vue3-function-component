import type {
    ComponentPropsOptions,
    EmitsOptions,
    Ref,
    SetupContext,
    VNode,
    VNodeNormalizedChildren,
    ComponentInternalInstance,
} from "vue";
import {
    EffectScope,
    customRef,
    Fragment,
    getCurrentInstance,
    isRef, isVNode,
    nextTick,
    ref,
    toValue,
    warn,
} from "vue";
import { is, isArray, isFunction, transformArray } from "@/hooks/utils";
import { JSX } from "vue/jsx-runtime";
import { ComponentPublicInstance } from "@vue/runtime-core";

const modelPropsMsp = new WeakMap();

export function useIsProps(key: string, instance?: any) {
    instance = instance || getCurrentInstance();
    if (key in instance.props) {
        return true;
    }
    return false;
}

interface ComponentInternalInstance2 extends ComponentInternalInstance {
    emitsOptions: any;
    parent: ComponentInternalInstance2;
    ctx: {
        [key: string]: any
    };
}

function useSetModelProp(key: string, value: any, instance: ComponentInternalInstance2) {
    const emitEventKey = "update:" + key;
    const emitsOptions = instance.emitsOptions;
    if (emitsOptions && emitsOptions[emitEventKey]) {
        instance.emit(emitEventKey, value);
    } else {
        if (useIsProps(key, instance)) {
            useSetModelProp(key, value, instance.parent);
        } else if (instance.ctx && key in instance.ctx) {
            instance.ctx[key] = value;
        } else if (instance.exposeProxy && key in instance.exposeProxy) {
            instance.exposeProxy[key] = value;
        }
    }
}

export function useModelProps(key: string) {
    const proxy: any = getCurrentInstance();
    if (proxy) {
        const weakMap = modelPropsMsp.get(proxy) || modelPropsMsp.set(proxy, new Map()).get(proxy);
        if (weakMap.has(key)) {
            return weakMap.get(key);
        }
        const _ref = customRef(function(track, trigger) {
            return {
                get() {
                    track();
                    return proxy.props[key];
                },
                set(v) {
                    useSetModelProp(key, v, proxy);
                    trigger();
                },
            };
        });
        weakMap.set(key, _ref);
        return _ref;
    }
}

export type taskItemFn = () => StateOption

export interface StateOption {
    refId: number,
    state: StateItemState[];
    effects: effectOption[];
    effectIndex: number
    stateIndex: number
    flag: boolean
    gate?: boolean
    updateScheduler?: () => void,
    scheduler?: Function,
    updateFlag: Ref<boolean>
}

const tasks: taskItemFn[] = [];

let currentState: StateOption | null = null;

let currentScheduler: Function | null = null;

function createState() {
    let _gate = false;

    const currentState: StateOption = {
        refId: 0,
        state: [],
        effects: [],
        effectIndex: 0,
        stateIndex: 0,
        flag: true,
        updateScheduler: () => {
            currentState.updateFlag.value = !currentState.updateFlag.value;
        },
        updateFlag: ref(false),
    };

    return def(currentState, "gate", {
        get() {
            return _gate;
        },
        set(this: StateOption, v: boolean) {
            _gate = v;
            if (this.flag) {
                if (v) {
                    this.flag = true;
                    this.refId = 0;
                    this.stateIndex = 0;
                    this.effectIndex = 0;
                    currentState.updateFlag.value;
                } else {
                    if (this.stateIndex !== this.state.length || this.effectIndex !== this.effects.length) {
                        try {
                            throw new Error("error Rendered fewer hooks than expected. This may be caused by an accidental early return statement.");
                        } catch (err) {
                            throw new Error((err as any).message);
                        } finally {
                            this.flag = false;
                        }
                    }
                }
            }
        },
    })[0];
}

const def = <T, K extends keyof T>(obj: T, key: K | PropertyKey, options?: PropertyDescriptor): [T, Function] => {
    Object.defineProperty(obj, key, {
        configurable: true,
        enumerable: false,
        ...options || {},
    });
    return [obj, def];
};

function createSelfState(dep?: taskItemFn): taskItemFn {

    if (tasks.some((cb) => cb === dep)) {
        return tasks.find((cb) => cb === dep) as taskItemFn;
    }
    const state = createState();

    return tasks[tasks.push(() => state) - 1];
}

function createCacheEffectTask() {
    return createSelfState()();
}

function openExamineStateTasks() {
    return examineStateTasks();
}

function last(target: { [name: number | string | symbol]: any, length: number }) {
    return target[target.length - 1];
}

interface StateItemState {
    initValue: any,
    history: any[],
    options?: StateItemStateOption
    scheduler?: <T>(arg: T) => Promise<any> | null,
    _scheduler?: Function | null,
    add: <T>(v: T) => void,
    value?: any
}

function _createState<T>(target: T, options: StateItemStateOption) {
    let _isRef: null | boolean = null;
    const state: StateItemState = {
        initValue: target,
        history: [target],
        options: options || null,
        add(v: any) {
            const lastCurrentState = last(this.history);
            const setState = typeof v === "function" ? v : () => v;
            if (_isRef !== null ? _isRef : (_isRef = isRef(lastCurrentState))) {
                lastCurrentState.value = setState(state.value);

            } else {
                if (this.history.length > 2) {
                    this.history.splice(this.history.length - 2, 1);
                }
                this.history.push(setState(state.value) as any);
            }
        },
    };
    def(state, "value", {
        get(this: StateItemState) {
            if (this.options && this.options.isToRef) {
                return toRefValue(last(state.history));
            }
            return last(this.history);
        },
    });
    return state;
}

function examineStateTasks() {
    const _currentState = currentState as any;
    const currentRunStateCount = _currentState.stateIndex;
    _currentState.gate = true;
    return {
        stop() {
            _currentState.gate = false;
        },
        init() {
            _currentState.stateIndex = currentRunStateCount;
        },
    };
}


function _judgeCurrentState() {
    if (!currentState || !currentState.gate) {
        warn("Invalid hook call. Hooks can only be called inside of the body of a function component.");
        return true;
    }
    return false;
}

interface componentProps {
    updateScheduler?: Function | null;
}

interface componentProps2 extends componentProps {
}

type ComponentContext = {
    slots: object,
    emit: (k: string, ...args: any[]) => void,
    attrs: object,
    props: object
}

let currentRenderComponentContext: null | ComponentContext = null;

const DEFINEMEMORENDER = "DefineMemoRender";

type ScopeTaskStateSchedulerRenderTs = ((...args: any) => any) & {
    shargFlag?: any;
    runCount?: any;
    type?: "DefineMemoRender",
    props?: any,
    emits?: any
};

function setCurrentState(row: StateOption | null) {
    currentState = row || null;
}

function getCurrentState() {
    return currentState;
}

function scopeTaskStateScheduler(renderHandler: ScopeTaskStateSchedulerRenderTs) {
    let _: taskItemFn | null = null;
    let oldProps: componentProps2 | null = null;
    const componentFuntionName = renderHandler ? renderHandler.name : "defineMemoRender";
    const componentVnode = {
        [componentFuntionName]: function(props: componentProps2, context: SetupContext<any>) {
            const parentCurrentState = currentState;
            const parentCurrentRenderComponentContext: any = currentRenderComponentContext;
            currentRenderComponentContext = {
                ...context,
                props: props,
            };
            let result = null;

            if (oldProps !== props) {

                currentState = (_ = createSelfState())();
            } else {

                currentState = (_ as taskItemFn)();
            }

            oldProps = props;

            const resultExamineStateTasks = examineStateTasks();

            const isRunMemoFlag = isMemo(renderHandler) ? getMemoRunCount(renderHandler) : null;

            try {
                result = renderHandler(props, context);
                if (isRunMemoFlag !== null) {
                    if (isRunMemoFlag === getMemoRunCount(renderHandler)) {

                        resultExamineStateTasks.init();
                    }
                }
                resultExamineStateTasks.stop();
            } catch (err: any) {

                warn(err.message);
            } finally {

                currentState = parentCurrentState;

                currentRenderComponentContext = parentCurrentRenderComponentContext;
            }

            return result;
        },
    };

    {
        const _renderHandler = renderHandler as any;
        const DefineMemoRender = componentVnode[componentFuntionName] as any;

        DefineMemoRender.props = _renderHandler.props;

        DefineMemoRender.emits = _renderHandler.emits;

        DefineMemoRender.type = DEFINEMEMORENDER;

        DefineMemoRender.cursor = renderHandler;
    }

    return componentVnode[componentFuntionName];
}

function defineMemoRender<T extends ScopeTaskStateSchedulerRenderTs>(renderHandler: T) {
    if (!isFunction(renderHandler)) {
        return renderHandler;
    }
    if (renderHandler.type === DEFINEMEMORENDER) return renderHandler;
    return scopeTaskStateScheduler(renderHandler);
}

type StateItemStateOption = {
    scheduler?: Function,
    isToRef?: boolean
}

type createCurrentStateResult = [any, <T>(v: T) => void]

export function toRefValue(target: any) {
    return isRef(target) ? toValue(target) : target;
}

function createCurrentState<T>(initState: T | (() => T), options: StateItemStateOption = {
    isToRef: true,
}) {
    let returnResult;
    if (currentState) {
        const _currentState = currentState;
        try {
            const _initState = initState;
            initState = (typeof initState === "function" ? initState : () => _initState) as (() => any);
            const currentSub = _currentState.stateIndex;
            const state = _currentState.state;
            let current = state[currentSub] || state[state.push(_createState(options.isToRef ? ref(initState()) : initState(), options)) - 1];
            const _options = current.options || options;
            current._scheduler = current._scheduler || (_options && _options.scheduler) || currentScheduler;
            returnResult = [current.value, (current.scheduler || (current.scheduler = async <T>(value: T) => {
                if (!is(value, current.value)) {
                    let isSetStateFlag: boolean | Function | void = true;
                    if (current._scheduler) {
                        isSetStateFlag = await current._scheduler();
                    }
                    if (isSetStateFlag || isSetStateFlag === void 0) {
                        current.add(value);
                        if (isFunction(isSetStateFlag)) {
                            (isSetStateFlag as Function)();
                        }
                    }
                }
            }))];
        } finally {
            _currentState.stateIndex++;
        }
    }
    return returnResult as unknown as createCurrentStateResult;
}

interface effectOption {
    scheduler: (arg: effectArgOption) => void,
    resultScheduler: (() => void) | null
    deps: effectArgDepTs | null
    init: boolean
}

interface effectArgOption {
    callback: effectArgTs,
    deps: effectArgDepTs
}

type createCurrentEffectScheduleTs = (arg: () => boolean, arg2: effectArgOption, arg3: effectOption[], arg4: number, arg5: StateOption) => void


function createCurrentEffect(callback: effectArgTs, schedule: createCurrentEffectScheduleTs, deps: effectArgDepTs) {
    if (currentState) {
        try {
            const _currentState = currentState;
            const currentSub = _currentState.effectIndex;
            const effects = _currentState.effects;
            if (effects.length <= currentSub || effects.length === 0) {
                effects.push({
                    scheduler(options: effectArgOption) {
                        if (_currentState.effectIndex >= currentSub && _currentState.flag) {
                            effects[currentSub].deps = options.deps;
                            effects[currentSub].init = true;
                            schedule(() => _currentState.flag, options, effects, currentSub, _currentState);
                        }
                    },
                    resultScheduler: null,
                    deps: null,
                    init: false,
                });
            }
            if ((function() {
                if (!effects[currentSub].init) {
                    return true;
                }
                const oldDeps = effects[currentSub].deps as any;
                const newDeps = deps as any;
                return typeof newDeps === "function" ? newDeps() : oldDeps == null || oldDeps.length && (newDeps.length !== (oldDeps && oldDeps.length) || (oldDeps && oldDeps.some((dep: any, index: number) => (newDeps[index]) !== (dep))));
            })()) {

                effects[currentSub].scheduler({
                    callback,
                    deps,
                });
            }

        } finally {
            currentState.effectIndex++;
        }
    }
}

function dispatchEffectResultScheduler(effect: effectOption) {
    if (effect && effect.resultScheduler) {
        effect.resultScheduler();
    }
}

function setEffectResultScheduler(effect: effectOption, result: (() => void) | (() => boolean) | void) {
    if (effect) {
        effect.resultScheduler = result as any;
    }
}

function useEffectPre(target: effectArgTs, deps: effectArgDepTs) {
    _judgeCurrentState();
    createCurrentEffect(target, (validate, options, effects, index) => {
        const currentEffect = effects[index];
        const _callback = options.callback;
        dispatchEffectResultScheduler(currentEffect);
        nextTick(() => {
            if (!validate()) return;
            setEffectResultScheduler(currentEffect, _callback());
        }).then(() => void 0);
    }, deps);
}

type effectArgTs = () => (() => void) | void;

type effectArgDepTs = any[] | (() => boolean) | void;

function useEffectSync(target: effectArgTs, deps: effectArgDepTs) {
    _judgeCurrentState();
    createCurrentEffect(target, (validate, options, effects, index) => {
        if (!validate()) return;
        const currentEffect = effects[index];
        const _callback = options.callback;
        dispatchEffectResultScheduler(currentEffect);
        setEffectResultScheduler(currentEffect, _callback());
    }, deps);
}

function useState<T>(target?: T) {
    _judgeCurrentState();
    return createCurrentState(target, {
        isToRef: true,
    });
}

function useUpdate() {
    _judgeCurrentState();
    const updateScheduler = currentState && currentState.updateScheduler;
    return () => {
        updateScheduler && updateScheduler();
    };
}

function useEffect(callback: effectArgTs, deps?: effectArgDepTs) {
    return useEffectPre(callback, deps);
}

function watchEffect<T>(target: T, deps: effectArgDepTs, scheduler = <T>(v: T) => v) {
    _judgeCurrentState();
    let [result, setResult] = createCurrentState(null, {
        isToRef: false,
    }) as createCurrentStateResult;
    useEffectSync(() => {
        setResult(result = scheduler(target));
    }, deps);
    return result;
}

function useCallback(target: Function, deps: effectArgDepTs) {
    return watchEffect(target, deps);
}

function useMemo(target: Function, deps?: effectArgDepTs) {
    return watchEffect(target, deps, (v) => (v as Function)());
}

function useId() {
    _judgeCurrentState();
    return `:vid${currentState && ++currentState.refId}`;
}

function useSyncExternalStore(subscribe: Function, getSnapshot: Function) {
    _judgeCurrentState();
    const _currentState = currentState as StateOption;
    let [dispatcher, setDispatcher] = createCurrentState(null, {
        scheduler: () => void 0,
        isToRef: true,
    }) as createCurrentStateResult;
    useEffectPre(() => {
        if (typeof dispatcher === "function") {
            dispatcher();
        }
        const __ = () => {
            (_currentState.scheduler as Function)();
        };
        setDispatcher(dispatcher = subscribe(__));
    }, [subscribe]);

    return getSnapshot();
}

function useLayoutEffect<T extends effectArgTs, T2 extends effectArgDepTs>(target: T, deps: T2) {
    return useEffectPre(target, deps);
}

const useReducerOptions = {
    isToRef: false,
};

// @ts-ignore
function useReducer<TT, TT2>(reducer: <T>(arg: T, arg2: object) => T, initialArg: TT2, init?: (v: TT2) => any): [TT2, (arg: object) => void] | null {
    _judgeCurrentState();
    const [isInit, setInit] = createCurrentState(false, useReducerOptions) as createCurrentStateResult;
    if (typeof init === "function" && !isInit) {
        initialArg = init(initialArg);
        setInit(true);
    }
    let [state, setState] = createCurrentState(initialArg) as createCurrentStateResult;
    return [state, useCallback((target: object) => {
        typeof target === "object" && setState(reducer(state, target));
    }, [state])];
}

type MemoNextFun = (newProps: object, oldPorps: object | null) => boolean

function memoDefaultDiffProps(newProps: object, oldProps: object | null) {
    try {
        if (oldProps === null) {
            return true;
        } else {
            for (let w in newProps) {
                if (!is((oldProps as any)[w], (newProps as any)[w])) {
                    return true;
                }
            }
        }
    } catch {
    }
    return false;
}

const memoFragment = Symbol("memoFragment");

function isMemo(target: { shargFlag?: any }) {
    return target.shargFlag === memoFragment;
}

function getMemoRunCount(target: { runCount?: any }) {
    return target.runCount;
}

function memo(component: Function, callback?: MemoNextFun) {
    let result: any = null;
    let oldProps: any = null;
    const nextCallback = typeof callback === "function" ? callback : memoDefaultDiffProps;

    const Component = {
        [component.name]: function(props: object, context: SetupContext<object>) {
            if (nextCallback(props, oldProps)) {
                oldProps = { ...props };
                result = component(props, context);
                (Component[component.name] as any).runCount++;
            }
            return result;
        },
    };

    (Component[component.name] as any).runCount = 0;

    (Component[component.name] as any).shargFlag = memoFragment;

    return defineMemoRender(Component[component.name]);
}

function useRef(target: any = null) {
    const [get] = createCurrentState({
        value: target, __v_isRef: true,
    }, {
        isToRef: false,
    }) as any;
    return get;
}

export type slotResultDto = <T>(ctx: T) => JSX.Element | VNodeNormalizedChildren

export type IsFunction<T> = T extends slotResultDto ? true : false;

export type SlotsDto = {
    [name: string]: slotResultDto
}

function useDefineSlot<T extends SlotsDto, K extends keyof T & { [P in keyof T]: IsFunction<T[P]> extends true ? P : never }[keyof T], C>(slots: T, name: K, ctx?: C) {
    return isFunction(slots[name]) ? slots[name](ctx) : slots[name];
}

type MapSlotsResult<K> = { [name in keyof K]: JSX.Element | any }

function useDefineSlots<T extends SlotsDto, K extends string | Array<string>>(slots: T, names: K, ctx?: object) {
    const l = arguments.length;
    if (l < 3) {
        ctx = {};
    }
    const _names = transformArray(names);
    const _slots: any | MapSlotsResult<K> = {};
    const isCtxObject = typeof ctx === "object" && ctx !== null;
    for (let name of _names) {
        _slots[name] = useDefineSlot(slots, name, isCtxObject ? (ctx as any)[name] : ctx);
    }
    return _slots;
}

type KeysOfComponentContext = keyof ComponentContext;

function useComponentContextValue<T extends KeysOfComponentContext>(name?: T) {
    if (_judgeCurrentState() || !currentRenderComponentContext) {
        return null;
    }
    return (arguments.length && name ? currentRenderComponentContext[name] as ComponentContext[T] : currentRenderComponentContext as ComponentContext) || null;
}

function useSlots2() {
    return useComponentContextValue("slots");
}

function useContext2(): ComponentContext {
    return useComponentContextValue() as ComponentContext;
}

function useAttrs2() {
    return useComponentContextValue("attrs");
}

function useEmit() {
    return useComponentContextValue("emit");
}

function useProps() {
    return useComponentContextValue("props") as any;
}

function transformVNodeFunctionComponentTypeWithMemo<T extends VNodeNormalizedChildren>(vnode: T): T {
    if (!vnode) {
        return vnode;
    }
    if (isArray(vnode) ? !vnode.length : true) {
        return vnode;
    }
    return (vnode as any[]).map((node: VNode) => {
        const type: any = node.type;
        if (isFunction(type) && (type as { type: string }).type !== DEFINEMEMORENDER) {
            node.type = defineMemoRender(type as () => any) as any;
        } else if (isFunction(type.render) && (type.render as { type: string }).type !== DEFINEMEMORENDER) {
            node.type = {
                ...type,
                render: defineMemoRender(function(this: any, ...args: any) {
                    return type.render.call(this, ...args);
                }),
            };
            console.log(node.type);

        }

        return node;
    }) as T;
}


function isSameMemoComponentType<T extends Function & { type: { cursor: any } }, T2 extends T>(n: T, n2: T2) {
    if (isFunction(n.type) && isFunction(n2.type)) {

        return (n.type.cursor === n2.type.cursor || n.type.cursor === n2.type);
    } else {
        return false;
    }
}

function isFragmentNode(nodes: VNode[] | null) {

    if (nodes) {
        for (let i = 0; i < nodes.length; i++) {
            transformMemoComponent(nodes[i]);
        }
    }

}

function transformMemoComponent(node: VNode) {
    if (isFunction(node.type)) {
        node.type = defineMemoRender(node.type as any);
    } else if (isFragment(node)) {
        isFragmentNode(node.children as any);
    }
}

function isFragment(node: VNode) {
    return node.type === Fragment;
}

function diffTransformMemoComponent(n: any, n2: any) {
    if (!n2) {
        return isFragmentNode(n);
    }
    for (let i = 0; i < n.length; i++) {

        let n1IsFragment = false;

        if (!n[i] || !n2[i] || (n2[i].key !== n[i].key)) {
            transformMemoComponent(n[i]);
            continue;
        }
        if (isSameMemoComponentType(n2[i], n[i])) {

            n[i].type = n2[i].type;
        } else if (n1IsFragment = isFragment(n[i]) && isFragment(n2[i])) {

            diffTransformMemoComponent(n[i].children, n2[i].children);
        } else if (n1IsFragment) {
            transformMemoComponent(n[i]);
        }
    }
}

const DefineMemoComponent = {
    name: "DefineMemoComponent",
    setup(_props: any, { slots }: any) {
        return defineMemoRender(function DefineMemoComponent2() {

            let defaultSlot = (useDefineSlot(slots as { default: () => any }, "default") as any);

            let [Component, setCurrentdefaultSlot] = createCurrentState(null, {
                isToRef: false,
            }) as any;

            if (Component !== defaultSlot) {
                if (!Component && defaultSlot) {
                    for (let i = 0; i < defaultSlot.length; i++) {
                        transformMemoComponent(defaultSlot[i]);
                    }
                } else {
                    diffTransformMemoComponent(defaultSlot, Component);
                }
                Component = defaultSlot;

                setCurrentdefaultSlot(defaultSlot);

            }

            return (Component);
        });
    },
};

function useImperativeHandle(ref: Ref<any>, stateCallback: () => any, deps?: effectArgDepTs) {
    useEffect(() => {
        ref.value = stateCallback();
    }, deps);
}

export function useDelayedRender(num: number): (arg: number) => Boolean {
    let currentFrame = ref(0);

    function run(frame: number) {
        if (currentFrame.value + 1 > num || frame > currentFrame.value) return;
        const _currentFrame = currentFrame.value;
        requestAnimationFrame(() => {
            if (currentFrame.value !== _currentFrame) {
                return;
            }
            currentFrame.value++;
        });
    }

    return (frame: number) => {
        run(frame);
        return currentFrame.value >= frame;
    };
}

const instanceCacheMps = new WeakMap();

interface CurrentCacheInstanceTs {
    parent: CurrentCacheInstanceTs | null;
    instance: ComponentInternalInstance | null;
    effect: StateOption | null;
    exposed?: Record<string, any>;
    ref?: any;
}


const currentCacheInstance: CurrentCacheInstanceTs[] = [];

interface CurrentInstanceContextDto {
    proxy: {
        $el: object | null
    } | null;
}

let currentInstanceContext: CurrentInstanceContextDto | null = null;

function getCurrentInstance2() {
    return currentInstanceContext || getCurrentInstance();
}

function setCurrentInstanceContext(v: CurrentInstanceContextDto) {
    currentInstanceContext = v;
}

function useCacheEntrance() {
    const instance = getCurrentInstance2();
    if (!instance) {
        warn("useCacheEntrance", "not find currentInstance");
        return;
    }
    if (!instanceCacheMps.has(instance)) {
        instanceCacheMps.set(instance, {
            parent: null,
            instance: instance,
        });
    }
    const row = instanceCacheMps.get(instance);
    row.parent = currentCacheInstance.at(-1) || null;
    currentCacheInstance.push(row);
}

function getCurrentCacheInstance() {
    if (!currentCacheInstance.length) {
        warn("getCurrentCacheInstance", "not find currentCacheInstance");
        return;
    }
    return currentCacheInstance.at(-1);
}

function closeCacheEntrance() {
    if (currentCacheInstance.length) {
        const row = currentCacheInstance[currentCacheInstance.length - 1];
        row.parent = null;
        currentCacheInstance.pop();
    }
}

interface DefineCacheFCOptions {
    name?: string;
    props?: ComponentPropsOptions,
    emits?: EmitsOptions
    fallback?: Function
    loading?: Function
    error?: Function
}

function patchDefineCacheFCOption<F extends Function, O extends DefineCacheFCOptions, K extends keyof O>(fn: F, options: O, key: K) {
    if (key in options) {
        // @ts-ignore
        fn[key] = options[key];
    }
}

function isPromise(target: any) {
    if (target && isFunction(target.then)) {
        return true;
    }
    return false;
}

const __v_FC_component = "__v_FC_component";

type DefineFunctionComputedOptionsRenderResolveResponse = (props?: ComponentPropsOptions, context?: SetupContext, ...args: any[]) => VNode | VNode[] | any

type DefineFunctionComputedOptions = {
    component: (...args: any) => Promise<DefineFunctionComputedOptionsRenderResolveResponse | any> | Function,
    error?: DefineFunctionComputedOptionsRenderResolveResponse
    loading?: DefineFunctionComputedOptionsRenderResolveResponse
}

function defineFunctionErrorDefault() {
    return null;
}

function defineCacheFC(callback: DefineFunctionComputedOptionsRenderResolveResponse | DefineFunctionComputedOptions, options?: DefineCacheFCOptions | string) {

    const functionOptions = callback as DefineFunctionComputedOptions;

    if (typeof callback === "object") {
        // @ts-ignore
        callback = (callback.component as unknown as DefineFunctionComputedOptionsRenderResolveResponse);
    }

    if (callback == null) {
        // @ts-ignore
        callback = defineFunctionErrorDefault;
    }

    if (callback[__v_FC_component]) return callback;

    const options2 = ((typeof options === "string" ? { name: options } : options)) as DefineCacheFCOptions;

    const componentFCName = options2 && options2.name || callback.name;

    const functionComponent = ref<DefineFunctionComputedOptionsRenderResolveResponse>(callback);

    let returnResult: any, resultExamineStateTasks: any;

    let isAsyncRenderFlag = false;

    const handlers = {

        [componentFCName](props: ComponentPropsOptions, context: SetupContext, ...args: any[]) {

            useCacheEntrance();

            const parentCurrentState = getCurrentState();

            const parentCurrentRenderComponentContext: any = currentRenderComponentContext;

            currentRenderComponentContext = {
                ...context,
                props: props,
            };

            const cacheInstance = getCurrentCacheInstance() as CurrentCacheInstanceTs;

            try {

                setCurrentState(cacheInstance.effect || (cacheInstance.effect = createCacheEffectTask()));

                resultExamineStateTasks = openExamineStateTasks();

                returnResult = toValue(functionComponent.value(props, context, ...args));

                if ((isAsyncRenderFlag = isPromise(returnResult))) {

                    returnResult.then((resolveRes: DefineFunctionComputedOptionsRenderResolveResponse) => {

                        functionComponent.value = resolveRes;
                    }).catch((err: any) => {

                        DefineFunctionComponentError(err, "asyncRender");
                        functionComponent.value = functionOptions.error || defineFunctionErrorDefault;
                    }).finally(() => {

                        returnResult = null;
                        isAsyncRenderFlag = false;
                    });

                    returnResult = functionOptions.loading && functionOptions.loading();
                }

            } catch (err: any) {

                DefineFunctionComponentError(err);
                returnResult = null;
            } finally {

                if (!isAsyncRenderFlag) {

                    if (resultExamineStateTasks) {

                        resultExamineStateTasks.stop();
                    }

                    setCurrentState(parentCurrentState);

                    currentRenderComponentContext = parentCurrentRenderComponentContext || null;
                }

            }

            closeCacheEntrance();

            return returnResult;
        },
    };

    const handler = handlers[componentFCName];

    handler[__v_FC_component] = DEFINEMEMORENDER;

    const options3 = options2 ? { ...options2 } : callback;

    try {

        delete (options3 as any).name;
    } catch {

    }

    Object.assign(handler, options3);
    return handler;
}

function DefineFunctionComponentError(err: Error | string, key?: string) {
    warn(`DefineFunctionComponent ${key != null ? `${key} ` : ""}Error message:`, err["message"] || err);
}

const defineExposeInstances = new WeakMap<CurrentCacheInstanceTs, object>();

function defineExpose<T extends Record<string, any>>(exposeContext: T, deps?: effectArgDepTs) {

    const instance = getCurrentCacheInstance();

    if (instance) {
        (instance.exposed as T) = exposeContext;
        useEffectPre(() => {
            // @ts-ignore
            const { ctx: proxy } = instance.instance;
            const ref = proxy?.$el || proxy;
            defineExposeInstances.set(instance, ref);
            const exposedContext = defineExposedMap.get(ref);
            if (exposedContext) {
                exposedContext._currentExposed = exposeContext;
                exposedContext.hooks[1]();
            }
        }, deps);
    }
}

type ExposedCtx = ComponentPublicInstance | null | Record<string, any>;

interface DefineExposedContext<> {
    currentExposed: ExposedCtx;
    exposed: Ref<Record<string, any>> | null;
    _currentExposed: any;
    hooks: ((...args: any[]) => any)[];
}

const defineExposedMap = new WeakMap<DefineExposedContext>();

function useDefineExpose() {

    const context: DefineExposedContext = {
        hooks: [],
        currentExposed: null,
        _currentExposed: null,
        exposed: null,
    };
    context.exposed = customRef((track, trigger) => {
        context.hooks = [track, trigger];
        return {
            get() {
                track();
                return context._currentExposed;
            },
            set(v) {
                if (!is(context.currentExposed, v)) {
                    if (typeof v === "object" && v) {
                        defineExposedMap.delete(context.currentExposed as DefineExposedContext);
                        context.currentExposed = v;
                        defineExposedMap.set(context.currentExposed as DefineExposedContext, context);
                    }
                }
            },
        };
    });

    return context.exposed;
}

type ExposedType = CurrentCacheInstanceTs["exposed"];

function getCurrentInstanceExposed() {
    const instance = getCurrentCacheInstance();
    if (instance) {
        return createCurrentState(customRef((track, trigger) => {
            return {
                get() {
                    track();
                    return instance.exposed || null;
                },
                set() {
                    return warn("Write operation failed: ", "Function getCurrentInstanceExposed return value (", instance.exposed, ")is readonly");
                },
            };
        }), {
            isToRef: false,
        })[0] as Ref<ExposedType>;
    }
}

function useRefImpl<T>(initValue: T) {
    _judgeCurrentState();
    return createCurrentState(ref<T>(initValue), {
        isToRef: false,
    })[0] as Ref<T>;
}

function useReactive<T>(value: T) {

    let row;
    if (!!(row = (useRefImpl<T>(value)))) {
        return row.value;
    }
}

type DefineFunctionSlotTs = (...args: any[]) => VNode | VNode[] | null | void

function defineFunctionSlots(context: VNode | VNode[] | DefineFunctionSlotTs | Record<string, DefineFunctionSlotTs>, ...args: (DefineFunctionSlotTs | Record<string, DefineFunctionSlotTs>)[]) {
    if (context)
        if (isVNode(context)) {
            return {
                default: () => context,
            };
        } else if (isFunction(context)) {
            if (arguments.length === 1) {
                return {
                    default: context,
                };
            } else {
                const slots = {};
                for (let slotFn of arguments) {
                    if (isFunction(slotFn)) {
                        slots[slotFn.name || "default"] = slotFn;
                    } else {
                        Object.assign(slots, slotFn);
                    }
                }
                return slots;
            }
        } else {
            for (let slotName in context) {
                if (!isFunction(context[slotName])) {
                    context[slotName] = () => context[slotName];
                }
            }
        }
    return context;
}

function useEffectScope(fn: () => any | (() => any), deps: effectArgDepTs) {

    _judgeCurrentState();

    let [scope, setScope] = createCurrentState(null, {
        isToRef: false,
        scheduler: () => void 0,
    }) as [EffectScope, any];

    useEffectSync(() => {
        scope = new EffectScope();
        setScope(scope);
        scope.run(fn);

        return () => {

            scope.stop();
        };

    }, deps);

}

function usePureState<T>(target?: T) {

    _judgeCurrentState();
    const effect = getCurrentCacheInstance()?.effect;
    const updateScheduler = useCallback(() => {
        ((effect as StateOption).updateScheduler as Function)();
    }, []);
    return createCurrentState(target, {
        isToRef: false,
        scheduler() {
            if (effect && effect.updateScheduler) {
                return updateScheduler;
            }
        },
    });
}

export {
    setCurrentInstanceContext,
    getCurrentInstance2,
    usePureState,
    useEffectScope,
    defineFunctionSlots,
    useReactive,
    useRefImpl,
    getCurrentInstanceExposed,
    useDefineExpose,
    useCacheEntrance,
    closeCacheEntrance,
    defineCacheFC as defineFunctionComponent,
    getCurrentCacheInstance,
    defineExpose,
    useDefineSlots as useSlotsMap,
    useDefineSlot,
    useState,
    useEffect,
    defineMemoRender as defineCacheRender,
    defineMemoRender,
    useCallback,
    useMemo,
    useId,
    useSyncExternalStore as useSyncExternalStore,
    useLayoutEffect,
    useReducer,
    memo,
    useRef,
    useEffectPre,
    useEffectSync,
    useUpdate,
    useSlots2,
    useContext2,
    useAttrs2,
    useEmit,
    useProps,
    transformVNodeFunctionComponentTypeWithMemo,
    createCurrentState,
    DefineMemoComponent,
    useImperativeHandle,
    createCacheEffectTask,
    openExamineStateTasks,
};
