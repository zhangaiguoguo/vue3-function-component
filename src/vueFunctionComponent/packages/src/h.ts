import { isObject2, isArray } from "../shared";
import { Fragment, isVNode, h as JSX } from "vue";
import { defineFunctionSlots } from "./defineFunctionComponent";

export function h(type: any, propsOrChildren: any, children: any) {
  if (type.$$typeof) {
    const l = arguments.length;
    if (l === 2) {
      if (isObject2(propsOrChildren) && !isArray(propsOrChildren)) {
        if (isVNode(propsOrChildren)) {
          return JSX(type, null, defineFunctionSlots(propsOrChildren));
        }
        return JSX(type, propsOrChildren);
      } else {
        return JSX(type, null, propsOrChildren);
      }
    } else {
      if (l > 3) {
        children = Array.prototype.slice.call(arguments, 2);
      } else if (l === 3 && isVNode(children)) {
        children = [children];
      }
      return JSX(type, propsOrChildren, defineFunctionSlots(children));
    }
  }

  return (JSX as any)(...arguments);
}

export { Fragment };
