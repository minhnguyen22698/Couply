-- Categories: per-user, seeded with 7 defaults on signup, otherwise user-managed.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null default '📦',
  sort_order int not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "manage_own_categories"
  on public.categories for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Expenses: single-user CRUD for now; sharing/visibility comes in Giai đoạn 4.
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  note text,
  spent_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index expenses_user_spent_on_idx on public.expenses (user_id, spent_on desc);

alter table public.expenses enable row level security;

create policy "manage_own_expenses"
  on public.expenses for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Shared by the signup trigger and the backfill below so both stay in sync.
create function public.seed_default_categories(target_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.categories (user_id, name, icon, sort_order, is_default)
  values
    (target_user_id, 'Ăn uống', '🍜', 1, true),
    (target_user_id, 'Di chuyển', '🚗', 2, true),
    (target_user_id, 'Nhà ở', '🏠', 3, true),
    (target_user_id, 'Mua sắm', '🛍️', 4, true),
    (target_user_id, 'Giải trí', '🎬', 5, true),
    (target_user_id, 'Sức khỏe', '💊', 6, true),
    (target_user_id, 'Khác', '📦', 7, true);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  perform public.seed_default_categories(new.id);

  return new;
end;
$$;

-- Backfill categories for profiles created before this migration existed.
do $$
declare
  p record;
begin
  for p in select id from public.profiles loop
    perform public.seed_default_categories(p.id);
  end loop;
end $$;
