<script lang="tsx" setup>
import {
  defineFunctionComponent,
  defineFunctionSlots,
  startTransition,
  useCallback,
  useState,
} from "@/vueFunctionComponent";
import { C, C2 } from "./components/context";
import Cc from "./components/async/Cc";
import { defineAsyncComponent, ref } from "vue";

console.log(C);

const A = defineFunctionComponent(
  (props) => {
    props.a;
    const [count, setCount] = useState(1);
    const setCount2 = useCallback(() => {
      startTransition(() => {
        setCount(count + 1);
      });
      return 1;
    }, [count]);

    return (
      <div>
        <h1>A - {count}</h1>
        <button onClick={setCount2}>count++</button>
        <C.Provider value={count}>
          {defineFunctionSlots(
            <Cc a={1} b={1}>
              {defineFunctionSlots(
                <>
                  <C.Provider
                    value={count * 2}
                    children={<Cc a={2}></Cc>}
                  ></C.Provider>
                </>
              )}
            </Cc>
          )}
        </C.Provider>
        <C
          value={count}
          children={
            <C.Consumer>
              {(value) => {
                return <h1>C.Consumer - {value}</h1>;
              }}
            </C.Consumer>
          }
        ></C>
        <C2 value={1314} children={<Cc a={1} b={count}></Cc>}></C2>
        {new Array(1).fill(1).map((i, index) => (
          <Cc a={index + 1} />
        ))}
      </div>
    );
  },
  {
    name: "A",
    props: ["a", "b"] as const,
  }
);

const AA = defineAsyncComponent(() => {
  return import("./components/async/AA.vue");
});
const count = ref(1)
</script>

<template>
  <transition>
    <div>
      <!-- <Cc :a="count" :b="[1, 2, 3]" /> -->
      <A :a="count" :b="[1, 2, 3]" />
      <h1>{{ count }}</h1>
      <button @click="count++">点击</button>
    </div>
  </transition>
</template>
