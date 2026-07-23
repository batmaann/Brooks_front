import { api, listResult } from '@/api'
import type { ApiListResponse } from '@/types/common'
import type { MonthlySummary, Transaction, TransactionPayload } from '@/types/finance'

export async function getTransactions() {
  return listResult(await api<ApiListResponse<Transaction>>('/transactions/'))
}

export function getMonthlySummary(currency = 'RUB') {
  const params = new URLSearchParams({ currency })
  return api<MonthlySummary>(`/transactions/monthly-summary/?${params}`)
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
