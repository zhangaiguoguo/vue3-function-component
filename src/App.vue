<script setup lang="tsx">

import HelloWorld from '@/components/HelloWorld.vue';
import {createVNode, h, onMounted, ref} from "vue";
import {
  useCallback,
  useId,
  useMemo,
  useReducer,
  useRef,
  useDefineSlot,
  useSlots2,
  useState,
  useProps,
  useContext2
} from "@/hooks";

const msg = ref('Vite + Vue')
const count = ref(1)

onMounted(() => {
})

defineExpose({
  msg
})


function AAChild() {
  const slots = useSlots2()
  const props = useProps()
  const [state, dispatch] = useReducer((state: any, type: any) => {
    switch (type.type) {
      case "setCount":
        state.count++
        break
    }
    return state
  }, {count: 1})
  const [num, setNum] = useState(1)
  const currentRef = useRef(1)
  const numComputed = useMemo(() => {
    return num + "->>" + (state && state.count)
  }, [num, state])
  const onClick = useCallback(() => {
    dispatch({
      type: 'setCount'
    })
    setNum(num + 1)
  }, [num, state])
  return <>
    <div key={useId()}>
      <h1 ref={currentRef}>{props.index}</h1>
      <br/>
      <button onClick={onClick}>点击{numComputed}</button>
      <br/>
      <br/>
      <Button type="primary">
        {
          {
            default({count}) {
              return <span>点击{count}</span>
            }
          }
        }
      </Button>
    </div>
  </>
}

function Button() {
  const slots = useSlots2()
  const [count, setCount] = useState(1)
  return (<>
    <button onClick={() => setCount(count + 1)}>
      {
        useDefineSlot(slots, 'default', {
          count: count
        })
      }
    </button>
  </>)
}

function AA(props, {slots}) {
  console.log('-----')
  return <>
    {
      new Array(1).fill(1).map((v, index) => {
        return <>
          <AAChild index={'loop' + index}>
            {
              {
                default() {
                  return <div>
                    <h1>你好</h1>
                  </div>
                }
              }
            }
          </AAChild>
        </>
      })
    }
  </ >
}

const A = {
  setup(props, context) {
    const num = ref(1)
    const done = ref(true)
    return () => {
      const a = {onClick: () => num.value++, num: num.value}
      return num.value % 2 ? [
        h('div', {num: num.value}, '你好 - a'),
        h('div', '你好'),
        h('input', {
          type: "checkbox",
          checked: done.value, 'onInput': ({target}: InputEventInit) => {
            done.value = target.checked
          }
        }),
        h('br'),
        createVNode('button', a, `点击${num.value}`, 0, []),
        h(HelloWorld, {msg: count.value}),
        h(AA, {value: 123, num: num.value}, {
          default({setNum, num}) {
            return [
              <div>
                <h1>你好</h1>
                <button onClick={() => setNum(num + 1)}>点击{num}</button>
              </div>
            ]
          }
        })
      ] : [
        h(HelloWorld, {msg: count.value}),
        h('div', {num: num.value}, '你好 - a'),
        h('div', '你好'),
        createVNode('button', a, `点击${num.value}`, 0, []),
      ]
    }
  }
}

</script>

<template>
  <button @click="count++">点击{{ count }}</button>
  <!--    <HelloWorld :msg="msg" v-if="count % 2"/>-->
  <!--    <h1 :num="count">-&#45;&#45;&#45;&#45;&#45;&#45;&#45;&#45;</h1>-->
  <!--    <b>1231</b>-->
  <!--    <HelloWorld :msg="msg"/>-->
  <!--    <A/>-->
  <AA/>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
