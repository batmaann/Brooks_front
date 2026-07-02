export type FuelType = 'АИ-92' | 'АИ-95' | 'АИ-98' | 'ДТ' | 'ГАЗ'

export interface GasStation {
  id: number
  name: string
  number: string
  address: string
  company: string
}

export interface Refueling {
  id: number
  date: string
  mileage: number | null
  month: number | null
  quarter: number | null
  odometer: number
  fuel_quantity: string | null
  price_per_liter: string | null
  total_cost: string | null
  effective_cost: number | null
  fuel_consumption: number | null
  service_operation: string
  gas_station: number | null
  vehicle: number | null
  fuel_type: FuelType | string | null
  is_full_tank: boolean | null
  cashback: string | null
  comment: string
  transaction: number | null
  category: number | null
  is_complete: boolean
  user?: number
  created_at?: string
  updated_at?: string
}

export interface RefuelingDraft {
  vehicle: number | null
  date: string
  mileage: number
  fuel_quantity: number
  price_per_liter: number
  service_operation: number
  gas_station: number | null
  fuel_type: FuelType | string | null
  is_full_tank: boolean
  cashback: number
  comment: string
  category?: number | null
  transaction?: number | null
}

export type RefuelingPayload = Partial<RefuelingDraft>

export type GasStationPayload = Omit<GasStation, 'id'>

