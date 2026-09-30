<script setup lang="ts">
import type { TransactionSortKey } from '@/types/table'

interface DashboardVisibility {
  attachFile: boolean
  addBank: boolean
  addCategory: boolean
  summary: boolean
}

interface Props {
  canToggleColumn: (key: TransactionSortKey) => boolean
  columnLabels: Record<TransactionSortKey, string>
  columnOrder: TransactionSortKey[]
  columnVisibility: Record<TransactionSortKey, boolean>
  dashboardVisibility: DashboardVisibility
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggleColumn: [key: TransactionSortKey, checked: boolean]
  updateDashboardVisibility: [visibility: DashboardVisibility]
}>()

function updateDashboardVisibility(field: keyof DashboardVisibility, checked: boolean) {
  emit('updateDashboardVisibility', { ...props.dashboardVisibility, [field]: checked })
}
</script>

<template>
  <div class="visibility-dropdown">
    <label>
      <input :checked="dashboardVisibility.summary" type="checkbox" @change="updateDashboardVisibility('summary', ($event.target as HTMLInputElement).checked)">
      <span>Виджеты</span>
    </label>
    <label>
      <input :checked="dashboardVisibility.addBank" type="checkbox" @change="updateDashboardVisibility('addBank', ($event.target as HTMLInputElement).checked)">
      <span>Добавить банк</span>
    </label>
    <label>
      <input :checked="dashboardVisibility.addCategory" type="checkbox" @change="updateDashboardVisibility('addCategory', ($event.target as HTMLInputElement).checked)">
      <span>Добавить категории</span>
    </label>
    <label class="disabled" title="В разработке">
      <input disabled type="checkbox">
      <span>AI</span>
    </label>
    <label>
      <input :checked="dashboardVisibility.attachFile" type="checkbox" @change="updateDashboardVisibility('attachFile', ($event.target as HTMLInputElement).checked)">
      <span>Прикрепить файл</span>
    </label>
    <div class="visibility-divider"></div>
    <strong class="visibility-title">Столбцы</strong>
    <label v-for="columnKey in columnOrder" :key="`visibility-${columnKey}`" :class="{ disabled: !canToggleColumn(columnKey) }">
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
