import { ref, type Ref } from 'vue'
import { ApiError } from '@/api'
import type { useAuthStore } from '@/stores/auth'
import type { useFinanceStore } from '@/stores/finance'
import type { useFleetStore } from '@/stores/fleet'

type IdCollection = Ref<Array<{ id: number }>>

interface UseWorkspaceDataOptions {
  authStore: ReturnType<typeof useAuthStore>
  clearRefuelingSelection: () => void
  clearTransactionSelection: () => void
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
      if (!options.authStore.isAuthenticated) {
        options.authStore.handleUnauthorized()
      } else {
        options.error.value = requestError instanceof ApiError ? requestError.message : 'Не удалось загрузить данные'
      }
    } finally {
      loading.value = false
    }
  }

  function logout() {
    options.authStore.logout()
    options.clearTransactionSelection()
    options.clearRefuelingSelection()
    options.fleetStore.clear()
    options.financeStore.clear()
  }

  return {
    loadData,
    loading,
    logout,
  }
}
