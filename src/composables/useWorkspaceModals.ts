import { computed, ref, type Ref } from 'vue'
import { ApiError } from '@/api'
import type { useFinanceStore } from '@/stores/finance'
import type { useFleetStore } from '@/stores/fleet'
import type { Refueling } from '@/types/refueling'
import type { FinanceDeleteResource } from '@/composables/useFinanceWorkspace'
import type { FleetDeleteResource } from '@/composables/useFleetWorkspace'

export type WorkspaceModal = 'vehicle' | 'refueling' | 'station' | 'bankLabel' | 'category' | 'about' | 'delete' | null
export type WorkspaceDeleteResource = FinanceDeleteResource | FleetDeleteResource

type SubmitState = (
  action: () => Promise<void>,
  options: { closeAfter?: boolean, onSuccess: () => void },
) => Promise<void>

interface UseWorkspaceModalsOptions {
  clearRefuelingSelection: () => void
  clearTransactionSelection: () => void
  editingRefuelingId: Ref<number | null>
  error: Ref<string>
  financeStore: ReturnType<typeof useFinanceStore>
  fleetStore: ReturnType<typeof useFleetStore>
  loadData: () => Promise<void>
  prepareCreateRefueling: () => void
  prepareEditRefueling: (item: Refueling) => void
  resetDictionaryEditors: () => void
  resetRefuelingEditor: () => void
  saving: Ref<boolean>
  selectedRefuelingIds: Ref<number[]>
  selectedTransactionIds: Ref<number[]>
  submitState: SubmitState
}

export function useWorkspaceModals(options: UseWorkspaceModalsOptions) {
  const modal = ref<WorkspaceModal>(null)
  const pendingDelete = ref<{ resource: WorkspaceDeleteResource, id: number, label: string } | null>(null)

  const modalTitle = computed(() => {
    if (modal.value === 'vehicle') return 'Транспорт'
    if (modal.value === 'refueling') return options.editingRefuelingId.value ? 'Редактирование заправки' : 'Заправка'
    if (modal.value === 'station') return 'Автозаправочная станция'
    if (modal.value === 'bankLabel') return 'Банк'
    if (modal.value === 'category') return 'Категории'
    if (modal.value === 'delete') return 'Удалить запись'
    return 'О нас'
  })
  const modalEyebrow = computed(() => modal.value === 'about' ? 'Информация' : modal.value === 'delete' ? 'Подтверждение' : 'Новая запись')

  function openModal(type: Exclude<WorkspaceModal, null>) {
    options.error.value = ''
    if (type === 'refueling') options.prepareCreateRefueling()
    modal.value = type
  }

  function closeModal() {
    options.resetDictionaryEditors()
    options.resetRefuelingEditor()
    modal.value = null
    pendingDelete.value = null
  }

  async function submit(action: () => Promise<void>, submitOptions: { closeAfter?: boolean } = {}) {
    await options.submitState(action, {
      closeAfter: submitOptions.closeAfter,
      onSuccess: closeModal,
    })
  }

  function requestDelete(resource: WorkspaceDeleteResource, id: number, label: string) {
    options.error.value = ''
    pendingDelete.value = { resource, id, label }
    modal.value = 'delete'
  }

  function remove(resource: WorkspaceDeleteResource, id: number, label: string) {
    requestDelete(resource, id, label)
  }

  function startEditRefueling(item: Refueling) {
    options.prepareEditRefueling(item)
    modal.value = 'refueling'
  }

  async function confirmRemove() {
    if (!pendingDelete.value) return
    options.saving.value = true
    options.error.value = ''
    const target = pendingDelete.value
    try {
      if (target.resource === 'bulk-transactions') {
        await Promise.all(options.selectedTransactionIds.value.map((id) => options.financeStore.deleteTransaction(id)))
        options.clearTransactionSelection()
      } else if (target.resource === 'bulk-refuelings') {
        await Promise.all(options.selectedRefuelingIds.value.map((id) => options.fleetStore.deleteRefueling(id)))
        options.clearRefuelingSelection()
      } else if (target.resource === 'vehicle') {
        await options.fleetStore.deleteVehicle(target.id)
      } else if (target.resource === 'refueling') {
        await options.fleetStore.deleteRefueling(target.id)
      } else if (target.resource === 'gasStation') {
        await options.fleetStore.deleteGasStation(target.id)
      } else {
        await options.financeStore.deleteTransaction(target.id)
      }
      closeModal()
      await options.loadData()
    } catch (requestError) {
      options.error.value = requestError instanceof ApiError ? requestError.message : 'Не удалось удалить запись'
    } finally {
      options.saving.value = false
    }
  }

  return {
    closeModal,
    confirmRemove,
    modal,
    modalEyebrow,
    modalTitle,
    openModal,
    pendingDelete,
    remove,
    requestDelete,
    startEditRefueling,
    submit,
  }
}
