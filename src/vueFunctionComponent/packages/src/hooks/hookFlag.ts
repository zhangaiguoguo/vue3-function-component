// Hook 类型标志（用于调试和错误检查）
export enum EffectQueueFlag {
  USE_STATE = 0b00000000001,
  USE_EFFECT = 0b00000000010,
  USE_MEMO = 0b00000000100,
  USE_CALLBACK = 0b00000001000,
  USE_REDUCER = 0b00000010000,
  USE_REF = 0b00000100000,
  USE_LAYOUT_EFFECT = 0b00001000000,
  USE_TRANSITION = 0b00010000000,
  USE_ID = 0b00100000000,
  USE_DEFERRED_VALUE = 0b01000000000,
  USE_SYNC_EXTERNAL_STORE = 0b10000000000
}

// Hook 名称映射（用于错误提示）
export const EffectFlagName = {
  [EffectQueueFlag.USE_STATE]: "useState",
  [EffectQueueFlag.USE_EFFECT]: "useEffect",
  [EffectQueueFlag.USE_MEMO]: "useMemo",
  [EffectQueueFlag.USE_CALLBACK]: "useCallback",
  [EffectQueueFlag.USE_REDUCER]: "useReducer",
  [EffectQueueFlag.USE_REF]: "useRef",
  [EffectQueueFlag.USE_LAYOUT_EFFECT]: "useLayoutEffect",
  [EffectQueueFlag.USE_TRANSITION]: "useTransition",
  [EffectQueueFlag.USE_ID]: "useId",
  [EffectQueueFlag.USE_DEFERRED_VALUE]: "useDeferredValue",
  [EffectQueueFlag.USE_SYNC_EXTERNAL_STORE]: "useSyncExternalStore",
};

export function isEffectFlag(flag: number): flag is EffectQueueFlag {
  return Object.values(EffectQueueFlag).includes(flag as EffectQueueFlag);
}
