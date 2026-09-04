import { reportServiceUnavailable } from '@/composables/useServiceAvailability'

const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api'
const AI_API_URL = import.meta.env.VITE_AI_API_BASE_URL || '/ai-api'

export type ApiErrorPayload = Record<string, string | string[]>

export class ApiError extends Error {
  details: ApiErrorPayload

  constructor(message: string, details: ApiErrorPayload = {}) {
    super(message)
    this.details = details
  }
}

interface AuthClientConfig {
  getToken: () => string | null
  onUnauthorized: () => void
}

let authClient: AuthClientConfig = {
  getToken: () => null,
  onUnauthorized: () => {},
}

export function configureAuthClient(config: AuthClientConfig) {
  authClient = config
}

async function request<T>(baseUrl: string, path: string, options: RequestInit = {}): Promise<T> {
  const token = authClient.getToken()
  const headers = new Headers(options.headers)

  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Token ${token}`)

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, headers })
  } catch (error) {
    reportServiceUnavailable()
    throw error
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status >= 500) reportServiceUnavailable(response.status)
    if (response.status === 401) authClient.onUnauthorized()
    const details = data && typeof data === 'object' ? data as ApiErrorPayload : {}
    const firstValue = Object.values(details)[0]
    const message = Array.isArray(firstValue)
      ? firstValue[0] || 'Не удалось выполнить запрос'
      : typeof firstValue === 'string' ? firstValue : 'Не удалось выполнить запрос'
    throw new ApiError(message, details)
  }

  return data as T
}

export function api<T>(path: string, options: RequestInit = {}) {
  return request<T>(API_URL, path, options)
}

export function aiApi<T>(path: string, options: RequestInit = {}) {
  return request<T>(AI_API_URL, path, options)
}

export function listResult<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : data.results
}
