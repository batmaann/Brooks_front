<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ApiError } from '@/api'
import AppModalLayer from '@/components/modals/AppModalLayer.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { navItems } from '@/constants/navigation'
import DashboardView from '@/views/DashboardView.vue'
import RefuelingsView from '@/views/RefuelingsView.vue'
import { useSubmitState } from '@/composables/useSubmitState'
import { useTheme } from '@/composables/useTheme'
import { useFinanceStore } from '@/stores/finance'
import { useFleetStore } from '@/stores/fleet'
import { useFinanceWorkspace } from '@/composables/useFinanceWorkspace'
import { useFleetWorkspace } from '@/composables/useFleetWorkspace'
import { useWorkspaceData } from '@/composables/useWorkspaceData'
import { useWorkspaceModals, type WorkspaceDeleteResource } from '@/composables/useWorkspaceModals'
import type { AppView } from '@/types/navigation'

type View = AppView

const emit = defineEmits<{
  logout: []
}>()

const { applyTheme, isDarkTheme, toggleTheme } = useTheme()
const financeStore = useFinanceStore()
const fleetStore = useFleetStore()

const activeView = ref<View>('dashboard')
const mobileNavOpen = ref(false)
const search = ref('')
const transactionSearch = ref('')
const dashboardControlsOpen = ref(false)
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
  addingTransaction,
  allVisibleTransactionsSelected,
  applyBulkTransactionCategory,
  applyBulkTransactionSection,
  bankLabelEditForm,
  bankLabelForm,
  bankLabels,
  bulkCategoryValue,
  bulkSectionValue,
  canToggleTransactionColumn,
  cancelCreateTransaction,
  cancelEditTransaction,
  categories,
  categoryEditForm,
  categoryForm,
  clearTransactionSelection,
  createBankLabel,
  createCategory,
  createTransaction,
  dashboardVisibility,
  draggedTransactionColumn,
  dropTransactionColumn,
  editingTransactionId,
  finishTransactionColumnDrag,
  isTransactionSelected,
  keepExistingTransactionSelection,
  requestBulkTransactionDelete,
  resetDictionaryEditors,
  sectionName,
  sections,
  selectedBankLabelId,
  selectedCategoryId,
  selectedTransactionIds,
  selectedTransactionCount,
  startCreateTransaction,
  startEditTransaction,
  startTransactionColumnDrag,
  toggleAllVisibleTransactions,
  toggleTransactionColumn,
  toggleTransactionSelection,
  toggleTransactionSort,
  transactionBalance,
  transactionColumnLabels,
  transactionColumnOrder,
  transactionColumnVisibility,
  transactionEditForm,
  transactionExpense,
  transactionForm,
  transactionIncome,
  transactions,
  transactionSaving,
  transactionSign,
  transactionSort,
  transactionTitle,
  transactionTypeLabels,
  updateBankLabel,
  updateCategory,
  updateTransaction,
  visibleTransactionColumns,
  visibleTransactionIds,
  visibleTransactions,
  selectBankLabelForEdit,
  selectCategoryForEdit,
} = finance

const {
  allVisibleRefuelingsSelected,
  applyBulkRefuelingStation,
  applyBulkRefuelingVehicle,
  bulkRefuelingStationValue,
  bulkRefuelingVehicleValue,
  canToggleRefuelingColumn,
  clearRefuelingSelection,
  createStation,
  createVehicle,
  draggedRefuelingColumn,
  dropRefuelingColumn,
  editingRefuelingId,
  filteredRefuelings,
  filteredStations,
  filteredVehicles,
  finishRefuelingColumnDrag,
  isRefuelingSelected,
  keepExistingRefuelingSelection,
  prepareCreateRefueling,
  refuelingColumnLabels,
  refuelingColumnOrder,
  refuelingColumnVisibility,
  refuelingControlsOpen,
  refuelingForm,
  refuelingSort,
  refuelingTotalCost,
  refuelingTotalFuel,
  refuelingVisibility,
  refuelings,
  requestBulkRefuelingDelete,
  resetRefuelingEditor,
  saveRefueling,
  selectedRefuelingCount,
  selectedRefuelingIds,
  startEditRefueling: prepareEditRefueling,
  startRefuelingColumnDrag,
  stationById,
  stationForm,
  stations,
  toggleAllVisibleRefuelings,
  toggleRefuelingColumn,
  toggleRefuelingSelection,
  toggleRefuelingSort,
  vehicleById,
  vehicleForm,
  vehicles,
  visibleRefuelingColumns,
  visibleRefuelingIds,
} = fleet

