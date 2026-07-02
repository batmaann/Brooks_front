<script setup lang="ts">
import { Eye, Plus, Search, WalletCards } from '@lucide/vue'
import { computed } from 'vue'
import TransactionBulkActions from '@/components/finance/TransactionBulkActions.vue'
import TransactionTable from '@/components/finance/TransactionTable.vue'
import { useFormatters } from '@/composables/useFormatters'
import type { BankLabel, Category, Section, Transaction, TransactionDraft, TransactionType } from '@/types/finance'
import type { SortDirection } from '@/types/common'
import type { TransactionSortKey } from '@/types/table'

interface Props {
  addingTransaction: boolean
  allVisibleTransactionsSelected: boolean
  bankLabels: BankLabel[]
  bulkCategoryValue: string
  bulkSectionValue: string
  canToggleTransactionColumn: (key: TransactionSortKey) => boolean
  categories: Category[]
  dashboardControlsOpen: boolean
  dashboardVisibility: { summary: boolean, addBank: boolean, addCategory: boolean }
  draggedTransactionColumn: TransactionSortKey | null
  editingTransactionId: number | null
  isTransactionSelected: (id: number) => boolean
  saving: boolean
  sectionName: (id: number | null) => string
  sections: Section[]
  selectedTransactionCount: number
  transactionBalance: number
  transactionColumnLabels: Record<TransactionSortKey, string>
  transactionColumnOrder: TransactionSortKey[]
  transactionColumnVisibility: Record<TransactionSortKey, boolean>
  transactionEditForm: TransactionDraft
  transactionExpense: number
  transactionForm: TransactionDraft
  transactionIncome: number
  transactionSaving: number
  transactionSearch: string
  transactionSign: (type: TransactionType) => string
  transactionSort: { key: TransactionSortKey | null, direction: SortDirection }
  transactionTitle: (item: Transaction) => string
  transactionTypeLabels: Record<TransactionType, string>
  transactions: Transaction[]
  visibleTransactionColumns: TransactionSortKey[]
  visibleTransactionIds: number[]
  visibleTransactions: Transaction[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  applyBulkTransactionCategory: []
  applyBulkTransactionSection: []
  cancelCreateTransaction: []
  cancelEditTransaction: []
  clearTransactionSelection: []
  createTransaction: []
  dropTransactionColumn: [key: TransactionSortKey]
  finishTransactionColumnDrag: []
  openBankLabelModal: []
  openCategoryModal: []
  removeTransaction: [id: number, label: string]
  requestBulkTransactionDelete: []
  startCreateTransaction: []
  startEditTransaction: [item: Transaction]
  startTransactionColumnDrag: [key: TransactionSortKey]
  toggleAllVisibleTransactions: [checked: boolean]
  toggleDashboardControls: []
  toggleTransactionColumn: [key: TransactionSortKey, checked: boolean]
  toggleTransactionSelection: [id: number, checked: boolean]
  toggleTransactionSort: [key: TransactionSortKey]
  updateBulkCategoryValue: [value: string]
  updateBulkSectionValue: [value: string]
  updateTransaction: [id: number]
  updateTransactionSearch: [value: string]
}>()

const {
  currency,
} = useFormatters()

const transactionSearchModel = computed({
  get: () => props.transactionSearch,
  set: (value: string) => emit('updateTransactionSearch', value),
})

</script>

<template>
  <div v-if="dashboardVisibility.summary" class="finance-summary">
    <div class="finance-summary-item income"><span>Доходы</span><strong>{{ currency(transactionIncome) }}</strong></div>
    <div class="finance-summary-item expense"><span>Траты</span><strong>{{ currency(transactionExpense) }}</strong></div>
    <div class="finance-summary-item saving"><span>Накопления</span><strong>{{ currency(transactionSaving) }}</strong></div>
    <div class="finance-summary-item balance"><span>Итог</span><strong>{{ currency(transactionBalance) }}</strong></div>
  </div>
  <section class="finance-panel panel">
    <div class="section-heading">
      <div class="finance-heading-main"><h2>Финансовые операции</h2><div class="search-field transaction-search"><Search :size="18" /><input v-model="transactionSearchModel" placeholder="Поиск по операциям, банку и описанию"></div></div>
      <div class="finance-heading-actions">
        <button class="primary-button dashboard-add-button" title="Добавить операцию" @click="emit('startCreateTransaction')"><Plus :size="18" /></button>
        <button v-if="dashboardVisibility.addBank" class="secondary-button" type="button" @click="emit('openBankLabelModal')">Добавить банк</button>
        <button v-if="dashboardVisibility.addCategory" class="secondary-button" type="button" @click="emit('openCategoryModal')">Добавить категории</button>
        <div class="visibility-menu">
          <button class="icon-button" :class="{ active: dashboardControlsOpen }" title="Настроить главную" type="button" @click="emit('toggleDashboardControls')"><Eye :size="18" /></button>
          <div v-if="dashboardControlsOpen" class="visibility-dropdown">
            <label><input v-model="dashboardVisibility.summary" type="checkbox"><span>Виджеты</span></label>
            <label><input v-model="dashboardVisibility.addBank" type="checkbox"><span>Добавить банк</span></label>
            <label><input v-model="dashboardVisibility.addCategory" type="checkbox"><span>Добавить категории</span></label>
            <label class="disabled" title="В разработке"><input disabled type="checkbox"><span>AI</span></label>
            <label class="disabled" title="В разработке"><input disabled type="checkbox"><span>Прикрепить файл</span></label>
            <div class="visibility-divider"></div>
            <strong class="visibility-title">Столбцы</strong>
            <label v-for="columnKey in transactionColumnOrder" :key="`visibility-${columnKey}`" :class="{ disabled: !canToggleTransactionColumn(columnKey) }"><input type="checkbox" :checked="transactionColumnVisibility[columnKey]" :disabled="!canToggleTransactionColumn(columnKey)" @change="emit('toggleTransactionColumn', columnKey, ($event.target as HTMLInputElement).checked)"><span>{{ transactionColumnLabels[columnKey] }}</span></label>
          </div>
        </div>
      </div>
    </div>
    <TransactionBulkActions
      :bulk-category-value="bulkCategoryValue"
      :bulk-section-value="bulkSectionValue"
      :categories="categories"
      :saving="saving"
      :sections="sections"
      :selected-count="selectedTransactionCount"
      @apply-category="emit('applyBulkTransactionCategory')"
      @apply-section="emit('applyBulkTransactionSection')"
      @clear="emit('clearTransactionSelection')"
      @delete="emit('requestBulkTransactionDelete')"
      @update-bulk-category-value="emit('updateBulkCategoryValue', $event)"
      @update-bulk-section-value="emit('updateBulkSectionValue', $event)"
    />
    <TransactionTable
      :adding-transaction="addingTransaction"
      :all-visible-selected="allVisibleTransactionsSelected"
      :bank-labels="bankLabels"
      :categories="categories"
      :dragged-column="draggedTransactionColumn"
      :editing-transaction-id="editingTransactionId"
      :has-transactions="transactions.length > 0"
      :is-selected="isTransactionSelected"
      :saving="saving"
      :section-name="sectionName"
      :sections="sections"
      :sort="transactionSort"
      :transaction-column-labels="transactionColumnLabels"
      :transaction-edit-form="transactionEditForm"
      :transaction-form="transactionForm"
      :transaction-sign="transactionSign"
      :transaction-title="transactionTitle"
      :transaction-type-labels="transactionTypeLabels"
      :transactions="visibleTransactions"
      :visible-column-ids="visibleTransactionIds"
      :visible-columns="visibleTransactionColumns"
      @cancel-create="emit('cancelCreateTransaction')"
      @cancel-edit="emit('cancelEditTransaction')"
      @create="emit('createTransaction')"
      @drop-column="emit('dropTransactionColumn', $event)"
      @finish-column-drag="emit('finishTransactionColumnDrag')"
      @remove="(id, label) => emit('removeTransaction', id, label)"
      @start-column-drag="emit('startTransactionColumnDrag', $event)"
      @start-edit="emit('startEditTransaction', $event)"
      @toggle-all="emit('toggleAllVisibleTransactions', $event)"
      @toggle-selection="(id, checked) => emit('toggleTransactionSelection', id, checked)"
      @toggle-sort="emit('toggleTransactionSort', $event)"
      @update="emit('updateTransaction', $event)"
    />
    <div v-if="!transactions.length && !addingTransaction" class="empty-state"><WalletCards :size="28" /><strong>Финансовых операций пока нет</strong><span>Добавьте доход, трату или накопление.</span><button class="secondary-button" @click="emit('startCreateTransaction')"><Plus :size="17" />Операция</button></div>
  </section>
</template>
