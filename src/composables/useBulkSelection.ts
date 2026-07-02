import { computed, ref, type ComputedRef } from 'vue'

export function useBulkSelection(visibleIds: ComputedRef<number[]>) {
  const selectedIds = ref<number[]>([])

  const selectedCount = computed(() => selectedIds.value.length)
  const allVisibleSelected = computed(() =>
    visibleIds.value.length > 0 && visibleIds.value.every((id) => selectedIds.value.includes(id)),
  )

  function isSelected(id: number) {
    return selectedIds.value.includes(id)
  }

  function toggleSelection(id: number, checked: boolean) {
    selectedIds.value = checked
      ? Array.from(new Set([...selectedIds.value, id]))
      : selectedIds.value.filter((selectedId) => selectedId !== id)
  }

  function toggleAllVisible(checked: boolean) {
    if (checked) {
      selectedIds.value = Array.from(new Set([...selectedIds.value, ...visibleIds.value]))
      return
    }

    selectedIds.value = selectedIds.value.filter((id) => !visibleIds.value.includes(id))
  }

  function clearSelection() {
    selectedIds.value = []
  }

  function keepExisting(existingIds: number[]) {
    selectedIds.value = selectedIds.value.filter((id) => existingIds.includes(id))
  }

  return {
    allVisibleSelected,
    clearSelection,
    isSelected,
    keepExisting,
    selectedCount,
    selectedIds,
    toggleAllVisible,
    toggleSelection,
  }
}

