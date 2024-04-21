<script setup lang="ts">

import {useModelProps} from "@/hooks/index"
import {ref} from 'vue'

defineProps<{ msg: string | number }>()


const msg = useModelProps("msg")

const emit = defineEmits(['update:msg'])

let done = ref(false)

</script>

<template>
    <h1>{{ msg }}</h1>
    <input type="text" v-model="msg">
    <input type="checkbox" v-model="done">
</template>

<style scoped>
.read-the-docs {
    color: #888;
}
</style>
