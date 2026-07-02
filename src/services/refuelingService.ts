import { api, listResult } from '@/api'
import type { ApiListResponse } from '@/types/common'
import type { GasStation, GasStationPayload, Refueling, RefuelingPayload } from '@/types/refueling'

export async function getRefuelings() {
  return listResult(await api<ApiListResponse<Refueling>>('/refuelings/'))
}

export function createRefueling(payload: RefuelingPayload) {
  return api<Refueling>('/refuelings/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateRefueling(id: number, payload: RefuelingPayload) {
  return api<Refueling>(`/refuelings/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteRefueling(id: number) {
  return api<void>(`/refuelings/${id}/`, { method: 'DELETE' })
}

export async function getGasStations() {
  return listResult(await api<ApiListResponse<GasStation>>('/gasStation/'))
}

export function createGasStation(payload: GasStationPayload) {
  return api<GasStation>('/gasStation/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteGasStation(id: number) {
  return api<void>(`/gasStation/${id}/`, { method: 'DELETE' })
}

