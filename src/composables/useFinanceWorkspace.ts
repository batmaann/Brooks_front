import { computed, reactive, ref, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useBulkSelection } from '@/composables/useBulkSelection'
import { useColumnSettings } from '@/composables/useColumnSettings'
import { useFormatters } from '@/composables/useFormatters'
import { useSortableData } from '@/composables/useSortableData'
import type { useFinanceStore } from '@/stores/finance'
import type { Transaction, TransactionDraft, TransactionPayload, TransactionType } from '@/types/finance'
import type { TransactionSortKey } from '@/types/table'

export type FinanceDeleteResource = 'transaction' | 'bulk-transactions'

type Submit = (action: () => Promise<void>, options?: { closeAfter?: boolean }) => Promise<void>

interface UseFinanceWorkspaceOptions {
  error: Ref<string>
  financeStore: ReturnType<typeof useFinanceStore>
  loadData: () => Promise<void>
  requestDelete: (resource: FinanceDeleteResource, id: number, label: string) => void
  submit: Submit
  transactionSearch: Ref<string>
}

const transactionColumnLabels: Record<TransactionSortKey, string> = {
  date: 'Дата',
  transaction_type: 'Тип операции',
  section: 'Раздел',
  category: 'Категория',
  amount: 'Сумма',
  bank_label: 'Банк',
  description: 'Описание',
}

const transactionTypeLabels: Record<TransactionType, string> = {
  income: 'Доход',
  expense: 'Трата',
  saving: 'Накопление',
}

function defaultTransactionDraft(): TransactionDraft {
  return {
    date: new Date().toISOString().slice(0, 10),
    transaction_type: 'expense',
    amount: 0,
    currency: 'RUB',
    status: 'confirmed',
    description: '',
    category: null,
    bank_label: null,
    section: null,
  }
}

function bulkValue(rawValue: string) {
  return rawValue === '__clear__' ? null : Number(rawValue)
}

