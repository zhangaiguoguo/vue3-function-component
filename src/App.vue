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
} from "@/vueFunctionComponent";
import { getCurrentInstance, onMounted, onUnmounted, ref } from "vue";

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
    console.log("getSnapshot");
    return todos.length % 2 ? todos : window.a||(window.a = [...todos]);
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
    useEffect(() => {
      console.log(1);
      return () => {
        console.log(2);
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
const B = defineFunctionComponent(() => {
  return (
    <div>
      <h1>B</h1>
    </div>
  );
});
const count = ref(0);
</script>
<template>
  <div class="app_class">
    <div>
      <button @click="count++">count++{{ count }}</button>
    </div>
    <A :a="1" :b="count" v-for="item in 1" />
  </div>
</template>
