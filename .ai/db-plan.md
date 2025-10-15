# BudgetManager Database Schema

## 1. Custom Types and Domains

```sql
-- ENUM types for categorical data
CREATE TYPE account_type_enum AS ENUM (
    'checking',
    'savings', 
    'credit_card',
    'cash',
    'investment'
);

CREATE TYPE transaction_type_enum AS ENUM (
    'expense',
    'income'
);

-- Domain for monetary amounts (in cents, max $999,999.99)
CREATE DOMAIN money_cents AS INTEGER
    CHECK (VALUE >= 0 AND VALUE <= 99999999);
```

## 2. Tables

### users

This table is managed by Supabase Auth

```
- id: UUID PRIMARY KEY
- email: VARCHAR(255) NOT NULL UNIQUE
- encrypted_password: VARCHAR NOT NULL
- created_at: TIMESTAMPZ NOT NULL DEFAULT now()
- confirmed_at: TIMESTAMPZ
```

### accounts
User financial accounts with soft delete support.

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_type account_type_enum NOT NULL,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT accounts_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);
```

### categories  
Transaction categories with predefined and custom user categories.

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT categories_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT categories_unique_name_per_user UNIQUE (user_id, LOWER(name))
);
```

### transactions
Core transaction records with integer amounts in cents.

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    amount_cents money_cents NOT NULL,
    transaction_type transaction_type_enum NOT NULL,
    description TEXT NOT NULL,
    transaction_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT transactions_description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
    CONSTRAINT transactions_user_owns_account CHECK (
        NOT EXISTS (
            SELECT 1 FROM accounts a 
            WHERE a.id = account_id AND a.user_id != transactions.user_id
        )
    ),
    CONSTRAINT transactions_user_owns_category CHECK (
        NOT EXISTS (
            SELECT 1 FROM categories c 
            WHERE c.id = category_id AND c.user_id != transactions.user_id
        )
    )
);
```

### ai_suggestions
AI category suggestions with approval workflow tracking.

```sql
CREATE TABLE ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    suggested_category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    confidence_score NUMERIC(4,3) NOT NULL,
    approved BOOLEAN NULL, -- NULL = pending, TRUE = approved, FALSE = rejected
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT ai_suggestions_confidence_range CHECK (confidence_score >= 0.000 AND confidence_score <= 1.000),
    CONSTRAINT ai_suggestions_unique_per_transaction UNIQUE (transaction_id)
);
```

## 3. Relationships

### Entity Relationship Overview
- **Users** (auth.users) ← One-to-Many → **Accounts** (user's financial accounts)
- **Users** (auth.users) ← One-to-Many → **Categories** (user-scoped categories)
- **Accounts** ← One-to-Many → **Transactions** (transactions belong to accounts)
- **Categories** ← One-to-Many → **Transactions** (transactions have categories)
- **Users** (auth.users) ← One-to-Many → **Transactions** (user owns transactions)
- **Transactions** ← One-to-One → **AI_Suggestions** (optional AI suggestions)
- **Categories** ← One-to-Many → **AI_Suggestions** (suggested categories)

### Key Constraints
- All user data tables include `user_id` foreign key to `auth.users(id)` with CASCADE DELETE
- Accounts use soft delete (`deleted_at` timestamp) to preserve transaction history
- Categories cannot be deleted if referenced by transactions (RESTRICT)
- Cross-table user ownership enforced via CHECK constraints
- AI suggestions maintain one-to-one relationship with transactions

## 4. Indexes

```sql
-- Performance indexes for common queries
CREATE INDEX idx_accounts_user_created ON accounts (user_id, created_at DESC);
CREATE INDEX idx_accounts_user_not_deleted ON accounts (user_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_categories_user_created ON categories (user_id, created_at DESC);

CREATE INDEX idx_transactions_user_created ON transactions (user_id, created_at DESC);
CREATE INDEX idx_transactions_user_account_created ON transactions (user_id, account_id, created_at DESC);
CREATE INDEX idx_transactions_account_date ON transactions (account_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions (category_id);

CREATE INDEX idx_ai_suggestions_transaction ON ai_suggestions (transaction_id);
CREATE INDEX idx_ai_suggestions_category ON ai_suggestions (suggested_category_id);
```

## 5. Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all user data tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;


-- Accounts policies  
CREATE POLICY accounts_user_access ON accounts
    FOR ALL USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY categories_user_access ON categories
    FOR ALL USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY transactions_user_access ON transactions
    FOR ALL USING (auth.uid() = user_id);

-- AI suggestions policies (through transaction ownership)
CREATE POLICY ai_suggestions_user_access ON ai_suggestions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM transactions t 
            WHERE t.id = ai_suggestions.transaction_id 
            AND t.user_id = auth.uid()
        )
    );
```

## 6. Additional Notes

### Design Decisions

**Monetary Storage**: Amounts stored as integers in cents to avoid floating-point precision issues. The `money_cents` domain enforces a maximum of $999,999.99 per transaction.

**No Stored Balances**: Account balances calculated dynamically from transaction sums rather than stored values, ensuring data consistency and eliminating sync issues.

**Transaction Types**: Uses ENUM field (`transaction_type`) instead of positive/negative amounts for clearer data semantics and better validation.

**Soft Delete Strategy**: Accounts use soft delete (`deleted_at`) with CASCADE DELETE to preserve transaction history while allowing data recovery.

**AI Suggestions Separation**: AI categorization data stored in separate table to preserve suggestion history, enable accuracy metrics, and maintain clean transaction records.

**User Ownership**: All tables include user scoping with RLS policies ensuring users can only access their own data. CHECK constraints prevent cross-user data references.

**Category Management**: Predefined categories will be auto-provisioned for new users via application logic. Unique constraint prevents case-insensitive duplicates.

**Indexing Strategy**: Composite indexes optimize common dashboard queries and transaction listing. Partial indexes handle soft-deleted records efficiently.

### Supabase Considerations

- Leverages Supabase's built-in `auth.users` table for authentication
- RLS policies integrate with Supabase's `auth.uid()` function
- All tables designed to work with Supabase's automatic API generation
- Foreign key constraints ensure referential integrity at database level
- TIMESTAMPTZ types handle timezone considerations automatically

### Predefined Categories

The application should create 15-20 standard categories for new users, covering common expense types (groceries, utilities, transportation, entertainment) and income types (salary, freelance, investment returns).