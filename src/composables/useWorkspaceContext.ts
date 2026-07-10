import { inject, type InjectionKey, type Ref } from 'vue'
import type { useFinanceWorkspace } from '@/composables/useFinanceWorkspace'
import type { useFleetWorkspace } from '@/composables/useFleetWorkspace'
import type { useWorkspaceModals } from '@/composables/useWorkspaceModals'

type FinanceWorkspace = ReturnType<typeof useFinanceWorkspace>
type FleetWorkspace = ReturnType<typeof useFleetWorkspace>
type WorkspaceModals = ReturnType<typeof useWorkspaceModals>

export interface WorkspaceUiContext {
  dashboardControlsOpen: Ref<boolean>
  error: Ref<string>
  saving: Ref<boolean>
  search: Ref<string>
  transactionSearch: Ref<string>
}

export const financeWorkspaceKey: InjectionKey<FinanceWorkspace> = Symbol('financeWorkspace')
export const fleetWorkspaceKey: InjectionKey<FleetWorkspace> = Symbol('fleetWorkspace')
export const workspaceModalsKey: InjectionKey<WorkspaceModals> = Symbol('workspaceModals')
export const workspaceUiKey: InjectionKey<WorkspaceUiContext> = Symbol('workspaceUi')

function requireInjection<T>(value: T | undefined, name: string): T {
  if (!value) throw new Error(`${name} was not provided`)
  return value
}

export function useFinanceWorkspaceContext() {
  return requireInjection(inject(financeWorkspaceKey), 'financeWorkspace')
}

export function useFleetWorkspaceContext() {
  return requireInjection(inject(fleetWorkspaceKey), 'fleetWorkspace')
}

export function useWorkspaceModalsContext() {
  return requireInjection(inject(workspaceModalsKey), 'workspaceModals')
}

export function useWorkspaceUiContext() {
  return requireInjection(inject(workspaceUiKey), 'workspaceUi')
}
