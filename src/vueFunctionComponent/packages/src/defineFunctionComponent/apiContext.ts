import { SetupContext } from "vue";
import { getCurrentFunctionComponentInstance } from "./functionComponent";
import { DefineFunctionComponentInstanceContext } from "./types";

function useContext(): SetupContext {
  return getCurrentFunctionComponentInstance()?.context as any;
}

export const useSetupContext = useContext;

export function useSlots(): SetupContext["slots"] {
  return useContext()?.slots;
}

export function useAttrs(): SetupContext["attrs"] {
  return useContext()?.attrs;
}

export function useProps(): DefineFunctionComponentInstanceContext["props"] {
  return getCurrentFunctionComponentInstance()?.props;
}
