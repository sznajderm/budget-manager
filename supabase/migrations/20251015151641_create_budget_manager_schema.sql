--
-- Budget Manager Database Schema Migration
--
-- Purpose: Creates the complete database schema for the budget manager application
-- Affected Objects: 
--   - Custom types: account_type_enum, transaction_type_enum, money_cents domain
--   - Tables: accounts, categories, transactions, ai_suggestions
--   - Indexes: Performance indexes for common queries
--   - Row Level Security: Comprehensive RLS policies for data isolation
--
-- Design Features:
--   - Soft delete strategy for accounts to preserve transaction history
--   - Monetary amounts stored as integers in cents to avoid floating-point precision issues
--   - User data isolation through RLS policies
--   - Comprehensive indexing for optimal query performance
--
-- Generated: 2025-10-15 15:16:41 UTC
--

begin;

-- ============================================================================
-- 1. CUSTOM TYPES AND DOMAINS
-- ============================================================================

-- account type enumeration for categorizing different types of financial accounts
create type account_type_enum as enum (
    'checking',
    'savings', 
    'credit_card',
    'cash',
    'investment'
);
comment on type account_type_enum is 'enumeration of supported account types for financial accounts';

-- transaction type enumeration to distinguish between money coming in vs going out
create type transaction_type_enum as enum (
    'expense',
    'income'
);
comment on type transaction_type_enum is 'enumeration to categorize transactions as income or expense';

-- domain for monetary amounts stored as cents to avoid floating-point precision issues
-- supports amounts up to $999,999.99 (99,999,999 cents)
create domain money_cents as integer
    check (value >= 0 and value <= 99999999);
comment on domain money_cents is 'monetary amounts stored as integer cents, range 0 to $999,999.99';

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- accounts table: user financial accounts with soft delete support
create table accounts (
    -- primary identifier
    id uuid primary key default gen_random_uuid(),
    
    -- user ownership - cascade delete when user is removed
    user_id uuid not null references auth.users(id) on delete cascade,
    
    -- account details
    name text not null,
    account_type account_type_enum not null,
    
    -- audit timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    
    -- soft delete support - null means active, timestamp means deleted
    deleted_at timestamptz null,
    
    -- constraints
    constraint accounts_name_not_empty check (length(trim(name)) > 0)
);

comment on table accounts is 'user financial accounts with soft delete capability';
comment on column accounts.id is 'unique identifier for the account';
comment on column accounts.user_id is 'references the owning user from supabase auth.users';
comment on column accounts.name is 'user-defined name for the account (e.g., "Chase Checking")';
comment on column accounts.account_type is 'type of account from account_type_enum';
comment on column accounts.created_at is 'timestamp when account was first created';
comment on column accounts.updated_at is 'timestamp when account was last modified';
comment on column accounts.deleted_at is 'soft delete timestamp - null means active, non-null means deleted';

-- categories table: transaction categories with user scope
create table categories (
    -- primary identifier
    id uuid primary key default gen_random_uuid(),
    
    -- user ownership - cascade delete when user is removed
    user_id uuid not null references auth.users(id) on delete cascade,
    
    -- category details
    name text not null,
    
    -- audit timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    
    -- constraints
    constraint categories_name_not_empty check (length(trim(name)) > 0)
);

comment on table categories is 'transaction categories scoped to individual users';
comment on column categories.id is 'unique identifier for the category';
comment on column categories.user_id is 'references the owning user from supabase auth.users';
comment on column categories.name is 'user-defined category name (case-insensitive unique per user)';
comment on column categories.created_at is 'timestamp when category was first created';
comment on column categories.updated_at is 'timestamp when category was last modified';

-- transactions table: core transaction records
create table transactions (
    -- primary identifier
    id uuid primary key default gen_random_uuid(),
    
    -- ownership and relationships
    user_id uuid not null references auth.users(id) on delete cascade,
    account_id uuid not null references accounts(id) on delete cascade,
    category_id uuid not null references categories(id) on delete restrict,
    
    -- transaction details
    amount_cents money_cents not null,
    transaction_type transaction_type_enum not null,
    description text not null,
    transaction_date timestamptz not null,
    
    -- audit timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    
    -- constraints
    constraint transactions_description_not_empty check (length(trim(description)) > 0),
    constraint transactions_user_owns_account check (
        not exists (
            select 1 from accounts a 
            where a.id = account_id and a.user_id != transactions.user_id
        )
    ),
    constraint transactions_user_owns_category check (
        not exists (
            select 1 from categories c 
            where c.id = category_id and c.user_id != transactions.user_id
        )
    )
);

