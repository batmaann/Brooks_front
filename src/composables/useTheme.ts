import { ref } from 'vue'

const THEME_STORAGE_KEY = 'brooks-theme'

export function useTheme() {
  const isDarkTheme = ref(localStorage.getItem(THEME_STORAGE_KEY) === 'dark')

  function applyTheme() {
    document.documentElement.dataset.theme = isDarkTheme.value ? 'dark' : 'light'
    localStorage.setItem(THEME_STORAGE_KEY, isDarkTheme.value ? 'dark' : 'light')
  }

  function toggleTheme() {
    isDarkTheme.value = !isDarkTheme.value
    applyTheme()
  }

  return {
    applyTheme,
    isDarkTheme,
    toggleTheme,
  }
}

