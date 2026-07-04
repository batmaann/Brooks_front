import { ref, type Ref } from 'vue'
import { ApiError, hasToken, setToken } from '@/api'
import type { useFinanceStore } from '@/stores/finance'
import type { useFleetStore } from '@/stores/fleet'

type IdCollection = Ref<Array<{ id: number }>>

interface UseWorkspaceDataOptions {
  clearRefuelingSelection: () => void
  clearTransactionSelection: () => void
  emitLogout: () => void
  error: Ref<string>
  financeStore: ReturnType<typeof useFinanceStore>
  fleetStore: ReturnType<typeof useFleetStore>
  keepExistingRefuelingSelection: (ids: number[]) => void
  keepExistingTransactionSelection: (ids: number[]) => void
  refuelings: IdCollection
  transactions: IdCollection
}

export function useWorkspaceData(options: UseWorkspaceDataOptions) {
  const loading = ref(false)

  async function loadData() {
    loading.value = true
    options.error.value = ''
    try {
      await Promise.all([
        options.fleetStore.load(),
        options.financeStore.load(),
      ])
      options.keepExistingRefuelingSelection(options.refuelings.value.map((item) => item.id))
      options.keepExistingTransactionSelection(options.transactions.value.map((item) => item.id))
    } catch (requestError) {
      if (!hasToken()) {
        options.emitLogout()
      } else {
        options.error.value = requestError instanceof ApiError ? requestError.message : 'Не удалось загрузить данные'
      }
    } finally {
      loading.value = false
    }
  }

  function logout() {
    setToken(null)
    options.clearTransactionSelection()
    options.clearRefuelingSelection()
    options.fleetStore.clear()
    options.financeStore.clear()
    options.emitLogout()
  }

  return {
    loadData,
    loading,
    logout,
  }
}
