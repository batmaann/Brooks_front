<script setup lang="ts">
import { ArrowLeft, ChevronLeft, ChevronRight, Info, Lightbulb, Menu } from '@lucide/vue'

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
  showHelp: []
  toggleTheme: []
}>()
</script>

<template>
  <header class="topbar" :class="{ 'topbar-statistics': statisticsMode }">
    <button class="icon-button menu-button" title="Открыть меню" @click="emit('openMenu')"><Menu :size="21" /></button>
    <button v-if="statisticsMode" class="topbar-statistics-back" type="button" aria-label="Назад на главную" title="Назад на главную" @click="emit('closeStatistics')"><ArrowLeft :size="19" />Назад</button>
    <div class="topbar-heading">
      <p v-if="!statisticsMode" class="eyebrow">Панель управления</p>
      <h1>{{ statisticsMode ? 'Статистика' : title }}</h1>
    </div>
    <div v-if="statisticsMode" class="topbar-month-picker">
        <button type="button" aria-label="Предыдущий месяц" @click="emit('previousStatisticsMonth')"><ChevronLeft :size="18" /></button>
        <strong>{{ statisticsMonthLabel }}</strong>
        <button type="button" aria-label="Следующий месяц" @click="emit('nextStatisticsMonth')"><ChevronRight :size="18" /></button>
    </div>
    <div class="topbar-actions">
      <button class="icon-button interface-help-button" type="button" title="Показать подсказки" aria-label="Показать подсказки" @click="emit('showHelp')">
        <Info :size="20" />
      </button>
      <button
        class="icon-button theme-toggle"
        data-help="Тема оформления — нажмите на лампочку, чтобы переключить светлую и тёмную тему интерфейса."
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

<style scoped>
@media (max-width: 760px) {
  .interface-help-button { display: none; }
}
</style>
