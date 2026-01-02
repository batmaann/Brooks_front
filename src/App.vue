<script lang="ts">
import Vehicle from '@/components/Vehicle.vue';

export default {
  components: {
    Vehicle
  },
  data() {
    return {
      isVisible: true
    };
  }
}
</script>

<template>
  <Vehicle />

  <h1>Транспортное средство</h1>
  <p v-if="isVisible">Вы меня видите!</p>
  <p v-else>А теперь нет.</p>
  <button @click="isVisible = !isVisible">Переключить</button>
</template>