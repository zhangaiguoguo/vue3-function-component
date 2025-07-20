export {
  defineFunctionComponent,
  defineFunctionSlots,
  useSetupContext,
  useAttrs,
  useProps,
  useSlots,
} from "./defineFunctionComponent/index";

export * from "./hooks";

export * from "./createContext";

export { onUnMounted, onBeforeUnmount } from "./lifeCycle";

export * from "./h";

globalThis.__DEV__ = true;
