import { extend, isFunction, isObject2 } from "../shared";
import { isVNode, type Slots } from "vue";
import type { VueFunctionComponentVnode } from "./types";

type Slot = (...args: any[]) => VueFunctionComponentVnode;

export function defineFunctionSlots(slot: VueFunctionComponentVnode): {
  default: Slot;
};
export function defineFunctionSlots(slot: Slot): { default: Slot };
export function defineFunctionSlots(...args: Slot[]): Slots;

export function defineFunctionSlots(...slots: any): any {
  if (slots[0] && slots[0].slots2) {
    return slots[0];
  }
  const slots2: any = {
    _slotSkip: true,
  };
  for (let slot of slots) {
    if (isVNode(slot)) {
      slots2.default = () => slot;
    } else if (isFunction(slot)) {
      slots2[slot.name || "default"] = slot;
    } else if (isObject2(slot)) {
      extend(slots2, slot);
    } else {
      slots2.default = () => slot;
    }
  }
  return slots2;
}
