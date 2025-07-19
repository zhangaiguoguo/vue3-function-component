# Vue Function Component 插件使用指南

## 概述

Vue Function Component 是一个为 Vue 3 设计的函数式组件库，提供了类似 React Hooks 的 API，让开发者能够以函数式的方式编写 Vue 组件。本文将详细介绍该插件的核心功能、API 使用方法以及在 Vite 中的配置。

## 安装与配置

### 安装

```bash
npm install vue-function-component
# 或
yarn add vue-function-component
```

## 核心 API 介绍

### 1. 组件定义

#### `defineFunctionComponent`

定义函数式组件，类似于 React 的函数组件。

```typescript
import { defineFunctionComponent } from 'vue-function-component'

// 基本用法
const MyComponent = defineFunctionComponent((props) => {
  return <div>Hello, {props.name}</div>
})

// 带选项的用法
const MyComponentWithOptions = defineFunctionComponent(
  (props) => {
    return <div>Hello, {props.name}</div>;
  },
  {
    name: "MyComponent",
    props: ["name"] as const,
    props: {
      name: { required: true, type: String, default: "my-function-component" },
    },
    emits: ["click"],
  }
);
```

#### `defineFunctionSlots`

定义插槽：

```typescript
  const divRef = useRef();
  const slots = useSlots();
  return (
    <div ref={divRef}>
      {slots.header?.()}
      {slots.default?.({ children: "Main Content" })}
      {slots.footer?.()}
    </div>
  );
}

const ComponentWithSlots = defineFunctionComponent(() => {
  const slots = defineFunctionSlots(<h1>1</h1>);

  return (
    <div>
      {slots.default()}
      <Ccc>
        {defineFunctionSlots(
          (props) => (
            <div>Default Slot: {props.children}</div>
          ),
          {
            header: () => <div>Header Slot</div>,
            footer: () => <div>Footer Slot</div>,
          }
        )}
      </Ccc>
    </div>
  );
});
```

### 2. JSX 支持

#### `createJsxFunctionComponent`

包装函数组件，提供记忆化优化：

##### Vite 配置

在 `vite.config.ts` 中添加以下配置：

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsxFactory: "h",
    jsxFragment: "Fragment",
    jsxInject: "import { createJsxFunctionComponent as h, Fragment } from 'vue-function-component'",
  }
})
```

`如果不是vite工程的话 需要在现有工程上中配置 JSX 工厂函数`

```typescript


const Header = () => {
  useEffect(() => {

  })
  return <header>header</header>
}

const HeaderVnode = createJsxFunctionComponent(Header)
const HeaderVnode2 = createJsxFunctionComponent(Header)

console.log(HeaderVnode.type === HeaderVnode2.type) // true

const divVnode = createJsxFunctionComponent(
  "div", 
  { a: 1 }, 
  createJsxFunctionComponent('h1', null, 'Title')
)

const A = () => {
  console.log(useState())
  return <Header/>
}

const B = () => {
  console.log(useState())
  return <A/>
}


```

#### `markRegularFunctionComponent`

标记函数组件，跳过记忆化转换：

```typescript
const Bodyer = markRegularFunctionComponent(() => <h1>mark</h1>)
const vnode = createJsxFunctionComponent(Bodyer) // 不会进行记忆化优化
```

### 3. Hooks API

#### `useState`

状态管理 Hook：

```typescript
const Counter = defineFunctionComponent(() => {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
})
```

#### `useEffect`

副作用 Hook：

```typescript
const EffectExample = defineFunctionComponent(({ id }) => {
  useEffect(() => {
    console.log('Component mounted or id changed:', id)
    
    return () => {
      console.log('Cleanup before unmount or before next effect')
    }
  }, [id]) // 依赖数组
  
  return <div>Check console for effect logs</div>
})
```

#### `useContext`

上下文 Hook（需要先创建上下文）：

```typescript
// 创建上下文
const ThemeContext = createContext('light')

const ThemedButton = defineFunctionComponent(() => {
  const theme = useContext(ThemeContext)
  
  return (
    <button style={{ background: theme === 'dark' ? '#333' : '#EEE' }}>
      Themed Button
    </button>
  )
})

const App = defineFunctionComponent(() => {
  return (
    <ThemeContext.Provider value="dark">
      <ThemedButton />
    </ThemeContext.Provider>
  )
})
```

#### 其他 Hooks

- `useReducer`: 类似 Redux 的状态管理
- `useRef`: 获取可变引用
- `useMemo`: 记忆化计算
- `useCallback`: 记忆化函数
- `useLayoutEffect`: 在 DOM 更新后同步执行
- `useTransition`: 并发模式过渡
- `useDeferredValue`: 延迟更新值
- `useSyncExternalStore`: 订阅外部存储
- `useImperativeHandle`: 暴露自定义实例值

### 4. 生命周期

- `onBeforeUnmount`: 组件卸载前调用
- `onUnMounted`: 组件卸载后调用

```typescript
const LifecycleExample = defineFunctionComponent(() => {
  onBeforeUnmount(() => {
    console.log('Before unmount')
  })
  
  onUnMounted(() => {
    console.log('After unmount')
  })
  
  return <div>Check console when navigating away</div>
})
```

## 高级用法

### 异步组件

```typescript
const AsyncComponent = defineFunctionComponent({
  loader: () => import('./HeavyComponent.vue'),
  loading: () => <div>Loading...</div>,
  error: (props) => <div>Error: {props.error?.message}</div>
})
```

### 自定义 Hooks

```typescript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue)
  
  const increment = () => setCount(c => c + 1)
  const decrement = () => setCount(c => c - 1)
  
  return { count, increment, decrement }
}

const CounterApp = defineFunctionComponent(() => {
  const { count, increment, decrement } = useCounter(10)
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
    </div>
  )
})
```

## 与 Vue 选项式 API 对比

| 特性 | Vue Function Component | Vue 选项式 API |
|------|------------------------|---------------|
| 组件定义 | 函数式 | 对象式 |
| 状态管理 | `useState` | `data()` |
| 副作用 | `useEffect` | `mounted`, `updated` 等生命周期 |
| 上下文 | `useContext` | `provide/inject` |
| 事件 | `emits` 选项 | `emits` 选项 |
| 插槽 | `defineFunctionSlots` | `slots` 选项 |

## 注意事项

1. **Hooks 调用顺序**：必须在组件顶层调用 Hooks，不能在条件或循环中调用
2. **性能优化**：对于复杂计算，使用 `useMemo` 或 `useCallback` 避免不必要的重计算
3. **TypeScript 支持**：插件提供了完善的 TypeScript 类型定义
4. **与 Vue 生态兼容**：可以与 Vue Router、Pinia 等库一起使用

## 示例项目结构

```
src/
├── components/
│   ├── Counter.tsx
│   ├── ThemeProvider.tsx
│   └── AsyncComponent.tsx
├── hooks/
│   ├── useCounter.ts
│   └── useFetch.ts
├── App.tsx
└── main.ts
```

## 总结

Vue Function Component 提供了一种在 Vue 3 中使用函数式组件和类似 React Hooks 的编程模式。它特别适合喜欢 React Hooks 风格的开发者，或者需要在 Vue 和 React 之间共享逻辑的场景。通过合理的使用，可以编写出更加简洁和可维护的组件代码。