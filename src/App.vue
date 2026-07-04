<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Check, RefreshCw, Trash2 } from '@lucide/vue'
import { ApiError, hasToken, setToken } from '@/api'
import AuthView from '@/components/auth/AuthView.vue'
import AboutContent from '@/components/modals/AboutContent.vue'
import BankLabelModal from '@/components/modals/BankLabelModal.vue'
import CategoryModal from '@/components/modals/CategoryModal.vue'
import DeleteConfirmContent from '@/components/modals/DeleteConfirmContent.vue'
import GasStationFormModal from '@/components/modals/GasStationFormModal.vue'
import RefuelingFormModal from '@/components/modals/RefuelingFormModal.vue'
import VehicleFormModal from '@/components/modals/VehicleFormModal.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { navItems } from '@/constants/navigation'
import DashboardView from '@/views/DashboardView.vue'
import RefuelingsView from '@/views/RefuelingsView.vue'
import { storeToRefs } from 'pinia'
import { useBulkSelection } from '@/composables/useBulkSelection'
import { useColumnSettings } from '@/composables/useColumnSettings'
import { useFormatters } from '@/composables/useFormatters'
import { useTheme } from '@/composables/useTheme'
import { useFinanceStore } from '@/stores/finance'
import { useFleetStore } from '@/stores/fleet'
import type { SortDirection } from '@/types/common'
import type {
  Transaction,
  TransactionDraft,
  TransactionPayload,
  TransactionType,
} from '@/types/finance'
import type { Refueling, RefuelingPayload } from '@/types/refueling'
import type { AppView } from '@/types/navigation'
import type { RefuelingColumnKey, TransactionSortKey } from '@/types/table'

type View = AppView
type Modal = 'vehicle' | 'refueling' | 'station' | 'bankLabel' | 'category' | 'about' | 'delete' | null
type DeleteResource = 'vehicle' | 'refueling' | 'gasStation' | 'transaction' | 'bulk-transactions' | 'bulk-refuelings'

const authenticated = ref(hasToken())
const {
  currency,
  formatDate,
} = useFormatters()
const { applyTheme, isDarkTheme, toggleTheme } = useTheme()
const financeStore = useFinanceStore()
const fleetStore = useFleetStore()
const {
  bankLabels,
  categories,
  sections,
  transactions,
} = storeToRefs(financeStore)
const {
  refuelings,
  stations,
  vehicles,
} = storeToRefs(fleetStore)

const activeView = ref<View>('dashboard')
const mobileNavOpen = ref(false)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const search = ref('')
const transactionSearch = ref('')
const modal = ref<Modal>(null)
const dashboardControlsOpen = ref(false)
const refuelingControlsOpen = ref(false)
const selectedBankLabelId = ref<number | null>(null)
const selectedCategoryId = ref<number | null>(null)
const bankLabelEditForm = reactive({ name: '', description: '' })
const categoryEditForm = reactive({ name: '', description: '' })
const dashboardVisibility = reactive({ summary: true, addBank: true, addCategory: true })
const refuelingVisibility = reactive({ summary: true, vehicles: true, stations: true })
const refuelingColumnLabels: Record<RefuelingColumnKey, string> = {
  date: 'Дата',
  vehicle: 'Транспорт',
  station_fuel: 'АЗС / топливо',
  mileage: 'Пробег',
  fuel_quantity: 'Объем',
  is_full_tank: 'Полный бак',
  cost: 'Стоимость',
}
const pendingDelete = ref<{ resource: DeleteResource, id: number, label: string } | null>(null)
const bankLabelForm = reactive({ name: '', description: '' })
const categoryForm = reactive({ name: '', description: '' })
const vehicleForm = reactive({
  name: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  initial_odometer: 0,
  is_active: true,
})
const refuelingForm = reactive({
  vehicle: null as number | null,
  date: new Date().toISOString().slice(0, 10),
  mileage: 0,
  fuel_quantity: 0,
  price_per_liter: 0,
  service_operation: 0,
  gas_station: null as number | null,
  fuel_type: 'АИ-95',
  is_full_tank: true,
  cashback: 0,
  comment: '',
})
const stationForm = reactive({ name: '', company: '', number: '', address: '' })
const transactionForm = reactive(defaultTransactionDraft())
const editingTransactionId = ref<number | null>(null)
const editingRefuelingId = ref<number | null>(null)
const transactionEditForm = reactive(defaultTransactionDraft())
const addingTransaction = ref(false)
const bulkCategoryValue = ref('')
const bulkSectionValue = ref('')
const bulkRefuelingVehicleValue = ref('')
const bulkRefuelingStationValue = ref('')
const transactionSort = reactive<{ key: TransactionSortKey | null, direction: SortDirection }>({
  key: null,
  direction: null,
})
const refuelingSort = reactive<{ key: RefuelingColumnKey | null, direction: SortDirection }>({
  key: null,
  direction: null,
})
const transactionColumnLabels: Record<TransactionSortKey, string> = {
  date: 'Дата',
  transaction_type: 'Тип операции',
  section: 'Раздел',
  category: 'Категория',
  amount: 'Сумма',
  bank_label: 'Банк',
  description: 'Описание',
}

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

