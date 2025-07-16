<script lang="tsx" setup>
import {
  createContext,
  defineFunctionComponent,
  startTransition,
  useCallback,
  useSetupContext,
  useState,
} from "@/vueFunctionComponent";

const C = createContext(1);

console.log(C);

const Cc = defineFunctionComponent<{ a: number }>(
  {
    loader() {
      return Promise.resolve((props) => {
        const [count, setCount] = useState(1);
        return (
          <>
            <h1>Cc - {props.a}</h1>
            <h1>Cc count - {count}</h1>
            <button onClick={() => setCount((count + 1) * props.a)}>
              count++
            </button>
          </>
        );
      });
    },
  },
  {
    emits: ["a"],
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
        <C.Provider value={count} />
        <Cc a={count * 1} b="1" />
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
  <A :a="1" :b="[1, 2, 3]" />
</template>
