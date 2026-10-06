<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { X } from '@lucide/vue'
import AppSidebar from '@/components/navigation/AppSidebar.vue'
import AppTopbar from '@/components/navigation/AppTopbar.vue'
import InterfaceHelp from '@/components/navigation/InterfaceHelp.vue'
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

const shell = ref<HTMLElement>()
const helpOpen = ref(false)
const helpTargets = ref<{ text: string; side: boolean; left: number; top: number; width: number; height: number }[]>([])
let previousFocus: HTMLElement | null = null

function measureHelp() {
  helpTargets.value = Array.from(shell.value?.querySelectorAll<HTMLElement>('[data-help]') ?? []).map((element) => {
    const rect = element.getBoundingClientRect()
    return { text: element.dataset.help ?? '', side: !!element.closest('.sidebar'), left: rect.left, top: rect.top, width: rect.width, height: rect.height }
  })
}

async function showHelp() {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  helpOpen.value = true
  await nextTick()
  measureHelp()
  window.addEventListener('resize', measureHelp)
}

async function closeHelp() {
  helpOpen.value = false
  window.removeEventListener('resize', measureHelp)
  await nextTick()
  previousFocus?.focus()
}

onBeforeUnmount(() => window.removeEventListener('resize', measureHelp))
</script>

<template>
  <div ref="shell" class="app-shell" :class="{ 'help-open': helpOpen }" :inert="helpOpen">
    <AppSidebar
      :active-view="activeView"
      :open="mobileNavOpen || helpOpen"
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
        @show-help="showHelp"
        @previous-statistics-month="emit('previousStatisticsMonth')"
        @toggle-theme="emit('toggleTheme')"
      />

      <main class="content">
        <div v-if="error" class="error-banner"><span>{{ error }}</span><button title="Закрыть" @click="emit('clearError')"><X :size="18" /></button></div>
        <slot />
      </main>
    </div>
  </div>
  <InterfaceHelp v-if="helpOpen" :targets="helpTargets" @close="closeHelp" />
</template>
