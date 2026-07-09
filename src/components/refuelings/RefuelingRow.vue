<script setup lang="ts">
import { CalendarDays, Pencil, Trash2 } from '@lucide/vue'
import { useFormatters } from '@/composables/useFormatters'
import type { Category } from '@/types/finance'
import type { GasStation, Refueling } from '@/types/refueling'
import type { RefuelingColumnKey } from '@/types/table'
import type { Vehicle } from '@/types/vehicle'

interface Props {
  item: Refueling
  selected: boolean
  categoryById: (id: number | null) => Category | undefined
  stationById: (id: number | null) => GasStation | undefined
  vehicleById: (id: number | null) => Vehicle | undefined
  visibleColumns: RefuelingColumnKey[]
}

defineProps<Props>()

const emit = defineEmits<{
  remove: [id: number, label: string]
  startEdit: [item: Refueling]
  toggleSelection: [id: number, checked: boolean]
}>()

const {
  formatDate,
  optionalCurrency,
  optionalNumber,
} = useFormatters()
</script>

<template>
  <tr class="refueling-display-row" :class="{ 'refueling-incomplete-row': !item.is_complete, selected }">
    <td class="selection-column"><input type="checkbox" :checked="selected" title="Выбрать заправку" @change="emit('toggleSelection', item.id, ($event.target as HTMLInputElement).checked)"></td>
    <template v-for="columnKey in visibleColumns" :key="`refueling-${item.id}-${columnKey}`">
      <td v-if="columnKey === 'date'"><span class="date-cell"><CalendarDays :size="16" />{{ formatDate(item.date) }}</span></td>
      <td v-else-if="columnKey === 'vehicle'"><strong>{{ vehicleById(item.vehicle)?.name || '—' }}</strong><small v-if="!item.is_complete">Нужно дополнить</small></td>
      <td v-else-if="columnKey === 'station_fuel'"><strong>{{ stationById(item.gas_station)?.company || stationById(item.gas_station)?.name || 'Не указана' }}</strong><small>{{ item.fuel_type || '—' }}</small></td>
      <td v-else-if="columnKey === 'category'">{{ categoryById(item.category)?.name || '—' }}</td>
      <td v-else-if="columnKey === 'description'"><span class="transaction-description">{{ item.description || item.comment || '—' }}</span></td>
      <td v-else-if="columnKey === 'odometer'">{{ optionalNumber(item.odometer_reading ?? item.odometer, ' км') }}</td>
      <td v-else-if="columnKey === 'distance'">{{ optionalNumber(item.distance, ' км') }}</td>
      <td v-else-if="columnKey === 'fuel_quantity'">{{ optionalNumber(item.fuel_quantity, ' л', 2) }}</td>
      <td v-else-if="columnKey === 'price_per_liter'">{{ optionalCurrency(item.price_per_liter) }}</td>
      <td v-else-if="columnKey === 'service_operation'">{{ optionalCurrency(item.service_operation) }}</td>
      <td v-else-if="columnKey === 'cashback'">{{ optionalCurrency(item.cashback) }}</td>
      <td v-else-if="columnKey === 'is_full_tank'"><span class="status" :class="{ inactive: !item.is_full_tank }"><i></i>{{ item.is_full_tank ? 'Да' : 'Нет' }}</span></td>
      <td v-else><strong>{{ optionalCurrency(item.effective_cost || item.total_cost) }}</strong></td>
    </template>
    <td>
      <div class="transaction-actions">
        <button class="icon-button" title="Редактировать заправку" @click="emit('startEdit', item)"><Pencil :size="16" /></button>
        <button class="icon-button danger" title="Удалить заправку" @click="emit('remove', item.id, `заправку от ${formatDate(item.date)}`)"><Trash2 :size="17" /></button>
      </div>
    </td>
  </tr>
</template>