const workspaceData = useWorkspaceData({
  clearRefuelingSelection,
  clearTransactionSelection,
  emitLogout: () => emit('logout'),
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

const { loadData: refreshWorkspace, loading, logout } = workspaceData
const {
  closeModal,
  confirmRemove,
  modal,
  modalEyebrow,
  modalTitle,
  openModal,
  pendingDelete,
  remove,
  startEditRefueling,
} = workspaceModals

const viewTitle = computed(() => navItems.find((item) => item.id === activeView.value)?.label || '')

function selectView(view: View) {
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
    :title="viewTitle"
    @about="openModal('about')"
    @clear-error="error = ''"
    @close-menu="mobileNavOpen = false"
    @logout="logout"
    @open-menu="mobileNavOpen = true"
    @refresh="refreshWorkspace"
    @select-view="selectView"
    @toggle-theme="toggleTheme"
  >
    <DashboardView
      v-if="activeView === 'dashboard'"
      :adding-transaction="addingTransaction"
      :all-visible-transactions-selected="allVisibleTransactionsSelected"
      :bank-labels="bankLabels"
      :bulk-category-value="bulkCategoryValue"
      :bulk-section-value="bulkSectionValue"
      :can-toggle-transaction-column="canToggleTransactionColumn"
      :categories="categories"
      :dashboard-controls-open="dashboardControlsOpen"
      :dashboard-visibility="dashboardVisibility"
      :dragged-transaction-column="draggedTransactionColumn"
      :editing-transaction-id="editingTransactionId"
      :is-transaction-selected="isTransactionSelected"
      :saving="saving"
      :section-name="sectionName"
      :sections="sections"
      :selected-transaction-count="selectedTransactionCount"
      :transaction-balance="transactionBalance"
      :transaction-column-labels="transactionColumnLabels"
      :transaction-column-order="transactionColumnOrder"
      :transaction-column-visibility="transactionColumnVisibility"
      :transaction-edit-form="transactionEditForm"
      :transaction-expense="transactionExpense"
      :transaction-form="transactionForm"
      :transaction-income="transactionIncome"
      :transaction-saving="transactionSaving"
      :transaction-search="transactionSearch"
      :transaction-sign="transactionSign"
      :transaction-sort="transactionSort"
      :transaction-title="transactionTitle"
      :transaction-type-labels="transactionTypeLabels"
      :transactions="transactions"
      :visible-transaction-columns="visibleTransactionColumns"
      :visible-transaction-ids="visibleTransactionIds"
      :visible-transactions="visibleTransactions"
      @apply-bulk-transaction-category="applyBulkTransactionCategory"
      @apply-bulk-transaction-section="applyBulkTransactionSection"
      @cancel-create-transaction="cancelCreateTransaction"
      @cancel-edit-transaction="cancelEditTransaction"
      @clear-transaction-selection="clearTransactionSelection"
      @create-transaction="createTransaction"
      @drop-transaction-column="dropTransactionColumn"
      @finish-transaction-column-drag="finishTransactionColumnDrag"
      @open-bank-label-modal="openModal('bankLabel')"
      @open-category-modal="openModal('category')"
      @remove-transaction="(id, label) => remove('transaction', id, label)"
      @request-bulk-transaction-delete="requestBulkTransactionDelete"
      @start-create-transaction="startCreateTransaction"
      @start-edit-transaction="startEditTransaction"
      @start-transaction-column-drag="startTransactionColumnDrag"
      @toggle-all-visible-transactions="toggleAllVisibleTransactions"
      @toggle-dashboard-controls="dashboardControlsOpen = !dashboardControlsOpen"
      @toggle-transaction-column="toggleTransactionColumn"
      @toggle-transaction-selection="toggleTransactionSelection"
      @toggle-transaction-sort="toggleTransactionSort"
      @update-bulk-category-value="bulkCategoryValue = $event"
      @update-bulk-section-value="bulkSectionValue = $event"
      @update-transaction="updateTransaction"
      @update-transaction-search="transactionSearch = $event"
    />

    <RefuelingsView
      v-else
      :all-visible-refuelings-selected="allVisibleRefuelingsSelected"
      :bulk-refueling-station-value="bulkRefuelingStationValue"
      :bulk-refueling-vehicle-value="bulkRefuelingVehicleValue"
      :can-toggle-refueling-column="canToggleRefuelingColumn"
      :dragged-refueling-column="draggedRefuelingColumn"
      :filtered-refuelings="filteredRefuelings"
      :filtered-stations="filteredStations"
      :filtered-vehicles="filteredVehicles"
      :is-refueling-selected="isRefuelingSelected"
      :refueling-column-labels="refuelingColumnLabels"
      :refueling-column-order="refuelingColumnOrder"
      :refueling-column-visibility="refuelingColumnVisibility"
      :refueling-controls-open="refuelingControlsOpen"
      :refueling-sort="refuelingSort"
      :refueling-total-cost="refuelingTotalCost"
      :refueling-total-fuel="refuelingTotalFuel"
      :refueling-visibility="refuelingVisibility"
      :refuelings="refuelings"
      :saving="saving"
      :search="search"
      :selected-refueling-count="selectedRefuelingCount"
      :station-by-id="stationById"
      :stations="stations"
      :vehicle-by-id="vehicleById"
      :vehicles="vehicles"
      :visible-refueling-columns="visibleRefuelingColumns"
      :visible-refueling-ids="visibleRefuelingIds"
      @apply-bulk-refueling-station="applyBulkRefuelingStation"
      @apply-bulk-refueling-vehicle="applyBulkRefuelingVehicle"
      @clear-refueling-selection="clearRefuelingSelection"
      @drop-refueling-column="dropRefuelingColumn"
      @finish-refueling-column-drag="finishRefuelingColumnDrag"
      @open-refueling-modal="openModal('refueling')"
      @open-station-modal="openModal('station')"
      @open-vehicle-modal="openModal('vehicle')"
      @remove-gas-station="(id, label) => remove('gasStation', id, label)"
      @remove-refueling="(id, label) => remove('refueling', id, label)"
      @remove-vehicle="(id, label) => remove('vehicle', id, label)"
      @request-bulk-refueling-delete="requestBulkRefuelingDelete"
      @start-edit-refueling="startEditRefueling"
      @start-refueling-column-drag="startRefuelingColumnDrag"
      @toggle-all-visible-refuelings="toggleAllVisibleRefuelings"
      @toggle-refueling-column="toggleRefuelingColumn"
      @toggle-refueling-controls="refuelingControlsOpen = !refuelingControlsOpen"
      @toggle-refueling-selection="toggleRefuelingSelection"
      @toggle-refueling-sort="toggleRefuelingSort"
      @update-bulk-refueling-station-value="bulkRefuelingStationValue = $event"
      @update-bulk-refueling-vehicle-value="bulkRefuelingVehicleValue = $event"
      @update-search="search = $event"
    />
  </AppLayout>

  <AppModalLayer
    :bank-label-create-form="bankLabelForm"
    :bank-label-edit-form="bankLabelEditForm"
    :bank-labels="bankLabels"
    :categories="categories"
    :category-create-form="categoryForm"
    :category-edit-form="categoryEditForm"
    :delete-label="pendingDelete?.label"
    :error="error"
    :modal="modal"
    :modal-eyebrow="modalEyebrow"
    :modal-title="modalTitle"
    :refueling-form="refuelingForm"
    :saving="saving"
    :selected-bank-label-id="selectedBankLabelId"
    :selected-category-id="selectedCategoryId"
    :station-form="stationForm"
    :stations="stations"
    :vehicle-form="vehicleForm"
    :vehicles="vehicles"
    @close="closeModal"
    @confirm-delete="confirmRemove"
    @create-bank-label="createBankLabel"
    @create-category="createCategory"
    @create-station="createStation"
    @create-vehicle="createVehicle"
    @save-refueling="saveRefueling"
    @select-bank-label="selectBankLabelForEdit"
    @select-category="selectCategoryForEdit"
    @update-bank-label="updateBankLabel"
    @update-bank-label-create-form="Object.assign(bankLabelForm, $event)"
    @update-bank-label-edit-form="Object.assign(bankLabelEditForm, $event)"
    @update-category="updateCategory"
    @update-category-create-form="Object.assign(categoryForm, $event)"
    @update-category-edit-form="Object.assign(categoryEditForm, $event)"
    @update-refueling-form="Object.assign(refuelingForm, $event)"
    @update-station-form="Object.assign(stationForm, $event)"
    @update-vehicle-form="Object.assign(vehicleForm, $event)"
  />
</template>
