<script setup lang="ts">
import { Eye, Paperclip, Plus, Search, WalletCards } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FinanceSummary from '@/components/finance/FinanceSummary.vue'
import TransactionImportModal from '@/components/finance/TransactionImportModal.vue'
import TransactionBulkActions from '@/components/finance/TransactionBulkActions.vue'
import TransactionColumnSettings from '@/components/finance/TransactionColumnSettings.vue'
import TransactionTable from '@/components/finance/TransactionTable.vue'
import { useFinanceWorkspaceContext, useWorkspaceModalsContext, useWorkspaceUiContext } from '@/composables/useWorkspaceContext'

const finance = useFinanceWorkspaceContext()
const modals = useWorkspaceModalsContext()
const ui = useWorkspaceUiContext()
const emit = defineEmits<{ openStatistics: [metric: 'income' | 'expense' | 'saving' | 'total'] }>()

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
  monthlySummary,
  refreshFinanceData,
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
  transactionColumnLabels,
  transactionColumnOrder,
  transactionColumnVisibility,
  transactionEditForm,
  transactionForm,
  transactions,
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
const importModalOpen = ref(false)
const transactionSearchOpen = ref(Boolean(transactionSearch.value))
const transactionSearchInput = ref<HTMLInputElement>()
const transactionSearchControl = ref<HTMLElement>()
const transactionSearchWidth = ref(390)
const dashboardControlsMenu = ref<HTMLElement>()

function closeDashboardControlsOnOutsideClick(event: MouseEvent) {
  if (dashboardControlsOpen.value && event.target instanceof Node && !dashboardControlsMenu.value?.contains(event.target)) {
    dashboardControlsOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', closeDashboardControlsOnOutsideClick, true))
onBeforeUnmount(() => {
  document.removeEventListener('click', closeDashboardControlsOnOutsideClick, true)
  dashboardControlsOpen.value = false
})

watch(() => dashboardVisibility.search, (visible) => {
  if (visible) return
  transactionSearch.value = ''
  transactionSearchOpen.value = false
}, { immediate: true })

async function openTransactionSearch() {
  const bounds = transactionSearchControl.value?.getBoundingClientRect()
  transactionSearchWidth.value = Math.max(40, Math.min(390, (bounds?.right ?? 468) - 78))
  transactionSearchOpen.value = true
  await nextTick()
  transactionSearchInput.value?.focus()
}

function collapseUnusedSearch() {
  if (transactionSearch.value.trim()) return
  transactionSearch.value = ''
  transactionSearchOpen.value = false
}

const transactionSearchModel = computed({
  get: () => transactionSearch.value,
  set: (value: string) => { transactionSearch.value = value },
})
</script>

<template>
  <FinanceSummary
    v-if="dashboardVisibility.summary"
    :summary="monthlySummary"
    @open-statistics="emit('openStatistics', $event)"
  />
  <section class="finance-panel panel">
    <div class="section-heading">
      <div class="finance-heading-main">
        <h2>Финансовые операции</h2>
      </div>
      <div class="finance-heading-actions">
        <button class="primary-button dashboard-add-button" :style="transactionSearchOpen ? { transform: `translateX(-${transactionSearchWidth - 40}px)` } : undefined" title="Добавить операцию" data-help-placement="left" data-help="Кнопка «+» — добавляет новую операцию: доход, трату или накопление. Нажмите её, заполните поля и сохраните операцию галочкой." @click="startCreateTransaction()"><Plus :size="18" /></button>
        <div v-if="dashboardVisibility.search" ref="transactionSearchControl" class="transaction-search-control" :class="{ 'search-open': transactionSearchOpen }">
          <div v-if="transactionSearchOpen" class="search-field transaction-search" data-help="Поиск по операциям — введите текст, чтобы найти операции по банку или описанию. Очистите поле, чтобы снова увидеть весь список." :style="{ width: `${transactionSearchWidth}px` }">
            <Search :size="18" />
            <input ref="transactionSearchInput" v-model="transactionSearchModel" aria-label="Поиск по операциям, банку и описанию" placeholder="Поиск по операциям, банку и описанию" @blur="collapseUnusedSearch">
          </div>
          <button v-else class="icon-button" type="button" title="Поиск по операциям" aria-label="Раскрыть поиск по операциям" data-help="Поиск по операциям — нажмите на лупу, чтобы раскрыть поле и найти операции по банку или описанию. Пустое поле свернётся, когда вы перейдёте к другому элементу." :aria-expanded="transactionSearchOpen" @click="openTransactionSearch">
            <Search :size="18" />
          </button>
        </div>
        <button v-if="dashboardVisibility.attachFile" class="icon-button" title="Прикрепить файл" type="button" data-help="Прикрепить файл — откройте окно импорта, чтобы загрузить выписку или документ с финансовыми операциями. Файл можно выбрать на устройстве, перетащить или вставить из буфера обмена." @click="importModalOpen = true"><Paperclip :size="18" /></button>
        <button v-if="dashboardVisibility.addBank" class="secondary-button" type="button" data-help="Добавить банк — создайте банк, чтобы выбирать его при добавлении операций. В этом окне также можно изменить название и описание существующего банка." @click="openModal('bankLabel')">Добавить банк</button>
        <button v-if="dashboardVisibility.addCategory" class="secondary-button" type="button" data-help="Добавить категории — создайте категорию, например «Продукты» или «Зарплата», чтобы указывать назначение операций. В этом окне также можно редактировать существующие категории." @click="openModal('category')">Добавить категории</button>
        <div ref="dashboardControlsMenu" class="visibility-menu">
          <button class="icon-button" :class="{ active: dashboardControlsOpen }" title="Настроить главную" type="button" data-help="Настроить главную — выберите, какие виджеты, кнопки и столбцы таблицы показывать на главной странице. Ваш выбор сохраняется в этом браузере." @click="dashboardControlsOpen = !dashboardControlsOpen"><Eye :size="18" /></button>
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
  <TransactionImportModal
    v-if="importModalOpen"
    :bank-labels="bankLabels"
    :categories="categories"
    @close="importModalOpen = false"
    @imported="refreshFinanceData"
  />
</template>

<style scoped>
.transaction-search-control { position: relative; flex: 0 0 40px; width: 40px; height: 42px; }
.finance-heading-actions .dashboard-add-button { position: relative; z-index: 21; }
.transaction-search-control .transaction-search { position: absolute; z-index: 20; top: 0; right: 0; max-width: calc(100vw - 32px); box-shadow: 0 4px 14px rgb(0 0 0 / 12%); }
.transaction-search-control .transaction-search input { min-width: 0; }
.transaction-search-control .transaction-search > svg { flex-shrink: 0; }
@media (max-width: 760px) {
  .finance-heading-actions .dashboard-add-button { transform: none !important; }
  .transaction-search-control.search-open { order: 1; flex: 1 1 100%; width: 100%; min-width: 0; }
  .transaction-search-control .transaction-search { position: static; width: 100% !important; max-width: none; box-shadow: none; }
  .transaction-search-control .transaction-search input { width: 100%; font-size: 16px; }
}
</style>