export function useFinanceWorkspace(options: UseFinanceWorkspaceOptions) {
  const { error, financeStore, loadData, requestDelete, submit, transactionSearch } = options
  const { bankLabels, categories, sections, transactions } = storeToRefs(financeStore)
  const { currency, formatDate } = useFormatters()

  const selectedBankLabelId = ref<number | null>(null)
  const selectedCategoryId = ref<number | null>(null)
  const bankLabelEditForm = reactive({ name: '', description: '' })
  const categoryEditForm = reactive({ name: '', description: '' })
  const bankLabelForm = reactive({ name: '', description: '' })
  const categoryForm = reactive({ name: '', description: '' })
  const dashboardVisibility = reactive({ summary: true, addBank: true, addCategory: true })
  const transactionForm = reactive(defaultTransactionDraft())
  const transactionEditForm = reactive(defaultTransactionDraft())
  const editingTransactionId = ref<number | null>(null)
  const addingTransaction = ref(false)
  const bulkCategoryValue = ref('')
  const bulkSectionValue = ref('')

  const {
    canToggleColumn: canToggleTransactionColumn,
    columnOrder: transactionColumnOrder,
    columnVisibility: transactionColumnVisibility,
    draggedColumn: draggedTransactionColumn,
    dropColumn: dropTransactionColumn,
    finishColumnDrag: finishTransactionColumnDrag,
    startColumnDrag: startTransactionColumnDrag,
    toggleColumn: toggleTransactionColumn,
    visibleColumns: visibleTransactionColumns,
  } = useColumnSettings<TransactionSortKey>(
    ['date', 'transaction_type', 'section', 'category', 'amount', 'bank_label', 'description'],
    {
      date: true,
      transaction_type: true,
      section: true,
      category: true,
      amount: true,
      bank_label: true,
      description: true,
    },
  )

  const transactionIncome = computed(() => transactions.value
    .filter((item) => item.transaction_type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0))
  const transactionExpense = computed(() => transactions.value
    .filter((item) => item.transaction_type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0))
  const transactionSaving = computed(() => transactions.value
    .filter((item) => item.transaction_type === 'saving')
    .reduce((sum, item) => sum + Number(item.amount), 0))
  const transactionBalance = computed(() => transactionIncome.value - transactionExpense.value - transactionSaving.value)

  function sectionById(id: number | null) {
    return sections.value.find((section) => section.id === id)
  }

  function sectionName(id: number | null) {
    return sectionById(id)?.name || '—'
  }

  function transactionTitle(item: Transaction) {
    return item.category_name_snapshot || item.description || transactionTypeLabels[item.transaction_type]
  }

  function transactionSign(type: TransactionType) {
    return type === 'income' ? '+' : '-'
  }

  function transactionSortValue(item: Transaction, key: TransactionSortKey) {
    if (key === 'date') return new Date(`${item.date}T00:00:00`).getTime()
    if (key === 'transaction_type') return transactionTypeLabels[item.transaction_type]
    if (key === 'section') return sectionName(item.section)
    if (key === 'category') return item.category_name_snapshot || 'Без категории'
    if (key === 'amount') return Number(item.amount)
    if (key === 'bank_label') return item.bank_label_name_snapshot || 'Не указан'
    return item.description || ''
  }

  const {
    sort: transactionSort,
    sortedItems: sortedTransactions,
    toggleSort: toggleTransactionSort,
  } = useSortableData<Transaction, TransactionSortKey>(transactions, transactionSortValue)

  const visibleTransactions = computed(() => {
    const query = transactionSearch.value.trim().toLowerCase()
    if (!query) return sortedTransactions.value

    return sortedTransactions.value.filter((item) => [
      item.date,
      formatDate(item.date),
      transactionTypeLabels[item.transaction_type],
      sectionName(item.section),
      item.category_name_snapshot || 'Без категории',
      item.bank_label_name_snapshot || 'Не указан',
      item.description || '',
      item.currency,
      String(item.amount),
      currency(item.amount, item.currency),
    ].some((value) => value.toLowerCase().includes(query)))
  })
  const visibleTransactionIds = computed(() => visibleTransactions.value.map((item) => item.id))
  const {
    allVisibleSelected: allVisibleTransactionsSelected,
    clearSelection: clearTransactionIds,
    isSelected: isTransactionSelected,
    keepExisting: keepExistingTransactionSelection,
    selectedCount: selectedTransactionCount,
    selectedIds: selectedTransactionIds,
    toggleAllVisible: toggleAllVisibleTransactions,
    toggleSelection: toggleTransactionSelection,
  } = useBulkSelection(visibleTransactionIds)

  async function createBankLabel() {
    await submit(async () => {
      const created = await financeStore.createBankLabel(bankLabelForm)
      selectedBankLabelId.value = created.id
      Object.assign(bankLabelEditForm, { name: created.name, description: created.description || '' })
      Object.assign(bankLabelForm, { name: '', description: '' })
    })
  }

  function selectBankLabelForEdit(id: number | null) {
    selectedBankLabelId.value = id
    const bankLabel = bankLabels.value.find((item) => item.id === id)
    Object.assign(bankLabelEditForm, {
      name: bankLabel?.name || '',
      description: bankLabel?.description || '',
    })
  }

  async function updateBankLabel() {
    const bankLabelId = selectedBankLabelId.value
    if (!bankLabelId) return
    await submit(async () => {
      const updated = await financeStore.updateBankLabel(bankLabelId, bankLabelEditForm)
      selectBankLabelForEdit(updated.id)
      await loadData()
    }, { closeAfter: false })
  }

  async function createCategory() {
    await submit(async () => {
      const created = await financeStore.createCategory(categoryForm)
      selectedCategoryId.value = created.id
      Object.assign(categoryEditForm, { name: created.name, description: created.description || '' })
      Object.assign(categoryForm, { name: '', description: '' })
    }, { closeAfter: false })
  }

  function selectCategoryForEdit(id: number | null) {
    selectedCategoryId.value = id
    const category = categories.value.find((item) => item.id === id)
    Object.assign(categoryEditForm, {
      name: category?.name || '',
      description: category?.description || '',
    })
  }

  async function updateCategory() {
    const categoryId = selectedCategoryId.value
    if (!categoryId) return
    await submit(async () => {
      const updated = await financeStore.updateCategory(categoryId, categoryEditForm)
      selectCategoryForEdit(updated.id)
      await loadData()
    }, { closeAfter: false })
  }

  function resetTransactionForm() {
    Object.assign(transactionForm, defaultTransactionDraft())
  }

  function resetTransactionEditForm() {
    Object.assign(transactionEditForm, defaultTransactionDraft())
  }

  function transactionPayload(form: TransactionDraft): TransactionPayload {
    return {
      date: form.date,
      transaction_type: form.transaction_type,
      amount: form.amount,
      currency: form.currency.trim().toUpperCase(),
      status: form.status,
      description: form.description,
      category: form.category,
      bank_label: form.bank_label,
      section: form.section,
    }
  }

  function startCreateTransaction() {
    error.value = ''
    editingTransactionId.value = null
    resetTransactionEditForm()
    addingTransaction.value = true
  }

  function cancelCreateTransaction() {
    addingTransaction.value = false
    resetTransactionForm()
  }

  function startEditTransaction(item: Transaction) {
    error.value = ''
    addingTransaction.value = false
    resetTransactionForm()
    editingTransactionId.value = item.id
    Object.assign(transactionEditForm, {
      date: item.date,
      transaction_type: item.transaction_type,
      amount: Number(item.amount),
      currency: item.currency,
      status: item.status,
      description: item.description,
      category: item.category,
      bank_label: item.bank_label,
      section: item.section,
    })
  }

  function cancelEditTransaction() {
    editingTransactionId.value = null
    resetTransactionEditForm()
  }

  function clearTransactionSelection() {
    clearTransactionIds()
    bulkCategoryValue.value = ''
    bulkSectionValue.value = ''
  }

  async function applyBulkTransactionCategory() {
    if (!selectedTransactionIds.value.length || !bulkCategoryValue.value) return
    await submit(async () => {
      await Promise.all(selectedTransactionIds.value.map((id) =>
        financeStore.updateTransaction(id, { category: bulkValue(bulkCategoryValue.value) }),
      ))
      clearTransactionSelection()
      await loadData()
    }, { closeAfter: false })
  }

  async function applyBulkTransactionSection() {
    if (!selectedTransactionIds.value.length || !bulkSectionValue.value) return
    await submit(async () => {
      await Promise.all(selectedTransactionIds.value.map((id) =>
        financeStore.updateTransaction(id, { section: bulkValue(bulkSectionValue.value) }),
      ))
      clearTransactionSelection()
      await loadData()
    }, { closeAfter: false })
  }

  function requestBulkTransactionDelete() {
    if (!selectedTransactionIds.value.length) return
    requestDelete('bulk-transactions', 0, `${selectedTransactionIds.value.length} операций`)
  }

  async function createTransaction() {
    await submit(async () => {
      const payload = {
        ...transactionPayload(transactionForm),
        source: 'manual' as const,
      }
      await financeStore.createTransaction(payload)
      addingTransaction.value = false
      resetTransactionForm()
      await loadData()
    }, { closeAfter: false })
  }

  async function updateTransaction(id: number) {
    await submit(async () => {
      await financeStore.updateTransaction(id, transactionPayload(transactionEditForm))
      cancelEditTransaction()
      await loadData()
    }, { closeAfter: false })
  }

  function resetDictionaryEditors() {
    selectedBankLabelId.value = null
    selectedCategoryId.value = null
    Object.assign(bankLabelEditForm, { name: '', description: '' })
    Object.assign(categoryEditForm, { name: '', description: '' })
  }

  return {
    addingTransaction,
    allVisibleTransactionsSelected,
    applyBulkTransactionCategory,
    applyBulkTransactionSection,
    bankLabelEditForm,
    bankLabelForm,
    bankLabels,
    bulkCategoryValue,
    bulkSectionValue,
    canToggleTransactionColumn,
    cancelCreateTransaction,
    cancelEditTransaction,
    categories,
    categoryEditForm,
    categoryForm,
    clearTransactionSelection,
    createBankLabel,
    createCategory,
    createTransaction,
    dashboardVisibility,
    draggedTransactionColumn,
    dropTransactionColumn,
    editingTransactionId,
    finishTransactionColumnDrag,
    isTransactionSelected,
    keepExistingTransactionSelection,
    requestBulkTransactionDelete,
    resetDictionaryEditors,
    sectionName,
    sections,
    selectedBankLabelId,
    selectedCategoryId,
    selectedTransactionIds,
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
    updateBankLabel,
    updateCategory,
    updateTransaction,
    visibleTransactionColumns,
    visibleTransactionIds,
    visibleTransactions,
    selectBankLabelForEdit,
    selectCategoryForEdit,
  }
}
