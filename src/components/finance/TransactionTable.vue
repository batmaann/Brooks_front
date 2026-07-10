<script setup lang="ts">
import { ChevronDown, ChevronUp } from '@lucide/vue'
import TransactionCreateRow from '@/components/finance/TransactionCreateRow.vue'
import TransactionEditRow from '@/components/finance/TransactionEditRow.vue'
import TransactionRow from '@/components/finance/TransactionRow.vue'
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
  'update:transactionForm': [form: TransactionDraft]
  'update:transactionEditForm': [form: TransactionDraft]
}>()
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
          <TransactionCreateRow
            v-if="addingTransaction"
            :bank-labels="bankLabels"
            :categories="categories"
            :form="transactionForm"
            :saving="saving"
            :sections="sections"
            :visible-columns="visibleColumns"
            @cancel="emit('cancelCreate')"
            @create="emit('create')"
            @update:form="emit('update:transactionForm', $event)"
          />
          <template v-for="item in transactions" :key="item.id">
            <TransactionRow
              v-if="editingTransactionId !== item.id"
              :item="item"
              :section-name="sectionName"
              :selected="isSelected(item.id)"
              :transaction-sign="transactionSign"
              :transaction-title="transactionTitle"
              :transaction-type-labels="transactionTypeLabels"
              :visible-columns="visibleColumns"
              @remove="(id, label) => emit('remove', id, label)"
              @start-edit="emit('startEdit', $event)"
              @toggle-selection="(id, checked) => emit('toggleSelection', id, checked)"
            />
            <TransactionEditRow
              v-else
              :bank-labels="bankLabels"
              :categories="categories"
              :form="transactionEditForm"
              :is-selected="isSelected(item.id)"
              :item-id="item.id"
              :saving="saving"
              :sections="sections"
              :visible-columns="visibleColumns"
              @cancel="emit('cancelEdit')"
              @toggle-selection="(id, checked) => emit('toggleSelection', id, checked)"
              @update="emit('update', $event)"
              @update:form="emit('update:transactionEditForm', $event)"
            />
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
