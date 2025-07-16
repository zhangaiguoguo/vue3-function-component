import { Fragment, h, ref, renderSlot } from "vue";
import {
  defineFunctionComponent,
  getCurrentFunctionComponentInstance,
  provide,
  setCurrentFunctionComponentInstance,
  useSlots,
  type ExoticComponent,
  type VueFunctionComponentVnode,
} from "./defineFunctionComponent";
import { useEffectImpl } from "./hooks/dispatcher";
import { EffectQueueFlag } from "./hooks/hookFlag";
import { Priority } from "./scheduler";
import { isFunction } from "../shared";
import { useContext } from "./hooks";

interface ProviderProps<T> {
  value: T;
  children?: VueFunctionComponentVnode | undefined;
}
interface ConsumerProps<T> {
  children: (value: T) => VueFunctionComponentVnode;
}
interface ProviderExoticComponent<P> extends ExoticComponent<P> {}
type Consumer<T> = ExoticComponent<ConsumerProps<T>>;
type Provider<T> = ProviderExoticComponent<ProviderProps<T>>;
export interface Context<T> extends Provider<T> {
  Provider: Provider<T>;
  Consumer: Consumer<T>;
}

const VUE_CONTEXT_TYPE = Symbol.for("vue.context"),
  VUE_CONSUMER_TYPE = Symbol.for("vue.consumer");

export function createContext<T>(defaultValue: T): Context<T>;

export function createContext<T>(defaultValue: T): Context<T> {
  let context: any = {
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    Provider: null,
    Consumer: null,
    _renderCount: 0,
  };
  const Provider = defineFunctionComponent<ProviderProps<T>>(function Provider(
    props
  ) {
    if (process.env.NODE_ENV !== "production" && !("value" in props)) {
      throw new Error(
        "The `value` prop is required for the `<Context.Provider>`. Did you misspell it or forget to pass it?"
      );
    }
    const prevRenderer = context._currentRenderer;
    const provides = getCurrentFunctionComponentInstance().provides;
    const state = (provides ? provides.get(context) : null) || ref();
    useEffectImpl(
      () => {
        state.value = props.value;
        provide(context, state);
      },
      [props.value],
      EffectQueueFlag.USE_EFFECT,
      Priority.SYNC
    );
    context._currentRenderer = state;
    try {
      if (props.children) {
        return h(Fragment, [props.children]);
      } else {
        return renderSlot(useSlots(), "default", {});
      }
    } finally {
      context._currentRenderer = prevRenderer;
      context._renderCount++;
    }
  });
  context.Provider = Provider;
  context.Provider.$$typeof = VUE_CONTEXT_TYPE;
  context.Consumer = defineFunctionComponent<ConsumerProps<T>>(
    function Consumer(props) {
      const slots = useSlots();
      let flag = 0;
      if (
        !(
          (flag = "children" in props ? 1 : 0) ||
          (flag = "default" in slots ? 2 : 0)
        )
      ) {
        if (process.env.NODE_ENV !== "production")
          throw new Error(
            "The `children` prop is required for the `<Context.Provider>`. Did you misspell it or forget to pass it?"
          );
      }
      const value = useContext<T>(context);
      const prevFunctionIntanceContext = getCurrentFunctionComponentInstance();
      setCurrentFunctionComponentInstance(null);
      try {
        switch (flag) {
          case 1:
            if (
              process.env.NODE_ENV !== "production" &&
              !isFunction(props.children)
            ) {
              throw new Error(
                "A context consumer was rendered with multiple children, or a child that isn't a function. A context consumer expects a single child that is a function. If you did pass a function, make sure there is no trailing or leading whitespace around it."
              );
            }
            return props.children(value);
          case 2:
            return slots.default!(value);
        }
      } finally {
        setCurrentFunctionComponentInstance(prevFunctionIntanceContext);
      }
    }
  );
  context.Consumer.$$typeof = VUE_CONSUMER_TYPE;
  context._currentRenderer2 = null;
  context._currentRenderer = null;
  Object.assign(Provider, context);
  context = new Proxy(Provider, {});
  context.Consumer._context = context;
  return context as Context<T>;
}
