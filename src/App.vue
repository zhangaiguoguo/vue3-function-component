<script setup lang="tsx">

import HelloWorld from '@/components/HelloWorld.vue';
import { createVNode, h, onMounted, ref } from "vue";
import { memo, useImperativeHandle, useProps, useRef, useState } from './hooks';

const msg = ref('Vite + Vue')
const count = ref(1)

onMounted(() => {
})

defineExpose({
    msg
})

const Input = function () {
    const { ref2 } = useProps()
    const inputRef = useRef(null)
    useImperativeHandle(ref2, () => {
        console.log(1);

        return {
            focus() {
                inputRef.value.focus()
            }
        }
    }, [inputRef.value])

    console.log(inputRef.value, ref2);

    return (
        <input ref={inputRef} />
    )
}

const Content = function () {
    const [count, setCount] = useState(1)
    const inputRef = useRef(null)

    return <>
        <button onClick={() => setCount(count + 1)}>
            点击{count}
        </button>
        <div>
            你好
        </div>
        <br />
        <Input ref2={inputRef} />
        <button onClick={() => inputRef.value.focus()}>
            获取焦点
        </button>
    </>
}


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
                <Content count={count.value}/>
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
