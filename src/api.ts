import { reportServiceUnavailable } from '@/composables/useServiceAvailability'

const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api'
const AI_API_URL = import.meta.env.VITE_AI_API_BASE_URL || '/ai'

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

// Fetch is used instead of EventSource to retain Token authentication headers.
export async function aiEvents<T>(path: string, signal: AbortSignal, onStatus: (data: T) => boolean): Promise<void> {
  let failures = 0
  while (!signal.aborted) {
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
    try {
      const token = authClient.getToken()
      const response = await fetch(`${AI_API_URL}${path}`, {
        signal,
        headers: { Accept: 'text/event-stream', ...(token ? { Authorization: `Token ${token}` } : {}) },
      })
      if (response.status === 401) authClient.onUnauthorized()
      if (!response.ok) throw new ApiError(`Не удалось подключиться к обновлениям (${response.status}).`)
      if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
        throw new ApiError('Сервер не вернул поток обновлений.')
      }
      reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (!signal.aborted) {
        const { value, done } = await reader.read()
        if (done) break
        failures = 0
        buffer += decoder.decode(value, { stream: true })
        let boundary: number
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const event = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          const data = event.split('\n').filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trimStart()).join('\n')
          if (data && onStatus(JSON.parse(data) as T)) return
        }
      }
    } catch (error) {
      if (signal.aborted) return
      if (error instanceof ApiError || ++failures >= 3) throw error
    } finally {
      await reader?.cancel().catch(() => {})
    }
    // Reconnect after the server's bounded stream or a transient disconnect.
    await new Promise<void>((resolve) => {
      const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve() }
      const timer = setTimeout(finish, 1000 * Math.max(1, failures))
      signal.addEventListener('abort', finish, { once: true })
      if (signal.aborted) finish()
    })
  }
}
