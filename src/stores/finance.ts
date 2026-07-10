import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createBankLabel as createBankLabelRequest,
  createCategory as createCategoryRequest,
  getBankLabels,
  getCategories,
  getSections,
  updateBankLabel as updateBankLabelRequest,
  updateCategory as updateCategoryRequest,
} from '@/services/dictionaryService'
import {
  createTransaction as createTransactionRequest,
  deleteTransaction as deleteTransactionRequest,
  getTransactions,
  updateTransaction as updateTransactionRequest,
} from '@/services/transactionService'
import type {
  BankLabel,
  BankLabelPayload,
  Category,
  CategoryPayload,
  Section,
  Transaction,
  TransactionPayload,
} from '@/types/finance'

export const useFinanceStore = defineStore('finance', () => {
  const transactions = ref<Transaction[]>([])
  const bankLabels = ref<BankLabel[]>([])
  const categories = ref<Category[]>([])
  const sections = ref<Section[]>([])

  function sortByName<T extends { name: string }>(items: T[]) {
    items.sort((first, second) => first.name.localeCompare(second.name, 'ru', { sensitivity: 'base' }))
  }

  async function load() {
    const [transactionData, bankLabelData, categoryData, sectionData] = await Promise.all([
      getTransactions(),
      getBankLabels(),
      getCategories(),
      getSections().catch(() => [] as Section[]),
    ])

    transactions.value = transactionData
    bankLabels.value = bankLabelData
    categories.value = categoryData
    sections.value = sectionData.filter((section) => section.is_active)
  }

  async function createTransaction(payload: TransactionPayload) {
    return createTransactionRequest(payload)
  }

  async function updateTransaction(id: number, payload: Partial<TransactionPayload>) {
    return updateTransactionRequest(id, payload)
  }

  async function deleteTransaction(id: number) {
    await deleteTransactionRequest(id)
  }

  async function createBankLabel(payload: BankLabelPayload) {
    const created = await createBankLabelRequest(payload)
    bankLabels.value.push(created)
    sortByName(bankLabels.value)
    return created
  }

  async function updateBankLabel(id: number, payload: BankLabelPayload) {
    const updated = await updateBankLabelRequest(id, payload)
    const index = bankLabels.value.findIndex((item) => item.id === updated.id)
    if (index !== -1) bankLabels.value[index] = updated
    sortByName(bankLabels.value)
    return updated
  }

  async function createCategory(payload: CategoryPayload) {
    const created = await createCategoryRequest(payload)
    categories.value.push(created)
    sortByName(categories.value)
    return created
  }

  async function updateCategory(id: number, payload: CategoryPayload) {
    const updated = await updateCategoryRequest(id, payload)
    const index = categories.value.findIndex((item) => item.id === updated.id)
    if (index !== -1) categories.value[index] = updated
    sortByName(categories.value)
    return updated
  }

  function clear() {
    transactions.value = []
    bankLabels.value = []
    categories.value = []
    sections.value = []
  }

  return {
    bankLabels,
    categories,
    clear,
    createBankLabel,
    createCategory,
    createTransaction,
    deleteTransaction,
    load,
    sections,
    transactions,
    updateBankLabel,
    updateCategory,
    updateTransaction,
  }
})
