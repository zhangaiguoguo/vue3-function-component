<template>
    <component :is="slotDefaultVnode" v-if="slotDefaultVnode" />
</template>
<script lang="ts" setup>
import { useSlots, defineProps, withDefaults, shallowRef, VNodeNormalizedChildren } from "vue";
import { transformVNodeFunctionComponentTypeWithMemo, useDefineSlot } from "@/hooks/index.ts";

const slots = useSlots() as { default: () => VNodeNormalizedChildren }

export interface Props {
    render?: Function | null
}

const props = withDefaults(defineProps<Props>(), {
    render: null
})

const slotDefaultVnode = shallowRef({
    render() {
        return transformVNodeFunctionComponentTypeWithMemo(useDefineSlot(slots, 'default') as VNodeNormalizedChildren)
    }
})

</script>