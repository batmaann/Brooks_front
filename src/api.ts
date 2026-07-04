const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api'

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

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authClient.getToken()
  const headers = new Headers(options.headers)

  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Token ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
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

export function listResult<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : data.results
}
