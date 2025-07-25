import { isFunction, isObject as isObject2 } from "../shared";
import { warn } from "vue";
import type {
  DefineFunctionComponentInstanceContext,
  DefineFunctionComponentOptions,
  DefineFunctionComponentRenderContext,
} from "./types";

export const createInstanceMemoized =
  (): DefineFunctionComponentInstanceContext["memoizedEffect"] => ({
    queue: null,
    prevLast: null,
    last: null,
  });

export const validateRenderInput = (render: any): boolean => {
  if (process.env.NODE_ENV !== "production") {
    if (!isFunction(render) && !isObject2(render)) {
      warn(
        "The first argument should be a render function or an object with a 'functionComponent' property.",
        render
      );
      return false;
    }
    if (isObject2(render) && !isFunction(render.loader)) {
      warn("The loader function must be a valid function.", render.loader);
      return false;
    }
  }
  return true;
};

export const getComponentDisplayName = (
  renderContext: DefineFunctionComponentRenderContext,
  options?: DefineFunctionComponentOptions
): string => {
  return (
    (options as any)?.name ||
    (renderContext && renderContext.render?.name) ||
    "AnonymousComponent"
  );
};

export const initOptions = (handler: any, options: any) => {
  if (options) {
    for (const k in options) {
      if (k !== "name") {
        handler[k] = options[k];
      }
    }
  }
};