const {
  canToggleColumn: canToggleRefuelingColumn,
  columnOrder: refuelingColumnOrder,
  columnVisibility: refuelingColumnVisibility,
  draggedColumn: draggedRefuelingColumn,
  dropColumn: dropRefuelingColumn,
  finishColumnDrag: finishRefuelingColumnDrag,
  startColumnDrag: startRefuelingColumnDrag,
  toggleColumn: toggleRefuelingColumn,
  visibleColumns: visibleRefuelingColumns,
} = useColumnSettings<RefuelingColumnKey>(
  ['date', 'vehicle', 'station_fuel', 'mileage', 'fuel_quantity', 'is_full_tank', 'cost'],
  {
    date: true,
    vehicle: true,
    station_fuel: true,
    mileage: true,
    fuel_quantity: true,
    is_full_tank: true,
    cost: true,
  },
)


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

const viewTitle = computed(() => navItems.find((item) => item.id === activeView.value)?.label || '')
const modalTitle = computed(() => {
  if (modal.value === 'vehicle') return 'Транспорт'
  if (modal.value === 'refueling') return editingRefuelingId.value ? 'Редактирование заправки' : 'Заправка'
  if (modal.value === 'station') return 'Автозаправочная станция'
  if (modal.value === 'bankLabel') return 'Банк'
  if (modal.value === 'category') return 'Категории'
  if (modal.value === 'delete') return 'Удалить запись'
  return 'О нас'
})
const modalEyebrow = computed(() => modal.value === 'about' ? 'Информация' : modal.value === 'delete' ? 'Подтверждение' : 'Новая запись')
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
const refuelingTotalCost = computed(() => refuelings.value.reduce((sum, item) => sum + Number(item.effective_cost || item.total_cost || 0), 0))
const refuelingTotalFuel = computed(() => refuelings.value.reduce((sum, item) => sum + Number(item.fuel_quantity || 0), 0))

const sortedTransactions = computed(() => {
  if (!transactionSort.key || !transactionSort.direction) return transactions.value

  const directionMultiplier = transactionSort.direction === 'asc' ? 1 : -1
  return [...transactions.value].sort((first, second) => {
    const firstValue = transactionSortValue(first, transactionSort.key!)
    const secondValue = transactionSortValue(second, transactionSort.key!)
    const result = typeof firstValue === 'number' && typeof secondValue === 'number'
      ? firstValue - secondValue
      : String(firstValue).localeCompare(String(secondValue), 'ru', { numeric: true, sensitivity: 'base' })

    return result * directionMultiplier
  })
})

