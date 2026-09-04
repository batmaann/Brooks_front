import { aiApi, api, listResult } from '@/api'
import type { ApiListResponse } from '@/types/common'
import type {
  MonthlyBankBreakdown,
  MonthlyCategoryBreakdown,
  MonthlySummary,
  Transaction,
  TransactionImport,
  TransactionImportItem,
  TransactionPayload,
} from '@/types/finance'

export async function getTransactions() {
  return listResult(await api<ApiListResponse<Transaction>>('/transactions/'))
}

export function uploadTransactionImport(file: File) {
  const body = new FormData()
  body.append('file', file)
  return aiApi<TransactionImport>('/transaction-imports/', { method: 'POST', body })
}

export function getTransactionImport(id: string) {
  return aiApi<TransactionImport>(`/transaction-imports/${id}/`)
}

export async function getTransactionImports() {
  return listResult(await aiApi<ApiListResponse<TransactionImport>>('/transaction-imports/?page_size=100'))
}

export async function getTransactionImportItems(id: string) {
  const items: TransactionImportItem[] = []
  let page = 1
  let result: TransactionImportItem[]
  do {
    result = listResult(await aiApi<ApiListResponse<TransactionImportItem>>(`/transaction-imports/${id}/items/?page_size=100&page=${page}`))
    items.push(...result)
    page += 1
  } while (result.length === 100)
  return items
}

export function confirmTransactionImport(id: string, itemIds: string[]) {
  return aiApi<TransactionImport>(`/transaction-imports/${id}/confirm/`, {
    method: 'POST',
    body: JSON.stringify({ mode: 'detailed', item_ids: itemIds }),
  })
}

export function updateTransactionImportItem(id: string, payload: { category_id?: number | null, bank_label_id?: number | null, transaction_type?: TransactionImportItem['transaction_type'] }) {
  return aiApi<TransactionImportItem>(`/draft-transactions/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
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
