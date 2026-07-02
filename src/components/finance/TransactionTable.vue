<script setup lang="ts">
import { CalendarDays, Check, ChevronDown, ChevronUp, Pencil, Trash2, X } from '@lucide/vue'
import { useFormatters } from '@/composables/useFormatters'
import type { SortDirection } from '@/types/common'
import type { BankLabel, Category, Section, Transaction, TransactionDraft, TransactionType } from '@/types/finance'
import type { TransactionSortKey } from '@/types/table'

interface Props {
  addingTransaction: boolean
  allVisibleSelected: boolean
  bankLabels: BankLabel[]
  categories: Category[]
  draggedColumn: TransactionSortKey | null
  editingTransactionId: number | null
  hasTransactions: boolean
  isSelected: (id: number) => boolean
  saving: boolean
  sectionName: (id: number | null) => string
  sections: Section[]
  sort: { key: TransactionSortKey | null, direction: SortDirection }
  transactionColumnLabels: Record<TransactionSortKey, string>
  transactionEditForm: TransactionDraft
  transactionForm: TransactionDraft
  transactionSign: (type: TransactionType) => string
  transactionTitle: (item: Transaction) => string
  transactionTypeLabels: Record<TransactionType, string>
  transactions: Transaction[]
  visibleColumnIds: number[]
  visibleColumns: TransactionSortKey[]
}

defineProps<Props>()

const emit = defineEmits<{
  cancelCreate: []
  cancelEdit: []
  create: []
  dropColumn: [key: TransactionSortKey]
  finishColumnDrag: []
  remove: [id: number, label: string]
  startColumnDrag: [key: TransactionSortKey]
  startEdit: [item: Transaction]
  toggleAll: [checked: boolean]
  toggleSelection: [id: number, checked: boolean]
  toggleSort: [key: TransactionSortKey]
  update: [id: number]
}>()

const {
  currency,
  formatDate,
} = useFormatters()
</script>

<template>
  <div v-if="hasTransactions || addingTransaction" class="table-panel transaction-table">
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th class="selection-column"><input type="checkbox" :checked="allVisibleSelected" :disabled="!visibleColumnIds.length" title="Выбрать все видимые" @change="emit('toggleAll', ($event.target as HTMLInputElement).checked)"></th>
            <th
              v-for="columnKey in visibleColumns"
              :key="columnKey"
              class="draggable-column"
              :class="{ dragging: draggedColumn === columnKey }"
              draggable="true"
              @dragstart="emit('startColumnDrag', columnKey)"
              @dragover.prevent
              @drop.prevent="emit('dropColumn', columnKey)"
              @dragend="emit('finishColumnDrag')"
            >
              <button class="sort-header" :class="{ active: sort.key === columnKey }" type="button" @click="emit('toggleSort', columnKey)">
                <span>{{ transactionColumnLabels[columnKey] }}</span>
                <ChevronUp v-if="sort.key === columnKey && sort.direction === 'asc'" :size="14" />
                <ChevronDown v-else-if="sort.key === columnKey && sort.direction === 'desc'" :size="14" />
              </button>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="addingTransaction" class="transaction-edit-row transaction-create-row">
            <td class="selection-column"></td>
            <template v-for="columnKey in visibleColumns" :key="`create-${columnKey}`">
              <td v-if="columnKey === 'date'"><input v-model="transactionForm.date" required type="date"></td>
              <td v-else-if="columnKey === 'transaction_type'"><select v-model="transactionForm.transaction_type"><option value="income">Доход</option><option value="expense">Трата</option><option value="saving">Накопление</option></select></td>
              <td v-else-if="columnKey === 'section'"><select v-model.number="transactionForm.section"><option :value="null">Не выбран</option><option v-for="section in sections" :key="section.id" :value="section.id">{{ section.name }}</option></select></td>
              <td v-else-if="columnKey === 'category'"><select v-model.number="transactionForm.category"><option :value="null">Не выбрана</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></td>
              <td v-else-if="columnKey === 'amount'"><input v-model.number="transactionForm.amount" required type="number" min="0.01" step="0.01"></td>
              <td v-else-if="columnKey === 'bank_label'"><select v-model.number="transactionForm.bank_label"><option :value="null">Не указан</option><option v-for="bankLabel in bankLabels" :key="bankLabel.id" :value="bankLabel.id">{{ bankLabel.name }}</option></select></td>
              <td v-else><input v-model.trim="transactionForm.description" placeholder="Описание"></td>
            </template>
            <td>
              <div class="transaction-actions editing">
                <button class="icon-button" title="Сохранить" :disabled="saving" @click="emit('create')"><Check :size="16" /></button>
                <button class="icon-button" title="Отмена" :disabled="saving" @click="emit('cancelCreate')"><X :size="16" /></button>
              </div>
            </td>
          </tr>
          <template v-for="item in transactions" :key="item.id">
            <tr v-if="editingTransactionId !== item.id" class="transaction-display-row" :class="{ selected: isSelected(item.id) }">
              <td class="selection-column"><input type="checkbox" :checked="isSelected(item.id)" title="Выбрать операцию" @change="emit('toggleSelection', item.id, ($event.target as HTMLInputElement).checked)"></td>
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
            <tr v-else class="transaction-edit-row">
              <td class="selection-column"><input type="checkbox" :checked="isSelected(item.id)" title="Выбрать операцию" @change="emit('toggleSelection', item.id, ($event.target as HTMLInputElement).checked)"></td>
              <template v-for="columnKey in visibleColumns" :key="`edit-${item.id}-${columnKey}`">
                <td v-if="columnKey === 'date'"><input v-model="transactionEditForm.date" required type="date"></td>
                <td v-else-if="columnKey === 'transaction_type'"><select v-model="transactionEditForm.transaction_type"><option value="income">Доход</option><option value="expense">Трата</option><option value="saving">Накопление</option></select></td>
                <td v-else-if="columnKey === 'section'"><select v-model.number="transactionEditForm.section"><option :value="null">Не выбран</option><option v-for="section in sections" :key="section.id" :value="section.id">{{ section.name }}</option></select></td>
                <td v-else-if="columnKey === 'category'"><select v-model.number="transactionEditForm.category"><option :value="null">Не выбрана</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></td>
                <td v-else-if="columnKey === 'amount'"><input v-model.number="transactionEditForm.amount" required type="number" min="0.01" step="0.01"></td>
                <td v-else-if="columnKey === 'bank_label'"><select v-model.number="transactionEditForm.bank_label"><option :value="null">Не указан</option><option v-for="bankLabel in bankLabels" :key="bankLabel.id" :value="bankLabel.id">{{ bankLabel.name }}</option></select></td>
                <td v-else><input v-model.trim="transactionEditForm.description" placeholder="Описание"></td>
              </template>
              <td>
                <div class="transaction-actions editing">
                  <button class="icon-button" title="Сохранить" :disabled="saving" @click="emit('update', item.id)"><Check :size="16" /></button>
                  <button class="icon-button" title="Отмена" :disabled="saving" @click="emit('cancelEdit')"><X :size="16" /></button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
