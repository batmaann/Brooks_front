import { readonly, ref } from 'vue'

const unavailable = ref(false)
const statusCode = ref<number | null>(null)

export function reportServiceUnavailable(status: number | null = null) {
  statusCode.value = status
  unavailable.value = true
}

export function useServiceAvailability() {
  function retry() {
    unavailable.value = false
    statusCode.value = null
    window.location.reload()
  }

  return {
    retry,
    statusCode: readonly(statusCode),
    unavailable: readonly(unavailable),
  }
}
