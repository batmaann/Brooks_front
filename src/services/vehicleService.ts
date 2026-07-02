import { api, listResult } from '@/api'
import type { ApiListResponse } from '@/types/common'
import type { Vehicle, VehiclePayload } from '@/types/vehicle'

export async function getVehicles() {
  return listResult(await api<ApiListResponse<Vehicle>>('/vehicle/'))
}

export function createVehicle(payload: VehiclePayload) {
  return api<Vehicle>('/vehicle/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteVehicle(id: number) {
  return api<void>(`/vehicle/${id}/`, { method: 'DELETE' })
}

