<template>
    <component :is="slotDefaultVnode" v-if="slotDefaultVnode" />
</template>
<script lang="ts" setup>
import { useSlots, defineProps, withDefaults, shallowRef, VNodeNormalizedChildren, useAttrs, h } from "vue";
import { defineMemoRender, transformVNodeFunctionComponentTypeWithMemo, useDefineSlot } from "@/hooks/index.ts";

const slots = useSlots() as { default: () => VNodeNormalizedChildren }

export interface Props {
    render?: Function | null
}

const props = withDefaults(defineProps<Props>(), {
    render: null
})

const attrs = useAttrs()

const slotDefaultVnode = shallowRef({
    render() {

        if (typeof props.render === "function") {
            return h(defineMemoRender(props.render) as any, attrs)
        }
        return transformVNodeFunctionComponentTypeWithMemo(useDefineSlot(slots, 'default') as VNodeNormalizedChildren)
    }
})

</script>