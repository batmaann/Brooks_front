import { api, listResult } from '@/api'
import type { ApiListResponse } from '@/types/common'
import type {
  MonthlyBankBreakdown,
  MonthlyCategoryBreakdown,
  MonthlySummary,
  Transaction,
  TransactionPayload,
} from '@/types/finance'

export async function getTransactions() {
  return listResult(await api<ApiListResponse<Transaction>>('/transactions/'))
}

export function getMonthlySummary(currency = 'RUB') {
  const params = new URLSearchParams({ currency })
  return api<MonthlySummary>(`/transactions/monthly-summary/?${params}`)
}

export function getMonthlyCategorySummary(year: number, month: number, currency = 'RUB') {
  const params = new URLSearchParams({ year: String(year), month: String(month), currency })
  return api<MonthlyCategoryBreakdown>(`/transactions/monthly-category-summary/?${params}`)
}

export function getMonthlyBankSummary(year: number, month: number, currency = 'RUB') {
  const params = new URLSearchParams({ year: String(year), month: String(month), currency })
  return api<MonthlyBankBreakdown>(`/transactions/monthly-bank-summary/?${params}`)
}

export function createTransaction(payload: TransactionPayload) {
  return api<Transaction>('/transactions/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTransaction(id: number, payload: Partial<TransactionPayload>) {
  return api<Transaction>(`/transactions/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteTransaction(id: number) {
  return api<void>(`/transactions/${id}/`, { method: 'DELETE' })
}
