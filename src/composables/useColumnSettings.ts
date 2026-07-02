import { computed, reactive, ref, shallowRef } from 'vue'

export function useColumnSettings<T extends string>(initialOrder: T[], initialVisibility: Record<T, boolean>) {
  const columnOrder = shallowRef<T[]>([...initialOrder])
  const columnVisibility = reactive<Record<T, boolean>>({ ...initialVisibility })
  const draggedColumn = ref<T | null>(null)

  const visibleColumns = computed(() => columnOrder.value.filter((key) => columnVisibility[key]))

  function startColumnDrag(key: T) {
    draggedColumn.value = key
  }

  function dropColumn(targetKey: T) {
    const sourceKey = draggedColumn.value
    if (!sourceKey || sourceKey === targetKey) return

    const nextOrder = [...columnOrder.value]
    const sourceIndex = nextOrder.indexOf(sourceKey)
    const targetIndex = nextOrder.indexOf(targetKey)
    if (sourceIndex === -1 || targetIndex === -1) return

    nextOrder.splice(sourceIndex, 1)
    nextOrder.splice(targetIndex, 0, sourceKey)
    columnOrder.value = nextOrder
  }

  function finishColumnDrag() {
    draggedColumn.value = null
  }

  function canToggleColumn(key: T) {
    return columnVisibility[key] || visibleColumns.value.length > 1
  }

  function toggleColumn(key: T, checked: boolean) {
    if (!checked && visibleColumns.value.length <= 1) return
    columnVisibility[key] = checked
  }

  return {
    canToggleColumn,
    columnOrder,
    columnVisibility,
    draggedColumn,
    dropColumn,
    finishColumnDrag,
    startColumnDrag,
    toggleColumn,
    visibleColumns,
  }
}
