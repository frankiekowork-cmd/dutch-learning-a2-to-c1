# AI tutor activation gate — NOT DEPLOYED

## Implemented in the draft branch (19 November 2026)
- Day 32 demo exercises (12) have a canonical server-side answer/question map; new A2–C1 sample writing exercises are **not yet graded by AI**.
- Edge Function `supabase/functions/ai-tutor/index.ts` validates an actual Supabase JWT through `getUser(jwt)` and rejects unexpected web origins.
- OpenAI Responses API with Structured Outputs returns a structured Dutch correction or Dutch/English/Traditional-Chinese explanation.
- The server-only `public.consume_ai_quota(user_id)` RPC is **SECURITY INVOKER**, restricted to `service_role` EXECUTE. Its atomic upsert limits each account to 20 attempted requests per UTC day.
- The web client calls a Supabase Edge Function through a signed-in session and **never contains an OpenAI API secret**.
- The demo grading and tutor question buttons have an explicit `ENABLED=false` release gate; users cannot call the untested backend through the UI.
- The legacy elevated privilege function `public.claim_ai_daily_quota()` is not executable by signed-in or anonymous users.

## Before activation
1. Validate real Supabase authentication and verify cross-account RLS using two consenting test users. Existing Playwright tests simulate auth.
2. Add and securely configure `OPENAI_API_KEY` in Supabase Edge Function secrets — **never share the key via chat, public web client or GitHub.** Configure `OPENAI_MODEL` to a verified Structured Outputs-capable model.
3. Confirm `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are present in the Edge Function environment. The service key must NEVER be exposed to the browser.
4. Set `ALLOWED_ORIGIN=https://frankiekowork-cmd.github.io` for GitHub Pages. This is a scheme+host origin with **no repository path or trailing slash**. Reconfigure for a distinct preview origin if needed.
5. Configure OpenAI project spend controls and operational alerts, and guard against abuse by newly registered accounts. The per-user quota is **not** a global spending cap.
6. Add privacy notice and lawful handling of learner texts passed to an external AI provider, account deletion/export, retention, monitoring, and incident response.
7. Deploy Edge Function with JWT verification enabled where supported; test an invalid JWT, unauthenticated caller, unapproved origin, malformed JSON, invalid lesson, exhausted quota, upstream failure, and acceptable Dutch variants.
8. Validate strict Structured Outputs decoding and ensure no learner-submitted instructions can override system instructions. Run a live grading quality sample with native review.
9. Only after all checks pass, change the explicit `ENABLED` flag in `web/ai-ui.js`, merge PR, and retest production.

## API contract
Authenticated POST `/functions/v1/ai-tutor`.
- Grade: `{"mode":"grade","level":"A2","exercise_id":1,"answer_nl":"De winkel die ik zoek, is dichtbij."}`
- Ask: `{"mode":"ask","level":"B1","question":"Waarom staat het werkwoord achteraan na omdat?"}`
- The AI response is `{"mode":"grade"|"ask","feedback":{...}}` using the schema in `index.ts`.

## Security limitations
- Only 12 original Day 32 exercises are currently supported by the server grading map. Browser content for other A2–C1 examples is not a trusted grading source.
- There is currently no public AI service and no tested connection to an OpenAI billable account.
- The server checks identity via Supabase Auth. User ID in quota RPC is only passed after verification, not read from untrusted request body.
- API outputs may be inaccurate; accepted alternative Dutch sentences require quality assessment.
- Atomic daily quota counts failures as consumed; only validated requests reach the quota call.
- CORS is **not** authentication and will not stop malicious non-browser scripts. Supabase Auth and budget/rate protections are required.
- The backend has not yet been tested on Supabase Edge runtime. Do not represent the scaffold as a live deployed service.

## Official references
- https://supabase.com/docs/guides/functions/auth
- https://supabase.com/docs/guides/getting-started/api-keys
- https://developers.openai.com/api/docs/guides/structured-outputs
