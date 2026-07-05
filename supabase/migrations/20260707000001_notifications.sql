-- Notifications: rows are created by the expense server action (not a DB
-- trigger), so the "notify partner" toggle in the UI can skip creating a
-- row per-request without needing extra columns on `expenses`.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null default 'expense_shared',
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "select_own_notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "update_own_notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Lets a user create a notification only for their own active partner,
-- not for arbitrary users.
create policy "insert_partner_notification"
  on public.notifications for insert
  with check (
    user_id in (
      select case when user_a_id = auth.uid() then user_b_id else user_a_id end
      from public.couples
      where status = 'active' and (user_a_id = auth.uid() or user_b_id = auth.uid())
    )
  );

alter publication supabase_realtime add table public.notifications;
