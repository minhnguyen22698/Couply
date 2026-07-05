-- Budgets: per-user, per-category, per-month spending limits.
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  month date not null,
  amount numeric(14, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

alter table public.budgets enable row level security;

create policy "manage_own_budgets"
  on public.budgets for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
