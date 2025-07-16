<script setup lang="tsx">
import {
  defineFunctionComponent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  useReducer,
  useSyncExternalStore,
  startTransition,
  useRef,
  useImperativeHandle,
  useLayoutEffect,
  useTransition,
  defineFunctionSlots,
  useSetupContext,
  useProps,
  createContext,
} from "@/vueFunctionComponent";
import { getCurrentInstance, h, ref } from "vue";

let nextId = 0;
let todos = [{ id: nextId++, text: "Todo #1" }];
let listeners = [];

const todosStore = {
  addTodo() {
    todos = [...todos, { id: nextId++, text: "Todo #" + nextId }];
    emitChange();
    console.log("1-1");
  },
  subscribe(listener) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  getSnapshot() {
    return todos;
  },
};

function emitChange() {
  for (let listener of listeners) {
    listener();
  }
}

const A = defineFunctionComponent(
  (props, context) => {
    const [count, setCount] = props.b % 2 || true ? useState(1) : [1, () => 1];
    const [state, dispatch] = useReducer(
      (v, type) => {
        switch (type.type) {
          case 1:
            return { ...v, a: v.a + 1 };
        }
        return v;
      },
      { a: 1 }
    );
    const setCount2 = useCallback(() => {
      startTransition(() => {
        setCount(count + 1);
      });
      return 1;
    }, [count]);
    // console.log(count % 2 ? useState(() => 3) : useId());
    useEffect(() => {});
    useEffect(() => {
      // console.log(1);
      return () => {
        // console.log(2);
      };
    }, [count]);
    const obj = useMemo(
      () => ({
        count: count,
      }),
      [count]
    );
    const todos = useSyncExternalStore(
      todosStore.subscribe,
      todosStore.getSnapshot
    );
    useState();
    const bRef = useRef();
    useId();
    // !(count % 2) ? useEffect(() => {
    //   console.log(1);
    //   return () => {
    //     console.log(2);
    //   };
    // }, [count]) : useCallback(() => 1,[]);
    return (
      <div>
        <h1>A - {count * props.a}</h1>
        <h1>memo-count - {JSON.stringify(obj)}</h1>
        <button onClick={setCount2}>count++</button>
        <h1>state - {JSON.stringify(state)}</h1>
        <button
          onClick={() => {
            dispatch({ type: 1 });
          }}
        >
          state.a++
        </button>
        <br />

        <button onClick={() => todosStore.addTodo()}>Add todo</button>
        <hr />
        <ul>
          {todos.map((todo) => (
            <li key={todo.id}>{todo.text}</li>
          ))}
        </ul>
        {<B a={bRef} />}
      </div>
    );
  },
  {
    name: "A",
    props: {
      a: {},
      b: {},
    },
  }
);
const B = defineFunctionComponent(({ a: aRef }) => {
  const inputRef = useRef();
  const divRef = useRef();
  const [count, setCount] = useState(1);
  const [isPending, startTransition] = useTransition();
  const setCountHandler = useCallback(() => {
    startTransition(() => {
      setCount((a) => {
        return a + 1;
      });
    });
  }, [count]);
  useImperativeHandle(
    aRef,
    () => {
      return {
        focus() {
          inputRef.current.focus();
        },
      };
    },
    [inputRef.current]
  );

  useLayoutEffect(() => {
    divRef.current.style.color = "red";
  }, []);

  useEffect(() => {}, [divRef]);

  return (
    <>
      <div ref={divRef}>
        <h1>B - {count}</h1>
        <p>{isPending ? "加载中..." : null}</p>
        <button onClick={setCountHandler}>点击count++</button>
        <div></div>
        <input type="text" ref={inputRef} autofoucus />
        {/* {count % 2 ? new Array(500).fill(1).map((_, i) => <h1><SlowPost index={i + 1} /></h1>) : null} */}
      </div>
    </>
  );
});
function SlowPost({ index }) {
  let startTime = performance.now();
  while (performance.now() - startTime < 1) {
    // 每个 item 都等待 1 毫秒以模拟极慢的代码。
  }

  return <li className="item">Post #{index + 1}</li>;
}
const count = ref(1);
</script>
<template>
  <div class="app_class">
    <div>
      <button @click="count++">count++{{ count }}</button>
    </div>
    <A :a="1" v-show="1" :b="count" v-for="item in 1" />
  </div>
</template>
