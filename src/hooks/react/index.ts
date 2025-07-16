import * as vue from "vue";

export default new Proxy(
  {
    h() {
      const args = [...arguments];
      const type = args[0];

      return vue.h(type, ...args.slice(1));
    },
  },
  {
    get(target, key) {
      // @ts-ignore
      if (target[key]) {
        return Reflect.get(target, key);
      }
      // @ts-ignore
      return Reflect.get(vue, key);
    },
  }
);
