<template>
  <button>点击</button>
</template>
<script setup lang="tsx">
await new Promise((res) => {
  setTimeout(res, 3000);
});
</script>
