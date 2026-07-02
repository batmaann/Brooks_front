<script setup lang="ts">
import { CalendarDays, ChevronDown, ChevronUp, Fuel, Pencil, Trash2 } from '@lucide/vue'
import { useFormatters } from '@/composables/useFormatters'
import type { SortDirection } from '@/types/common'
import type { GasStation, Refueling } from '@/types/refueling'
import type { RefuelingColumnKey } from '@/types/table'
import type { Vehicle } from '@/types/vehicle'

interface Props {
  allVisibleSelected: boolean
  draggedColumn: RefuelingColumnKey | null
  isSelected: (id: number) => boolean
  refuelingColumnLabels: Record<RefuelingColumnKey, string>
  refuelingSort: { key: RefuelingColumnKey | null, direction: SortDirection }
  refuelings: Refueling[]
  stationById: (id: number | null) => GasStation | undefined
  vehicleById: (id: number | null) => Vehicle | undefined
  visibleColumnIds: number[]
  visibleColumns: RefuelingColumnKey[]
}

defineProps<Props>()

const emit = defineEmits<{
  dropColumn: [key: RefuelingColumnKey]
  finishColumnDrag: []
  remove: [id: number, label: string]
  startColumnDrag: [key: RefuelingColumnKey]
  startEdit: [item: Refueling]
  toggleAll: [checked: boolean]
  toggleSelection: [id: number, checked: boolean]
  toggleSort: [key: RefuelingColumnKey]
}>()

const {
  formatDate,
  optionalCurrency,
  optionalNumber,
} = useFormatters()
</script>

<template>
  <div class="table-panel refueling-table">
    <div class="table-scroll">
      <table>
        <thead><tr><th class="selection-column"><input type="checkbox" :checked="allVisibleSelected" :disabled="!visibleColumnIds.length" title="Выбрать все видимые" @change="emit('toggleAll', ($event.target as HTMLInputElement).checked)"></th><th
          v-for="columnKey in visibleColumns"
          :key="columnKey"
          class="draggable-column"
          :class="{ dragging: draggedColumn === columnKey }"
          draggable="true"
          @dragstart="emit('startColumnDrag', columnKey)"
          @dragover.prevent
          @drop.prevent="emit('dropColumn', columnKey)"
          @dragend="emit('finishColumnDrag')"
        ><button class="sort-header" :class="{ active: refuelingSort.key === columnKey }" type="button" @click="emit('toggleSort', columnKey)"><span>{{ refuelingColumnLabels[columnKey] }}</span><ChevronUp v-if="refuelingSort.key === columnKey && refuelingSort.direction === 'asc'" :size="14" /><ChevronDown v-else-if="refuelingSort.key === columnKey && refuelingSort.direction === 'desc'" :size="14" /></button></th><th></th></tr></thead>
        <tbody>
          <tr v-for="item in refuelings" :key="item.id" class="refueling-display-row" :class="{ 'refueling-incomplete-row': !item.is_complete, selected: isSelected(item.id) }">
            <td class="selection-column"><input type="checkbox" :checked="isSelected(item.id)" title="Выбрать заправку" @change="emit('toggleSelection', item.id, ($event.target as HTMLInputElement).checked)"></td>
            <template v-for="columnKey in visibleColumns" :key="`refueling-${item.id}-${columnKey}`">
              <td v-if="columnKey === 'date'"><span class="date-cell"><CalendarDays :size="16" />{{ formatDate(item.date) }}</span></td>
              <td v-else-if="columnKey === 'vehicle'"><strong>{{ vehicleById(item.vehicle)?.name || '—' }}</strong><small v-if="!item.is_complete">Нужно дополнить</small></td>
              <td v-else-if="columnKey === 'station_fuel'"><strong>{{ stationById(item.gas_station)?.company || stationById(item.gas_station)?.name || 'Не указана' }}</strong><small>{{ item.fuel_type || '—' }} · {{ optionalCurrency(item.price_per_liter) }}/л</small></td>
              <td v-else-if="columnKey === 'mileage'">{{ optionalNumber(item.mileage, ' км') }}</td>
              <td v-else-if="columnKey === 'fuel_quantity'">{{ optionalNumber(item.fuel_quantity, ' л', 2) }}</td>
              <td v-else-if="columnKey === 'is_full_tank'"><span class="status" :class="{ inactive: !item.is_full_tank }"><i></i>{{ item.is_full_tank ? 'Да' : 'Нет' }}</span></td>
              <td v-else><strong>{{ optionalCurrency(item.effective_cost || item.total_cost) }}</strong></td>
            </template>
            <td><div class="transaction-actions"><button class="icon-button" title="Редактировать заправку" @click="emit('startEdit', item)"><Pencil :size="16" /></button><button class="icon-button danger" title="Удалить заправку" @click="emit('remove', item.id, `заправку от ${formatDate(item.date)}`)"><Trash2 :size="17" /></button></div></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!refuelings.length" class="empty-state"><Fuel :size="28" /><strong>Записи не найдены</strong></div>
  </div>
</template>

