<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  Building2,
  CalendarDays,
  CarFront,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleGauge,
  Eye,
  Fuel,
  Banknote,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Home,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  WalletCards,
  X,
} from '@lucide/vue'
import { api, ApiError, hasToken, listResult, setToken } from '@/api'

type View = 'dashboard' | 'refuelings'
type Modal = 'vehicle' | 'refueling' | 'station' | 'bankLabel' | 'category' | 'about' | 'delete' | null
type TransactionType = 'income' | 'expense' | 'saving'
type TransactionStatus = 'confirmed' | 'draft' | 'needs_review' | 'ignored'
type SortDirection = 'asc' | 'desc' | null
type TransactionSortKey = 'date' | 'transaction_type' | 'section' | 'category' | 'amount' | 'bank_label' | 'description'
type RefuelingColumnKey = 'date' | 'vehicle' | 'station_fuel' | 'mileage' | 'fuel_quantity' | 'is_full_tank' | 'cost'

interface Vehicle {
  id: number
  name: string
  brand: string | null
  model: string | null
  year: number | null
  initial_odometer: number
  current_odometer: number
  is_active: boolean
}

interface Refueling {
  id: number
  date: string
  mileage: number | null
  odometer: number
  fuel_quantity: string | null
  price_per_liter: string | null
  total_cost: string | null
  effective_cost: number | null
  fuel_consumption: number | null
  service_operation: string
  gas_station: number | null
  vehicle: number | null
  fuel_type: string | null
  is_full_tank: boolean
  discount: string
  comment: string
  transaction: number | null
  category: number | null
  is_complete: boolean
}

interface GasStation {
  id: number
  name: string
  number: string
  address: string
  company: string
}

interface BankLabel {
  id: number
  name: string
  description: string
}

interface Category {
  id: number
  name: string
  description: string
}

interface Section {
  id: number
  name: string
  code: string
  app: string
  description: string
  is_active: boolean
}

interface Transaction {
  id: number
  date: string
  transaction_type: TransactionType
  category: number | null
  category_name_snapshot: string
  amount: string
  currency: string
  bank_label: number | null
  bank_label_name_snapshot: string
  section: number | null
  description: string
  source: string
  status: TransactionStatus
}

interface TransactionDraft {
  date: string
  transaction_type: TransactionType
  amount: number
  currency: string
  status: TransactionStatus
  description: string
  category: number | null
  bank_label: number | null
  section: number | null
}

const authenticated = ref(hasToken())
const authMode = ref<'login' | 'register'>('login')
const authForm = reactive({ username: '', password: '', phone: '' })
const authError = ref('')
const authLoading = ref(false)

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
const refuelingColumnOrder = ref<RefuelingColumnKey[]>(['date', 'vehicle', 'station_fuel', 'mileage', 'fuel_quantity', 'is_full_tank', 'cost'])
const refuelingColumnVisibility = reactive<Record<RefuelingColumnKey, boolean>>({
  date: true,
  vehicle: true,
  station_fuel: true,
  mileage: true,
  fuel_quantity: true,
  is_full_tank: true,
  cost: true,
})
const refuelingColumnLabels: Record<RefuelingColumnKey, string> = {
  date: 'Дата',
  vehicle: 'Транспорт',
  station_fuel: 'АЗС / топливо',
  mileage: 'Пробег',
  fuel_quantity: 'Объем',
  is_full_tank: 'Полный бак',
  cost: 'Стоимость',
}
const pendingDelete = ref<{ path: string, id: number, label: string } | null>(null)
const bankLabelForm = reactive({ name: '', description: '' })
const categoryForm = reactive({ name: '', description: '' })
const isDarkTheme = ref(localStorage.getItem('brooks-theme') === 'dark')

const vehicles = ref<Vehicle[]>([])
const refuelings = ref<Refueling[]>([])
const stations = ref<GasStation[]>([])
const transactions = ref<Transaction[]>([])
const bankLabels = ref<BankLabel[]>([])
const categories = ref<Category[]>([])
const sections = ref<Section[]>([])

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
  discount: 0,
  comment: '',
})
const stationForm = reactive({ name: '', company: '', number: '', address: '' })
const transactionForm = reactive(defaultTransactionDraft())
const editingTransactionId = ref<number | null>(null)
const editingRefuelingId = ref<number | null>(null)
const transactionEditForm = reactive(defaultTransactionDraft())
const addingTransaction = ref(false)
const selectedTransactionIds = ref<number[]>([])
const selectedRefuelingIds = ref<number[]>([])
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
const transactionColumnOrder = ref<TransactionSortKey[]>(['date', 'transaction_type', 'section', 'category', 'amount', 'bank_label', 'description'])
const transactionColumnVisibility = reactive<Record<TransactionSortKey, boolean>>({
  date: true,
  transaction_type: true,
  section: true,
  category: true,
  amount: true,
  bank_label: true,
  description: true,
})
const draggedTransactionColumn = ref<TransactionSortKey | null>(null)
const draggedRefuelingColumn = ref<RefuelingColumnKey | null>(null)
const transactionColumnLabels: Record<TransactionSortKey, string> = {
  date: 'Дата',
  transaction_type: 'Тип операции',
  section: 'Раздел',
  category: 'Категория',
  amount: 'Сумма',
  bank_label: 'Банк',
  description: 'Описание',
}

function startTransactionColumnDrag(key: TransactionSortKey) {
  draggedTransactionColumn.value = key
}

function dropTransactionColumn(targetKey: TransactionSortKey) {
  const sourceKey = draggedTransactionColumn.value
  if (!sourceKey || sourceKey === targetKey) return

  const nextOrder = [...transactionColumnOrder.value]
  const sourceIndex = nextOrder.indexOf(sourceKey)
  const targetIndex = nextOrder.indexOf(targetKey)
  if (sourceIndex === -1 || targetIndex === -1) return

  nextOrder.splice(sourceIndex, 1)
  nextOrder.splice(targetIndex, 0, sourceKey)
  transactionColumnOrder.value = nextOrder
}

function finishTransactionColumnDrag() {
  draggedTransactionColumn.value = null
}

function startRefuelingColumnDrag(key: RefuelingColumnKey) {
  draggedRefuelingColumn.value = key
}

function dropRefuelingColumn(targetKey: RefuelingColumnKey) {
  const sourceKey = draggedRefuelingColumn.value
  if (!sourceKey || sourceKey === targetKey) return

  const nextOrder = [...refuelingColumnOrder.value]
  const sourceIndex = nextOrder.indexOf(sourceKey)
  const targetIndex = nextOrder.indexOf(targetKey)
  if (sourceIndex === -1 || targetIndex === -1) return

  nextOrder.splice(sourceIndex, 1)
  nextOrder.splice(targetIndex, 0, sourceKey)
  refuelingColumnOrder.value = nextOrder
}

