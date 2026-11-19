-- Run with the Supabase SQL editor. This migration is not executed by GitHub.
create table if not exists public.learner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  level text not null default 'A2' check (level in ('A2','B1','B2','C1')),
  daily_minutes integer not null default 15 check (daily_minutes in (5,15,30)),
  goal text not null default 'daily' check (goal in ('daily','work','exam')),
  explanation_language text not null default 'zh-en' check (explanation_language in ('zh-en','en','nl')),
  updated_at timestamptz not null default now()
);
create table if not exists public.learning_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  exercise_id integer not null,
  answer_nl text not null check (length(answer_nl) between 1 and 1500),
  created_at timestamptz not null default now()
);
create index if not exists submissions_owner_time_idx on public.learning_submissions(user_id, created_at desc);
create table if not exists public.ai_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_day date not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, usage_day)
);
alter table public.learner_profiles enable row level security;
alter table public.learning_submissions enable row level security;
alter table public.ai_daily_usage enable row level security;
revoke all on public.ai_daily_usage from anon, authenticated;
grant select, insert, update, delete on public.learner_profiles to authenticated;
grant select, insert, delete on public.learning_submissions to authenticated;
drop policy if exists profile_owner on public.learner_profiles;
create policy profile_owner on public.learner_profiles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists submission_owner on public.learning_submissions;
create policy submission_owner on public.learning_submissions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Quota function is callable with a real signed-in user's JWT; no arbitrary user ID input.
-- Serializable row update ensures two simultaneous calls cannot bypass a limit.
create or replace function public.claim_ai_daily_quota()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  who uuid := auth.uid();
  changed integer;
begin
  if who is null then
    return false;
  end if;
  insert into public.ai_daily_usage(user_id, usage_day, request_count)
  values (who, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, usage_day)
  do update set request_count = public.ai_daily_usage.request_count + 1
  where public.ai_daily_usage.request_count < 20;
  get diagnostics changed = row_count;
  return changed > 0;
end;
$$;
revoke all on function public.claim_ai_daily_quota() from public, anon;
grant execute on function public.claim_ai_daily_quota() to authenticated;
