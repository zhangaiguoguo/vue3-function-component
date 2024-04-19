import type {SetupContext} from "vue"
import {ComponentInternalInstance, customRef, getCurrentInstance, isReactive, isRef, nextTick, ref, toValue} from "vue";
import {is, transformFunction} from "@/hooks/utils";

const modelPropsMsp = new WeakMap();

export function useIsProps(key: string, instance?: any) {
    instance = instance || getCurrentInstance()
    if (key in instance.props) {
        return true
    }
    return false
}

interface ComponentInternalInstance2 extends ComponentInternalInstance {
    emitsOptions: any;
    parent: ComponentInternalInstance2
    ctx: {
        [key: string]: any
    }
}

function useSetModelProp(key: string, value: any, instance: ComponentInternalInstance2) {
    const emitEventKey = "update:" + key
    const emitsOptions = instance.emitsOptions
    if (emitsOptions && emitsOptions[emitEventKey]) {
        instance.emit(emitEventKey, value);
    } else {
        if (useIsProps(key, instance)) {
            useSetModelProp(key, value, instance.parent)
        } else if (instance.ctx && key in instance.ctx) {
            instance.ctx[key] = value
        } else if (instance.exposeProxy && key in instance.exposeProxy) {
            instance.exposeProxy[key] = value
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
        const _ref = customRef(function (track, trigger) {
            return {
                get() {
                    track();
                    return proxy.props[key];
                },
                set(v) {
                    useSetModelProp(key, v, proxy)
                    trigger();
                },
            };
        });
        weakMap.set(key, _ref);
        return _ref;
    }
}

type taskItemFn = () => StateOption

interface StateOption {
    refId: number,
    state: StateItemState[];
    effects: effectOption[];
    effectIndex: number
    stateIndex: number
    _: number
    _index: number
    flag: boolean
    gate?: boolean
    updateScheduler?: Function
    scheduler?: Function
}

const tasks: taskItemFn[] = []

let index = 0

let globalCurrentScheduler: Function | null = null

let currentState: StateOption | null = null

let currentScheduler: Function | null = null

function collectTime() {
    const _ = Date.now()
    return () => Date.now() - _
}

function createState() {
    const _index = index
    const __ = collectTime()
    let _gate = false
    const currentState: StateOption = {
        refId: 0,
        state: [],
        effects: [],
        effectIndex: 0,
        stateIndex: 0,
        _: __(),
        _index: _index,
        flag: true,
    }
    try {
        return def(currentState, 'gate', {
            get() {
                return _gate
            },
            set(this: StateOption, v: boolean) {
                _gate = v
                if (this.flag) {
                    if (v) {
                        this.flag = true
                        this.refId = 0
                        this.stateIndex = 0
                        this.effectIndex = 0
                    } else {
                        if (this.stateIndex !== this.state.length || this.effectIndex !== this.effects.length) {
                            try {
                                throw new Error("error Rendered fewer hooks than expected. This may be caused by an accidental early return statement.")
                            } catch (err) {
                                throw new Error((err as any).message)
                            } finally {
                                this.flag = false
                            }
                        }
                    }
                }
            }
        })[0]
    } finally {
        index++
    }
}

const def = <T, K extends keyof T>(obj: T, key: K | PropertyKey, options?: PropertyDescriptor): [T, Function] => {
    Object.defineProperty(obj, key, {
        configurable: true,
        enumerable: false,
        ...options || {},
    });
    return [obj, def]
};

function createSelfState(dep?: taskItemFn): taskItemFn {

    if (tasks.some((cb) => cb === dep)) {
        return tasks.find((cb) => cb === dep) as taskItemFn
    }
    const state = createState()

    return tasks[tasks.push(() => state) - 1]
}

function last(target: { [name: number | string | symbol]: any, length: number }) {
    return target[target.length - 1]
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
    const state: StateItemState = {
        initValue: target,
        history: [target],
        options: options || null,
        add<T>(v: T) {
            const lastCurrentState = last(this.history)
            if (isReactive(lastCurrentState) || isRef(lastCurrentState)) {
                lastCurrentState.value = v
            } else {
                if (this.history.length > 2) {
                    this.history.splice(this.history.length - 2, 1)
                }
                this.history.push(v as any)
            }
        },
    }
    def(state, 'value', {
        get() {
            return last(state.history)
        }
    })
    return state
}

function examineStateTasks() {
    if (currentState) {
        const _currentState = currentState
        _currentState.gate = true
        return () => {
            _currentState.gate = false
        }
    } else {
        throw new Error("error")
    }
}


function _judgeCurrentState() {
    if (!currentState || !currentState.gate) {
        console.error("Invalid hook call. Hooks can only be called inside of the body of a function component.")
        return true
    }
}

interface componentProps {
    updateScheduler?: Function | null
}

interface componentProps2 extends componentProps {
}

function scopeTaskStateScheduler(renderHandler: Function) {
    let _: taskItemFn | null = null
    let oldProps: componentProps2 | null = null;
    return (props: componentProps2, context: SetupContext<any>) => {
        let result = null
        if (oldProps !== props) {
            currentState = (_ = createSelfState())()
        } else {
            currentState = (_ as taskItemFn)()
        }
        oldProps = props
        currentState.scheduler = () => {
            (props.updateScheduler && props.updateScheduler()) || globalCurrentScheduler && globalCurrentScheduler()
        }
        currentScheduler = props.updateScheduler || null
        const resultExamineStateTasks = examineStateTasks()
        try {
            result = renderHandler(props, context)
            resultExamineStateTasks()
        } catch (err) {
            console.error(err)
        } finally {
            currentState = null
        }
        return result
    }
}

function render(renderHandler: Function) {
    return scopeTaskStateScheduler(renderHandler)
}

type StateItemStateOption = {
    scheduler?: Function,
    isToRef?: boolean
}

type createCurrentStateResult = [any, <T>(v: T) => void]

function createCurrentState<T>(initState: T | (() => T), options: StateItemStateOption = {
    isToRef: true
}): createCurrentStateResult | void {
    if (currentState) {
        const _currentState = currentState
        try {
            const _initState = initState
            initState = (typeof initState === "function" ? initState : () => _initState) as (() => any)
            const currentSub = _currentState.stateIndex
            const state = _currentState.state
            let current = state[currentSub] || state[state.push(_createState(options.isToRef ? ref(initState()) : initState(), options)) - 1];
            const _options = current.options || options
            current._scheduler = current._scheduler || (_options && _options.scheduler) || _currentState.scheduler || currentScheduler;
            return [options.isToRef ? toValue(current.value) : current.value, (current.scheduler || (current.scheduler = async <T>(value: T) => {
                if (!is(value, toValue(current.value))) {
                    let isSetStateFlag = true
                    if (current._scheduler) {
                        isSetStateFlag = await current._scheduler()
                    }
                    if (isSetStateFlag || isSetStateFlag === void 0) {
                        current.add(value)
                    }
                }
            }))]
        } finally {
            _currentState.stateIndex++
        }
    }
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
            const _currentState = currentState
            const currentSub = _currentState.effectIndex
            const effects = _currentState.effects
            if (effects.length <= currentSub || effects.length === 0) {
                effects.push({
                    scheduler(options: effectArgOption) {
                        if (_currentState.effectIndex >= currentSub && _currentState.flag) {
                            effects[currentSub].deps = options.deps
                            effects[currentSub].init = true
                            schedule(() => _currentState.flag, options, effects, currentSub, _currentState);
                        }
                    },
                    resultScheduler: null,
                    deps: null,
                    init: false
                })
            }
            if ((function () {
                if (!effects[currentSub].init) {
                    return true
                }
                const oldDeps = transformFunction(effects[currentSub].deps)();
                const newDeps = transformFunction(deps)();
                return oldDeps == null || oldDeps.length && (newDeps.length !== (oldDeps && oldDeps.length) || (oldDeps && oldDeps.some((dep: any, index: number) => newDeps[index] !== dep)))
            })()) {
                effects[currentSub].scheduler({
                    callback,
                    deps
                })
            }

        } finally {
            currentState.effectIndex++
        }
    }
}

