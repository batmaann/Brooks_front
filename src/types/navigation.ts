import type { Component } from 'vue'

export type AppView = 'dashboard' | 'refuelings'
export type FutureView = 'savings' | 'investments' | 'utilities' | 'business' | 'cryptocurrency'

export interface NavItem {
  id: AppView | FutureView
  label: string
  icon: Component
  disabled: boolean
}