function finishRefuelingColumnDrag() {
  draggedRefuelingColumn.value = null
}

function canToggleTransactionColumn(key: TransactionSortKey) {
  return transactionColumnVisibility[key] || visibleTransactionColumns.value.length > 1
}

function toggleTransactionColumn(key: TransactionSortKey, checked: boolean) {
  if (!checked && visibleTransactionColumns.value.length <= 1) return
  transactionColumnVisibility[key] = checked
}

function canToggleRefuelingColumn(key: RefuelingColumnKey) {
  return refuelingColumnVisibility[key] || visibleRefuelingColumns.value.length > 1
}

function toggleRefuelingColumn(key: RefuelingColumnKey, checked: boolean) {
  if (!checked && visibleRefuelingColumns.value.length <= 1) return
  refuelingColumnVisibility[key] = checked
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

const navItems = [
  { id: 'dashboard' as View, label: 'Главная', icon: LayoutDashboard, disabled: false },
  { id: 'refuelings' as View, label: 'Заправки', icon: Fuel, disabled: false },
  { id: 'savings', label: 'Накопления', icon: Banknote, disabled: true },
  { id: 'investments', label: 'Инвестиции', icon: ChartNoAxesCombined, disabled: true },
  { id: 'utilities', label: 'ЖКХ', icon: Home, disabled: true },
  { id: 'business', label: 'Бизнес', icon: BriefcaseBusiness, disabled: true },
]

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
const visibleTransactionColumns = computed(() => transactionColumnOrder.value.filter((key) => transactionColumnVisibility[key]))
const visibleRefuelingColumns = computed(() => refuelingColumnOrder.value.filter((key) => refuelingColumnVisibility[key]))

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
const selectedTransactionCount = computed(() => selectedTransactionIds.value.length)
const selectedRefuelingCount = computed(() => selectedRefuelingIds.value.length)
const visibleTransactionIds = computed(() => visibleTransactions.value.map((item) => item.id))
const allVisibleTransactionsSelected = computed(() => visibleTransactionIds.value.length > 0 && visibleTransactionIds.value.every((id) => selectedTransactionIds.value.includes(id)))
const visibleRefuelingIds = computed(() => filteredRefuelings.value.map((item) => item.id))
const allVisibleRefuelingsSelected = computed(() => visibleRefuelingIds.value.length > 0 && visibleRefuelingIds.value.every((id) => selectedRefuelingIds.value.includes(id)))

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

function currency(value: number | string | null | undefined, code = 'RUB') {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: code || 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0))
}

function number(value: number | string | null | undefined, digits = 0) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(Number(value || 0))
}

function optionalNumber(value: number | string | null | undefined, suffix = '', digits = 0) {
  if (value === null || value === undefined || value === '') return '—'
  return `${number(value, digits)}${suffix}`
}

function optionalCurrency(value: number | string | null | undefined, code = 'RUB') {
  if (value === null || value === undefined || value === '') return '—'
  return currency(value, code)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
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

async function authenticate() {
  authLoading.value = true
  authError.value = ''
  try {
    const path = authMode.value === 'login' ? '/user/login/' : '/user/register/'
    const body = authMode.value === 'login'
      ? { username: authForm.username, password: authForm.password }
      : authForm
    const response = await api<{ token: string }>(path, { method: 'POST', body: JSON.stringify(body) })
    setToken(response.token)
    authenticated.value = true
    await loadData()
  } catch (requestError) {
    authError.value = requestError instanceof ApiError ? requestError.message : 'Сервис временно недоступен'
  } finally {
    authLoading.value = false
  }
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [vehicleData, refuelingData, stationData, transactionData, bankLabelData, categoryData, sectionData] = await Promise.all([
      api<Vehicle[] | { results: Vehicle[] }>('/vehicle/'),
      api<Refueling[] | { results: Refueling[] }>('/refuelings/'),
      api<GasStation[] | { results: GasStation[] }>('/gasStation/'),
      api<Transaction[] | { results: Transaction[] }>('/transactions/'),
      api<BankLabel[] | { results: BankLabel[] }>('/bank-labels/'),
      api<Category[] | { results: Category[] }>('/categories/'),
      api<Section[] | { results: Section[] }>('/sections/').catch(() => [] as Section[]),
    ])
    vehicles.value = listResult(vehicleData)
    refuelings.value = listResult(refuelingData)
    selectedRefuelingIds.value = selectedRefuelingIds.value.filter((id) => refuelings.value.some((item) => item.id === id))
    stations.value = listResult(stationData)
    transactions.value = listResult(transactionData)
    selectedTransactionIds.value = selectedTransactionIds.value.filter((id) => transactions.value.some((item) => item.id === id))
    bankLabels.value = listResult(bankLabelData)
    categories.value = listResult(categoryData)
    sections.value = listResult(sectionData).filter((section) => section.is_active)
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
    const created = await api<Vehicle>('/vehicle/', {
      method: 'POST',
      body: JSON.stringify(vehicleForm),
    })
    vehicles.value.push(created)
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
    discount: 0,
    comment: '',
  })
}

function refuelingPayload() {
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
    discount: Number(item.discount || 0),
    comment: item.comment || '',
  })
  modal.value = 'refueling'
}

async function saveRefueling() {
  await submit(async () => {
    if (editingRefuelingId.value) {
      await api<Refueling>(`/refuelings/${editingRefuelingId.value}/`, {
        method: 'PATCH',
        body: JSON.stringify(refuelingPayload()),
      })
    } else {
      await api<Refueling>('/refuelings/', {
        method: 'POST',
        body: JSON.stringify(refuelingPayload()),
      })
    }
    editingRefuelingId.value = null
    resetRefuelingForm()
    await loadData()
  })
}

async function createStation() {
  await submit(async () => {
    const created = await api<GasStation>('/gasStation/', {
      method: 'POST',
      body: JSON.stringify(stationForm),
    })
    stations.value.push(created)
    Object.assign(stationForm, { name: '', company: '', number: '', address: '' })
  })
}

