<script setup lang="ts">
import { X } from '@lucide/vue'

defineProps<{
  closeDanger?: boolean
  eyebrow: string
  showFooter?: boolean
  title: string
  wide?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="modal-backdrop" @mousedown.self="emit('close')">
    <section class="modal" :class="{ wide }">
      <header>
        <div>
          <p class="eyebrow">{{ eyebrow }}</p>
          <h2>{{ title }}</h2>
        </div>
        <button class="icon-button" :class="{ danger: closeDanger }" title="Закрыть" @click="emit('close')"><X :size="20" /></button>
      </header>

      <slot />

      <footer v-if="showFooter && $slots.footer">
        <slot name="footer" />
      </footer>
    </section>
  </div>
</template>
