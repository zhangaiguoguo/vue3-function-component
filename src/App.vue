<script lang="tsx" setup>
import {
  createContext,
  defineFunctionComponent,
  defineFunctionSlots,
  startTransition,
  useCallback,
  useContext,
  useSetupContext,
  useState,
} from "@/vueFunctionComponent";
import { useSlots } from "vue";

const C = createContext(123);
const C2 = createContext(173);

console.log(C);

const Cc = defineFunctionComponent(
  {
    async loader() {
      await new Promise((rlt) => {
        setTimeout(rlt, 2000);
      });
      return Promise.resolve((props) => {
        const [count, setCount] = useState(1);
        const value = useContext(C);
        // console.log(useContext(C2));
        const slots = useSlots();
        return (
          <>
            <h1>
              Cc - {props.a} - {value}
            </h1>
            <h1>Cc count - {count}</h1>
            <button onClick={() => setCount((count + 1) * props.a)}>
              count++
            </button>
            {slots.default && slots.default()}
          </>
        );
      });
    },
    loading() {
      return "loading...";
    },
  },
  {
    props: ["a", "b"] as const,
  }
);

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
            <Cc a={1} b={count}>
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
        {/* <C2 value={1314} children={<Cc a={1} b={count}></Cc>}></C2> */}
        {/* {new Array(1).fill(1).map((i, index) => (
          <Cc a={index + 1} />
        ))} */}
      </div>
    );
  },
  {
    name: "A",
    props: ["a", "b"] as const,
  }
);
</script>

<template>
  <transition>
    <A :a="1" :b="[1, 2, 3]" />
  </transition>
</template>
