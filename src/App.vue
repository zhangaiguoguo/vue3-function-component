<script setup lang="tsx">

import HelloWorld from '@/components/HelloWorld.vue';
import { createVNode, getCurrentInstance, h, onMounted, ref } from "vue";
import DefineMemoRender from "@/hooks/DefineMemoRender.vue"
import { defineMemoRender, useMemo, useState } from './hooks';
import { useUpdate } from './hooks';

const msg = ref('Vite + Vue')
const count = ref(1)

onMounted(() => {
})

defineExpose({
    msg
})



const A = {
    setup(props, context) {
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

function Button(): any {
    const [count, setCount] = useState(1);
    const Content = useMemo(() => {
        return defineMemoRender(() => {
            const [count, setCount] = useState(1)
            return <>
                <button onClick={() => setCount(count + 1)}>点击{count}</button>
            </>
        })
    }, [])
    return <>
        <button onClick={() => setCount(count + 1)}>点击{count}</button>
        <br />
        <br />
        <Content />
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
    <DefineMemoRender>
        <Button></Button>
    </DefineMemoRender>
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
