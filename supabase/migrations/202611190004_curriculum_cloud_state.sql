-- Per-account cloud snapshot for reviewed lesson samples; explicit upload/restore only.
create table if not exists public.learner_curriculum_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  drafts jsonb not null default '{}'::jsonb
    check (jsonb_typeof(drafts) = 'object' and octet_length(drafts::text) <= 60000),
  studied jsonb not null default '{}'::jsonb
    check (jsonb_typeof(studied) = 'object' and octet_length(studied::text) <= 12000),
  reviews jsonb not null default '{}'::jsonb
    check (jsonb_typeof(reviews) = 'object' and octet_length(reviews::text) <= 36000),
  updated_at timestamptz not null default now()
);
alter table public.learner_curriculum_state enable row level security;
revoke all on public.learner_curriculum_state from anon;
grant select, insert, update, delete on public.learner_curriculum_state to authenticated;
drop policy if exists curriculum_state_owner on public.learner_curriculum_state;
create policy curriculum_state_owner on public.learner_curriculum_state
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
