import {
  defineFunctionComponent,
  type ExoticComponent,
  type VueFunctionComponentVnode,
} from "./defineFunctionComponent";

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
interface Context<T> extends Provider<T> {
  Provider: Provider<T>;
  Consumer: Consumer<T>;
  displayName?: string | undefined;
}

const VUE_CONTEXT_TYPE = Symbol.for("vue.context"),
  VUE_CONSUMER_TYPE = Symbol.for("vue.consumer");

export function createContext<T>(defaultValue: T): Context<T>;

export function createContext<T>(defaultValue: T): Context<T> {
  const context: any = {
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    _threadCount: 0,
    Provider: null,
    Consumer: null,
  };
  context.Provider = defineFunctionComponent<ProviderProps<T>>(
    function Provider(props) {
      console.log(1);
    }
  );
  context.Provider.$$typeof = VUE_CONTEXT_TYPE;
  context.Consumer = defineFunctionComponent<ConsumerProps<T>>(
    function Consumer() {
      console.log(1);
    }
  );
  context.Consumer.$$typeof = VUE_CONSUMER_TYPE;
  context._currentRenderer = null;
  context._currentRenderer2 = null;
  return context as Context<T>;
}
