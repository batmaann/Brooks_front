<script lang="ts">
import { ref } from 'vue'

export default {

  
  setup() {
    const count = ref(0)
    
    return {
      count
    }
  }
}
</script>


<template>

  <h1>Транспортное средство11</h1>
  <button @click="count++">
    Счётчик: {{ count }}
  </button>
 
</template>