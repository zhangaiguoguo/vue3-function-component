<script lang="tsx" setup>
import { ref } from 'vue';
import Cc from './components/async/Cc';
import { useState, markRegularFunctionComponent, useContext, useRef, createJsxFunctionComponent } from 'vue-function-component';
import { C } from './components/context';

const B = ((props: { a: number }) => {
  const [count, setCount] = useState(1)
  console.log(useContext(C))
  return <>
    <h1>B - count - {count}</h1>
    <button onClick={() => setCount(count + 1)}>点击</button>
    <Ccc />
  </>
})

function Ccc() {
  const divRef = useRef()
  return <div ref={divRef}>
    {useContext(C)}
  </div>;
}

const A = markRegularFunctionComponent(() => {
  return (<>
    <h1>A</h1>
    {/* <Cc a={1} b={2}></Cc> */}
    <B a={1} />
    <C value={100}>
      <B a={1} />
    </C>
  </>)
})

const count = ref(1);

</script>

<template>
  <transition>
    <div>
      <A :a="count" :b="[1, 2, 3]" />
      <h1>{{ count }}</h1>
      <button @click="count++">点击</button>
    </div>
  </transition>
</template>
