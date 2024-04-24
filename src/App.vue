<script setup lang="tsx">

import HelloWorld from '@/components/HelloWorld.vue';
import { Fragment, createVNode, getCurrentInstance, h, onMounted, ref } from "vue";
import DefineMemoRender from "@/hooks/DefineMemoRender.vue"
import { DefineMemoComponent, createCurrentState, defineMemoRender, useDefineSlot, useMemo, useProps, useSlots2, useState } from './hooks';
import { isFunction } from './hooks/utils';

const msg = ref('Vite + Vue')
const count = ref(1)

onMounted(() => {
})

defineExpose({
    msg
})



const A = {
    setup(_props, _context) {
        const num = ref(1)
        const done = ref(true)
        return () => {
            const a = { onClick: () => num.value++, num: num.value }
            return num.value % 2 ? [
                h('div', { num: num.value }, '你好 - a'),
                h('div', '你好'),
                h('input', {
                    type: "checkbox",
                    checked: done.value, 'onInput': ({ target }: InputEventInit) => {
                        done.value = target.checked
                    }
                }),
                h('br'),
                createVNode('button', a, `点击${num.value}`, 0, []),
                h(HelloWorld, { msg: count.value }),
            ] : [
                h(HelloWorld, { msg: count.value }),
                h('div', { num: num.value }, '你好 - a'),
                h('div', '你好'),
                createVNode('button', a, `点击${num.value}`, 0, []),
            ]
        }
    }
}

function Content() {
    const [count, setCount] = useState(1)
    const props = useProps() as any
    return <>
        <button onClick={() => setCount(count + 1)}>点击 {count}-props - {props.count}</button>
        <br />
        <br />
        <DefineMemoComponent>
            {
                {
                    default: () => {
                        return (<Content2 count={count} />)
                    }
                }
            }
        </DefineMemoComponent>
    </>
}

function Content2() {
    const [count, setCount] = useState(1)
    const props = useProps() as any
    return <>
        <button onClick={() => setCount(count + 1)}>点击 {count}-props2 - {props.count}</button>
    </>
}


function Button(): any {
    const [count, setCount] = useState(1);
    return <>
        <button onClick={() => setCount(count + 1)}>点击{count}</button>
        <br />
        <br />
    </>
}

</script>

<template>
    <button @click="count++">点击{{ count }}</button>
    <!--    <HelloWorld :msg="msg" v-if="count % 2"/>-->
    <!--    <h1 :num="count">-&#45;&#45;&#45;&#45;&#45;&#45;&#45;&#45;</h1>-->
    <!--    <b>1231</b>-->
    <!--    <HelloWorld :msg="msg"/>-->
    <!--    <A/>-->
    <br />
    <br />
    <DefineMemoRender :render="Button" />
    <div>
        <DefineMemoComponent>
            <template v-slot:default>
                <Content :count="count" v-for="i in 5"/>
                <hr>
                <br/>
                <br/>
                <Button :count="count" />
            </template>
        </DefineMemoComponent>
    </div>
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
