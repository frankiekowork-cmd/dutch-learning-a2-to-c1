# AI tutor backend — deployment and security

This code is a **scaffold** and is **not deployed or enabled**. The database migration `202611190003_disable_quota_rpc.sql` revokes access to `public.claim_ai_daily_quota`; **the scaffold cannot currently call it**. Before AI deployment, redesign quota consumption behind a private server-controlled authorization boundary (not an exposed authenticated RPC), add tests, and run security advisors again. Public GitHub Pages cannot securely store OpenAI API keys. This project uses Supabase Auth + an Edge Function as the authenticated server proxy.

## Preparation
1. Create your own Supabase project; enable email or OAuth sign-in and configure allowed redirects.
2. Run `supabase/migrations/202611190001_learning.sql` in your project **after reviewing it**.
3. Deploy the function `supabase/functions/ai-tutor` through Supabase CLI. Default gateway JWT verification should remain enabled if using legacy JWT signing; for newer signing keys follow current Supabase authorization guidance, with `getUser()` validation remaining mandatory. Do not use a public unauthenticated endpoint.
4. Configure **server-side secrets**: `OPENAI_API_KEY`, `OPENAI_MODEL` (e.g. a compatible Structured Outputs model), and `ALLOWED_ORIGIN` set to the exact production Pages origin (e.g. `https://frankiekowork-cmd.github.io`). Supabase provides `SUPABASE_URL` and legacy `SUPABASE_ANON_KEY` depending on project configuration; verify them. **Never commit secrets or put them in `web/`.**
5. Integrate Supabase Auth into the web app and call the edge endpoint with a real signed-in session. The current front end does **not** call this service yet.
6. Independently test auth, RLS, CORS, daily quota, correctness, accepted alternatives, abuse limits and billing alerts before exposing to users.

## Contract
POST `/functions/v1/ai-tutor`, with valid bearer session JWT and `Origin` matching `ALLOWED_ORIGIN`.
- Grade: `{"mode":"grade","level":"A2","exercise_id":1,"answer_nl":"De winkel die ik zoek is dichtbij."}`
- Ask: `{"mode":"ask","level":"A2","question":"Waarom staat het werkwoord achteraan na omdat?"}`

Returns `{"mode":"grade"|"ask","feedback":{...}}` with validated JSON response shape. Model-generated explanations are fallible and require educational QA.

## Safeguards and remaining risks
- The function validates the session using `auth.getUser(jwt)`, checks the origin, caps request and answer lengths, and applies a database-backed daily **20 AI requests per user** quota.
- CORS is not authentication and does not protect server-to-server calls. Rate limiting by account alone does not prevent multiple account creation or spending spikes.
- Configure OpenAI **project spending limits**, Supabase deployment limits and anomaly monitoring before public launch. The daily quota counts even failed upstream requests, so an operator may need to refund quota manually for outages.
- Personal answers are sent to OpenAI for evaluation; publish a privacy policy and retention/consent terms before collecting user data.
- The SQL `learner_profiles` and `learning_submissions` tables have owner-only RLS; app writes and cloud sync are not implemented yet.
- No automatic storage of AI responses, no spoken-language evaluation and no verified full A2–C1 dataset.
- Never trust client-supplied expected answers; this demo server uses its own canonical exercise map. Future exercises should come from reviewed server-side content storage.
- Review both backend code and security policy before enabling public access.

## References
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://supabase.com/docs/guides/functions/auth
- https://supabase.com/docs/reference/javascript/auth-getuser

## Current security gate (2026-11-19)
- Direct `authenticated` and `anon` EXECUTE rights on the privileged quota function were revoked in the linked Supabase project.
- Authenticated AI request processing therefore intentionally remains disabled until the quota endpoint is redesigned and tested.
- No OpenAI key is configured or deployed in this project through this repository.
