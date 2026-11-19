-- Optimize owner checks: evaluate auth.uid once per statement where possible.
drop policy if exists profile_owner on public.learner_profiles;
create policy profile_owner on public.learner_profiles for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
drop policy if exists submission_owner on public.learning_submissions;
create policy submission_owner on public.learning_submissions for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
