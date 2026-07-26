<script setup lang="ts">
import { ArrowLeft, ChevronLeft, ChevronRight, Lightbulb, Menu, RefreshCw } from '@lucide/vue'

defineProps<{
  loading: boolean
  title: string
  darkTheme: boolean
  statisticsMode: boolean
  statisticsMonthLabel: string
}>()

const emit = defineEmits<{
  openMenu: []
  closeStatistics: []
  nextStatisticsMonth: []
  previousStatisticsMonth: []
  refresh: []
  toggleTheme: []
}>()
</script>

<template>
  <header class="topbar">
    <button class="icon-button menu-button" title="Открыть меню" @click="emit('openMenu')"><Menu :size="21" /></button>
    <button v-if="statisticsMode" class="topbar-statistics-back" type="button" @click="emit('closeStatistics')"><ArrowLeft :size="19" />Назад</button>
    <div>
      <p v-if="!statisticsMode" class="eyebrow">Панель управления</p>
      <h1>{{ statisticsMode ? 'Статистика' : title }}</h1>
    </div>
    <div class="topbar-actions">
      <div v-if="statisticsMode" class="topbar-month-picker">
        <button type="button" aria-label="Предыдущий месяц" @click="emit('previousStatisticsMonth')"><ChevronLeft :size="18" /></button>
        <strong>{{ statisticsMonthLabel }}</strong>
        <button type="button" aria-label="Следующий месяц" @click="emit('nextStatisticsMonth')"><ChevronRight :size="18" /></button>
      </div>
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
