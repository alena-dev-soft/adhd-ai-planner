-- ADH Planner: initial schema (CLAUDE.md section 5).
-- Tables, constraints, row level security and the sign-up trigger.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  time_zone     text not null default 'Asia/Ho_Chi_Minh',
  rollover_hour int  not null default 7
);

create table public.quotes (
  id     serial primary key,
  text   text not null,
  author text
);

create table public.weeks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  unique (user_id, week_start)
);

create table public.week_tasks (
  id      uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks (id) on delete cascade,
  slot    int  not null check (slot between 1 and 12),
  title   text,
  is_done boolean not null default false,
  unique (week_id, slot)
);

create table public.days (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  date        date not null,
  quote_id    int references public.quotes (id) on delete set null,
  notes       text,
  highlight   text,
  what_worked text,
  what_didnt  text,
  rating      int check (rating between 1 and 10),
  closed_at   timestamptz,
  unique (user_id, date)
);

create table public.day_tasks (
  id                  uuid primary key default gen_random_uuid(),
  day_id              uuid not null references public.days (id) on delete cascade,
  slot                int  not null check (slot between 1 and 5),
  title               text,
  target_pomodoros    int,
  completed_pomodoros int  not null default 0,
  is_done             boolean not null default false,
  feasibility         text check (feasibility in ('yes', 'warning', 'no')),
  feasibility_note    text,
  week_task_id        uuid null references public.week_tasks (id) on delete set null,
  unique (day_id, slot)
);

create index day_tasks_week_task_id_idx on public.day_tasks (week_task_id);
create index days_quote_id_idx on public.days (quote_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles   enable row level security;
alter table public.quotes     enable row level security;
alter table public.weeks      enable row level security;
alter table public.week_tasks enable row level security;
alter table public.days       enable row level security;
alter table public.day_tasks  enable row level security;

-- profiles: the row whose id is the current user
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (id = (select auth.uid()));

-- quotes: read-only for signed-in users
create policy "quotes_select_authenticated" on public.quotes
  for select to authenticated using (true);

-- weeks: owner only
create policy "weeks_select_own" on public.weeks
  for select to authenticated using (user_id = (select auth.uid()));
create policy "weeks_insert_own" on public.weeks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "weeks_update_own" on public.weeks
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "weeks_delete_own" on public.weeks
  for delete to authenticated using (user_id = (select auth.uid()));

-- days: owner only
create policy "days_select_own" on public.days
  for select to authenticated using (user_id = (select auth.uid()));
create policy "days_insert_own" on public.days
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "days_update_own" on public.days
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "days_delete_own" on public.days
  for delete to authenticated using (user_id = (select auth.uid()));

-- week_tasks: through the parent week
create policy "week_tasks_select_own" on public.week_tasks
  for select to authenticated using (
    exists (select 1 from public.weeks w
            where w.id = week_tasks.week_id and w.user_id = (select auth.uid())));
create policy "week_tasks_insert_own" on public.week_tasks
  for insert to authenticated with check (
    exists (select 1 from public.weeks w
            where w.id = week_tasks.week_id and w.user_id = (select auth.uid())));
create policy "week_tasks_update_own" on public.week_tasks
  for update to authenticated
  using (
    exists (select 1 from public.weeks w
            where w.id = week_tasks.week_id and w.user_id = (select auth.uid())))
  with check (
    exists (select 1 from public.weeks w
            where w.id = week_tasks.week_id and w.user_id = (select auth.uid())));
create policy "week_tasks_delete_own" on public.week_tasks
  for delete to authenticated using (
    exists (select 1 from public.weeks w
            where w.id = week_tasks.week_id and w.user_id = (select auth.uid())));

-- day_tasks: through the parent day; a linked week task must also be the user's
create policy "day_tasks_select_own" on public.day_tasks
  for select to authenticated using (
    exists (select 1 from public.days d
            where d.id = day_tasks.day_id and d.user_id = (select auth.uid())));
create policy "day_tasks_insert_own" on public.day_tasks
  for insert to authenticated with check (
    exists (select 1 from public.days d
            where d.id = day_tasks.day_id and d.user_id = (select auth.uid()))
    and (day_tasks.week_task_id is null or exists (
      select 1 from public.week_tasks wt join public.weeks w on w.id = wt.week_id
      where wt.id = day_tasks.week_task_id and w.user_id = (select auth.uid()))));
create policy "day_tasks_update_own" on public.day_tasks
  for update to authenticated
  using (
    exists (select 1 from public.days d
            where d.id = day_tasks.day_id and d.user_id = (select auth.uid())))
  with check (
    exists (select 1 from public.days d
            where d.id = day_tasks.day_id and d.user_id = (select auth.uid()))
    and (day_tasks.week_task_id is null or exists (
      select 1 from public.week_tasks wt join public.weeks w on w.id = wt.week_id
      where wt.id = day_tasks.week_task_id and w.user_id = (select auth.uid()))));
create policy "day_tasks_delete_own" on public.day_tasks
  for delete to authenticated using (
    exists (select 1 from public.days d
            where d.id = day_tasks.day_id and d.user_id = (select auth.uid())));

-- Signed-out (anon) clients get nothing.
revoke all on public.profiles, public.quotes, public.weeks, public.week_tasks,
              public.days, public.day_tasks from anon;
revoke all on sequence public.quotes_id_seq from anon;

-- ---------------------------------------------------------------------------
-- Sign-up trigger: create the profile row
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
