import { computed, reactive, ref, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useBulkSelection } from '@/composables/useBulkSelection'
import { useColumnSettings } from '@/composables/useColumnSettings'
import { useSortableData } from '@/composables/useSortableData'
import type { useFleetStore } from '@/stores/fleet'
import type { GasStationPayload, Refueling, RefuelingPayload } from '@/types/refueling'
import type { VehiclePayload } from '@/types/vehicle'
import type { RefuelingColumnKey } from '@/types/table'

export type FleetDeleteResource = 'vehicle' | 'refueling' | 'gasStation' | 'bulk-refuelings'

type Submit = (action: () => Promise<void>, options?: { closeAfter?: boolean }) => Promise<void>

interface UseFleetWorkspaceOptions {
  error: Ref<string>
  fleetStore: ReturnType<typeof useFleetStore>
  loadData: () => Promise<void>
  requestDelete: (resource: FleetDeleteResource, id: number, label: string) => void
  search: Ref<string>
  submit: Submit
}

const refuelingColumnLabels: Record<RefuelingColumnKey, string> = {
  date: 'Дата',
  vehicle: 'Транспорт',
  station_fuel: 'АЗС / топливо',
  mileage: 'Пробег',
  fuel_quantity: 'Объем',
  is_full_tank: 'Полный бак',
  cost: 'Стоимость',
}

function defaultVehicleForm(): VehiclePayload {
  return {
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    initial_odometer: 0,
    is_active: true,
  }
}

function defaultRefuelingForm(vehicle: number | null = null) {
  return {
    vehicle,
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
  }
}

function defaultStationForm(): GasStationPayload {
  return { name: '', company: '', number: '', address: '' }
}

export function useFleetWorkspace(options: UseFleetWorkspaceOptions) {
  const { error, fleetStore, loadData, requestDelete, search, submit } = options
  const { refuelings, stations, vehicles } = storeToRefs(fleetStore)

  const refuelingVisibility = reactive({ summary: true, vehicles: true, stations: true })
  const vehicleForm = reactive(defaultVehicleForm())
  const refuelingForm = reactive(defaultRefuelingForm())
  const stationForm = reactive(defaultStationForm())
  const editingRefuelingId = ref<number | null>(null)
  const bulkRefuelingVehicleValue = ref('')
  const bulkRefuelingStationValue = ref('')

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

  function vehicleById(id: number | null) {
    return vehicles.value.find((vehicle) => vehicle.id === id)
  }

  function stationById(id: number | null) {
    return stations.value.find((station) => station.id === id)
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

  const refuelingTotalCost = computed(() => refuelings.value.reduce((sum, item) => sum + Number(item.effective_cost || item.total_cost || 0), 0))
  const refuelingTotalFuel = computed(() => refuelings.value.reduce((sum, item) => sum + Number(item.fuel_quantity || 0), 0))
  const {
    sort: refuelingSort,
    sortedItems: sortedRefuelings,
    toggleSort: toggleRefuelingSort,
  } = useSortableData<Refueling, RefuelingColumnKey>(refuelings, refuelingSortValue)

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
  const visibleRefuelingIds = computed(() => filteredRefuelings.value.map((item) => item.id))
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

  async function createVehicle() {
    await submit(async () => {
      await fleetStore.createVehicle(vehicleForm)
      Object.assign(vehicleForm, defaultVehicleForm())
    })
  }

  function resetRefuelingForm() {
    Object.assign(refuelingForm, defaultRefuelingForm(vehicles.value[0]?.id ?? null))
  }

  function refuelingPayload(): RefuelingPayload {
    return {
      ...refuelingForm,
      gas_station: refuelingForm.gas_station || null,
      fuel_type: refuelingForm.fuel_type || null,
    }
  }

  function prepareCreateRefueling() {
    resetRefuelingForm()
    if (!refuelingForm.vehicle && vehicles.value.length) {
      refuelingForm.vehicle = vehicles.value[0]!.id
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
      Object.assign(stationForm, defaultStationForm())
    })
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
    requestDelete('bulk-refuelings', 0, `${selectedRefuelingIds.value.length} заправок`)
  }

  function resetRefuelingEditor() {
    editingRefuelingId.value = null
  }

  return {
    allVisibleRefuelingsSelected,
    applyBulkRefuelingStation,
    applyBulkRefuelingVehicle,
    bulkRefuelingStationValue,
    bulkRefuelingVehicleValue,
    canToggleRefuelingColumn,
    clearRefuelingSelection,
    createStation,
    createVehicle,
    draggedRefuelingColumn,
    dropRefuelingColumn,
    editingRefuelingId,
    filteredRefuelings,
    filteredStations,
    filteredVehicles,
    finishRefuelingColumnDrag,
    isRefuelingSelected,
    keepExistingRefuelingSelection,
    prepareCreateRefueling,
    refuelingColumnLabels,
    refuelingColumnOrder,
    refuelingColumnVisibility,
    refuelingControlsOpen: ref(false),
    refuelingForm,
    refuelingSort,
    refuelingTotalCost,
    refuelingTotalFuel,
    refuelingVisibility,
    refuelings,
    requestBulkRefuelingDelete,
    resetRefuelingEditor,
    saveRefueling,
    selectedRefuelingCount,
    selectedRefuelingIds,
    startEditRefueling,
    startRefuelingColumnDrag,
    stationById,
    stationForm,
    stations,
    toggleAllVisibleRefuelings,
    toggleRefuelingColumn,
    toggleRefuelingSelection,
    toggleRefuelingSort,
    vehicleById,
    vehicleForm,
    vehicles,
    visibleRefuelingColumns,
    visibleRefuelingIds,
  }
}
