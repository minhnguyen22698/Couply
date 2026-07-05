-- Shared fund: one per couple. Balance is computed client-side as
-- sum(fund_contributions) minus sum(expenses where visibility = 'fund' and
-- couple_id = this couple) — contributions top it up, 'fund'-visibility
-- expenses spend it down.
create table public.shared_funds (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null unique references public.couples (id) on delete cascade,
  goal_amount numeric(14, 2),
  created_at timestamptz not null default now()
);

alter table public.shared_funds enable row level security;

create policy "select_own_fund"
  on public.shared_funds for select
  using (
    couple_id in (
      select id from public.couples
      where status = 'active' and (user_a_id = auth.uid() or user_b_id = auth.uid())
    )
  );

create policy "insert_own_fund"
  on public.shared_funds for insert
  with check (
    couple_id in (
      select id from public.couples
      where status = 'active' and (user_a_id = auth.uid() or user_b_id = auth.uid())
    )
  );

create policy "update_own_fund"
  on public.shared_funds for update
  using (
    couple_id in (
      select id from public.couples
      where status = 'active' and (user_a_id = auth.uid() or user_b_id = auth.uid())
    )
  )
  with check (
    couple_id in (
      select id from public.couples
      where status = 'active' and (user_a_id = auth.uid() or user_b_id = auth.uid())
    )
  );

create table public.fund_contributions (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.shared_funds (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

create index fund_contributions_fund_idx on public.fund_contributions (fund_id, created_at desc);

alter table public.fund_contributions enable row level security;

create policy "select_own_fund_contributions"
  on public.fund_contributions for select
  using (
    fund_id in (
      select id from public.shared_funds
      where couple_id in (
        select id from public.couples
        where status = 'active' and (user_a_id = auth.uid() or user_b_id = auth.uid())
      )
    )
  );

create policy "insert_own_fund_contribution"
  on public.fund_contributions for insert
  with check (
    user_id = auth.uid()
    and fund_id in (
      select id from public.shared_funds
      where couple_id in (
        select id from public.couples
        where status = 'active' and (user_a_id = auth.uid() or user_b_id = auth.uid())
      )
    )
  );
