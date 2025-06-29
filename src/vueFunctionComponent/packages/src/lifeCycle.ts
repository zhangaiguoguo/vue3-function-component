import { isArray } from "../shared";
import { getCurrentFunctionComponentInstance } from "./defineFunctionComponent";

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

export function onMounted(fn: () => any) {
  injectCurrentInstanceLifeCycle(fn, "m");
}