comment on table transactions is 'core transaction records with user ownership validation';
comment on column transactions.id is 'unique identifier for the transaction';
comment on column transactions.user_id is 'references the owning user from supabase auth.users';
comment on column transactions.account_id is 'references the account this transaction belongs to';
comment on column transactions.category_id is 'references the category for this transaction';
comment on column transactions.amount_cents is 'transaction amount in cents (positive integer)';
comment on column transactions.transaction_type is 'whether this is income or expense';
comment on column transactions.description is 'user-provided description of the transaction';
comment on column transactions.transaction_date is 'when the transaction occurred';
comment on column transactions.created_at is 'timestamp when transaction record was created';
comment on column transactions.updated_at is 'timestamp when transaction was last modified';

-- ai_suggestions table: ai category suggestions with approval workflow
create table ai_suggestions (
    -- primary identifier
    id uuid primary key default gen_random_uuid(),
    
    -- relationships
    transaction_id uuid not null references transactions(id) on delete cascade,
    suggested_category_id uuid not null references categories(id) on delete cascade,
    
    -- ai suggestion details
    confidence_score numeric(4,3) not null,
    approved boolean null, -- null = pending, true = approved, false = rejected
    
    -- audit timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    
    -- constraints
    constraint ai_suggestions_confidence_range check (confidence_score >= 0.000 and confidence_score <= 1.000),
    constraint ai_suggestions_unique_per_transaction unique (transaction_id)
);

comment on table ai_suggestions is 'ai-generated category suggestions with approval workflow tracking';
comment on column ai_suggestions.id is 'unique identifier for the suggestion';
comment on column ai_suggestions.transaction_id is 'references the transaction this suggestion applies to';
comment on column ai_suggestions.suggested_category_id is 'references the ai-suggested category';
comment on column ai_suggestions.confidence_score is 'ai confidence score between 0.000 and 1.000';
comment on column ai_suggestions.approved is 'approval status: null=pending, true=approved, false=rejected';
comment on column ai_suggestions.created_at is 'timestamp when suggestion was generated';
comment on column ai_suggestions.updated_at is 'timestamp when suggestion was last modified';

-- ============================================================================
-- 3. PERFORMANCE INDEXES
-- ============================================================================

-- accounts indexes for common query patterns
create index idx_accounts_user_created on accounts (user_id, created_at desc);
comment on index idx_accounts_user_created is 'optimizes user account listing ordered by creation date';

create index idx_accounts_user_not_deleted on accounts (user_id) where deleted_at is null;
comment on index idx_accounts_user_not_deleted is 'optimizes queries for active accounts only';

-- categories indexes
create index idx_categories_user_created on categories (user_id, created_at desc);
comment on index idx_categories_user_created is 'optimizes user category listing ordered by creation date';

create unique index idx_categories_unique_name_per_user on categories (user_id, lower(name));
comment on index idx_categories_unique_name_per_user is 'enforces case-insensitive unique category names per user';

-- transactions indexes for dashboard and reporting queries
create index idx_transactions_user_created on transactions (user_id, created_at desc);
comment on index idx_transactions_user_created is 'optimizes user transaction listing ordered by creation date';

create index idx_transactions_user_account_created on transactions (user_id, account_id, created_at desc);
comment on index idx_transactions_user_account_created is 'optimizes account-specific transaction queries';

create index idx_transactions_account_date on transactions (account_id, transaction_date desc);
comment on index idx_transactions_account_date is 'optimizes account balance calculations and transaction history';

create index idx_transactions_category on transactions (category_id);
comment on index idx_transactions_category is 'optimizes category-based reporting and analytics';

-- ai_suggestions indexes
create index idx_ai_suggestions_transaction on ai_suggestions (transaction_id);
comment on index idx_ai_suggestions_transaction is 'optimizes transaction suggestion lookups';

create index idx_ai_suggestions_category on ai_suggestions (suggested_category_id);
comment on index idx_ai_suggestions_category is 'optimizes category suggestion analytics';

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- enable rls on all user data tables
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table ai_suggestions enable row level security;

-- ============================================================================
-- 4a. ACCOUNTS RLS POLICIES
-- ============================================================================

-- accounts select policy for authenticated users - can only see their own accounts
create policy accounts_select_authenticated on accounts
    for select 
    to authenticated 
    using (auth.uid() = user_id);

-- accounts select policy for anonymous users - no access
create policy accounts_select_anon on accounts
    for select 
    to anon 
    using (false);

-- accounts insert policy for authenticated users - can only create their own accounts
create policy accounts_insert_authenticated on accounts
    for insert 
    to authenticated 
    with check (auth.uid() = user_id);

-- accounts insert policy for anonymous users - no access
create policy accounts_insert_anon on accounts
    for insert 
    to anon 
    with check (false);

-- accounts update policy for authenticated users - can only update their own accounts
create policy accounts_update_authenticated on accounts
    for update 
    to authenticated 
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- accounts update policy for anonymous users - no access
create policy accounts_update_anon on accounts
    for update 
    to anon 
    using (false);

-- accounts delete policy for authenticated users - can only delete their own accounts
create policy accounts_delete_authenticated on accounts
    for delete 
    to authenticated 
    using (auth.uid() = user_id);

