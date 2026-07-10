<script setup lang="ts">
import { Eye, Plus, Search, WalletCards } from '@lucide/vue'
import { computed } from 'vue'
import FinanceSummary from '@/components/finance/FinanceSummary.vue'
import TransactionBulkActions from '@/components/finance/TransactionBulkActions.vue'
import TransactionColumnSettings from '@/components/finance/TransactionColumnSettings.vue'
import TransactionTable from '@/components/finance/TransactionTable.vue'
import { useFinanceWorkspaceContext, useWorkspaceModalsContext, useWorkspaceUiContext } from '@/composables/useWorkspaceContext'

const finance = useFinanceWorkspaceContext()
const modals = useWorkspaceModalsContext()
const ui = useWorkspaceUiContext()

const {
  addingTransaction,
  allVisibleTransactionsSelected,
  applyBulkTransactionCategory,
  applyBulkTransactionSection,
  bankLabels,
  bulkCategoryValue,
  bulkSectionValue,
  canToggleTransactionColumn,
  cancelCreateTransaction,
  cancelEditTransaction,
  categories,
  clearTransactionSelection,
  createTransaction,
  dashboardVisibility,
  draggedTransactionColumn,
  dropTransactionColumn,
  editingTransactionId,
  finishTransactionColumnDrag,
  isTransactionSelected,
  requestBulkTransactionDelete,
  sectionName,
  sections,
  selectedTransactionCount,
  startCreateTransaction,
  startEditTransaction,
  startTransactionColumnDrag,
  toggleAllVisibleTransactions,
  toggleTransactionColumn,
  toggleTransactionSelection,
  toggleTransactionSort,
  transactionBalance,
  transactionColumnLabels,
  transactionColumnOrder,
  transactionColumnVisibility,
  transactionEditForm,
  transactionExpense,
  transactionForm,
  transactionIncome,
  transactions,
  transactionSaving,
  transactionSign,
  transactionSort,
  transactionTitle,
  transactionTypeLabels,
  updateTransaction,
  visibleTransactionColumns,
  visibleTransactionIds,
  visibleTransactions,
} = finance
const { openModal, remove } = modals
const { dashboardControlsOpen, saving, transactionSearch } = ui

const transactionSearchModel = computed({
  get: () => transactionSearch.value,
  set: (value: string) => { transactionSearch.value = value },
})
</script>

<template>
  <FinanceSummary
    v-if="dashboardVisibility.summary"
    :balance="transactionBalance"
    :expense="transactionExpense"
    :income="transactionIncome"
    :saving="transactionSaving"
  />
  <section class="finance-panel panel">
    <div class="section-heading">
      <div class="finance-heading-main"><h2>Финансовые операции</h2><div class="search-field transaction-search"><Search :size="18" /><input v-model="transactionSearchModel" placeholder="Поиск по операциям, банку и описанию"></div></div>
      <div class="finance-heading-actions">
        <button class="primary-button dashboard-add-button" title="Добавить операцию" @click="startCreateTransaction()"><Plus :size="18" /></button>
        <button v-if="dashboardVisibility.addBank" class="secondary-button" type="button" @click="openModal('bankLabel')">Добавить банк</button>
        <button v-if="dashboardVisibility.addCategory" class="secondary-button" type="button" @click="openModal('category')">Добавить категории</button>
        <div class="visibility-menu">
          <button class="icon-button" :class="{ active: dashboardControlsOpen }" title="Настроить главную" type="button" @click="dashboardControlsOpen = !dashboardControlsOpen"><Eye :size="18" /></button>
          <TransactionColumnSettings
            v-if="dashboardControlsOpen"
            :can-toggle-column="canToggleTransactionColumn"
            :column-labels="transactionColumnLabels"
            :column-order="transactionColumnOrder"
            :column-visibility="transactionColumnVisibility"
            :dashboard-visibility="dashboardVisibility"
            @toggle-column="toggleTransactionColumn"
            @update-dashboard-visibility="Object.assign(dashboardVisibility, $event)"
          />
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
      @apply-category="applyBulkTransactionCategory"
      @apply-section="applyBulkTransactionSection"
      @clear="clearTransactionSelection"
      @delete="requestBulkTransactionDelete"
      @update-bulk-category-value="bulkCategoryValue = $event"
      @update-bulk-section-value="bulkSectionValue = $event"
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
      @cancel-create="cancelCreateTransaction"
      @cancel-edit="cancelEditTransaction"
      @create="createTransaction"
      @drop-column="dropTransactionColumn"
      @finish-column-drag="finishTransactionColumnDrag"
      @remove="(id, label) => remove('transaction', id, label)"
      @start-column-drag="startTransactionColumnDrag"
      @start-edit="startEditTransaction"
      @toggle-all="toggleAllVisibleTransactions"
      @toggle-selection="toggleTransactionSelection"
      @toggle-sort="toggleTransactionSort"
      @update="updateTransaction"
      @update:transaction-form="Object.assign(transactionForm, $event)"
      @update:transaction-edit-form="Object.assign(transactionEditForm, $event)"
    />
    <div v-if="!transactions.length && !addingTransaction" class="empty-state"><WalletCards :size="28" /><strong>Финансовых операций пока нет</strong><span>Добавьте доход, трату или накопление.</span><button class="secondary-button" @click="startCreateTransaction()"><Plus :size="17" />Операция</button></div>
  </section>
</template>
