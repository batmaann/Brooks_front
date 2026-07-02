export interface Vehicle {
  id: number
  name: string
  brand: string | null
  model: string | null
  year: number | null
  initial_odometer: number
  current_odometer: number
  is_active: boolean
  user?: number
}

export interface VehiclePayload {
  name: string
  brand: string
  model: string
  year: number | null
  initial_odometer: number
  is_active: boolean
}

