<script setup lang="tsx">
import { defineFunctionComponent } from "@/vueFunctionComponent";
import { onMounted, onUnmounted, ref } from "vue";

onUnmounted(() => {
  console.log("app destory");
});

onMounted(() => {
  console.log("app mounted");
});

const A = defineFunctionComponent(
  {
    loader() {
      return new Promise((resolve) => {
        // a;
        setTimeout(() => {
          resolve((props, context) => {
            console.log(props, context);
            return (
              <div>
                <h1>A</h1>
                <B />
              </div>
            );
          });
        }, 1000);
      });
    },
    loading: () => <div>Loading A...</div>,
    error(props) {
      console.log(props.error);
      return <div>Error loading A {props.error + ""}</div>;
    },
  },
  {
    name: "A",
    props: {
      a: {},
      b: {},
    },
  }
);
const B = defineFunctionComponent({
  loader() {
    return new Promise((resolve) => {
      a
      setTimeout(() => {
        resolve(() => {
          return (
            <div>
              <h1>B</h1>
            </div>
          );
        });
      }, 1000);
    });
  },
  error(){
    return "error"
  },
  loading(){
    return <div>B loading...</div>
  }
});
const count = ref(0);
</script>
<template>
  <div>
    <div>
      <button @click="count++">count++{{ count }}</button>
    </div>
    <A :a="1" :b="count" />
  </div>
</template>
