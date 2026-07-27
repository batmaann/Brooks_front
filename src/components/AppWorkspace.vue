<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue'
import { ApiError } from '@/api'
import AppModalLayer from '@/components/modals/AppModalLayer.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { navItems } from '@/constants/navigation'
import DashboardView from '@/views/DashboardView.vue'
import RefuelingsView from '@/views/RefuelingsView.vue'
import StatisticsView from '@/views/StatisticsView.vue'
import { useSubmitState } from '@/composables/useSubmitState'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { useFinanceStore } from '@/stores/finance'
import { useFleetStore } from '@/stores/fleet'
import { useFinanceWorkspace } from '@/composables/useFinanceWorkspace'
import { useFleetWorkspace } from '@/composables/useFleetWorkspace'
import { useWorkspaceData } from '@/composables/useWorkspaceData'
import { useWorkspaceModals, type WorkspaceDeleteResource } from '@/composables/useWorkspaceModals'
import { financeWorkspaceKey, fleetWorkspaceKey, workspaceModalsKey, workspaceUiKey } from '@/composables/useWorkspaceContext'
import type { AppView } from '@/types/navigation'

type View = AppView

const { applyTheme, isDarkTheme, toggleTheme } = useTheme()
const authStore = useAuthStore()
const financeStore = useFinanceStore()
const fleetStore = useFleetStore()

const activeView = ref<View>('dashboard')
const mobileNavOpen = ref(false)
const search = ref('')
const transactionSearch = ref('')
const dashboardControlsOpen = ref(false)
const statisticsOpen = ref(false)
const statisticsMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const statisticsRefreshKey = ref(0)
const statisticsMetric = ref<'income' | 'expense' | 'saving'>('expense')
const { error, saving, submit: submitState } = useSubmitState((requestError) => requestError instanceof ApiError ? requestError.message : 'Не удалось сохранить данные')

const deferred = {
  loadData: null as null | (() => Promise<void>),
  requestDelete: null as null | ((resource: WorkspaceDeleteResource, id: number, label: string) => void),
  submit: null as null | ((action: () => Promise<void>, options?: { closeAfter?: boolean }) => Promise<void>),
}

function loadData() {
  return deferred.loadData!()
}

function requestDelete(resource: WorkspaceDeleteResource, id: number, label: string) {
  return deferred.requestDelete!(resource, id, label)
}

function submit(action: () => Promise<void>, options?: { closeAfter?: boolean }) {
  return deferred.submit!(action, options)
}

const finance = useFinanceWorkspace({
  error,
  financeStore,
  loadData: () => loadData(),
  requestDelete: (resource, id, label) => requestDelete(resource, id, label),
  submit: (action, options) => submit(action, options),
  transactionSearch,
})
const fleet = useFleetWorkspace({
  error,
  fleetStore,
  loadData: () => loadData(),
  requestDelete: (resource, id, label) => requestDelete(resource, id, label),
  search,
  submit: (action, options) => submit(action, options),
})

const {
  clearTransactionSelection,
  keepExistingTransactionSelection,
  resetDictionaryEditors,
  selectedTransactionIds,
  transactions,
} = finance

const {
  clearRefuelingSelection,
  editingRefuelingId,
  keepExistingRefuelingSelection,
  prepareCreateRefueling,
  refuelingControlsOpen,
  refuelings,
  resetRefuelingEditor,
  selectedRefuelingIds,
  startEditRefueling: prepareEditRefueling,
} = fleet

const workspaceData = useWorkspaceData({
  authStore,
  clearRefuelingSelection,
  clearTransactionSelection,
  error,
  financeStore,
  fleetStore,
  keepExistingRefuelingSelection,
  keepExistingTransactionSelection,
  refuelings,
  transactions,
})
const workspaceModals = useWorkspaceModals({
  clearRefuelingSelection,
  clearTransactionSelection,
  editingRefuelingId,
  error,
  financeStore,
  fleetStore,
  loadData: workspaceData.loadData,
  prepareCreateRefueling,
  prepareEditRefueling,
  resetDictionaryEditors,
  resetRefuelingEditor,
  saving,
  selectedRefuelingIds,
  selectedTransactionIds,
  submitState,
})

deferred.loadData = workspaceData.loadData
deferred.requestDelete = workspaceModals.requestDelete
deferred.submit = workspaceModals.submit

provide(financeWorkspaceKey, finance)
provide(fleetWorkspaceKey, fleet)
provide(workspaceModalsKey, workspaceModals)
provide(workspaceUiKey, {
  dashboardControlsOpen,
  error,
  saving,
  search,
  transactionSearch,
})

const { loadData: refreshWorkspace, loading, logout } = workspaceData
const { openModal } = workspaceModals

const viewTitle = computed(() => navItems.find((item) => item.id === activeView.value)?.label || '')
const statisticsMonthLabel = computed(() => new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
}).format(statisticsMonth.value).replace(/^./, (letter) => letter.toUpperCase()))

function shiftStatisticsMonth(offset: number) {
  statisticsMonth.value = new Date(
    statisticsMonth.value.getFullYear(),
    statisticsMonth.value.getMonth() + offset,
    1,
  )
}

function openStatistics(metric: 'income' | 'expense' | 'saving' | 'total') {
  statisticsMetric.value = metric === 'total' ? 'expense' : metric
  statisticsOpen.value = true
}

function refreshCurrentView() {
  if (statisticsOpen.value) {
    statisticsRefreshKey.value += 1
    return
  }
  refreshWorkspace()
}

function selectView(view: View) {
  statisticsOpen.value = false
  activeView.value = view
  search.value = ''
  mobileNavOpen.value = false
  dashboardControlsOpen.value = false
  refuelingControlsOpen.value = false
}

onMounted(() => {
  applyTheme()
  refreshWorkspace()
})
</script>

<template>
  <AppLayout
    :active-view="activeView"
    :dark-theme="isDarkTheme"
    :error="error"
    :loading="loading"
    :mobile-nav-open="mobileNavOpen"
    :statistics-mode="statisticsOpen"
    :statistics-month-label="statisticsMonthLabel"
    :title="statisticsOpen ? 'Статистика' : viewTitle"
    @about="openModal('about')"
    @clear-error="error = ''"
    @close-menu="mobileNavOpen = false"
    @close-statistics="statisticsOpen = false"
    @logout="logout"
    @open-menu="mobileNavOpen = true"
    @next-statistics-month="shiftStatisticsMonth(1)"
    @previous-statistics-month="shiftStatisticsMonth(-1)"
    @refresh="refreshCurrentView"
    @select-view="selectView"
    @toggle-theme="toggleTheme"
  >
    <StatisticsView v-if="statisticsOpen" :initial-metric="statisticsMetric" :month="statisticsMonth" :refresh-key="statisticsRefreshKey" />
    <DashboardView v-else-if="activeView === 'dashboard'" @open-statistics="openStatistics" />
    <RefuelingsView v-else />
  </AppLayout>

  <AppModalLayer />
</template>
