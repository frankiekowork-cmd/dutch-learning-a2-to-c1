# Curriculum cloud sync: owner-scoped snapshot (development branch)

## Database
The connected Supabase project has `public.learner_curriculum_state` with one row per auth user, storing JSON objects for `drafts`, `studied`, `reviews`, plus updated timestamp.
RLS uses `(select auth.uid()) = user_id` with ownership checks for select/insert/update/delete; `anon` has no SELECT grant.
Schema: `supabase/migrations/202611190004_curriculum_cloud_state.sql`.

## Browser behavior
- The four new curriculum lesson drafts, acknowledged completion dates, and eight demo review question states remain local-first.
- Signed-in users can manually select **Upload local course progress** or **Download cloud course progress** in the curriculum section.
- Upload overwrites a prior server snapshot only after a second explicit prompt; it does not merge concurrent edits.
- Download overwrites the current browser account's curriculum state only after confirmation and makes a local backup at `dutch-learning-backup-<user-id>`.
- Sign-out and account switching change the per-account local storage namespace.
- No guest data is automatically uploaded to any newly signed-in account. No account can query other learners' rows if RLS is enforced.
- This implementation intentionally avoids claiming conflict-free or real-time multi-device sync.
- Never store secret/service-role API keys in the frontend.

## Known limitations and production gate
- True email authentication and cross-device operation still require two real test accounts; Playwright tests use a mocked Supabase client.
- A last-writer-wins full JSON snapshot can overwrite edits from another device; manual conflict prompts mitigate only some scenarios. Later versions should use per-item versioned sync / optimistic concurrency.
- The local backup is kept in browser storage and is not an independent secure backup. For privacy, local caches remain on shared browsers after sign-out.
- Server payload sizes are limited. Growing beyond sample lessons requires schema upgrades and pagination.
- Account deletion/data export, privacy policy, retention periods and secure AI grading still need implementation.
- GitHub Pages production is unchanged until the draft PR is reviewed and merged.
