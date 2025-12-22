<script lang="ts">
export default {
  data() {
    return {
      count: 0

    }
  }
}
</script>

<template>
  <h1 id="red">Test</h1>
  {{ count }}
  <button @click="count++">counter++</button>
</template>