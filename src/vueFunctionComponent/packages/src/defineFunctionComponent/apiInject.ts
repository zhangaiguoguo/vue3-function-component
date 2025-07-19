import { warn } from "vue";
import { currentInstanceContext } from "./functionComponent";
import { isFunction } from "../shared";

export function provide<T, K = any>(key: K, value: T): void;
export function provide(key: any, value: any) {
  if (!currentInstanceContext) {
    if (process.env.NODE_ENV !== "production") {
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