const sortedRefuelings = computed(() => {
  if (!refuelingSort.key || !refuelingSort.direction) return refuelings.value

  const directionMultiplier = refuelingSort.direction === 'asc' ? 1 : -1
  return [...refuelings.value].sort((first, second) => {
    const firstValue = refuelingSortValue(first, refuelingSort.key!)
    const secondValue = refuelingSortValue(second, refuelingSort.key!)
    const result = typeof firstValue === 'number' && typeof secondValue === 'number'
      ? firstValue - secondValue
      : String(firstValue).localeCompare(String(secondValue), 'ru', { numeric: true, sensitivity: 'base' })

    return result * directionMultiplier
  })
})

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
const visibleRefuelingIds = computed(() => filteredRefuelings.value.map((item) => item.id))
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
const {
  allVisibleSelected: allVisibleRefuelingsSelected,
  clearSelection: clearRefuelingIds,
  isSelected: isRefuelingSelected,
  keepExisting: keepExistingRefuelingSelection,
  selectedCount: selectedRefuelingCount,
  selectedIds: selectedRefuelingIds,
  toggleAllVisible: toggleAllVisibleRefuelings,
  toggleSelection: toggleRefuelingSelection,
} = useBulkSelection(visibleRefuelingIds)

const filteredVehicles = computed(() => {
  const query = search.value.toLowerCase()
  return vehicles.value.filter((item) =>
    [item.name, item.brand, item.model].some((value) => value?.toLowerCase().includes(query)),
  )
})
const filteredRefuelings = computed(() => {
  const query = search.value.toLowerCase()
  return sortedRefuelings.value.filter((item) => {
    const vehicle = vehicleById(item.vehicle)
    const station = stationById(item.gas_station)
    return [vehicle?.name, station?.name, station?.company, item.fuel_type, item.date].some((value) => value?.toLowerCase().includes(query))
  })
})
const filteredStations = computed(() => {
  const query = search.value.toLowerCase()
  return stations.value.filter((item) =>
    [item.name, item.company, item.address].some((value) => value?.toLowerCase().includes(query)),
  )
})

const transactionTypeLabels: Record<TransactionType, string> = {
  income: 'Доход',
  expense: 'Трата',
  saving: 'Накопление',
}

function vehicleById(id: number | null) {
  return vehicles.value.find((vehicle) => vehicle.id === id)
}

function stationById(id: number | null) {
  return stations.value.find((station) => station.id === id)
}

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

function refuelingSortValue(item: Refueling, key: RefuelingColumnKey) {
  if (key === 'date') return new Date(`${item.date}T00:00:00`).getTime()
  if (key === 'vehicle') return vehicleById(item.vehicle)?.name || ''
  if (key === 'station_fuel') return `${stationById(item.gas_station)?.company || stationById(item.gas_station)?.name || ''} ${item.fuel_type || ''}`
  if (key === 'mileage') return Number(item.mileage || 0)
  if (key === 'fuel_quantity') return Number(item.fuel_quantity || 0)
  if (key === 'is_full_tank') return item.is_full_tank ? 1 : 0
  return Number(item.effective_cost || item.total_cost || 0)
}

function toggleRefuelingSort(key: RefuelingColumnKey) {
  if (refuelingSort.key !== key) {
    refuelingSort.key = key
    refuelingSort.direction = 'asc'
    return
  }

  if (refuelingSort.direction === 'asc') {
    refuelingSort.direction = 'desc'
    return
  }

  refuelingSort.key = null
  refuelingSort.direction = null
}

function toggleTransactionSort(key: TransactionSortKey) {
  if (transactionSort.key !== key) {
    transactionSort.key = key
    transactionSort.direction = 'asc'
    return
  }

  if (transactionSort.direction === 'asc') {
    transactionSort.direction = 'desc'
    return
  }

  transactionSort.key = null
  transactionSort.direction = null
}

async function handleAuthenticated() {
  authenticated.value = true
  await loadData()
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([
      fleetStore.load(),
      financeStore.load(),
    ])
    keepExistingRefuelingSelection(refuelings.value.map((item) => item.id))
    keepExistingTransactionSelection(transactions.value.map((item) => item.id))
  } catch (requestError) {
    if (!hasToken()) {
      authenticated.value = false
    } else {
      error.value = requestError instanceof ApiError ? requestError.message : 'Не удалось загрузить данные'
    }
  } finally {
    loading.value = false
  }
}

function selectView(view: View) {
  activeView.value = view
  search.value = ''
  mobileNavOpen.value = false
  dashboardControlsOpen.value = false
  refuelingControlsOpen.value = false
}