async function createBankLabel() {
  await submit(async () => {
    const created = await api<BankLabel>('/bank-labels/', {
      method: 'POST',
      body: JSON.stringify(bankLabelForm),
    })
    bankLabels.value.push(created)
    bankLabels.value.sort((first, second) => first.name.localeCompare(second.name, 'ru', { sensitivity: 'base' }))
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
    const created = await api<Category>('/categories/', {
      method: 'POST',
      body: JSON.stringify(categoryForm),
    })
    categories.value.push(created)
    categories.value.sort((first, second) => first.name.localeCompare(second.name, 'ru', { sensitivity: 'base' }))
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
  if (!selectedCategoryId.value) return
  await submit(async () => {
    const updated = await api<Category>(`/categories/${selectedCategoryId.value}/`, {
      method: 'PATCH',
      body: JSON.stringify(categoryEditForm),
    })
    const index = categories.value.findIndex((item) => item.id === updated.id)
    if (index !== -1) categories.value[index] = updated
    categories.value.sort((first, second) => first.name.localeCompare(second.name, 'ru', { sensitivity: 'base' }))
    selectCategoryForEdit(updated.id)
    await loadData()
  }, { closeAfter: false })
}

async function updateBankLabel() {
  if (!selectedBankLabelId.value) return
  await submit(async () => {
    const updated = await api<BankLabel>(`/bank-labels/${selectedBankLabelId.value}/`, {
      method: 'PATCH',
      body: JSON.stringify(bankLabelEditForm),
    })
    const index = bankLabels.value.findIndex((item) => item.id === updated.id)
    if (index !== -1) bankLabels.value[index] = updated
    bankLabels.value.sort((first, second) => first.name.localeCompare(second.name, 'ru', { sensitivity: 'base' }))
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

function transactionPayload(form: TransactionDraft) {
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

function isTransactionSelected(id: number) {
  return selectedTransactionIds.value.includes(id)
}

function toggleTransactionSelection(id: number, checked: boolean) {
  selectedTransactionIds.value = checked
    ? Array.from(new Set([...selectedTransactionIds.value, id]))
    : selectedTransactionIds.value.filter((selectedId) => selectedId !== id)
}

function toggleAllVisibleTransactions(checked: boolean) {
  if (checked) {
    selectedTransactionIds.value = Array.from(new Set([...selectedTransactionIds.value, ...visibleTransactionIds.value]))
    return
  }

  selectedTransactionIds.value = selectedTransactionIds.value.filter((id) => !visibleTransactionIds.value.includes(id))
}

function clearTransactionSelection() {
  selectedTransactionIds.value = []
  bulkCategoryValue.value = ''
  bulkSectionValue.value = ''
}

function bulkValue(rawValue: string) {
  return rawValue === '__clear__' ? null : Number(rawValue)
}

async function applyBulkTransactionCategory() {
  if (!selectedTransactionIds.value.length || !bulkCategoryValue.value) return
  await submit(async () => {
    await Promise.all(selectedTransactionIds.value.map((id) => api<Transaction>(`/transactions/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ category: bulkValue(bulkCategoryValue.value) }),
    })))
    clearTransactionSelection()
    await loadData()
  }, { closeAfter: false })
}

async function applyBulkTransactionSection() {
  if (!selectedTransactionIds.value.length || !bulkSectionValue.value) return
  await submit(async () => {
    await Promise.all(selectedTransactionIds.value.map((id) => api<Transaction>(`/transactions/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ section: bulkValue(bulkSectionValue.value) }),
    })))
    clearTransactionSelection()
    await loadData()
  }, { closeAfter: false })
}

function requestBulkTransactionDelete() {
  if (!selectedTransactionIds.value.length) return
  error.value = ''
  pendingDelete.value = { path: 'bulk-transactions', id: 0, label: `${selectedTransactionIds.value.length} операций` }
  modal.value = 'delete'
}

function isRefuelingSelected(id: number) {
  return selectedRefuelingIds.value.includes(id)
}

function toggleRefuelingSelection(id: number, checked: boolean) {
  selectedRefuelingIds.value = checked
    ? Array.from(new Set([...selectedRefuelingIds.value, id]))
    : selectedRefuelingIds.value.filter((selectedId) => selectedId !== id)
}

function toggleAllVisibleRefuelings(checked: boolean) {
  if (checked) {
    selectedRefuelingIds.value = Array.from(new Set([...selectedRefuelingIds.value, ...visibleRefuelingIds.value]))
    return
  }

  selectedRefuelingIds.value = selectedRefuelingIds.value.filter((id) => !visibleRefuelingIds.value.includes(id))
}

function clearRefuelingSelection() {
  selectedRefuelingIds.value = []
  bulkRefuelingVehicleValue.value = ''
  bulkRefuelingStationValue.value = ''
}

async function applyBulkRefuelingVehicle() {
  if (!selectedRefuelingIds.value.length || !bulkRefuelingVehicleValue.value) return
  await submit(async () => {
    await Promise.all(selectedRefuelingIds.value.map((id) => api<Refueling>(`/refuelings/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ vehicle: Number(bulkRefuelingVehicleValue.value) }),
    })))
    clearRefuelingSelection()
    await loadData()
  }, { closeAfter: false })
}

async function applyBulkRefuelingStation() {
  if (!selectedRefuelingIds.value.length || !bulkRefuelingStationValue.value) return
  await submit(async () => {
    const gasStation = bulkRefuelingStationValue.value === '__clear__' ? null : Number(bulkRefuelingStationValue.value)
    await Promise.all(selectedRefuelingIds.value.map((id) => api<Refueling>(`/refuelings/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ gas_station: gasStation }),
    })))
    clearRefuelingSelection()
    await loadData()
  }, { closeAfter: false })
}

function requestBulkRefuelingDelete() {
  if (!selectedRefuelingIds.value.length) return
  error.value = ''
  pendingDelete.value = { path: 'bulk-refuelings', id: 0, label: `${selectedRefuelingIds.value.length} заправок` }
  modal.value = 'delete'
}

