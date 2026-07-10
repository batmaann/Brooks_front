<script setup lang="ts">
import type { RefuelingColumnKey } from '@/types/table'

interface RefuelingVisibility {
  stations: boolean
  summary: boolean
  vehicles: boolean
}

interface Props {
  canToggleColumn: (key: RefuelingColumnKey) => boolean
  columnLabels: Record<RefuelingColumnKey, string>
  columnOrder: RefuelingColumnKey[]
  columnVisibility: Record<RefuelingColumnKey, boolean>
  refuelingVisibility: RefuelingVisibility
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggleColumn: [key: RefuelingColumnKey, checked: boolean]
  updateRefuelingVisibility: [visibility: RefuelingVisibility]
}>()

function updateRefuelingVisibility(field: keyof RefuelingVisibility, checked: boolean) {
  emit('updateRefuelingVisibility', { ...props.refuelingVisibility, [field]: checked })
}
</script>

<template>
  <div class="visibility-dropdown">
    <label>
      <input :checked="refuelingVisibility.summary" type="checkbox" @change="updateRefuelingVisibility('summary', ($event.target as HTMLInputElement).checked)">
      <span>Виджеты</span>
    </label>
    <label>
      <input :checked="refuelingVisibility.vehicles" type="checkbox" @change="updateRefuelingVisibility('vehicles', ($event.target as HTMLInputElement).checked)">
      <span>Транспорт</span>
    </label>
    <label>
      <input :checked="refuelingVisibility.stations" type="checkbox" @change="updateRefuelingVisibility('stations', ($event.target as HTMLInputElement).checked)">
      <span>АЗС</span>
    </label>
    <label class="disabled" title="В разработке">
      <input disabled type="checkbox">
      <span>AI</span>
    </label>
    <div class="visibility-divider"></div>
    <strong class="visibility-title">Столбцы</strong>
    <label v-for="columnKey in columnOrder" :key="`refueling-visibility-${columnKey}`" :class="{ disabled: !canToggleColumn(columnKey) }">
      <input
        type="checkbox"
        :checked="columnVisibility[columnKey]"
        :disabled="!canToggleColumn(columnKey)"
        @change="emit('toggleColumn', columnKey, ($event.target as HTMLInputElement).checked)"
      >
      <span>{{ columnLabels[columnKey] }}</span>
    </label>
  </div>
</template>
