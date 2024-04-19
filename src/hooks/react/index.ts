import * as vue from "vue"
import {defineCacheRender} from "@/hooks/index.ts";

export default new Proxy({
    h() {
        const args = [...arguments]
        const type = typeof args[0] === "function" ? defineCacheRender(args[0]) : args[0]
        return vue.h(type, ...(args.slice(1)))
    }
}, {
    get(target, key) {
        // @ts-ignore
        if (target[key]) {
            return Reflect.get(target, key)
        }
        // @ts-ignore
        return Reflect.get(vue, key)
    }
})