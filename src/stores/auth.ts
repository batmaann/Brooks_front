import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { configureAuthClient } from '@/api'
import {
  login as loginRequest,
  register as registerRequest,
  type LoginPayload,
  type RegisterPayload,
} from '@/services/authService'

const TOKEN_STORAGE_KEY = 'brooks-token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_STORAGE_KEY))
  const isAuthenticated = computed(() => Boolean(token.value))

  function setToken(nextToken: string | null) {
    token.value = nextToken
    if (nextToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  }

  function handleUnauthorized() {
    setToken(null)
  }

  configureAuthClient({
    getToken: () => token.value,
    onUnauthorized: handleUnauthorized,
  })

  async function login(payload: LoginPayload) {
    const response = await loginRequest(payload)
    setToken(response.token)
    return response
  }

  async function register(payload: RegisterPayload) {
    const response = await registerRequest(payload)
    setToken(response.token)
    return response
  }

  function logout() {
    setToken(null)
  }

  return {
    handleUnauthorized,
    isAuthenticated,
    login,
    logout,
    register,
    token,
  }
})
