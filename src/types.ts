import type { Tables, TablesInsert, TablesUpdate, Enums } from './db/database.types'

/**
 * Common pagination metadata returned in list endpoints.
 */
export interface PaginationMeta {
  total_count: number
  limit: number
  offset: number
}

/** Account DTOs & Commands */
export type AccountType = Enums<'account_type_enum'>

export type AccountDTO = Omit<
  Tables<'accounts'>,
  /* omit internal columns not exposed via API */ 'user_id' | 'deleted_at'
>

export type AccountCreateCommand = Pick<
  TablesInsert<'accounts'>,
  'name' | 'account_type'
>

export type AccountUpdateCommand = Partial<
  Pick<TablesUpdate<'accounts'>, 'name'>
>

/** Response type for account list endpoint */
export interface AccountListResponse {
  data: AccountDTO[]
  meta: PaginationMeta
}

/** Category DTOs & Commands */
export type CategoryDTO = Omit<Tables<'categories'>, 'user_id'>

export type CategoryCreateCommand = Pick<TablesInsert<'categories'>, 'name'>

export type CategoryUpdateCommand = Partial<
  Pick<TablesUpdate<'categories'>, 'name'>
>

export interface DeleteCategoryCommand {
  category_id: string
}

export interface BulkReassignCategoryCommand {
  from_category_id: string
  to_category_id: string
}

/** Transaction DTOs & Commands */
export type TransactionType = Enums<'transaction_type_enum'>

// Helper refs to embed related names
export type AccountNameRef = Pick<Tables<'accounts'>, 'name'>
export type CategoryNameRef = Pick<Tables<'categories'>, 'name'>

export type TransactionDTO = Omit<Tables<'transactions'>, 'user_id'> & {
  /** Embedded related account */
  accounts: AccountNameRef
  /** Embedded related category (can be null when category deleted) */
  categories: CategoryNameRef | null
}

export type TransactionCreateCommand = Pick<
  TablesInsert<'transactions'>,
  'amount_cents' | 'transaction_type' | 'description' | 'transaction_date' | 'account_id' | 'category_id'
>

export type TransactionUpdateCommand = Partial<
  Pick<TablesUpdate<'transactions'>, 'amount_cents' | 'description' | 'category_id' | 'transaction_type' | 'transaction_date' | 'account_id'>
>

export interface DeleteTransactionCommand {
  transaction_id: string
}

/** Response type for transaction list endpoint */
export interface TransactionListResponse {
  data: TransactionDTO[]
  meta: PaginationMeta
}

/** AI Suggestion DTOs & Commands */
export interface AISuggestionDTO {
  id: string
  transaction_id: string
  suggested_category_id: string
  confidence_score: number
  approved: boolean | null
  created_at: string
  /** Embedded category name for convenience */
  categories: CategoryNameRef
}

export interface RequestAISuggestionCommand {
  transaction_id: string
}

export interface HandleAISuggestionCommand {
  suggestion_id: string
  approved: boolean
}

/** Dashboard summaries */
export interface SummaryCommand {
  start_date: string // ISO timestamp
  end_date: string // ISO timestamp
}

export interface SummaryDTO {
  total_cents: number
  transaction_count: number
  period_start: string
  period_end: string
}