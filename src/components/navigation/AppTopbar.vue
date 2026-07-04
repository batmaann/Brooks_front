<script setup lang="ts">
import { Lightbulb, Menu, RefreshCw } from '@lucide/vue'

defineProps<{
  loading: boolean
  title: string
  darkTheme: boolean
}>()

const emit = defineEmits<{
  openMenu: []
  refresh: []
  toggleTheme: []
}>()
</script>

<template>
  <header class="topbar">
    <button class="icon-button menu-button" title="Открыть меню" @click="emit('openMenu')"><Menu :size="21" /></button>
    <div>
      <p class="eyebrow">Панель управления</p>
      <h1>{{ title }}</h1>
    </div>
    <div class="topbar-actions">
      <button class="icon-button" title="Обновить данные" :disabled="loading" @click="emit('refresh')">
        <RefreshCw :class="{ spin: loading }" :size="19" />
      </button>
      <button
        class="icon-button theme-toggle"
        :class="{ active: darkTheme }"
        :title="darkTheme ? 'Выключить темную тему' : 'Включить темную тему'"
        type="button"
        @click="emit('toggleTheme')"
      >
        <Lightbulb :size="20" />
      </button>
    </div>
  </header>
</template>
