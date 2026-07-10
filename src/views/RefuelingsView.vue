<script setup lang="ts">
import { Eye, Plus, Search } from '@lucide/vue'
import { computed } from 'vue'
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
  applyBulkRefuelingStation,
  applyBulkRefuelingVehicle,
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
const { categoryById } = finance
const { openModal, remove, startEditRefueling } = modals
const { saving, search } = ui

const searchModel = computed({
  get: () => search.value,
  set: (value: string) => { search.value = value },
})
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
        @open-vehicle-modal="openModal('vehicle')"
        @remove-vehicle="(id, label) => remove('vehicle', id, label)"
      />

      <GasStationPanel
        v-if="refuelingVisibility.stations"
        :stations="filteredStations"
        @open-station-modal="openModal('station')"
        @remove-gas-station="(id, label) => remove('gasStation', id, label)"
      />
    </div>
  </section>

  <section class="finance-panel panel refueling-panel">
    <div class="section-heading">
      <div class="finance-heading-main"><h2>Заправки</h2><div class="search-field transaction-search"><Search :size="18" /><input v-model="searchModel" placeholder="Поиск по заправкам, транспорту и АЗС"></div></div>
      <div class="finance-heading-actions">
        <span class="action-tooltip" :title="vehicles.length ? 'Добавить новую заправку' : 'Сначала добавьте транспорт'">
          <button class="primary-button dashboard-add-button" title="Добавить заправку" :disabled="!vehicles.length" @click="openModal('refueling')"><Plus :size="18" /></button>
        </span>
        <button class="secondary-button" title="Добавить транспорт" @click="openModal('vehicle')"><Plus :size="18" />Добавить транспорт</button>
        <button class="secondary-button" title="Добавить АЗС" @click="openModal('station')"><Plus :size="18" />Добавить АЗС</button>
        <div class="visibility-menu">
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
      :bulk-station-value="bulkRefuelingStationValue"
      :bulk-vehicle-value="bulkRefuelingVehicleValue"
      :saving="saving"
      :selected-count="selectedRefuelingCount"
      :stations="stations"
      :vehicles="vehicles"
      @apply-station="applyBulkRefuelingStation"
      @apply-vehicle="applyBulkRefuelingVehicle"
      @clear="clearRefuelingSelection"
      @delete="requestBulkRefuelingDelete"
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