function openModal(type: Exclude<Modal, null>) {
  error.value = ''
  if (type === 'refueling') resetRefuelingForm()
  modal.value = type
  if (type === 'refueling' && !refuelingForm.vehicle && vehicles.value.length) {
    refuelingForm.vehicle = vehicles.value[0]!.id
  }
}

function closeModal() {
  selectedBankLabelId.value = null
  selectedCategoryId.value = null
  Object.assign(bankLabelEditForm, { name: '', description: '' })
  Object.assign(categoryEditForm, { name: '', description: '' })
  editingRefuelingId.value = null
  modal.value = null
  pendingDelete.value = null
}

async function createVehicle() {
  await submit(async () => {
    await fleetStore.createVehicle(vehicleForm)
    Object.assign(vehicleForm, {
      name: '', brand: '', model: '', year: new Date().getFullYear(),
      initial_odometer: 0, is_active: true,
    })
  })
}

function resetRefuelingForm() {
  Object.assign(refuelingForm, {
    vehicle: vehicles.value[0]?.id ?? null,
    date: new Date().toISOString().slice(0, 10),
    mileage: 0,
    fuel_quantity: 0,
    price_per_liter: 0,
    service_operation: 0,
    gas_station: null,
    fuel_type: 'АИ-95',
    is_full_tank: true,
    cashback: 0,
    comment: '',
  })
}

function refuelingPayload(): RefuelingPayload {
  return {
    ...refuelingForm,
    gas_station: refuelingForm.gas_station || null,
    fuel_type: refuelingForm.fuel_type || null,
  }
}

function startEditRefueling(item: Refueling) {
  error.value = ''
  editingRefuelingId.value = item.id
  Object.assign(refuelingForm, {
    vehicle: item.vehicle,
    date: item.date,
    mileage: item.mileage ?? 0,
    fuel_quantity: item.fuel_quantity === null ? 0 : Number(item.fuel_quantity),
    price_per_liter: item.price_per_liter === null ? 0 : Number(item.price_per_liter),
    service_operation: Number(item.service_operation || 0),
    gas_station: item.gas_station,
    fuel_type: item.fuel_type || 'АИ-95',
    is_full_tank: Boolean(item.is_full_tank),
    cashback: Number(item.cashback || 0),
    comment: item.comment || '',
  })
  modal.value = 'refueling'
}

async function saveRefueling() {
  await submit(async () => {
    if (editingRefuelingId.value) {
      await fleetStore.updateRefueling(editingRefuelingId.value, refuelingPayload())
    } else {
      await fleetStore.createRefueling(refuelingPayload())
    }
    editingRefuelingId.value = null
    resetRefuelingForm()
    await loadData()
  })
}

async function createStation() {
  await submit(async () => {
    await fleetStore.createGasStation(stationForm)
    Object.assign(stationForm, { name: '', company: '', number: '', address: '' })
  })
}

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

