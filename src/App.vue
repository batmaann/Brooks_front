<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  BarChart3,
  Building2,
  CalendarDays,
  CarFront,
  Check,
  ChevronRight,
  CircleGauge,
  Fuel,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Route,
  Search,
  Trash2,
  X,
} from '@lucide/vue'
import { api, ApiError, hasToken, listResult, setToken } from '@/api'

type View = 'dashboard' | 'refuelings'
type Modal = 'vehicle' | 'refueling' | 'station' | null

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
  mileage: number
  odometer: number
  fuel_quantity: string
  price_per_liter: string
  total_cost: string
  effective_cost: number
  fuel_consumption: number
  service_operation: string
  gas_station: number | null
  vehicle: number
  fuel_type: string | null
  is_full_tank: boolean
  discount: string
  comment: string
}

interface GasStation {
  id: number
  name: string
  number: string
  address: string
  company: string
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
const modal = ref<Modal>(null)
const isDarkTheme = ref(localStorage.getItem('brooks-theme') === 'dark')

const vehicles = ref<Vehicle[]>([])
const refuelings = ref<Refueling[]>([])
const stations = ref<GasStation[]>([])

const vehicleForm = reactive({
  name: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  initial_odometer: 0,
  is_active: true,
})
const refuelingForm = reactive({
  vehicle: 0,
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

const navItems = [
  { id: 'dashboard' as View, label: 'Обзор', icon: LayoutDashboard },
  { id: 'refuelings' as View, label: 'Заправки', icon: Fuel },
]

const viewTitle = computed(() => navItems.find((item) => item.id === activeView.value)?.label || '')
const totalCost = computed(() => refuelings.value.reduce((sum, item) => sum + Number(item.effective_cost || item.total_cost), 0))
const totalFuel = computed(() => refuelings.value.reduce((sum, item) => sum + Number(item.fuel_quantity), 0))
const totalDistance = computed(() => refuelings.value.reduce((sum, item) => sum + item.mileage, 0))
const averageConsumption = computed(() => totalDistance.value ? totalFuel.value / totalDistance.value * 100 : 0)
const activeVehicles = computed(() => vehicles.value.filter((vehicle) => vehicle.is_active).length)

const filteredVehicles = computed(() => {
  const query = search.value.toLowerCase()
  return vehicles.value.filter((item) =>
    [item.name, item.brand, item.model].some((value) => value?.toLowerCase().includes(query)),
  )
})
const filteredRefuelings = computed(() => {
  const query = search.value.toLowerCase()
  return refuelings.value.filter((item) => {
    const vehicle = vehicleById(item.vehicle)
    return [vehicle?.name, item.fuel_type, item.date].some((value) => value?.toLowerCase().includes(query))
  })
})
const filteredStations = computed(() => {
  const query = search.value.toLowerCase()
  return stations.value.filter((item) =>
    [item.name, item.company, item.address].some((value) => value?.toLowerCase().includes(query)),
  )
})
const recentRefuelings = computed(() => refuelings.value.slice(0, 5))

function currency(value: number | string) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(Number(value))
}

function number(value: number | string, digits = 0) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(Number(value))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}

function vehicleById(id: number) {
  return vehicles.value.find((vehicle) => vehicle.id === id)
}

function stationById(id: number | null) {
  return stations.value.find((station) => station.id === id)
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
    const [vehicleData, refuelingData, stationData] = await Promise.all([
      api<Vehicle[] | { results: Vehicle[] }>('/vehicle/'),
      api<Refueling[] | { results: Refueling[] }>('/refuelings/'),
      api<GasStation[] | { results: GasStation[] }>('/gasStation/'),
    ])
    vehicles.value = listResult(vehicleData)
    refuelings.value = listResult(refuelingData)
    stations.value = listResult(stationData)
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
}

function openModal(type: Exclude<Modal, null>) {
  error.value = ''
  modal.value = type
  if (type === 'refueling' && !refuelingForm.vehicle && vehicles.value.length) {
    refuelingForm.vehicle = vehicles.value[0]!.id
  }
}

function closeModal() {
  modal.value = null
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

async function createRefueling() {
  await submit(async () => {
    const payload = { ...refuelingForm, gas_station: refuelingForm.gas_station || null }
    const created = await api<Refueling>('/refuelings/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    refuelings.value.unshift(created)
    refuelingForm.mileage = 0
    refuelingForm.fuel_quantity = 0
    refuelingForm.price_per_liter = 0
    refuelingForm.service_operation = 0
    refuelingForm.discount = 0
    refuelingForm.comment = ''
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

async function submit(action: () => Promise<void>) {
  saving.value = true
  error.value = ''
  try {
    await action()
    closeModal()
  } catch (requestError) {
    error.value = requestError instanceof ApiError ? requestError.message : 'Не удалось сохранить данные'
  } finally {
    saving.value = false
  }
}

async function remove(path: string, id: number, label: string) {
  if (!window.confirm(`Удалить «${label}»?`)) return
  error.value = ''
  try {
    await api(`${path}${id}/`, { method: 'DELETE' })
    await loadData()
  } catch (requestError) {
    error.value = requestError instanceof ApiError ? requestError.message : 'Не удалось удалить запись'
  }
}

function logout() {
  setToken(null)
  authenticated.value = false
  vehicles.value = []
  refuelings.value = []
  stations.value = []
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
      <div class="brand-mark"><Fuel :size="25" /></div>
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
        <div class="brand-mark small"><Fuel :size="20" /></div>
        <strong>Brooks</strong>
        <button class="icon-button mobile-close" title="Закрыть меню" @click="mobileNavOpen = false"><X :size="20" /></button>
      </div>
      <nav>
        <button
          v-for="item in navItems"
          :key="item.id"
          :class="{ active: activeView === item.id }"
          @click="selectView(item.id)"
        >
          <component :is="item.icon" :size="19" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
      <div class="sidebar-footer">
        <button @click="logout"><LogOut :size="19" /><span>Выйти</span></button>
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
          <span class="action-tooltip" :title="vehicles.length ? 'Добавить новую заправку' : 'Сначала добавьте транспорт в разделе Заправки'">
            <button v-if="activeView === 'refuelings'" class="primary-button" :disabled="!vehicles.length" @click="openModal('refueling')"><Plus :size="18" />Добавить заправку</button>
          </span>
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
          <section class="metric-grid">
            <article class="metric">
              <div class="metric-icon green"><CarFront :size="21" /></div>
              <span>Активный транспорт</span>
              <strong>{{ activeVehicles }}</strong>
              <small>из {{ vehicles.length }} всего</small>
            </article>
            <article class="metric">
              <div class="metric-icon amber"><Fuel :size="21" /></div>
              <span>Топливо</span>
              <strong>{{ number(totalFuel, 1) }} л</strong>
              <small>за все время</small>
            </article>
            <article class="metric">
              <div class="metric-icon blue"><Route :size="21" /></div>
              <span>Пробег</span>
              <strong>{{ number(totalDistance) }} км</strong>
              <small>по заправкам</small>
            </article>
            <article class="metric">
              <div class="metric-icon red"><BarChart3 :size="21" /></div>
              <span>Расходы</span>
              <strong>{{ currency(totalCost) }}</strong>
              <small>{{ number(averageConsumption, 1) }} л / 100 км</small>
            </article>
          </section>

          <section class="dashboard-grid">
            <div class="panel">
              <div class="section-heading">
                <div><p class="eyebrow">Последние операции</p><h2>Недавние заправки</h2></div>
                <button class="link-button" @click="selectView('refuelings')">Все записи <ChevronRight :size="16" /></button>
              </div>
              <div v-if="recentRefuelings.length" class="activity-list">
                <div v-for="item in recentRefuelings" :key="item.id" class="activity-row">
                  <div class="activity-icon"><Fuel :size="18" /></div>
                  <div class="activity-main">
                    <strong>{{ vehicleById(item.vehicle)?.name || 'Транспорт' }}</strong>
                    <span>{{ formatDate(item.date) }} · {{ item.fuel_type || 'Топливо' }}</span>
                  </div>
                  <div class="activity-value">
                    <strong>{{ currency(item.effective_cost || item.total_cost) }}</strong>
                    <span>{{ number(item.fuel_quantity, 1) }} л</span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state"><Fuel :size="28" /><strong>Заправок пока нет</strong><span>Добавьте первую запись в журнале.</span></div>
            </div>

            <div class="panel fleet-panel">
              <div class="section-heading">
                <div><p class="eyebrow">Автопарк</p><h2>Состояние транспорта</h2></div>
              </div>
              <div class="fleet-summary">
                <div class="fleet-ring"><strong>{{ activeVehicles }}</strong><span>активно</span></div>
                <div class="fleet-legend">
                  <div><i class="dot active-dot"></i><span>В работе</span><strong>{{ activeVehicles }}</strong></div>
                  <div><i class="dot inactive-dot"></i><span>Неактивны</span><strong>{{ vehicles.length - activeVehicles }}</strong></div>
                  <div><i class="dot station-dot"></i><span>АЗС в справочнике</span><strong>{{ stations.length }}</strong></div>
                </div>
              </div>
              <button class="secondary-button wide" @click="selectView('refuelings')">Открыть заправки <ChevronRight :size="17" /></button>
            </div>
          </section>
        </template>

        <template v-else>
          <section class="list-toolbar">
            <div class="search-field"><Search :size="18" /><input v-model="search" placeholder="Поиск по заправкам, транспорту и АЗС"></div>
            <span class="record-count">{{ filteredRefuelings.length }} заправок</span>
          </section>

          <section class="table-panel">
            <div class="table-scroll">
              <table>
                <thead><tr><th>Дата</th><th>Транспорт</th><th>АЗС / топливо</th><th>Пробег</th><th>Объем</th><th>Стоимость</th><th></th></tr></thead>
                <tbody>
                  <tr v-for="item in filteredRefuelings" :key="item.id">
                    <td><span class="date-cell"><CalendarDays :size="16" />{{ formatDate(item.date) }}</span></td>
                    <td><strong>{{ vehicleById(item.vehicle)?.name || '—' }}</strong></td>
                    <td><strong>{{ stationById(item.gas_station)?.company || stationById(item.gas_station)?.name || 'Не указана' }}</strong><small>{{ item.fuel_type || '—' }} · {{ currency(item.price_per_liter) }}/л</small></td>
                    <td>{{ number(item.mileage) }} км</td>
                    <td>{{ number(item.fuel_quantity, 2) }} л</td>
                    <td><strong>{{ currency(item.effective_cost || item.total_cost) }}</strong></td>
                    <td><button class="icon-button danger" title="Удалить заправку" @click="remove('/refuelings/', item.id, `заправку от ${formatDate(item.date)}`)"><Trash2 :size="17" /></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="!filteredRefuelings.length" class="empty-state"><Fuel :size="28" /><strong>Записи не найдены</strong></div>
          </section>

          <section class="refueling-management">
            <div class="section-heading management-heading">
              <div><p class="eyebrow">Справочники</p><h2>Транспорт и АЗС</h2></div>
              <div class="management-actions">
                <button class="secondary-button" @click="openModal('vehicle')"><Plus :size="17" />Транспорт</button>
                <button class="secondary-button" @click="openModal('station')"><Plus :size="17" />АЗС</button>
              </div>
            </div>

            <div class="management-grid">
              <section class="management-panel">
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

              <section class="management-panel">
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
        </template>
      </main>
    </div>
  </div>

  <div v-if="modal" class="modal-backdrop" @mousedown.self="closeModal">
    <section class="modal">
      <header>
        <div>
          <p class="eyebrow">Новая запись</p>
          <h2>{{ modal === 'vehicle' ? 'Транспорт' : modal === 'refueling' ? 'Заправка' : 'Автозаправочная станция' }}</h2>
        </div>
        <button class="icon-button" title="Закрыть" @click="closeModal"><X :size="20" /></button>
      </header>

      <form v-if="modal === 'vehicle'" id="vehicle-form" @submit.prevent="createVehicle">
        <label class="full">Название<input v-model.trim="vehicleForm.name" required placeholder="Например, Рабочая Toyota"></label>
        <label>Марка<input v-model.trim="vehicleForm.brand" placeholder="Toyota"></label>
        <label>Модель<input v-model.trim="vehicleForm.model" placeholder="Camry"></label>
        <label>Год<input v-model.number="vehicleForm.year" type="number" min="1900" max="2100"></label>
        <label>Начальный пробег<input v-model.number="vehicleForm.initial_odometer" required type="number" min="0"></label>
        <label class="check-field full"><input v-model="vehicleForm.is_active" type="checkbox"><span><Check :size="16" />Активный транспорт</span></label>
      </form>

      <form v-if="modal === 'refueling'" id="refueling-form" @submit.prevent="createRefueling">
        <label class="full">Транспорт<select v-model.number="refuelingForm.vehicle" required><option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.name }}</option></select></label>
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

      <p v-if="error" class="form-error modal-error">{{ error }}</p>
      <footer>
        <button class="secondary-button" type="button" @click="closeModal">Отмена</button>
        <button class="primary-button" type="submit" :form="`${modal}-form`" :disabled="saving">
          <RefreshCw v-if="saving" class="spin" :size="17" /><Check v-else :size="17" />Сохранить
        </button>
      </footer>
    </section>
  </div>
</template>