-- accounts delete policy for anonymous users - no access
create policy accounts_delete_anon on accounts
    for delete 
    to anon 
    using (false);

-- ============================================================================
-- 4b. CATEGORIES RLS POLICIES
-- ============================================================================

-- categories select policy for authenticated users - can only see their own categories
create policy categories_select_authenticated on categories
    for select 
    to authenticated 
    using (auth.uid() = user_id);

-- categories select policy for anonymous users - no access
create policy categories_select_anon on categories
    for select 
    to anon 
    using (false);

-- categories insert policy for authenticated users - can only create their own categories
create policy categories_insert_authenticated on categories
    for insert 
    to authenticated 
    with check (auth.uid() = user_id);

-- categories insert policy for anonymous users - no access
create policy categories_insert_anon on categories
    for insert 
    to anon 
    with check (false);

-- categories update policy for authenticated users - can only update their own categories
create policy categories_update_authenticated on categories
    for update 
    to authenticated 
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- categories update policy for anonymous users - no access
create policy categories_update_anon on categories
    for update 
    to anon 
    using (false);

-- categories delete policy for authenticated users - can only delete their own categories
create policy categories_delete_authenticated on categories
    for delete 
    to authenticated 
    using (auth.uid() = user_id);

-- categories delete policy for anonymous users - no access
create policy categories_delete_anon on categories
    for delete 
    to anon 
    using (false);

-- ============================================================================
-- 4c. TRANSACTIONS RLS POLICIES
-- ============================================================================

-- transactions select policy for authenticated users - can only see their own transactions
create policy transactions_select_authenticated on transactions
    for select 
    to authenticated 
    using (auth.uid() = user_id);

-- transactions select policy for anonymous users - no access
create policy transactions_select_anon on transactions
    for select 
    to anon 
    using (false);

-- transactions insert policy for authenticated users - can only create their own transactions
create policy transactions_insert_authenticated on transactions
    for insert 
    to authenticated 
    with check (auth.uid() = user_id);

-- transactions insert policy for anonymous users - no access
create policy transactions_insert_anon on transactions
    for insert 
    to anon 
    with check (false);

-- transactions update policy for authenticated users - can only update their own transactions
create policy transactions_update_authenticated on transactions
    for update 
    to authenticated 
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- transactions update policy for anonymous users - no access
create policy transactions_update_anon on transactions
    for update 
    to anon 
    using (false);

-- transactions delete policy for authenticated users - can only delete their own transactions
create policy transactions_delete_authenticated on transactions
    for delete 
    to authenticated 
    using (auth.uid() = user_id);

-- transactions delete policy for anonymous users - no access
create policy transactions_delete_anon on transactions
    for delete 
    to anon 
    using (false);

-- ============================================================================
-- 4d. AI_SUGGESTIONS RLS POLICIES
-- ============================================================================

-- ai_suggestions select policy for authenticated users - can see suggestions for their own transactions
create policy ai_suggestions_select_authenticated on ai_suggestions
    for select 
    to authenticated 
    using (
        exists (
            select 1 from transactions t 
            where t.id = ai_suggestions.transaction_id 
            and t.user_id = auth.uid()
        )
    );

-- ai_suggestions select policy for anonymous users - no access
create policy ai_suggestions_select_anon on ai_suggestions
    for select 
    to anon 
    using (false);

-- ai_suggestions insert policy for authenticated users - can create suggestions for their own transactions
create policy ai_suggestions_insert_authenticated on ai_suggestions
    for insert 
    to authenticated 
    with check (
        exists (
            select 1 from transactions t 
            where t.id = ai_suggestions.transaction_id 
            and t.user_id = auth.uid()
        )
    );

-- ai_suggestions insert policy for anonymous users - no access
create policy ai_suggestions_insert_anon on ai_suggestions
    for insert 
    to anon 
    with check (false);

-- ai_suggestions update policy for authenticated users - can update suggestions for their own transactions
create policy ai_suggestions_update_authenticated on ai_suggestions
    for update 
    to authenticated 
    using (
        exists (
            select 1 from transactions t 
            where t.id = ai_suggestions.transaction_id 
            and t.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from transactions t 
            where t.id = ai_suggestions.transaction_id 
            and t.user_id = auth.uid()
        )
    );

-- ai_suggestions update policy for anonymous users - no access
create policy ai_suggestions_update_anon on ai_suggestions
    for update 
    to anon 
    using (false);

-- ai_suggestions delete policy for authenticated users - can delete suggestions for their own transactions
create policy ai_suggestions_delete_authenticated on ai_suggestions
    for delete 
    to authenticated 
    using (
        exists (
            select 1 from transactions t 
            where t.id = ai_suggestions.transaction_id 
            and t.user_id = auth.uid()
        )
    );

-- ai_suggestions delete policy for anonymous users - no access
create policy ai_suggestions_delete_anon on ai_suggestions
    for delete 
    to anon 
    using (false);

commit;