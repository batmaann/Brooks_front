<script setup lang="ts">
import { Eye, Plus, Search } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import GasStationPanel from '@/components/refuelings/GasStationPanel.vue'
import RefuelingBulkActions from '@/components/refuelings/RefuelingBulkActions.vue'
import RefuelingColumnSettings from '@/components/refuelings/RefuelingColumnSettings.vue'
import RefuelingSummary from '@/components/refuelings/RefuelingSummary.vue'
import RefuelingTable from '@/components/refuelings/RefuelingTable.vue'
import VehiclePanel from '@/components/refuelings/VehiclePanel.vue'
import { useFinanceWorkspaceContext, useFleetWorkspaceContext, useWorkspaceModalsContext, useWorkspaceUiContext } from '@/composables/useWorkspaceContext'

const finance = useFinanceWorkspaceContext()
const fleet = useFleetWorkspaceContext()
const modals = useWorkspaceModalsContext()
const ui = useWorkspaceUiContext()

const {
  allVisibleRefuelingsSelected,
  applyBulkRefuelingCategory,
  applyBulkRefuelingStation,
  applyBulkRefuelingVehicle,
  bulkRefuelingCategoryValue,
  bulkRefuelingStationValue,
  bulkRefuelingVehicleValue,
  canToggleRefuelingColumn,
  clearRefuelingSelection,
  draggedRefuelingColumn,
  dropRefuelingColumn,
  filteredRefuelings,
  filteredStations,
  filteredVehicles,
  finishRefuelingColumnDrag,
  isRefuelingSelected,
  prepareCreateStation,
  refuelingColumnLabels,
  refuelingColumnOrder,
  refuelingColumnVisibility,
  refuelingControlsOpen,
  refuelingSort,
  refuelingTotalCost,
  refuelingTotalFuel,
  refuelingVisibility,
  refuelings,
  requestBulkRefuelingDelete,
  selectedRefuelingCount,
  startRefuelingColumnDrag,
  startEditStation,
  stationById,
  stations,
  toggleAllVisibleRefuelings,
  toggleRefuelingColumn,
  toggleRefuelingSelection,
  toggleRefuelingSort,
  vehicleById,
  vehicles,
  visibleRefuelingColumns,
  visibleRefuelingIds,
} = fleet
const { categories, categoryById } = finance
const { openModal, remove, startEditRefueling } = modals
const { saving, search } = ui
const searchOpen = ref(Boolean(search.value))
const searchInput = ref<HTMLInputElement>()
const searchControl = ref<HTMLElement>()
const searchWidth = ref(390)
const refuelingControlsMenu = ref<HTMLElement>()