function dispatchEffectResultScheduler(effect: effectOption) {
    if (effect && effect.resultScheduler) {
        effect.resultScheduler()
    }
}

function setEffectResultScheduler(effect: effectOption, result: (() => void) | (() => boolean) | void) {
    if (effect) {
        effect.resultScheduler = result as any
    }
}

function useEffectPre(target: effectArgTs, deps: effectArgDepTs) {
    if (_judgeCurrentState()) return
    createCurrentEffect(target, (validate, options, effects, index) => {
        const currentEffect = effects[index]
        const _callback = options.callback
        dispatchEffectResultScheduler(currentEffect)
        nextTick(() => {
            if (!validate()) return
            setEffectResultScheduler(currentEffect, _callback())
        }).then(() => void 0)
    }, deps)
}

type effectArgTs = () => (() => void) | void;

type effectArgDepTs = any[] | (() => boolean) | void;

function useEffectSync(target: effectArgTs, deps: effectArgDepTs) {
    if (_judgeCurrentState()) return
    createCurrentEffect(target, (validate, options, effects, index) => {
        if (!validate()) return
        const currentEffect = effects[index]
        const _callback = options.callback
        dispatchEffectResultScheduler(currentEffect)
        setEffectResultScheduler(currentEffect, _callback())
    }, deps)
}

