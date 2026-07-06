import { reactive, watch } from 'vue'

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined'
}

function readStoredVisibility<T extends Record<string, boolean>>(storageKey: string, defaults: T): Partial<T> {
  if (!canUseLocalStorage()) return {}

  try {
    const storedValue = localStorage.getItem(storageKey)
    if (!storedValue) return {}

    const parsed = JSON.parse(storedValue) as Partial<T>
    return Object.keys(defaults).reduce<Partial<T>>((settings, key) => {
      const value = parsed[key as keyof T]
      if (typeof value === 'boolean') {
        settings[key as keyof T] = value as T[keyof T]
      }
      return settings
    }, {})
  } catch {
    return {}
  }
}

export function useStoredVisibility<T extends Record<string, boolean>>(storageKey: string, defaults: T) {
  const visibility = reactive({
    ...defaults,
    ...readStoredVisibility(storageKey, defaults),
  }) as T

  watch(visibility, () => {
    if (!canUseLocalStorage()) return
    localStorage.setItem(storageKey, JSON.stringify(visibility))
  }, { deep: true })

  return visibility
}
