import { computed, shallowRef, type Ref } from 'vue'
import type { SortDirection } from '@/types/common'

type SortValue = number | string | boolean | null | undefined
type ReadonlyValueRef<T> = Pick<Ref<T>, 'value'>

export function useSortableData<Item, Key extends string>(
  items: ReadonlyValueRef<Item[]>,
  valueForKey: (item: Item, key: Key) => SortValue,
) {
  const sort = shallowRef<{ key: Key | null, direction: SortDirection }>({
    key: null,
    direction: null,
  })

  const sortedItems = computed(() => {
    const sortState = sort.value
    if (!sortState.key || !sortState.direction) return items.value

    const key = sortState.key
    const directionMultiplier = sortState.direction === 'asc' ? 1 : -1

    return [...items.value].sort((first, second) => {
      const firstValue = valueForKey(first, key)
      const secondValue = valueForKey(second, key)
      const result = typeof firstValue === 'number' && typeof secondValue === 'number'
        ? firstValue - secondValue
        : String(firstValue ?? '').localeCompare(String(secondValue ?? ''), 'ru', { numeric: true, sensitivity: 'base' })

      return result * directionMultiplier
    })
  })

  function toggleSort(key: Key) {
    if (sort.value.key !== key) {
      sort.value = { key, direction: 'asc' }
      return
    }

    if (sort.value.direction === 'asc') {
      sort.value = { key, direction: 'desc' }
      return
    }

    sort.value = { key: null, direction: null }
  }

  return {
    sort,
    sortedItems,
    toggleSort,
  }
}
