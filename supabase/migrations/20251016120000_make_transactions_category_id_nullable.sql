--
-- Migration: Make transactions.category_id optional (nullable)
-- Idempotent: Yes (only alters column if currently NOT NULL)
-- Source of truth: .ai/db-plan.md
--

do $$
begin
    if exists (
        select 1
        from information_schema.columns c
        where c.table_schema = 'public'
          and c.table_name = 'transactions'
          and c.column_name = 'category_id'
          and c.is_nullable = 'NO'
    ) then
        alter table public.transactions
            alter column category_id drop not null;
    end if;
end $$;