async function createTransaction() {
  await submit(async () => {
    const payload = {
      ...transactionPayload(transactionForm),
      source: 'manual',
    }
    await api<Transaction>('/transactions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    addingTransaction.value = false
    resetTransactionForm()
    await loadData()
  }, { closeAfter: false })
}

async function updateTransaction(id: number) {
  await submit(async () => {
    await api<Transaction>(`/transactions/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(transactionPayload(transactionEditForm)),
    })
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

function remove(path: string, id: number, label: string) {
  error.value = ''
  pendingDelete.value = { path, id, label }
  modal.value = 'delete'
}

async function confirmRemove() {
  if (!pendingDelete.value) return
  saving.value = true
  error.value = ''
  const target = pendingDelete.value
  try {
    if (target.path === 'bulk-transactions') {
      await Promise.all(selectedTransactionIds.value.map((id) => api(`/transactions/${id}/`, { method: 'DELETE' })))
      clearTransactionSelection()
    } else if (target.path === 'bulk-refuelings') {
      await Promise.all(selectedRefuelingIds.value.map((id) => api(`/refuelings/${id}/`, { method: 'DELETE' })))
      clearRefuelingSelection()
    } else {
      await api(`${target.path}${target.id}/`, { method: 'DELETE' })
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
  vehicles.value = []
  refuelings.value = []
  stations.value = []
  transactions.value = []
  clearTransactionSelection()
  bankLabels.value = []
  categories.value = []
  sections.value = []
}

function applyTheme() {
  document.documentElement.dataset.theme = isDarkTheme.value ? 'dark' : 'light'
  localStorage.setItem('brooks-theme', isDarkTheme.value ? 'dark' : 'light')
}

function toggleTheme() {
  isDarkTheme.value = !isDarkTheme.value
  applyTheme()
}

onMounted(() => {
  applyTheme()
  if (authenticated.value) loadData()
})
</script>

<template>

  <div v-if="!authenticated" class="auth-layout">
    <section class="auth-brand">
      <div class="brand-mark"><svg class="gold-bag-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path class="bag-body" d="M10.4 12.2h11.2c2.9 2.8 5.2 6.4 5.2 10.3 0 4.3-3.3 6.9-10.8 6.9S5.2 26.8 5.2 22.5c0-3.9 2.3-7.5 5.2-10.3Z"/><path class="bag-neck" d="M11.1 4.4c1.6 1.1 3.1 1.4 4.9 1.4s3.3-.3 4.9-1.4l-2.1 6.1h-5.6l-2.1-6.1Z"/><path class="bag-tie" d="M10.2 12.1c1.7-1.2 3.7-1.8 5.8-1.8s4.1.6 5.8 1.8"/><circle class="bag-coin" cx="16" cy="21" r="4.2"/><path class="bag-dollar" d="M16 18.5v5M14.7 19.5h2c.8 0 1.3.4 1.3 1s-.5 1-1.3 1h-1.4c-.8 0-1.3.4-1.3 1s.5 1 1.3 1h2"/></svg></div>
      <div class="auth-copy">
        <p class="eyebrow">Учет без лишнего шума</p>
        <h1>Brooks</h1>
        <p>Транспорт, заправки и расходы в одной рабочей системе.</p>
      </div>
      <div class="auth-feature">
        <CircleGauge :size="26" />
        <div>
          <strong>Контроль расхода</strong>
          <span>Пробег, стоимость и потребление топлива</span>
        </div>
      </div>
    </section>

    <main class="auth-panel">
      <form class="auth-form" @submit.prevent="authenticate">
        <div>
          <p class="eyebrow">{{ authMode === 'login' ? 'С возвращением' : 'Новый аккаунт' }}</p>
          <h2>{{ authMode === 'login' ? 'Войти в Brooks' : 'Создать аккаунт' }}</h2>
        </div>
        <label>
          Имя пользователя
          <input v-model.trim="authForm.username" required autocomplete="username" placeholder="Введите логин">
        </label>
        <label>
          Пароль
          <input v-model="authForm.password" required minlength="8" type="password" autocomplete="current-password" placeholder="Не менее 8 символов">
        </label>
        <label v-if="authMode === 'register'">
          Телефон
          <input v-model.trim="authForm.phone" required type="tel" autocomplete="tel" placeholder="+7 999 000-00-00">
        </label>
        <p v-if="authError" class="form-error">{{ authError }}</p>
        <button class="primary-button wide" type="submit" :disabled="authLoading">
          <RefreshCw v-if="authLoading" class="spin" :size="18" />
          <span>{{ authMode === 'login' ? 'Войти' : 'Зарегистрироваться' }}</span>
          <ChevronRight v-if="!authLoading" :size="18" />
        </button>
        <button class="text-button" type="button" @click="authMode = authMode === 'login' ? 'register' : 'login'">
          {{ authMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти' }}
        </button>
      </form>
    </main>
  </div>

  <div v-else class="app-shell">
    <aside class="sidebar" :class="{ open: mobileNavOpen }">
      <div class="sidebar-brand">
        <div class="brand-mark small"><svg class="gold-bag-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path class="bag-body" d="M10.4 12.2h11.2c2.9 2.8 5.2 6.4 5.2 10.3 0 4.3-3.3 6.9-10.8 6.9S5.2 26.8 5.2 22.5c0-3.9 2.3-7.5 5.2-10.3Z"/><path class="bag-neck" d="M11.1 4.4c1.6 1.1 3.1 1.4 4.9 1.4s3.3-.3 4.9-1.4l-2.1 6.1h-5.6l-2.1-6.1Z"/><path class="bag-tie" d="M10.2 12.1c1.7-1.2 3.7-1.8 5.8-1.8s4.1.6 5.8 1.8"/><circle class="bag-coin" cx="16" cy="21" r="4.2"/><path class="bag-dollar" d="M16 18.5v5M14.7 19.5h2c.8 0 1.3.4 1.3 1s-.5 1-1.3 1h-1.4c-.8 0-1.3.4-1.3 1s.5 1 1.3 1h2"/></svg></div>
        <strong>Brooks</strong>
        <button class="icon-button mobile-close" title="Закрыть меню" @click="mobileNavOpen = false"><X :size="20" /></button>
      </div>
      <nav>
        <button
          v-for="item in navItems"
          :key="item.id"
          :class="{ active: activeView === item.id, disabled: item.disabled }"
          :disabled="item.disabled"
          :title="item.disabled ? 'В разработке' : item.label"
          @click="!item.disabled && selectView(item.id as View)"
        >
          <component :is="item.icon" :size="19" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
      <div class="sidebar-footer">
        <button @click="logout"><LogOut :size="19" /><span>Выйти</span></button>
        <button class="about-link" type="button" @click="openModal('about')">О нас</button>
      </div>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <button class="icon-button menu-button" title="Открыть меню" @click="mobileNavOpen = true"><Menu :size="21" /></button>
        <div>
          <p class="eyebrow">Панель управления</p>
          <h1>{{ viewTitle }}</h1>
        </div>
        <div class="topbar-actions">
          <button class="icon-button" title="Обновить данные" :disabled="loading" @click="loadData">
            <RefreshCw :class="{ spin: loading }" :size="19" />
          </button>
          <button
            class="icon-button theme-toggle"
            :class="{ active: isDarkTheme }"
            :title="isDarkTheme ? 'Выключить темную тему' : 'Включить темную тему'"
            type="button"
            @click="toggleTheme"
          >
            <Lightbulb :size="20" />
          </button>
        </div>
      </header>

      <main class="content">
        <div v-if="error" class="error-banner"><span>{{ error }}</span><button title="Закрыть" @click="error = ''"><X :size="18" /></button></div>

        <template v-if="activeView === 'dashboard'">
          <div v-if="dashboardVisibility.summary" class="finance-summary">
            <div class="finance-summary-item income"><span>Доходы</span><strong>{{ currency(transactionIncome) }}</strong></div>
            <div class="finance-summary-item expense"><span>Траты</span><strong>{{ currency(transactionExpense) }}</strong></div>
            <div class="finance-summary-item saving"><span>Накопления</span><strong>{{ currency(transactionSaving) }}</strong></div>
            <div class="finance-summary-item balance"><span>Итог</span><strong>{{ currency(transactionBalance) }}</strong></div>
          </div>
          <section class="finance-panel panel">
            <div class="section-heading">
              <div class="finance-heading-main"><h2>Финансовые операции</h2><div class="search-field transaction-search"><Search :size="18" /><input v-model="transactionSearch" placeholder="Поиск по операциям, банку и описанию"></div></div>
              <div class="finance-heading-actions">
                <button class="primary-button dashboard-add-button" title="Добавить операцию" @click="startCreateTransaction"><Plus :size="18" /></button>
                <button v-if="dashboardVisibility.addBank" class="secondary-button" type="button" @click="openModal('bankLabel')">Добавить банк</button>
                <button v-if="dashboardVisibility.addCategory" class="secondary-button" type="button" @click="openModal('category')">Добавить категории</button>
                <div class="visibility-menu">
                  <button class="icon-button" :class="{ active: dashboardControlsOpen }" title="Настроить главную" type="button" @click="dashboardControlsOpen = !dashboardControlsOpen"><Eye :size="18" /></button>
                  <div v-if="dashboardControlsOpen" class="visibility-dropdown">
                    <label><input v-model="dashboardVisibility.summary" type="checkbox"><span>Виджеты</span></label>
                    <label><input v-model="dashboardVisibility.addBank" type="checkbox"><span>Добавить банк</span></label>
                    <label><input v-model="dashboardVisibility.addCategory" type="checkbox"><span>Добавить категории</span></label>
                    <label class="disabled" title="В разработке"><input disabled type="checkbox"><span>AI</span></label>
                    <label class="disabled" title="В разработке"><input disabled type="checkbox"><span>Прикрепить файл</span></label>
                    <div class="visibility-divider"></div>
                    <strong class="visibility-title">Столбцы</strong>
                    <label v-for="columnKey in transactionColumnOrder" :key="`visibility-${columnKey}`" :class="{ disabled: !canToggleTransactionColumn(columnKey) }"><input type="checkbox" :checked="transactionColumnVisibility[columnKey]" :disabled="!canToggleTransactionColumn(columnKey)" @change="toggleTransactionColumn(columnKey, ($event.target as HTMLInputElement).checked)"><span>{{ transactionColumnLabels[columnKey] }}</span></label>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="selectedTransactionCount" class="bulk-actions">
              <strong>{{ selectedTransactionCount }} выбрано</strong>
              <select v-model="bulkCategoryValue">
                <option value="">Категория</option>
                <option value="__clear__">Без категории</option>
                <option v-for="category in categories" :key="category.id" :value="String(category.id)">{{ category.name }}</option>
              </select>
              <button class="secondary-button" type="button" :disabled="saving || !bulkCategoryValue" @click="applyBulkTransactionCategory">Проставить категорию</button>
              <select v-model="bulkSectionValue">
                <option value="">Раздел</option>
                <option value="__clear__">Без раздела</option>
                <option v-for="section in sections" :key="section.id" :value="String(section.id)">{{ section.name }}</option>
              </select>
              <button class="secondary-button" type="button" :disabled="saving || !bulkSectionValue" @click="applyBulkTransactionSection">Проставить раздел</button>
              <button class="danger-button" type="button" :disabled="saving" @click="requestBulkTransactionDelete"><Trash2 :size="17" />Удалить</button>
              <button class="text-button" type="button" :disabled="saving" @click="clearTransactionSelection">Сбросить</button>
            </div>
            <div v-if="transactions.length || addingTransaction" class="table-panel transaction-table">
              <div class="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th class="selection-column"><input type="checkbox" :checked="allVisibleTransactionsSelected" :disabled="!visibleTransactionIds.length" title="Выбрать все видимые" @change="toggleAllVisibleTransactions(($event.target as HTMLInputElement).checked)"></th>
                      <th
                        v-for="columnKey in visibleTransactionColumns"
                        :key="columnKey"
                        class="draggable-column"
                        :class="{ dragging: draggedTransactionColumn === columnKey }"
                        draggable="true"
                        @dragstart="startTransactionColumnDrag(columnKey)"
                        @dragover.prevent
                        @drop.prevent="dropTransactionColumn(columnKey)"
                        @dragend="finishTransactionColumnDrag"
                      >
                        <button class="sort-header" :class="{ active: transactionSort.key === columnKey }" type="button" @click="toggleTransactionSort(columnKey)">
                          <span>{{ transactionColumnLabels[columnKey] }}</span>
                          <ChevronUp v-if="transactionSort.key === columnKey && transactionSort.direction === 'asc'" :size="14" />
                          <ChevronDown v-else-if="transactionSort.key === columnKey && transactionSort.direction === 'desc'" :size="14" />
                        </button>
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="addingTransaction" class="transaction-edit-row transaction-create-row">
                      <td class="selection-column"></td>
                      <template v-for="columnKey in visibleTransactionColumns" :key="`create-${columnKey}`">
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
                          <button class="icon-button" title="Сохранить" :disabled="saving" @click="createTransaction"><Check :size="16" /></button>
                          <button class="icon-button" title="Отмена" :disabled="saving" @click="cancelCreateTransaction"><X :size="16" /></button>
                        </div>
                      </td>
                    </tr>
                    <template v-for="item in visibleTransactions" :key="item.id">
                      <tr v-if="editingTransactionId !== item.id" class="transaction-display-row" :class="{ selected: isTransactionSelected(item.id) }">
                        <td class="selection-column"><input type="checkbox" :checked="isTransactionSelected(item.id)" title="Выбрать операцию" @change="toggleTransactionSelection(item.id, ($event.target as HTMLInputElement).checked)"></td>
                        <template v-for="columnKey in visibleTransactionColumns" :key="`display-${item.id}-${columnKey}`">
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
                            <button class="icon-button" title="Редактировать операцию" @click="startEditTransaction(item)"><Pencil :size="16" /></button>
                            <button class="icon-button danger" title="Удалить операцию" @click="remove('/transactions/', item.id, transactionTitle(item))"><Trash2 :size="17" /></button>
                          </div>
                        </td>
                      </tr>
                      <tr v-else class="transaction-edit-row">
                        <td class="selection-column"><input type="checkbox" :checked="isTransactionSelected(item.id)" title="Выбрать операцию" @change="toggleTransactionSelection(item.id, ($event.target as HTMLInputElement).checked)"></td>
                        <template v-for="columnKey in visibleTransactionColumns" :key="`edit-${item.id}-${columnKey}`">
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
                            <button class="icon-button" title="Сохранить" :disabled="saving" @click="updateTransaction(item.id)"><Check :size="16" /></button>
                            <button class="icon-button" title="Отмена" :disabled="saving" @click="cancelEditTransaction"><X :size="16" /></button>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else class="empty-state"><WalletCards :size="28" /><strong>Финансовых операций пока нет</strong><span>Добавьте доход, трату или накопление.</span><button class="secondary-button" @click="startCreateTransaction"><Plus :size="17" />Операция</button></div>
          </section>
        </template>

        <template v-else>
          <div v-if="refuelingVisibility.summary" class="finance-summary refueling-summary">
            <div class="finance-summary-item income"><span>Заправки</span><strong>{{ refuelings.length }}</strong></div>
            <div class="finance-summary-item balance"><span>Транспорт</span><strong>{{ vehicles.length }}</strong></div>
            <div class="finance-summary-item saving"><span>АЗС</span><strong>{{ stations.length }}</strong></div>
            <div class="finance-summary-item expense"><span>Итог</span><strong>{{ currency(refuelingTotalCost) }}</strong><small>{{ optionalNumber(refuelingTotalFuel, ' л', 2) }}</small></div>
          </div>

          <section v-if="refuelingVisibility.vehicles || refuelingVisibility.stations" class="refueling-management top-management">
            <div class="section-heading management-heading">
              <div><p class="eyebrow">Справочники</p><h2>Транспорт и АЗС</h2></div>
            </div>

            <div class="management-grid" :class="{ single: !refuelingVisibility.vehicles || !refuelingVisibility.stations }">
              <section v-if="refuelingVisibility.vehicles" class="management-panel">
                <div class="section-heading compact-heading">
                  <div><p class="eyebrow">Транспорт</p><h2>{{ filteredVehicles.length }} записей</h2></div>
                </div>
                <div class="vehicle-grid compact-grid">
                  <article v-for="vehicle in filteredVehicles" :key="vehicle.id" class="vehicle-card">
                    <div class="vehicle-card-head">
                      <div class="vehicle-symbol"><CarFront :size="24" /></div>
                      <span class="status" :class="{ inactive: !vehicle.is_active }"><i></i>{{ vehicle.is_active ? 'Активен' : 'Неактивен' }}</span>
                      <button class="icon-button danger" title="Удалить транспорт" @click="remove('/vehicle/', vehicle.id, vehicle.name)"><Trash2 :size="17" /></button>
                    </div>
                    <div>
                      <h2>{{ vehicle.name }}</h2>
                      <p>{{ [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' · ') || 'Без дополнительных данных' }}</p>
                    </div>
                    <dl>
                      <div><dt>Текущий пробег</dt><dd>{{ number(vehicle.current_odometer || vehicle.initial_odometer) }} км</dd></div>
                      <div><dt>Начальный</dt><dd>{{ number(vehicle.initial_odometer) }} км</dd></div>
                    </dl>
                  </article>
                  <button class="add-card" @click="openModal('vehicle')"><Plus :size="23" /><strong>Добавить транспорт</strong></button>
                </div>
              </section>

              <section v-if="refuelingVisibility.stations" class="management-panel">
                <div class="section-heading compact-heading">
                  <div><p class="eyebrow">АЗС</p><h2>{{ filteredStations.length }} записей</h2></div>
                </div>
                <div class="station-list compact-station-list">
                  <article v-for="station in filteredStations" :key="station.id">
                    <div class="station-icon"><Building2 :size="21" /></div>
                    <div class="station-main"><h2>{{ station.company || station.name }}</h2><p>{{ station.name }}<template v-if="station.number"> · №{{ station.number }}</template></p></div>
                    <span class="station-address">{{ station.address || 'Адрес не указан' }}</span>
                    <button class="icon-button danger" title="Удалить АЗС" @click="remove('/gasStation/', station.id, station.name)"><Trash2 :size="17" /></button>
                  </article>
                  <button class="add-row" @click="openModal('station')"><Plus :size="20" />Добавить АЗС</button>
                </div>
              </section>
            </div>
          </section>

          <section class="finance-panel panel refueling-panel">
            <div class="section-heading">
              <div class="finance-heading-main"><h2>Заправки</h2><div class="search-field transaction-search"><Search :size="18" /><input v-model="search" placeholder="Поиск по заправкам, транспорту и АЗС"></div></div>
              <div class="finance-heading-actions">
                <span class="action-tooltip" :title="vehicles.length ? 'Добавить новую заправку' : 'Сначала добавьте транспорт'">
                  <button class="primary-button dashboard-add-button" title="Добавить заправку" :disabled="!vehicles.length" @click="openModal('refueling')"><Plus :size="18" /></button>
                </span>
                <button class="secondary-button" title="Добавить транспорт" @click="openModal('vehicle')"><Plus :size="18" />Добавить транспорт</button>
                <button class="secondary-button" title="Добавить АЗС" @click="openModal('station')"><Plus :size="18" />Добавить АЗС</button>
                <div class="visibility-menu">
                  <button class="icon-button" :class="{ active: refuelingControlsOpen }" title="Настроить заправки" type="button" @click="refuelingControlsOpen = !refuelingControlsOpen"><Eye :size="18" /></button>
                  <div v-if="refuelingControlsOpen" class="visibility-dropdown">
                    <label><input v-model="refuelingVisibility.summary" type="checkbox"><span>Виджеты</span></label>
                    <label><input v-model="refuelingVisibility.vehicles" type="checkbox"><span>Транспорт</span></label>
                    <label><input v-model="refuelingVisibility.stations" type="checkbox"><span>АЗС</span></label>
                    <label class="disabled" title="В разработке"><input disabled type="checkbox"><span>AI</span></label>
                    <div class="visibility-divider"></div>
                    <strong class="visibility-title">Столбцы</strong>
                    <label v-for="columnKey in refuelingColumnOrder" :key="`refueling-visibility-${columnKey}`" :class="{ disabled: !canToggleRefuelingColumn(columnKey) }"><input type="checkbox" :checked="refuelingColumnVisibility[columnKey]" :disabled="!canToggleRefuelingColumn(columnKey)" @change="toggleRefuelingColumn(columnKey, ($event.target as HTMLInputElement).checked)"><span>{{ refuelingColumnLabels[columnKey] }}</span></label>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="selectedRefuelingCount" class="bulk-actions">
              <strong>{{ selectedRefuelingCount }} выбрано</strong>
              <select v-model="bulkRefuelingVehicleValue">
                <option value="">Транспорт</option>
                <option v-for="vehicle in vehicles" :key="vehicle.id" :value="String(vehicle.id)">{{ vehicle.name }}</option>
              </select>
              <button class="secondary-button" type="button" :disabled="saving || !bulkRefuelingVehicleValue" @click="applyBulkRefuelingVehicle">Поменять транспорт</button>
              <select v-model="bulkRefuelingStationValue">
                <option value="">АЗС</option>
                <option value="__clear__">Без АЗС</option>
                <option v-for="station in stations" :key="station.id" :value="String(station.id)">{{ station.company || station.name }}</option>
              </select>
              <button class="secondary-button" type="button" :disabled="saving || !bulkRefuelingStationValue" @click="applyBulkRefuelingStation">Поменять АЗС</button>
              <button class="danger-button" type="button" :disabled="saving" @click="requestBulkRefuelingDelete"><Trash2 :size="17" />Удалить</button>
              <button class="text-button" type="button" :disabled="saving" @click="clearRefuelingSelection">Сбросить</button>
            </div>
            <div class="table-panel refueling-table">
              <div class="table-scroll">
                <table>
                  <thead><tr><th class="selection-column"><input type="checkbox" :checked="allVisibleRefuelingsSelected" :disabled="!visibleRefuelingIds.length" title="Выбрать все видимые" @change="toggleAllVisibleRefuelings(($event.target as HTMLInputElement).checked)"></th><th
                    v-for="columnKey in visibleRefuelingColumns"
                    :key="columnKey"
                    class="draggable-column"
                    :class="{ dragging: draggedRefuelingColumn === columnKey }"
                    draggable="true"
                    @dragstart="startRefuelingColumnDrag(columnKey)"
                    @dragover.prevent
                    @drop.prevent="dropRefuelingColumn(columnKey)"
                    @dragend="finishRefuelingColumnDrag"
                  ><button class="sort-header" :class="{ active: refuelingSort.key === columnKey }" type="button" @click="toggleRefuelingSort(columnKey)"><span>{{ refuelingColumnLabels[columnKey] }}</span><ChevronUp v-if="refuelingSort.key === columnKey && refuelingSort.direction === 'asc'" :size="14" /><ChevronDown v-else-if="refuelingSort.key === columnKey && refuelingSort.direction === 'desc'" :size="14" /></button></th><th></th></tr></thead>
                  <tbody>
                    <tr v-for="item in filteredRefuelings" :key="item.id" class="refueling-display-row" :class="{ 'refueling-incomplete-row': !item.is_complete, selected: isRefuelingSelected(item.id) }">
                      <td class="selection-column"><input type="checkbox" :checked="isRefuelingSelected(item.id)" title="Выбрать заправку" @change="toggleRefuelingSelection(item.id, ($event.target as HTMLInputElement).checked)"></td>
                      <template v-for="columnKey in visibleRefuelingColumns" :key="`refueling-${item.id}-${columnKey}`">
                        <td v-if="columnKey === 'date'"><span class="date-cell"><CalendarDays :size="16" />{{ formatDate(item.date) }}</span></td>
                        <td v-else-if="columnKey === 'vehicle'"><strong>{{ vehicleById(item.vehicle)?.name || '—' }}</strong><small v-if="!item.is_complete">Нужно дополнить</small></td>
                        <td v-else-if="columnKey === 'station_fuel'"><strong>{{ stationById(item.gas_station)?.company || stationById(item.gas_station)?.name || 'Не указана' }}</strong><small>{{ item.fuel_type || '—' }} · {{ optionalCurrency(item.price_per_liter) }}/л</small></td>
                        <td v-else-if="columnKey === 'mileage'">{{ optionalNumber(item.mileage, ' км') }}</td>
                        <td v-else-if="columnKey === 'fuel_quantity'">{{ optionalNumber(item.fuel_quantity, ' л', 2) }}</td>
                        <td v-else-if="columnKey === 'is_full_tank'"><span class="status" :class="{ inactive: !item.is_full_tank }"><i></i>{{ item.is_full_tank ? 'Да' : 'Нет' }}</span></td>
                        <td v-else><strong>{{ optionalCurrency(item.effective_cost || item.total_cost) }}</strong></td>
                      </template>
                      <td><div class="transaction-actions"><button class="icon-button" title="Редактировать заправку" @click="startEditRefueling(item)"><Pencil :size="16" /></button><button class="icon-button danger" title="Удалить заправку" @click="remove('/refuelings/', item.id, `заправку от ${formatDate(item.date)}`)"><Trash2 :size="17" /></button></div></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="!filteredRefuelings.length" class="empty-state"><Fuel :size="28" /><strong>Записи не найдены</strong></div>
            </div>
          </section>

        </template>
      </main>
    </div>
  </div>

  <div v-if="modal" class="modal-backdrop" @mousedown.self="closeModal">
    <section class="modal" :class="{ wide: modal === 'bankLabel' || modal === 'category' }">
      <header>
        <div>
          <p class="eyebrow">{{ modal === 'about' ? 'Информация' : modal === 'delete' ? 'Подтверждение' : 'Новая запись' }}</p>
          <h2>{{ modalTitle }}</h2>
        </div>
        <button class="icon-button" :class="{ danger: modal === 'about' }" title="Закрыть" @click="closeModal"><X :size="20" /></button>
      </header>
      <form v-if="modal === 'vehicle'" id="vehicle-form" @submit.prevent="createVehicle">
        <label class="full">Название<input v-model.trim="vehicleForm.name" required placeholder="Например, Рабочая Toyota"></label>
        <label>Марка<input v-model.trim="vehicleForm.brand" placeholder="Toyota"></label>
        <label>Модель<input v-model.trim="vehicleForm.model" placeholder="Camry"></label>
        <label>Год<input v-model.number="vehicleForm.year" type="number" min="1900" max="2100"></label>
        <label>Начальный пробег<input v-model.number="vehicleForm.initial_odometer" required type="number" min="0"></label>
        <label class="check-field full"><input v-model="vehicleForm.is_active" type="checkbox"><span><Check :size="16" />Активный транспорт</span></label>
      </form>

      <form v-if="modal === 'refueling'" id="refueling-form" @submit.prevent="saveRefueling">
        <label class="full">Транспорт<select v-model.number="refuelingForm.vehicle" required><option :value="null" disabled>Выберите транспорт</option><option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.name }}</option></select></label>
        <label>Дата<input v-model="refuelingForm.date" required type="date"></label>
        <label>Пробег с прошлой заправки<input v-model.number="refuelingForm.mileage" required type="number" min="1" max="5000"></label>
        <label>Количество, л<input v-model.number="refuelingForm.fuel_quantity" required type="number" min="0.01" step="0.01"></label>
        <label>Цена за литр<input v-model.number="refuelingForm.price_per_liter" required type="number" min="0.01" step="0.01"></label>
        <label>Тип топлива<select v-model="refuelingForm.fuel_type"><option v-for="fuelType in ['АИ-92', 'АИ-95', 'АИ-98', 'ДТ', 'ГАЗ']" :key="fuelType">{{ fuelType }}</option></select></label>
        <label>АЗС<select v-model="refuelingForm.gas_station"><option :value="null">Не выбрана</option><option v-for="station in stations" :key="station.id" :value="station.id">{{ station.company }} {{ station.name }}</option></select></label>
        <label>Работа сервиса<input v-model.number="refuelingForm.service_operation" type="number" min="0" step="0.01"></label>
        <label>Скидка<input v-model.number="refuelingForm.discount" type="number" min="0" step="0.01"></label>
        <label class="full">Комментарий<textarea v-model.trim="refuelingForm.comment" rows="3" placeholder="Необязательная заметка"></textarea></label>
        <label class="check-field full"><input v-model="refuelingForm.is_full_tank" type="checkbox"><span><Check :size="16" />Полный бак</span></label>
      </form>

      <form v-if="modal === 'station'" id="station-form" @submit.prevent="createStation">
        <label>Компания<input v-model.trim="stationForm.company" placeholder="Лукойл"></label>
        <label>Название<input v-model.trim="stationForm.name" required placeholder="АЗС"></label>
        <label>Номер<input v-model.trim="stationForm.number" placeholder="154"></label>
        <label class="full">Адрес<input v-model.trim="stationForm.address" placeholder="Город, улица, дом"></label>
      </form>

      <div v-if="modal === 'bankLabel'" class="bank-label-editor">
        <form class="bank-label-pane" id="bankLabel-create-form" @submit.prevent="createBankLabel">
          <div><p class="eyebrow">Новый банк</p><h3>Добавление</h3></div>
          <label>Название<input v-model.trim="bankLabelForm.name" required placeholder="Например, Т-Банк *2726"></label>
          <label>Описание<textarea v-model.trim="bankLabelForm.description" rows="4" placeholder="Например, Основная карта"></textarea></label>
          <button class="primary-button" type="submit" :disabled="saving"><RefreshCw v-if="saving" class="spin" :size="17" /><Check v-else :size="17" />Добавить</button>
        </form>

        <form class="bank-label-pane" id="bankLabel-edit-form" @submit.prevent="updateBankLabel">
          <div><p class="eyebrow">Существующий банк</p><h3>Редактирование</h3></div>
          <label>Банк<select :value="selectedBankLabelId" @change="selectBankLabelForEdit(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"><option :value="null">Выберите банк</option><option v-for="bankLabel in bankLabels" :key="bankLabel.id" :value="bankLabel.id">{{ bankLabel.name }}</option></select></label>
          <label>Название<input v-model.trim="bankLabelEditForm.name" :disabled="!selectedBankLabelId" required placeholder="Название банка"></label>
          <label>Описание<textarea v-model.trim="bankLabelEditForm.description" :disabled="!selectedBankLabelId" rows="4" placeholder="Описание банка"></textarea></label>
          <button class="secondary-button" type="submit" :disabled="saving || !selectedBankLabelId"><RefreshCw v-if="saving" class="spin" :size="17" /><Check v-else :size="17" />Сохранить</button>
        </form>
      </div>


      <div v-if="modal === 'category'" class="bank-label-editor">
        <form class="bank-label-pane" id="category-create-form" @submit.prevent="createCategory">
          <div><p class="eyebrow">Новая категория</p><h3>Добавление</h3></div>
          <label>Название<input v-model.trim="categoryForm.name" required placeholder="Например, Продукты"></label>
          <label>Описание<textarea v-model.trim="categoryForm.description" rows="4" placeholder="Например, Ежедневные покупки"></textarea></label>
          <button class="primary-button" type="submit" :disabled="saving"><RefreshCw v-if="saving" class="spin" :size="17" /><Check v-else :size="17" />Добавить</button>
        </form>

        <form class="bank-label-pane" id="category-edit-form" @submit.prevent="updateCategory">
          <div><p class="eyebrow">Существующая категория</p><h3>Редактирование</h3></div>
          <label>Категория<select :value="selectedCategoryId" @change="selectCategoryForEdit(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"><option :value="null">Выберите категорию</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></label>
          <label>Название<input v-model.trim="categoryEditForm.name" :disabled="!selectedCategoryId" required placeholder="Название категории"></label>
          <label>Описание<textarea v-model.trim="categoryEditForm.description" :disabled="!selectedCategoryId" rows="4" placeholder="Описание категории"></textarea></label>
          <button class="secondary-button" type="submit" :disabled="saving || !selectedCategoryId"><RefreshCw v-if="saving" class="spin" :size="17" /><Check v-else :size="17" />Сохранить</button>
        </form>
      </div>


      <div v-if="modal === 'about'" class="about-content">
        <p><span class="about-brand">Brooks</span> — финансовый некоммерческий продукт для личного учета доходов, расходов, накоплений и связанных повседневных операций.</p>
        <p>Проект создается как доступный инструмент для всех пользователей, которым важно видеть понятную картину своих финансов, анализировать движение средств и принимать более взвешенные решения.</p>
        <p>Проект не передает персональные данные третьим лицам и не использует их для внешней обработки. Работа с данными организована изолированно: информация каждого пользователя хранится и обрабатывается отдельно от данных других пользователей.</p>
        <p>Мы развиваем Brooks постепенно: улучшаем интерфейс, расширяем возможности учета, повышаем надежность работы с данными и добавляем функции, которые делают продукт удобнее в ежедневном использовании.</p>
      </div>

      <div v-if="modal === 'delete'" class="delete-content">
        <p>Вы действительно хотите удалить «{{ pendingDelete?.label }}»?</p>
        <span>Это действие нельзя будет отменить после удаления.</span>
      </div>

      <p v-if="error" class="form-error modal-error">{{ error }}</p>
      <footer v-if="modal !== 'about' && modal !== 'bankLabel' && modal !== 'category'">
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
      </footer>
    </section>
  </div>
</template>
