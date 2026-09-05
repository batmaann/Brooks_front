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

export type TransactionImportStatus = 'uploaded' | 'queued' | 'processing' | 'ready' | 'confirming' | 'confirmed' | 'failed' | 'cancelled'

export interface TransactionImport {
  id: string
  status: TransactionImportStatus
  original_filename: string
  file_format: string
  detected_bank: string
  total_rows: number
  created_rows: number
  duplicate_rows: number
  skipped_rows: number
  error: string
  confirmation_mode: 'detailed' | 'collapsed' | ''
  created_at: string
  completed_at: string | null
}

export interface TransactionImportItem {
  id: string
  transaction_import: string
  row_number: number
  date: string
  transaction_type: TransactionType
  amount: string
  currency: string
  description: string
  bank_category: string
  category_id: number | null
  bank_label_id: number | null
  category_reason: string
  duplicate_status: 'none' | 'exact' | 'possible'
  duplicate_transaction_id: number | null
  selected: boolean
}

export type MonthlySummaryDirection = 'up' | 'down' | 'same' | 'new'

export interface MonthlySummaryMetric {
  current: string
  previous: string
  change_percent: string | null
  direction: MonthlySummaryDirection
}

export interface MonthlySummary {
  period: {
    current: { date_from: string, date_to: string }
    previous: { date_from: string, date_to: string }
  }
  currency: string
  income: MonthlySummaryMetric
  expense: MonthlySummaryMetric
  saving: MonthlySummaryMetric
  total: MonthlySummaryMetric
}

export interface MonthlyBreakdownMetric {
  amount: string
  count: number
  share_percent: string
}

export interface MonthlyBreakdownTotals {
  income: Pick<MonthlyBreakdownMetric, 'amount' | 'count'>
  expense: Pick<MonthlyBreakdownMetric, 'amount' | 'count'>
  saving: Pick<MonthlyBreakdownMetric, 'amount' | 'count'>
}

export interface MonthlyBreakdownPeriod {
  year: number
  month: number
  date_from: string
  date_to: string
}

export interface MonthlyCategoryBreakdownItem {
  category_id: number | null
  category_name: string
  income: MonthlyBreakdownMetric
  expense: MonthlyBreakdownMetric
  saving: MonthlyBreakdownMetric
}

export interface MonthlyBankBreakdownItem {
  bank_label_id: number | null
  bank_label_name: string
  income: MonthlyBreakdownMetric
  expense: MonthlyBreakdownMetric
  saving: MonthlyBreakdownMetric
}

export interface MonthlyCategoryBreakdown {
  period: MonthlyBreakdownPeriod
  currency: string
  totals: MonthlyBreakdownTotals
  categories: MonthlyCategoryBreakdownItem[]
}

export interface MonthlyBankBreakdown {
  period: MonthlyBreakdownPeriod
  currency: string
  totals: MonthlyBreakdownTotals
  banks: MonthlyBankBreakdownItem[]
}

export type CategoryPayload = Pick<Category, 'name' | 'description'>
export type BankLabelPayload = Pick<BankLabel, 'name' | 'description'>
