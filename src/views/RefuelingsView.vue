<script setup lang="ts">
import { Building2, CarFront, Eye, Plus, Search, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import RefuelingBulkActions from '@/components/refuelings/RefuelingBulkActions.vue'
import RefuelingTable from '@/components/refuelings/RefuelingTable.vue'
import { useFormatters } from '@/composables/useFormatters'
import type { SortDirection } from '@/types/common'
import type { GasStation, Refueling } from '@/types/refueling'
import type { RefuelingColumnKey } from '@/types/table'
import type { Vehicle } from '@/types/vehicle'

interface Props {
  allVisibleRefuelingsSelected: boolean
  bulkRefuelingStationValue: string
  bulkRefuelingVehicleValue: string
  canToggleRefuelingColumn: (key: RefuelingColumnKey) => boolean
  draggedRefuelingColumn: RefuelingColumnKey | null
  filteredRefuelings: Refueling[]
  filteredStations: GasStation[]
  filteredVehicles: Vehicle[]
  isRefuelingSelected: (id: number) => boolean
  refuelingColumnLabels: Record<RefuelingColumnKey, string>
  refuelingColumnOrder: RefuelingColumnKey[]
  refuelingColumnVisibility: Record<RefuelingColumnKey, boolean>
  refuelingControlsOpen: boolean
  refuelingSort: { key: RefuelingColumnKey | null, direction: SortDirection }
  refuelingTotalCost: number
  refuelingTotalFuel: number
  refuelingVisibility: { summary: boolean, vehicles: boolean, stations: boolean }
  refuelings: Refueling[]
  saving: boolean
  search: string
  selectedRefuelingCount: number
  stationById: (id: number | null) => GasStation | undefined
  stations: GasStation[]
  vehicleById: (id: number | null) => Vehicle | undefined
  vehicles: Vehicle[]
  visibleRefuelingColumns: RefuelingColumnKey[]
  visibleRefuelingIds: number[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  applyBulkRefuelingStation: []
  applyBulkRefuelingVehicle: []
  clearRefuelingSelection: []
  dropRefuelingColumn: [key: RefuelingColumnKey]
  finishRefuelingColumnDrag: []
  openRefuelingModal: []
  openStationModal: []
  openVehicleModal: []
  removeGasStation: [id: number, label: string]
  removeRefueling: [id: number, label: string]
  removeVehicle: [id: number, label: string]
  requestBulkRefuelingDelete: []
  startEditRefueling: [item: Refueling]
  startRefuelingColumnDrag: [key: RefuelingColumnKey]
  toggleAllVisibleRefuelings: [checked: boolean]
  toggleRefuelingColumn: [key: RefuelingColumnKey, checked: boolean]
  toggleRefuelingControls: []
  toggleRefuelingSelection: [id: number, checked: boolean]
  toggleRefuelingSort: [key: RefuelingColumnKey]
  updateBulkRefuelingStationValue: [value: string]
  updateBulkRefuelingVehicleValue: [value: string]
  updateSearch: [value: string]
}>()

const {
  currency,
  number,
  optionalNumber,
} = useFormatters()

const searchModel = computed({
  get: () => props.search,
  set: (value: string) => emit('updateSearch', value),
})

</script>

<template>
  <div v-if="refuelingVisibility.summary" class="finance-summary refueling-summary">
    <div class="finance-summary-item income"><span>Заправки</span><strong>{{ refuelings.length }}</strong></div>
    <div class="finance-summary-item balance"><span>Транспорт</span><strong>{{ vehicles.length }}</strong></div>
    <div class="finance-summary-item saving"><span>АЗС</span><strong>{{ stations.length }}</strong></div>
    <div class="finance-summary-item expense"><span>Итог</span><strong>{{ currency(refuelingTotalCost) }}</strong><small>{{ optionalNumber(refuelingTotalFuel, ' л', 2) }}</small></div>
  </div>

  <section v-if="refuelingVisibility.vehicles || refuelingVisibility.stations" class="refueling-management top-management">
    <div class="section-heading management-heading">
      <div><p class="eyebrow">Справочники</p><h2>Транспорт и АЗС</h2></div>
    </div>

    <div class="management-grid" :class="{ single: !refuelingVisibility.vehicles || !refuelingVisibility.stations }">
      <section v-if="refuelingVisibility.vehicles" class="management-panel">
        <div class="section-heading compact-heading">
          <div><p class="eyebrow">Транспорт</p><h2>{{ filteredVehicles.length }} записей</h2></div>
        </div>
        <div class="vehicle-grid compact-grid">
          <article v-for="vehicle in filteredVehicles" :key="vehicle.id" class="vehicle-card">
            <div class="vehicle-card-head">
              <div class="vehicle-symbol"><CarFront :size="24" /></div>
              <span class="status" :class="{ inactive: !vehicle.is_active }"><i></i>{{ vehicle.is_active ? 'Активен' : 'Неактивен' }}</span>
              <button class="icon-button danger" title="Удалить транспорт" @click="emit('removeVehicle', vehicle.id, vehicle.name)"><Trash2 :size="17" /></button>
            </div>
            <div>
              <h2>{{ vehicle.name }}</h2>
              <p>{{ [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' · ') || 'Без дополнительных данных' }}</p>
            </div>
            <dl>
              <div><dt>Текущий пробег</dt><dd>{{ number(vehicle.current_odometer || vehicle.initial_odometer) }} км</dd></div>
              <div><dt>Начальный</dt><dd>{{ number(vehicle.initial_odometer) }} км</dd></div>
            </dl>
          </article>
          <button class="add-card" @click="emit('openVehicleModal')"><Plus :size="23" /><strong>Добавить транспорт</strong></button>
        </div>
      </section>

      <section v-if="refuelingVisibility.stations" class="management-panel">
        <div class="section-heading compact-heading">
          <div><p class="eyebrow">АЗС</p><h2>{{ filteredStations.length }} записей</h2></div>
        </div>
        <div class="station-list compact-station-list">
          <article v-for="station in filteredStations" :key="station.id">
            <div class="station-icon"><Building2 :size="21" /></div>
            <div class="station-main"><h2>{{ station.company || station.name }}</h2><p>{{ station.name }}<template v-if="station.number"> · №{{ station.number }}</template></p></div>
            <span class="station-address">{{ station.address || 'Адрес не указан' }}</span>
            <button class="icon-button danger" title="Удалить АЗС" @click="emit('removeGasStation', station.id, station.name)"><Trash2 :size="17" /></button>
          </article>
          <button class="add-row" @click="emit('openStationModal')"><Plus :size="20" />Добавить АЗС</button>
        </div>
      </section>
    </div>
  </section>

  <section class="finance-panel panel refueling-panel">
    <div class="section-heading">
      <div class="finance-heading-main"><h2>Заправки</h2><div class="search-field transaction-search"><Search :size="18" /><input v-model="searchModel" placeholder="Поиск по заправкам, транспорту и АЗС"></div></div>
      <div class="finance-heading-actions">
        <span class="action-tooltip" :title="vehicles.length ? 'Добавить новую заправку' : 'Сначала добавьте транспорт'">
          <button class="primary-button dashboard-add-button" title="Добавить заправку" :disabled="!vehicles.length" @click="emit('openRefuelingModal')"><Plus :size="18" /></button>
        </span>
        <button class="secondary-button" title="Добавить транспорт" @click="emit('openVehicleModal')"><Plus :size="18" />Добавить транспорт</button>
        <button class="secondary-button" title="Добавить АЗС" @click="emit('openStationModal')"><Plus :size="18" />Добавить АЗС</button>
        <div class="visibility-menu">
          <button class="icon-button" :class="{ active: refuelingControlsOpen }" title="Настроить заправки" type="button" @click="emit('toggleRefuelingControls')"><Eye :size="18" /></button>
          <div v-if="refuelingControlsOpen" class="visibility-dropdown">
            <label><input v-model="refuelingVisibility.summary" type="checkbox"><span>Виджеты</span></label>
            <label><input v-model="refuelingVisibility.vehicles" type="checkbox"><span>Транспорт</span></label>
            <label><input v-model="refuelingVisibility.stations" type="checkbox"><span>АЗС</span></label>
            <label class="disabled" title="В разработке"><input disabled type="checkbox"><span>AI</span></label>
            <div class="visibility-divider"></div>
            <strong class="visibility-title">Столбцы</strong>
            <label v-for="columnKey in refuelingColumnOrder" :key="`refueling-visibility-${columnKey}`" :class="{ disabled: !canToggleRefuelingColumn(columnKey) }"><input type="checkbox" :checked="refuelingColumnVisibility[columnKey]" :disabled="!canToggleRefuelingColumn(columnKey)" @change="emit('toggleRefuelingColumn', columnKey, ($event.target as HTMLInputElement).checked)"><span>{{ refuelingColumnLabels[columnKey] }}</span></label>
          </div>
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
      @apply-station="emit('applyBulkRefuelingStation')"
      @apply-vehicle="emit('applyBulkRefuelingVehicle')"
      @clear="emit('clearRefuelingSelection')"
      @delete="emit('requestBulkRefuelingDelete')"
      @update-bulk-station-value="emit('updateBulkRefuelingStationValue', $event)"
      @update-bulk-vehicle-value="emit('updateBulkRefuelingVehicleValue', $event)"
    />
    <RefuelingTable
      :all-visible-selected="allVisibleRefuelingsSelected"
      :dragged-column="draggedRefuelingColumn"
      :is-selected="isRefuelingSelected"
      :refueling-column-labels="refuelingColumnLabels"
      :refueling-sort="refuelingSort"
      :refuelings="filteredRefuelings"
      :station-by-id="stationById"
      :vehicle-by-id="vehicleById"
      :visible-column-ids="visibleRefuelingIds"
      :visible-columns="visibleRefuelingColumns"
      @drop-column="emit('dropRefuelingColumn', $event)"
      @finish-column-drag="emit('finishRefuelingColumnDrag')"
      @remove="(id, label) => emit('removeRefueling', id, label)"
      @start-column-drag="emit('startRefuelingColumnDrag', $event)"
      @start-edit="emit('startEditRefueling', $event)"
      @toggle-all="emit('toggleAllVisibleRefuelings', $event)"
      @toggle-selection="(id, checked) => emit('toggleRefuelingSelection', id, checked)"
      @toggle-sort="emit('toggleRefuelingSort', $event)"
    />
  </section>
</template>
