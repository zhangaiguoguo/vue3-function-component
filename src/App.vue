<script setup lang="tsx">
import {
  defineFunctionComponent,
  useCallback,
  useEffect,
  useId,
  useState,
} from "@/vueFunctionComponent";
import { getCurrentInstance, onMounted, onUnmounted, ref } from "vue";
onUnmounted(() => {
  console.log("app destory");
});

onMounted(() => {
  console.log("app mounted");
});

console.log(onMounted);

const A = defineFunctionComponent(
  (props, context) => {
    const [count, setCount] = props.b % 2 || true ? useState(1) : [1, () => 1];
    // setCount(count+1)
    console.log(useState(1));
    console.log(useState(() => 2));
    const setCount2 = useCallback(() => {
      setCount(count + 1);
      return 1;
    }, [count]);
    // console.log(count % 2 ? useState(() => 3) : useId());
    useEffect(() => {
      console.log(1);
      return () => {
        console.log(2);
      };
    }, [count]);
    return (
      <div>
        <h1>A - {count * props.a}</h1>
        <h1>A2 - {count * props.a}</h1>
        <h1>A3 - {count * props.a}</h1>
        <button onClick={setCount2}>count++</button>
      </div>
    );
  },
  {
    name: "A",
    props: {
      a: {},
      b: {},
    },
  }
);
const B = defineFunctionComponent(() => {
  return (
    <div>
      <h1>B</h1>
    </div>
  );
});
const count = ref(0);
</script>
<template>
  <div>
    <div>
      <button @click="count++">count++{{ count }}</button>
    </div>
    <A :a="1" :b="count" />
  </div>
</template>
