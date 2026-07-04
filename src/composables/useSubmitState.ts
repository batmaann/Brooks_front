import { ref } from 'vue'

interface SubmitOptions {
  closeAfter?: boolean
  onSuccess?: () => void
}

export function useSubmitState(getErrorMessage: (error: unknown) => string) {
  const error = ref('')
  const saving = ref(false)

  async function submit(action: () => Promise<void>, options: SubmitOptions = {}) {
    saving.value = true
    error.value = ''
    try {
      await action()
      if (options.closeAfter !== false) options.onSuccess?.()
    } catch (requestError) {
      error.value = getErrorMessage(requestError)
    } finally {
      saving.value = false
    }
  }

  return {
    error,
    saving,
    submit,
  }
}
