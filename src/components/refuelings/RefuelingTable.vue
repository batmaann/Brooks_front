<script setup lang="ts">
import { ChevronDown, ChevronUp, Fuel } from '@lucide/vue'
import RefuelingRow from '@/components/refuelings/RefuelingRow.vue'
import type { SortDirection } from '@/types/common'
import type { Category } from '@/types/finance'
import type { GasStation, Refueling } from '@/types/refueling'
import type { RefuelingColumnKey } from '@/types/table'
import type { Vehicle } from '@/types/vehicle'

interface Props {
  allVisibleSelected: boolean
  categoryById: (id: number | null) => Category | undefined
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
          <RefuelingRow
            v-for="item in refuelings"
            :key="item.id"
            :category-by-id="categoryById"
            :item="item"
            :selected="isSelected(item.id)"
            :station-by-id="stationById"
            :vehicle-by-id="vehicleById"
            :visible-columns="visibleColumns"
            @remove="(id, label) => emit('remove', id, label)"
            @start-edit="emit('startEdit', $event)"
            @toggle-selection="(id, checked) => emit('toggleSelection', id, checked)"
          />
        </tbody>
      </table>
    </div>
    <div v-if="!refuelings.length" class="empty-state"><Fuel :size="28" /><strong>Записи не найдены</strong></div>
  </div>
</template>
