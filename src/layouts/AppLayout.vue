<script setup lang="ts">
import { X } from '@lucide/vue'
import AppSidebar from '@/components/navigation/AppSidebar.vue'
import AppTopbar from '@/components/navigation/AppTopbar.vue'
import type { AppView } from '@/types/navigation'

defineProps<{
  activeView: AppView
  darkTheme: boolean
  error: string
  loading: boolean
  mobileNavOpen: boolean
  statisticsMode: boolean
  statisticsMonthLabel: string
  title: string
}>()

const emit = defineEmits<{
  about: []
  clearError: []
  closeMenu: []
  closeStatistics: []
  logout: []
  nextStatisticsMonth: []
  openMenu: []
  refresh: []
  previousStatisticsMonth: []
  selectView: [view: AppView]
  toggleTheme: []
}>()
</script>

<template>
  <div class="app-shell">
    <AppSidebar
      :active-view="activeView"
      :open="mobileNavOpen"
      @about="emit('about')"
      @close="emit('closeMenu')"
      @logout="emit('logout')"
      @select="emit('selectView', $event)"
    />

    <div class="workspace">
      <AppTopbar
        :dark-theme="darkTheme"
        :loading="loading"
        :statistics-mode="statisticsMode"
        :statistics-month-label="statisticsMonthLabel"
        :title="title"
        @close-statistics="emit('closeStatistics')"
        @next-statistics-month="emit('nextStatisticsMonth')"
        @open-menu="emit('openMenu')"
        @refresh="emit('refresh')"
        @previous-statistics-month="emit('previousStatisticsMonth')"
        @toggle-theme="emit('toggleTheme')"
      />

      <main class="content">
        <div v-if="error" class="error-banner"><span>{{ error }}</span><button title="Закрыть" @click="emit('clearError')"><X :size="18" /></button></div>
        <slot />
      </main>
    </div>
  </div>
</template>
