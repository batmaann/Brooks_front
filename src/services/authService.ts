import { api } from '@/api'

interface AuthResponse {
  token: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload extends LoginPayload {
  phone: string
  email: string
}

export function login(payload: LoginPayload) {
  return api<AuthResponse>('/user/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function register(payload: RegisterPayload) {
  return api<AuthResponse>('/user/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function requestPasswordReset(email: string) {
  return api<{ detail: string }>('/user/password-reset/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export interface PasswordResetPayload {
  uid: string
  token: string
  new_password: string
}

export function confirmPasswordReset(payload: PasswordResetPayload) {
  return api<{ detail: string }>('/user/password-reset/confirm/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