function closeRefuelingControlsOnOutsideClick(event: MouseEvent) {
  if (refuelingControlsOpen.value && event.target instanceof Node && !refuelingControlsMenu.value?.contains(event.target)) {
    refuelingControlsOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', closeRefuelingControlsOnOutsideClick, true))
onBeforeUnmount(() => {
  document.removeEventListener('click', closeRefuelingControlsOnOutsideClick, true)
  refuelingControlsOpen.value = false
})

watch(() => refuelingVisibility.search, (visible) => {
  if (visible) return
  search.value = ''
  searchOpen.value = false
}, { immediate: true })

async function openSearch() {
  const bounds = searchControl.value?.getBoundingClientRect()
  searchWidth.value = Math.max(40, Math.min(390, (bounds?.right ?? 468) - 78))
  searchOpen.value = true
  await nextTick()
  searchInput.value?.focus()
}

function collapseUnusedSearch() {
  if (search.value.trim()) return
  search.value = ''
  searchOpen.value = false
}

const searchModel = computed({
  get: () => search.value,
  set: (value: string) => { search.value = value },
})
const availableCategories = computed(() => [...categories.value]
  .sort((left, right) => left.name.localeCompare(right.name, 'ru', { sensitivity: 'base' })))

function openStationCreate() {
  prepareCreateStation()
  openModal('station')
}

function openStationEdit(station: Parameters<typeof startEditStation>[0]) {
  startEditStation(station)
  openModal('station')
}
</script>

<template>
  <RefuelingSummary
    v-if="refuelingVisibility.summary"
    :refueling-count="refuelings.length"
    :station-count="stations.length"
    :total-cost="refuelingTotalCost"
    :total-fuel="refuelingTotalFuel"
    :vehicle-count="vehicles.length"
  />

  <section v-if="refuelingVisibility.vehicles || refuelingVisibility.stations" class="refueling-management top-management">
    <div class="section-heading management-heading">
      <div><p class="eyebrow">Справочники</p><h2>Транспорт и АЗС</h2></div>
    </div>

    <div class="management-grid" :class="{ single: !refuelingVisibility.vehicles || !refuelingVisibility.stations }">
      <VehiclePanel
        v-if="refuelingVisibility.vehicles"
        :vehicles="filteredVehicles"
        @remove-vehicle="(id, label) => remove('vehicle', id, label)"
      />

      <GasStationPanel
        v-if="refuelingVisibility.stations"
        :stations="filteredStations"
        @edit-gas-station="openStationEdit"
        @remove-gas-station="(id, label) => remove('gasStation', id, label)"
      />
    </div>
  </section>

  <section class="finance-panel panel refueling-panel">
    <div class="section-heading">
      <div class="finance-heading-main"><h2>Заправки</h2></div>
      <div class="finance-heading-actions">
        <span class="action-tooltip" :title="vehicles.length ? 'Добавить новую заправку' : 'Сначала добавьте транспорт'">
          <button class="primary-button dashboard-add-button" :style="searchOpen ? { transform: `translateX(-${searchWidth - 40}px)` } : undefined" title="Добавить заправку" :disabled="!vehicles.length" @click="openModal('refueling')"><Plus :size="18" /></button>
        </span>
        <div v-if="refuelingVisibility.search" ref="searchControl" class="refueling-search-control" :class="{ 'search-open': searchOpen }">
          <div v-if="searchOpen" class="search-field transaction-search" :style="{ width: `${searchWidth}px` }">
            <Search :size="18" />
            <input ref="searchInput" v-model="searchModel" aria-label="Поиск по заправкам, транспорту и АЗС" placeholder="Поиск по заправкам, транспорту и АЗС" @blur="collapseUnusedSearch">
          </div>
          <button v-else class="icon-button" type="button" title="Поиск по заправкам" aria-label="Раскрыть поиск по заправкам" :aria-expanded="searchOpen" @click="openSearch">
            <Search :size="18" />
          </button>
        </div>
        <button class="secondary-button" title="Добавить транспорт" @click="openModal('vehicle')"><Plus :size="18" />Добавить транспорт</button>
        <button class="secondary-button" title="Добавить АЗС" @click="openStationCreate"><Plus :size="18" />Добавить АЗС</button>
        <div ref="refuelingControlsMenu" class="visibility-menu">
          <button class="icon-button" :class="{ active: refuelingControlsOpen }" title="Настроить заправки" type="button" @click="refuelingControlsOpen = !refuelingControlsOpen"><Eye :size="18" /></button>
          <RefuelingColumnSettings
            v-if="refuelingControlsOpen"
            :can-toggle-column="canToggleRefuelingColumn"
            :column-labels="refuelingColumnLabels"
            :column-order="refuelingColumnOrder"
            :column-visibility="refuelingColumnVisibility"
            :refueling-visibility="refuelingVisibility"
            @toggle-column="toggleRefuelingColumn"
            @update-refueling-visibility="Object.assign(refuelingVisibility, $event)"
          />
        </div>
      </div>
    </div>

    <RefuelingBulkActions
      :bulk-category-value="bulkRefuelingCategoryValue"
      :bulk-station-value="bulkRefuelingStationValue"
      :bulk-vehicle-value="bulkRefuelingVehicleValue"
      :categories="availableCategories"
      :saving="saving"
      :selected-count="selectedRefuelingCount"
      :stations="stations"
      :vehicles="vehicles"
      @apply-category="applyBulkRefuelingCategory"
      @apply-station="applyBulkRefuelingStation"
      @apply-vehicle="applyBulkRefuelingVehicle"
      @clear="clearRefuelingSelection"
      @delete="requestBulkRefuelingDelete"
      @update-bulk-category-value="bulkRefuelingCategoryValue = $event"
      @update-bulk-station-value="bulkRefuelingStationValue = $event"
      @update-bulk-vehicle-value="bulkRefuelingVehicleValue = $event"
    />
    <RefuelingTable
      :all-visible-selected="allVisibleRefuelingsSelected"
      :category-by-id="categoryById"
      :dragged-column="draggedRefuelingColumn"
      :is-selected="isRefuelingSelected"
      :refueling-column-labels="refuelingColumnLabels"
      :refueling-sort="refuelingSort"
      :refuelings="filteredRefuelings"
      :station-by-id="stationById"
      :vehicle-by-id="vehicleById"
      :visible-column-ids="visibleRefuelingIds"
      :visible-columns="visibleRefuelingColumns"
      @drop-column="dropRefuelingColumn"
      @finish-column-drag="finishRefuelingColumnDrag"
      @remove="(id, label) => remove('refueling', id, label)"
      @start-column-drag="startRefuelingColumnDrag"
      @start-edit="startEditRefueling"
      @toggle-all="toggleAllVisibleRefuelings"
      @toggle-selection="toggleRefuelingSelection"
      @toggle-sort="toggleRefuelingSort"
    />
  </section>
</template>

<style scoped>
.refueling-search-control { position: relative; flex: 0 0 40px; width: 40px; height: 42px; }
.finance-heading-actions .dashboard-add-button { position: relative; z-index: 21; }
.refueling-search-control .transaction-search { position: absolute; z-index: 20; top: 0; right: 0; max-width: calc(100vw - 32px); box-shadow: 0 4px 14px rgb(0 0 0 / 12%); }
.refueling-search-control .transaction-search input { min-width: 0; }
.refueling-search-control .transaction-search > svg { flex-shrink: 0; }
@media (max-width: 760px) {
  .finance-heading-actions .dashboard-add-button { transform: none !important; }
  .refueling-search-control.search-open { order: 1; flex: 1 1 100%; width: 100%; min-width: 0; }
  .refueling-search-control .transaction-search { position: static; width: 100% !important; max-width: none; box-shadow: none; }
  .refueling-search-control .transaction-search input { width: 100%; font-size: 16px; }
}
</style>
