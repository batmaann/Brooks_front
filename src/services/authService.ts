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

