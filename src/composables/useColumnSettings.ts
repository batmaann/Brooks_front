import { computed, ref, shallowRef, watch } from 'vue'

interface ColumnSettingsOptions {
  storageKey?: string
}

interface StoredColumnSettings<T extends string> {
  order: T[]
  visibility: Record<T, boolean>
}

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined'
}

function readStoredColumnSettings<T extends string>(
  storageKey: string | undefined,
  initialOrder: T[],
  initialVisibility: Record<T, boolean>,
): StoredColumnSettings<T> {
  const defaultSettings = {
    order: [...initialOrder],
    visibility: { ...initialVisibility },
  }
  if (!storageKey || !canUseLocalStorage()) return defaultSettings

  try {
    const storedValue = localStorage.getItem(storageKey)
    if (!storedValue) return defaultSettings

    const parsed = JSON.parse(storedValue) as Partial<StoredColumnSettings<T>>
    const knownColumns = new Set(initialOrder)
    const storedOrder = Array.isArray(parsed.order)
      ? parsed.order.filter((key): key is T => knownColumns.has(key as T))
      : []
    const order = [...storedOrder, ...initialOrder.filter((key) => !storedOrder.includes(key))]
    const visibility = { ...initialVisibility }

    if (parsed.visibility && typeof parsed.visibility === 'object') {
      initialOrder.forEach((key) => {
        const value = parsed.visibility?.[key]
        if (typeof value === 'boolean') visibility[key] = value
      })
    }

    if (!Object.values(visibility).some(Boolean)) {
      visibility[initialOrder[0]!] = true
    }

    return { order, visibility }
  } catch {
    return defaultSettings
  }
}

function writeStoredColumnSettings<T extends string>(
  storageKey: string | undefined,
  settings: StoredColumnSettings<T>,
) {
  if (!storageKey || !canUseLocalStorage()) return

  localStorage.setItem(storageKey, JSON.stringify(settings))
}

export function useColumnSettings<T extends string>(
  initialOrder: T[],
  initialVisibility: Record<T, boolean>,
  options: ColumnSettingsOptions = {},
) {
  const storedSettings = readStoredColumnSettings(options.storageKey, initialOrder, initialVisibility)
  const columnOrder = shallowRef<T[]>(storedSettings.order)
  const columnVisibility = ref<Record<T, boolean>>(storedSettings.visibility)
  const draggedColumn = ref<T | null>(null)

  const visibleColumns = computed(() => columnOrder.value.filter((key) => columnVisibility.value[key]))

  watch([columnOrder, columnVisibility], () => {
    writeStoredColumnSettings(options.storageKey, {
      order: columnOrder.value,
      visibility: columnVisibility.value,
    })
  }, { deep: true })

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
    return columnVisibility.value[key] || visibleColumns.value.length > 1
  }

  function toggleColumn(key: T, checked: boolean) {
    if (!checked && visibleColumns.value.length <= 1) return
    columnVisibility.value[key] = checked
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
