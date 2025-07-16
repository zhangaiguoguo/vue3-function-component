import { warn } from "vue";
import { isArray } from "../shared";
import {
  type DefineFunctionComponentInstanceContext,
  getCurrentFunctionComponentInstance,
} from "./defineFunctionComponent";

function injectCurrentInstanceLifeCycle(fn: () => any, key: string) {
  const c = getCurrentFunctionComponentInstance();
  if (c) {
    const instance = c.instance as any;
    if (isArray(instance[key])) {
      instance[key].push(fn);
    } else {
      instance[key] = [fn];
    }
  }
}

export function onUnmounted(fn: () => any) {
  injectCurrentInstanceLifeCycle(fn, "um");
}

export function onBeforeUnmount(fn: () => any) {
  injectCurrentInstanceLifeCycle(fn, "bum");
}

interface O {
  hooks: Map<string, OHookContext>;
}

interface OHookContext {
  fns: (() => any)[];
  status: 1 | 0;
  fn: () => any;
}

const instanceCaches = new WeakMap<DefineFunctionComponentInstanceContext, O>();

function injectCurrentInstanceToVnodeLifeCycle(fn: () => any, key: string) {
  const c = getCurrentFunctionComponentInstance();
  if (c) {
    const instance = c.instance;
    const vnode = instance.vnode;
    if (vnode) {
      if (!instanceCaches.has(c)) {
        instanceCaches.set(c, {
          hooks: new Map(),
        });
        onUnmounted(() => {
          instanceCaches.delete(c);
        });
      }

      const cc = instanceCaches.get(c) as O;
      const hooks = cc.hooks;
      const hookHasFlag = hooks.has(key);
      let hookContext = hooks.get(key) as OHookContext;
      vnode.props ??= {};
      const o = vnode.props[key];
      if (!hooks.has(key)) {
        hookContext = createHookContext(key, o);
      }

      hookContext.fns.push(fn);
      if (o === hookContext.fn) {
        return;
      } else {
        if (hookHasFlag) {
          hookContext.status = 0;
          const oo = hookContext;
          hookContext = createHookContext(key, o);
          hookContext.fns = oo.fns;
        }
      }
      vnode.props.onVnodeMounted;
      vnode.props[key] = hookContext.fn.bind(hookContext);
    } else {
      warn(
        "Failed to register the `onMounted` lifecycle hook function. The instance root node cannot be found"
      );
    }
  }
}

function createHookContext(key: string, callback?: () => void) {
  const c = instanceCaches.get(getCurrentFunctionComponentInstance());
  return c!.hooks
    .set(key, {
      fns: [],
      status: 1,
      fn() {
        callback && callback();
        if (this.status) {
          this.fns.forEach((fn) => {
            fn();
          });
          this.fns.length = 0;
        }
      },
    })
    .get(key) as OHookContext;
}

export function onMounted(fn: () => any) {
  injectCurrentInstanceToVnodeLifeCycle(fn, "onVnodeMounted");
}

export function onUnMounted(fn: () => any) {
  injectCurrentInstanceToVnodeLifeCycle(fn, "onVnodeUnmounted");
}

export function onBeforeMount(fn: () => any) {
  injectCurrentInstanceToVnodeLifeCycle(fn, "onVnodeBeforeMount");
}

export function onBeforeUpdate(fn: () => any) {
  injectCurrentInstanceToVnodeLifeCycle(fn, "onVnodeBeforeUpdate");
}

export function onUpdated(fn: () => any) {
  injectCurrentInstanceToVnodeLifeCycle(fn, "onVnodeUpdated");
}
