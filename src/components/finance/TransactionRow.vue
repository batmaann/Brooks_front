<script setup lang="ts">
import { CalendarDays, Pencil, Trash2 } from '@lucide/vue'
import { useFormatters } from '@/composables/useFormatters'
import type { Transaction, TransactionType } from '@/types/finance'
import type { TransactionSortKey } from '@/types/table'

interface Props {
  item: Transaction
  sectionName: (id: number | null) => string
  selected: boolean
  transactionSign: (type: TransactionType) => string
  transactionTitle: (item: Transaction) => string
  transactionTypeLabels: Record<TransactionType, string>
  visibleColumns: TransactionSortKey[]
}

defineProps<Props>()

const emit = defineEmits<{
  remove: [id: number, label: string]
  startEdit: [item: Transaction]
  toggleSelection: [id: number, checked: boolean]
}>()

const {
  currency,
  formatDate,
} = useFormatters()
</script>

<template>
  <tr class="transaction-display-row" :class="{ selected }">
    <td class="selection-column"><input type="checkbox" :checked="selected" title="Выбрать операцию" @change="emit('toggleSelection', item.id, ($event.target as HTMLInputElement).checked)"></td>
    <template v-for="columnKey in visibleColumns" :key="`display-${item.id}-${columnKey}`">
      <td v-if="columnKey === 'date'"><span class="date-cell"><CalendarDays :size="16" />{{ formatDate(item.date) }}</span></td>
      <td v-else-if="columnKey === 'transaction_type'"><span class="transaction-type" :class="item.transaction_type">{{ transactionTypeLabels[item.transaction_type] }}</span></td>
      <td v-else-if="columnKey === 'section'">{{ sectionName(item.section) }}</td>
      <td v-else-if="columnKey === 'category'"><strong>{{ item.category_name_snapshot || '—' }}</strong></td>
      <td v-else-if="columnKey === 'amount'"><strong class="transaction-amount" :class="item.transaction_type">{{ transactionSign(item.transaction_type) }}{{ currency(item.amount, item.currency) }}</strong></td>
      <td v-else-if="columnKey === 'bank_label'">{{ item.bank_label_name_snapshot || '—' }}</td>
      <td v-else><span class="transaction-description">{{ item.description || '—' }}</span></td>
    </template>
    <td>
      <div class="transaction-actions">
        <button class="icon-button" title="Редактировать операцию" @click="emit('startEdit', item)"><Pencil :size="16" /></button>
        <button class="icon-button danger" title="Удалить операцию" @click="emit('remove', item.id, transactionTitle(item))"><Trash2 :size="17" /></button>
      </div>
    </td>
  </tr>
</template>
