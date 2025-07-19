const EMPTY_OBJ: Readonly<any> =
  process.env.NODE_ENV !== "production" ? Object.freeze({}) : {};

const NOOP: () => void = () => {};
const NOOP2 = <T>(v: T): T => v;

const isArray: (arg: any) => arg is any[] = (target) => Array.isArray(target);

const hasOwnProperty2: (a: PropertyKey) => boolean =
  Object.prototype.hasOwnProperty;

const hasOwn: <O, K extends PropertyKey>(
  a: O,
  b: K
) => K extends keyof O ? true : false = (val, key) =>
  hasOwnProperty2.call(val, key) as any;

const isString: (a: any) => a is string = (val) => typeof val === "string";

const isSymbol: (a: any) => a is symbol = (val) => typeof val === "symbol";

const hasChanged: (a: any, b: any) => boolean = (value, oldValue) =>
  !Object.is(value, oldValue);

const isMap = (val: any): val is Map<unknown, unknown> =>
  toRawType(val) === "Map";

const isSet = (val: any): val is Set<unknown> => toRawType(val) === "Set";

const isObject2 = (val: any): val is Record<any, any> =>
  toRawType(val) === "Object";

const extend: (target: object, ...sources: any[]) => any = Object.assign;

const def: (a: object, b: string, c: any, d?: boolean) => void = (
  obj,
  key,
  value,
  writable = false
) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable,
    value,
  });
};
const getProto: (a: object) => object | null = (v) => Reflect.getPrototypeOf(v);

const toString2 = Object.prototype.toString;

function toRawType(target: any): string {
  return toString2.call(target).slice(8, -1);
}

function isFunction(target: unknown): target is Function {
  return typeof target === "function";
}

export function isPromise<T = any>(target: unknown): target is Promise<T> {
  return isObject(target) && "then" in target && isFunction(target.then);
}

function isObject(target: unknown): target is Record<any, unknown> {
  return typeof target === "object" && target !== null;
}

function toString<T extends { toString(): string }>(target: T): string {
  return target.toString();
}

function makeMap(
  str: string,
  expectsLowerCase?: boolean
): (val: string) => boolean {
  const map = Object.create(null);
  const list = str.split(",");
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase
    ? (val) => !!map[val.toLowerCase()]
    : (val) => !!map[val];
}

const isIntegerKey: (a: unknown) => boolean = (key) =>
  isString(key) &&
  key !== "NaN" &&
  key[0] !== "-" &&
  "" + parseInt(key, 10) === key;

let getOwnPropertyDescriptor: <T extends object, P extends PropertyKey>(
  a: T,
  key: P
) => TypedPropertyDescriptor<P extends keyof T ? T[P] : any> | undefined = (
  target,
  key
) => {
  if (typeof Reflect !== "undefined" && Reflect.getOwnPropertyDescriptor) {
    return (getOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor)(
      target,
      key
    );
  } else if (Object.getOwnPropertyDescriptor) {
    return (getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor)(
      target,
      key
    );
  } else {
    getOwnPropertyDescriptor = (target, key) => {
      const de = {
        //@ts-ignore
        set: Object.__lookupSetter__.call(target, key),
        //@ts-ignore
        get: Object.__lookupGetter__.call(target, key),
        writable: true,
        enumerable: true,
        configurable: true,
      };
      if (de.get || de.set) {
      } else {
        //@ts-ignore
        de.value = target[key];
      }
      return de;
    };
    return getOwnPropertyDescriptor(target, key);
  }
};

function removeArrayItem(arr: any[], item: any): any[] | void {
  const len = arr.length;
  if (len) {
    if (item === arr[len - 1]) {
      arr.length = len - 1;
      return;
    }
    if (item === arr[0]) {
      arr.shift();
      return;
    }
    const index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1);
    }
  }
}

const cacheStringFunction: (
  fn: (str: string) => string
) => (str: string) => any = (fn) => {
  const cache = Object.create(null);
  return (str: string) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};

const camelizeRE = /-(\w)/g;
const camelize: (str: string) => any = cacheStringFunction((str) => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ""));
});

const hyphenateRE = /\B([A-Z])/g;
const hyphenate: (str: string) => any = cacheStringFunction((str: string) =>
  str.replace(hyphenateRE, "-$1").toLowerCase()
);

type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;

export type { IfAny };

export {
  camelize,
  hyphenate,
  cacheStringFunction,
  removeArrayItem,
  getOwnPropertyDescriptor,
  isArray,
  hasOwnProperty2,
  hasOwn,
  isString,
  isSymbol,
  hasChanged,
  isMap,
  isSet,
  isObject2,
  def,
  getProto,
  toRawType,
  isFunction,
  isObject,
  toString,
  extend,
  NOOP,
  makeMap,
  isIntegerKey,
  EMPTY_OBJ,
  NOOP2,
};
