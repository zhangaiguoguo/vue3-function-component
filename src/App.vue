<script setup lang="tsx">

import HelloWorld from '@/components/HelloWorld.vue';
import { createVNode, h, onMounted, ref } from "vue";
import { memo, useProps, useState } from './hooks';

const msg = ref('Vite + Vue')
const count = ref(1)

onMounted(() => {
})

defineExpose({
    msg
})

const Content = memo(function Content() {

    const props = useProps()

    const [count, setcount] = useState(1);

    return (<>

        {
            new Array(1).fill(0).map((s, i) => {
                return <>
                    <div>
                        <h1>
                            {i} - {count}
                        </h1>
                        <button onClick={() => setcount(count + 1)}>点击</button>
                    </div>
                </>
            })
        }

    </>)
})


const A = {
    setup(_props, _context) {
        const num = ref(1)
        const done = ref(true)
        return () => {
            const a = { onClick: () => num.value++, num: num.value }
            return num.value % 2 || true ? [
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
                <Content count={count.value} />
            ] : [
                h(HelloWorld, { msg: count.value }),
                h('div', { num: num.value }, '你好 - a'),
                h('div', '你好'),
                createVNode('button', a, `点击${num.value}`, 0, []),
            ]
        }
    }
}

</script>

<template>
    <button @click="count++">点击{{ count }}</button>
    <hr>
    <A />
    <hr>
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
