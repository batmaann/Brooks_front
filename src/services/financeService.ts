import { api, listResult } from '@/api'
import type { ApiListResponse } from '@/types/common'
import type {
  BankLabel,
  BankLabelPayload,
  Category,
  CategoryPayload,
  Section,
  Transaction,
  TransactionPayload,
} from '@/types/finance'

export async function getTransactions() {
  return listResult(await api<ApiListResponse<Transaction>>('/transactions/'))
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

export async function getBankLabels() {
  return listResult(await api<ApiListResponse<BankLabel>>('/bank-labels/'))
}

export function createBankLabel(payload: BankLabelPayload) {
  return api<BankLabel>('/bank-labels/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateBankLabel(id: number, payload: BankLabelPayload) {
  return api<BankLabel>(`/bank-labels/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function getCategories() {
  return listResult(await api<ApiListResponse<Category>>('/categories/'))
}

export function createCategory(payload: CategoryPayload) {
  return api<Category>('/categories/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCategory(id: number, payload: CategoryPayload) {
  return api<Category>(`/categories/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function getSections() {
  return listResult(await api<ApiListResponse<Section>>('/sections/'))
}

