-- Couples: pairing between two users via a 6-digit invite code.
-- All writes go through the security-definer RPCs below, so the table has
-- only a SELECT policy — no insert/update/delete policy is needed for
-- regular roles.
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references auth.users (id) on delete cascade,
  user_b_id uuid references auth.users (id) on delete cascade,
  invite_code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'active', 'inactive')),
  created_at timestamptz not null default now()
);

alter table public.couples enable row level security;

create policy "select_own_couple"
  on public.couples for select
  using (user_a_id = auth.uid() or user_b_id = auth.uid());

-- Returns the caller's pending invite code, creating one if none exists.
create or replace function public.create_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_attempts int := 0;
begin
  if exists (
    select 1 from public.couples
    where status = 'active' and (user_a_id = auth.uid() or user_b_id = auth.uid())
  ) then
    raise exception 'already_paired';
  end if;

  select c.invite_code into v_code
  from public.couples c
  where c.user_a_id = auth.uid() and c.status = 'pending';

  if v_code is not null then
    return v_code;
  end if;

  loop
    v_code := lpad(floor(random() * 1000000)::text, 6, '0');
    begin
      insert into public.couples (user_a_id, invite_code, status)
      values (auth.uid(), v_code, 'pending');
      exit;
    exception when unique_violation then
      v_attempts := v_attempts + 1;
      if v_attempts > 10 then
        raise exception 'Could not generate a unique invite code';
      end if;
    end;
  end loop;

  return v_code;
end;
$$;

-- Joins the caller to the couple identified by an invite code.
create or replace function public.join_couple(p_invite_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple record;
begin
  if exists (
    select 1 from public.couples
    where status = 'active' and (user_a_id = auth.uid() or user_b_id = auth.uid())
  ) then
    raise exception 'already_paired';
  end if;

  select * into v_couple
  from public.couples
  where invite_code = p_invite_code and status = 'pending'
  for update;

  if not found then
    raise exception 'invalid_code';
  end if;

  if v_couple.user_a_id = auth.uid() then
    raise exception 'cannot_join_own_invite';
  end if;

  update public.couples
  set user_b_id = auth.uid(), status = 'active'
  where id = v_couple.id;
end;
$$;

-- Deactivates the caller's active couple. History (expenses, couple_id) is kept,
-- just no longer surfaced via the active-couple RLS checks.
create or replace function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.couples
  set status = 'inactive'
  where status = 'active' and (user_a_id = auth.uid() or user_b_id = auth.uid());
end;
$$;

grant execute on function public.create_invite() to authenticated;
grant execute on function public.join_couple(text) to authenticated;
grant execute on function public.leave_couple() to authenticated;

-- Expenses: add sharing. `visibility` controls whether a partner can see the
-- row at all; `couple_id` scopes it to a specific pairing.
alter table public.expenses
  add column visibility text not null default 'private' check (visibility in ('private', 'shared', 'fund')),
  add column couple_id uuid references public.couples (id) on delete set null;

create index expenses_couple_visibility_idx on public.expenses (couple_id, visibility);

drop policy "manage_own_expenses" on public.expenses;

create policy "select_own_or_shared_expenses"
  on public.expenses for select
  using (
    user_id = auth.uid()
    or (
      visibility <> 'private'
      and couple_id in (
        select id from public.couples
        where status = 'active'
        and (user_a_id = auth.uid() or user_b_id = auth.uid())
      )
    )
  );

create policy "insert_own_expenses"
  on public.expenses for insert
  with check (user_id = auth.uid());

create policy "update_own_expenses"
  on public.expenses for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "delete_own_expenses"
  on public.expenses for delete
  using (user_id = auth.uid());

-- Let each half of an active couple see the other's profile (display name,
-- for labeling shared expenses in the "Chúng ta" tab).
create policy "select_partner_profile"
  on public.profiles for select
  using (
    id in (
      select case when user_a_id = auth.uid() then user_b_id else user_a_id end
      from public.couples
      where status = 'active'
      and (user_a_id = auth.uid() or user_b_id = auth.uid())
    )
  );
