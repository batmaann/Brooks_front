export type TransactionType = 'income' | 'expense' | 'saving'
export type TransactionSource = 'manual' | 'import' | 'api' | 'forge'
export type TransactionStatus = 'confirmed' | 'draft' | 'needs_review' | 'ignored'

export interface Category {
  id: number
  name: string
  description: string
  user?: number
  created_at?: string
  updated_at?: string
}

export interface BankLabel {
  id: number
  name: string
  description: string
  user?: number
  created_at?: string
  updated_at?: string
}

export interface Section {
  id: number
  name: string
  code: string
  app: string
  description: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface Transaction {
  id: number
  date: string
  transaction_type: TransactionType
  category: number | null
  category_name_snapshot: string
  amount: string
  currency: string
  bank_label: number | null
  bank_label_name_snapshot: string
  section: number | null
  description: string
  source: TransactionSource
  status: TransactionStatus
  user?: number
  created_at?: string
  updated_at?: string
}

export interface TransactionDraft {
  date: string
  transaction_type: TransactionType
  amount: number
  currency: string
  status: TransactionStatus
  description: string
  category: number | null
  bank_label: number | null
  section: number | null
}

export interface TransactionPayload {
  date: string
  transaction_type: TransactionType
  amount: number
  currency: string
  status: TransactionStatus
  description: string
  category: number | null
  bank_label: number | null
  section: number | null
  source?: TransactionSource
}

export type CategoryPayload = Pick<Category, 'name' | 'description'>
export type BankLabelPayload = Pick<BankLabel, 'name' | 'description'>

