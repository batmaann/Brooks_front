<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>

<template>
  <div class="delete-content">
    <p>Вы действительно хотите удалить «{{ label }}»?</p>
    <span>Это действие нельзя будет отменить после удаления.</span>
  </div>
</template>