function useState<T>(target: T) {
    if (_judgeCurrentState()) return
    return createCurrentState(target, {
        isToRef: true
    })
}

function useUpdate() {
    if (_judgeCurrentState()) return
    const updateScheduler = currentState && currentState.scheduler
    return () => {
        updateScheduler && updateScheduler()
    }
}

function useEffect(callback: effectArgTs, deps?: effectArgDepTs) {
    return useEffectPre(callback, deps)
}

function watchEffect<T>(target: T, deps: effectArgDepTs, scheduler = <T>(v: T) => v) {
    if (_judgeCurrentState()) return
    let [result, setResult] = createCurrentState(null, {
        isToRef: false
    }) as createCurrentStateResult
    useEffectSync(() => {
        setResult(result = scheduler(target))
    }, deps)
    return result
}

function useCallback(target: Function, deps: effectArgDepTs) {
    return watchEffect(target, deps)
}

function useMemo(target: Function, deps?: effectArgDepTs) {
    return watchEffect(target, deps, (v) => (v as Function)())
}

function useId() {
    if (_judgeCurrentState()) return
    return `:rud${currentState && currentState.refId++}`
}

function useSyncExternalStore(subscribe: Function, getSnapshot: Function) {
    if (_judgeCurrentState()) return
    const _currentState = currentState as StateOption
    let [dispatcher, setDispatcher] = createCurrentState(null, {
        scheduler: () => void 0,
        isToRef: true,
    }) as createCurrentStateResult
    useEffectPre(() => {
        if (typeof dispatcher === "function") {
            dispatcher()
        }
        const __ = () => {
            (_currentState.scheduler as Function)()
        }
        setDispatcher(dispatcher = subscribe(__))
    }, [subscribe])

    return getSnapshot()
}

function useLayoutEffect<T extends effectArgTs, T2 extends effectArgDepTs>(target: T, deps: T2) {
    return useEffectPre(target, deps)
}

// @ts-ignore
function useReducer<TT, TT2>(reducer: <T>(arg: T, arg2: object) => T, initialArg: never, init: (v: TT2) => any) {
    if (_judgeCurrentState()) return
    const [isInit, setInit] = createCurrentState(false, {
        scheduler() {
        },
        isToRef: false
    }) as createCurrentStateResult
    const _store = (typeof init === "function" && !isInit ? !(setInit as Function)(true) && init(initialArg) : initialArg)
    let [store, setStore] = createCurrentState(_store, {}) as createCurrentStateResult
    const updateScheduler = useCallback((target: object) => {
        setStore(reducer(store, target))
    })
    return [store, updateScheduler]
}

function memo(component: Function, callback: effectArgDepTs) {
    let result: any = null
    let oldProps: any = null
    let init = false
    const _callback = typeof callback === "function" ? callback : () => !void 0

    function _(props: any) {
        let next = _callback()
        if (next) {
            try {
                for (let w in (props || {})) {
                    if (oldProps !== null) {
                        if (oldProps[w] !== props[w]) {
                            next = false
                            break
                        }
                    }
                }
            } catch {
                next = false
            }
        }
        oldProps = props || {}
        return !init ? !(init = true) : next
    }

    return function (props: object, context: SetupContext<object>) {
        if (!_(props)) {
            result = component(props, context)
        }
        return result
    }
}

function useRef(target: any = null) {
    return (createCurrentState(ref(arguments.length ? target : null), {
        isToRef: false
    }) as any)[0]
}

export {
    useState,
    useEffect,
    render as defineCacheRender,
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
    useUpdate
}