async function updateBankLabel() {
  const bankLabelId = selectedBankLabelId.value
  if (!bankLabelId) return
  await submit(async () => {
    const updated = await financeStore.updateBankLabel(bankLabelId, bankLabelEditForm)
    selectBankLabelForEdit(updated.id)
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

function bulkValue(rawValue: string) {
  return rawValue === '__clear__' ? null : Number(rawValue)
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
  error.value = ''
  pendingDelete.value = { resource: 'bulk-transactions', id: 0, label: `${selectedTransactionIds.value.length} операций` }
  modal.value = 'delete'
}

function clearRefuelingSelection() {
  clearRefuelingIds()
  bulkRefuelingVehicleValue.value = ''
  bulkRefuelingStationValue.value = ''
}

async function applyBulkRefuelingVehicle() {
  if (!selectedRefuelingIds.value.length || !bulkRefuelingVehicleValue.value) return
  await submit(async () => {
    await Promise.all(selectedRefuelingIds.value.map((id) =>
      fleetStore.updateRefueling(id, { vehicle: Number(bulkRefuelingVehicleValue.value) }),
    ))
    clearRefuelingSelection()
    await loadData()
  }, { closeAfter: false })
}

async function applyBulkRefuelingStation() {
  if (!selectedRefuelingIds.value.length || !bulkRefuelingStationValue.value) return
  await submit(async () => {
    const gasStation = bulkRefuelingStationValue.value === '__clear__' ? null : Number(bulkRefuelingStationValue.value)
    await Promise.all(selectedRefuelingIds.value.map((id) =>
      fleetStore.updateRefueling(id, { gas_station: gasStation }),
    ))
    clearRefuelingSelection()
    await loadData()
  }, { closeAfter: false })
}

function requestBulkRefuelingDelete() {
  if (!selectedRefuelingIds.value.length) return
  error.value = ''
  pendingDelete.value = { resource: 'bulk-refuelings', id: 0, label: `${selectedRefuelingIds.value.length} заправок` }
  modal.value = 'delete'
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

async function submit(action: () => Promise<void>, options: { closeAfter?: boolean } = {}) {
  saving.value = true
  error.value = ''
  try {
    await action()
    if (options.closeAfter !== false) closeModal()
  } catch (requestError) {
    error.value = requestError instanceof ApiError ? requestError.message : 'Не удалось сохранить данные'
  } finally {
    saving.value = false
  }
}

function remove(resource: DeleteResource, id: number, label: string) {
  error.value = ''
  pendingDelete.value = { resource, id, label }
  modal.value = 'delete'
}

async function confirmRemove() {
  if (!pendingDelete.value) return
  saving.value = true
  error.value = ''
  const target = pendingDelete.value
  try {
    if (target.resource === 'bulk-transactions') {
      await Promise.all(selectedTransactionIds.value.map((id) => financeStore.deleteTransaction(id)))
      clearTransactionSelection()
    } else if (target.resource === 'bulk-refuelings') {
      await Promise.all(selectedRefuelingIds.value.map((id) => fleetStore.deleteRefueling(id)))
      clearRefuelingSelection()
    } else if (target.resource === 'vehicle') {
      await fleetStore.deleteVehicle(target.id)
    } else if (target.resource === 'refueling') {
      await fleetStore.deleteRefueling(target.id)
    } else if (target.resource === 'gasStation') {
      await fleetStore.deleteGasStation(target.id)
    } else {
      await financeStore.deleteTransaction(target.id)
    }
    closeModal()
    await loadData()
  } catch (requestError) {
    error.value = requestError instanceof ApiError ? requestError.message : 'Не удалось удалить запись'
  } finally {
    saving.value = false
  }
}

function logout() {
  setToken(null)
  authenticated.value = false
  clearTransactionSelection()
  fleetStore.clear()
  financeStore.clear()
}

onMounted(() => {
  applyTheme()
  if (authenticated.value) loadData()
})
</script>

<template>

  <AuthView v-if="!authenticated" @authenticated="handleAuthenticated" />

  <AppLayout
    v-else
    :active-view="activeView"
    :dark-theme="isDarkTheme"
    :error="error"
    :loading="loading"
    :mobile-nav-open="mobileNavOpen"
    :title="viewTitle"
    @about="openModal('about')"
    @clear-error="error = ''"
    @close-menu="mobileNavOpen = false"
    @logout="logout"
    @open-menu="mobileNavOpen = true"
    @refresh="loadData"
    @select-view="selectView"
    @toggle-theme="toggleTheme"
  >
    <DashboardView
      v-if="activeView === 'dashboard'"
      :adding-transaction="addingTransaction"
      :all-visible-transactions-selected="allVisibleTransactionsSelected"
      :bank-labels="bankLabels"
      :bulk-category-value="bulkCategoryValue"
      :bulk-section-value="bulkSectionValue"
      :can-toggle-transaction-column="canToggleTransactionColumn"
      :categories="categories"
      :dashboard-controls-open="dashboardControlsOpen"
      :dashboard-visibility="dashboardVisibility"
      :dragged-transaction-column="draggedTransactionColumn"
      :editing-transaction-id="editingTransactionId"
      :is-transaction-selected="isTransactionSelected"
      :saving="saving"
      :section-name="sectionName"
      :sections="sections"
      :selected-transaction-count="selectedTransactionCount"
      :transaction-balance="transactionBalance"
      :transaction-column-labels="transactionColumnLabels"
      :transaction-column-order="transactionColumnOrder"
      :transaction-column-visibility="transactionColumnVisibility"
      :transaction-edit-form="transactionEditForm"
      :transaction-expense="transactionExpense"
      :transaction-form="transactionForm"
      :transaction-income="transactionIncome"
      :transaction-saving="transactionSaving"
      :transaction-search="transactionSearch"
      :transaction-sign="transactionSign"
      :transaction-sort="transactionSort"
      :transaction-title="transactionTitle"
      :transaction-type-labels="transactionTypeLabels"
      :transactions="transactions"
      :visible-transaction-columns="visibleTransactionColumns"
      :visible-transaction-ids="visibleTransactionIds"
      :visible-transactions="visibleTransactions"
      @apply-bulk-transaction-category="applyBulkTransactionCategory"
      @apply-bulk-transaction-section="applyBulkTransactionSection"
      @cancel-create-transaction="cancelCreateTransaction"
      @cancel-edit-transaction="cancelEditTransaction"
      @clear-transaction-selection="clearTransactionSelection"
      @create-transaction="createTransaction"
      @drop-transaction-column="dropTransactionColumn"
      @finish-transaction-column-drag="finishTransactionColumnDrag"
      @open-bank-label-modal="openModal('bankLabel')"
      @open-category-modal="openModal('category')"
      @remove-transaction="(id, label) => remove('transaction', id, label)"
      @request-bulk-transaction-delete="requestBulkTransactionDelete"
      @start-create-transaction="startCreateTransaction"
      @start-edit-transaction="startEditTransaction"
      @start-transaction-column-drag="startTransactionColumnDrag"
      @toggle-all-visible-transactions="toggleAllVisibleTransactions"
      @toggle-dashboard-controls="dashboardControlsOpen = !dashboardControlsOpen"
      @toggle-transaction-column="toggleTransactionColumn"
      @toggle-transaction-selection="toggleTransactionSelection"
      @toggle-transaction-sort="toggleTransactionSort"
      @update-bulk-category-value="bulkCategoryValue = $event"
      @update-bulk-section-value="bulkSectionValue = $event"
      @update-transaction="updateTransaction"
      @update-transaction-search="transactionSearch = $event"
    />

    <RefuelingsView
      v-else
      :all-visible-refuelings-selected="allVisibleRefuelingsSelected"
      :bulk-refueling-station-value="bulkRefuelingStationValue"
      :bulk-refueling-vehicle-value="bulkRefuelingVehicleValue"
      :can-toggle-refueling-column="canToggleRefuelingColumn"
      :dragged-refueling-column="draggedRefuelingColumn"
      :filtered-refuelings="filteredRefuelings"
      :filtered-stations="filteredStations"
      :filtered-vehicles="filteredVehicles"
      :is-refueling-selected="isRefuelingSelected"
      :refueling-column-labels="refuelingColumnLabels"
      :refueling-column-order="refuelingColumnOrder"
      :refueling-column-visibility="refuelingColumnVisibility"
      :refueling-controls-open="refuelingControlsOpen"
      :refueling-sort="refuelingSort"
      :refueling-total-cost="refuelingTotalCost"
      :refueling-total-fuel="refuelingTotalFuel"
      :refueling-visibility="refuelingVisibility"
      :refuelings="refuelings"
      :saving="saving"
      :search="search"
      :selected-refueling-count="selectedRefuelingCount"
      :station-by-id="stationById"
      :stations="stations"
      :vehicle-by-id="vehicleById"
      :vehicles="vehicles"
      :visible-refueling-columns="visibleRefuelingColumns"
      :visible-refueling-ids="visibleRefuelingIds"
      @apply-bulk-refueling-station="applyBulkRefuelingStation"
      @apply-bulk-refueling-vehicle="applyBulkRefuelingVehicle"
      @clear-refueling-selection="clearRefuelingSelection"
      @drop-refueling-column="dropRefuelingColumn"
      @finish-refueling-column-drag="finishRefuelingColumnDrag"
      @open-refueling-modal="openModal('refueling')"
      @open-station-modal="openModal('station')"
      @open-vehicle-modal="openModal('vehicle')"
      @remove-gas-station="(id, label) => remove('gasStation', id, label)"
      @remove-refueling="(id, label) => remove('refueling', id, label)"
      @remove-vehicle="(id, label) => remove('vehicle', id, label)"
      @request-bulk-refueling-delete="requestBulkRefuelingDelete"
      @start-edit-refueling="startEditRefueling"
      @start-refueling-column-drag="startRefuelingColumnDrag"
      @toggle-all-visible-refuelings="toggleAllVisibleRefuelings"
      @toggle-refueling-column="toggleRefuelingColumn"
      @toggle-refueling-controls="refuelingControlsOpen = !refuelingControlsOpen"
      @toggle-refueling-selection="toggleRefuelingSelection"
      @toggle-refueling-sort="toggleRefuelingSort"
      @update-bulk-refueling-station-value="bulkRefuelingStationValue = $event"
      @update-bulk-refueling-vehicle-value="bulkRefuelingVehicleValue = $event"
      @update-search="search = $event"
    />
  </AppLayout>

  <BaseModal
    v-if="modal"
    :close-danger="modal === 'about'"
    :eyebrow="modalEyebrow"
    :show-footer="modal !== 'about' && modal !== 'bankLabel' && modal !== 'category'"
    :title="modalTitle"
    :wide="modal === 'bankLabel' || modal === 'category'"
    @close="closeModal"
  >
      <VehicleFormModal v-if="modal === 'vehicle'" :form="vehicleForm" @submit="createVehicle" @update:form="Object.assign(vehicleForm, $event)" />
      <RefuelingFormModal v-if="modal === 'refueling'" :form="refuelingForm" :stations="stations" :vehicles="vehicles" @submit="saveRefueling" @update:form="Object.assign(refuelingForm, $event)" />
      <GasStationFormModal v-if="modal === 'station'" :form="stationForm" @submit="createStation" @update:form="Object.assign(stationForm, $event)" />
      <BankLabelModal
        v-if="modal === 'bankLabel'"
        :bank-labels="bankLabels"
        :create-form="bankLabelForm"
        :edit-form="bankLabelEditForm"
        :saving="saving"
        :selected-id="selectedBankLabelId"
        @create="createBankLabel"
        @select="selectBankLabelForEdit"
        @update="updateBankLabel"
        @update:create-form="Object.assign(bankLabelForm, $event)"
        @update:edit-form="Object.assign(bankLabelEditForm, $event)"
      />
      <CategoryModal
        v-if="modal === 'category'"
        :categories="categories"
        :create-form="categoryForm"
        :edit-form="categoryEditForm"
        :saving="saving"
        :selected-id="selectedCategoryId"
        @create="createCategory"
        @select="selectCategoryForEdit"
        @update="updateCategory"
        @update:create-form="Object.assign(categoryForm, $event)"
        @update:edit-form="Object.assign(categoryEditForm, $event)"
      />
      <AboutContent v-if="modal === 'about'" />
      <DeleteConfirmContent v-if="modal === 'delete'" :label="pendingDelete?.label" />

      <p v-if="error" class="form-error modal-error">{{ error }}</p>
      <template #footer>
        <template v-if="modal === 'delete'">
          <button class="danger-button" type="button" :disabled="saving" @click="closeModal">Отмена</button>
          <button class="secondary-button" type="button" :disabled="saving" @click="confirmRemove">
            <RefreshCw v-if="saving" class="spin" :size="17" /><Trash2 v-else :size="17" />Удалить
          </button>
        </template>
        <template v-else>
          <button class="secondary-button" type="button" @click="closeModal">Отмена</button>
          <button class="primary-button" type="submit" :form="`${modal}-form`" :disabled="saving">
            <RefreshCw v-if="saving" class="spin" :size="17" /><Check v-else :size="17" />Сохранить
          </button>
        </template>
      </template>
  </BaseModal>
</template>
