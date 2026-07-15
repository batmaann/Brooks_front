import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createGasStation as createGasStationRequest,
  createRefueling as createRefuelingRequest,
  deleteGasStation as deleteGasStationRequest,
  deleteRefueling as deleteRefuelingRequest,
  getGasStations,
  getRefuelings,
  updateGasStation as updateGasStationRequest,
  updateRefueling as updateRefuelingRequest,
} from '@/services/refuelingService'
import {
  createVehicle as createVehicleRequest,
  deleteVehicle as deleteVehicleRequest,
  getVehicles,
} from '@/services/vehicleService'
import type { GasStation, GasStationPayload, Refueling, RefuelingPayload } from '@/types/refueling'
import type { Vehicle, VehiclePayload } from '@/types/vehicle'

export const useFleetStore = defineStore('fleet', () => {
  const vehicles = ref<Vehicle[]>([])
  const refuelings = ref<Refueling[]>([])
  const stations = ref<GasStation[]>([])

  async function load() {
    const [vehicleData, refuelingData, stationData] = await Promise.all([
      getVehicles(),
      getRefuelings(),
      getGasStations(),
    ])

    vehicles.value = vehicleData
    refuelings.value = refuelingData
    stations.value = stationData
  }

  async function createVehicle(payload: VehiclePayload) {
    const created = await createVehicleRequest(payload)
    vehicles.value.push(created)
    return created
  }

  async function createRefueling(payload: RefuelingPayload) {
    return createRefuelingRequest(payload)
  }

  async function updateRefueling(id: number, payload: RefuelingPayload) {
    return updateRefuelingRequest(id, payload)
  }

  async function createGasStation(payload: GasStationPayload) {
    const created = await createGasStationRequest(payload)
    stations.value.push(created)
    return created
  }

  async function updateGasStation(id: number, payload: GasStationPayload) {
    const updated = await updateGasStationRequest(id, payload)
    const index = stations.value.findIndex((station) => station.id === id)
    if (index !== -1) stations.value[index] = updated
    return updated
  }

  async function deleteVehicle(id: number) {
    await deleteVehicleRequest(id)
  }

  async function deleteRefueling(id: number) {
    await deleteRefuelingRequest(id)
  }

  async function deleteGasStation(id: number) {
    await deleteGasStationRequest(id)
  }

  function clear() {
    vehicles.value = []
    refuelings.value = []
    stations.value = []
  }

  return {
    clear,
    createGasStation,
    createRefueling,
    createVehicle,
    deleteGasStation,
    deleteRefueling,
    deleteVehicle,
    load,
    refuelings,
    stations,
    updateGasStation,
    updateRefueling,
    vehicles,
  }
})
