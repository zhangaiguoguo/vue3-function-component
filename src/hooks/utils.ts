export const isArray = Array.isArray

export function transformArray(target: any | Array<any>) {
    return isArray(target) ? target : [target]
}

export function transformFunction(target: any) {
    return isFunction(target) ? target : () => target
}


export function isFunction(target: any | Function) {
    return typeof target === "function"
}

const toStringCall = Object.prototype.toString;

export function toRawType(target: any | never) {
    return toStringCall.call(target).slice(8, -1);
}


// @ts-ignore
export function isObject(target: any | never) {
    return toRawType(target) === "Object"
}

export const is = Object.is