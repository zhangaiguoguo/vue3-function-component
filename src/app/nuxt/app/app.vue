<template>
  <div>
    <NuxtRouteAnnouncer />
    <Suspense>
      <Button></Button>
      <template #fallback>
        <div>loading...</div>
      </template>
    </Suspense>
    <Layout />
  </div>
</template>
<script setup lang="tsx">
import { useSSRContext } from "vue";
import {
  defineFunctionComponent,
  useEffect,
  useState,
} from "vue-function-component";
const Layout = defineFunctionComponent<{}>({
  loader() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve((props) => {
          const [count, setCount] = useState(1);
          useEffect(() => {});
          return (
            <>
              <div>Layout - {count}</div>
              <button onClick={() => setCount(count + 1)}>count++</button>
            </>
          );
        });
      }, 1000);
    });
  },
  loading() {
    return <div>Loading Layout...</div>;
  },
});

const Button = defineAsyncComponent({
  loader() {
    return import("../components/button.vue");
  },
  timeout: 2000,
  loadingComponent(){
    return "<div>Loading Button...</div>";
  }
});

console.log(Button);
</script>
