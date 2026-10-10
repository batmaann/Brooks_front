import type { InjectionKey, Ref } from 'vue'

export const interfaceHelpKey: InjectionKey<Ref<boolean>> = Symbol('interfaceHelp')

export interface HelpTarget {
  id?: string
  related?: string
  text: string
  side: boolean
  content: boolean
  placement?: string
  left: number
  top: number
  width: number
  height: number
}
