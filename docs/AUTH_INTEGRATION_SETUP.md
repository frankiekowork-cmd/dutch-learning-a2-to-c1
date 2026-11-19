# Supabase email-login integration (development branch only)

## Implemented
- Browser uses Supabase publishable key (safe to expose; **never** use secret/service_role key).
- Email magic-link sign-in with PKCE, sign-out, signed-in session check.
- Load owner-scoped learner profile and latest saved answers from Supabase.
- Profile settings sync on Save. Display name is local only.
- Lesson answer sync uses the explicit **Save answers to cloud** button (not on every keystroke).
- Guest drafts and account drafts are kept in separate browser-local namespaces.
- Existing demo questions are still the sole source of exercises.
- Backend AI grading/Q&A remains unconfigured and disabled.

## Manual action before sign-in testing
Open Supabase Dashboard > Authentication > URL Configuration:
- Set **Site URL** to `https://frankiekowork-cmd.github.io/dutch-learning-a2-to-c1/`
- Add exactly `https://frankiekowork-cmd.github.io/dutch-learning-a2-to-c1/` under **Redirect URLs**
- For local testing you may temporarily allow the exact local development URL, but never use wildcard production redirects.
- Verify email provider configuration and email sending limits. Hosted default email may be rate-limited; configure a custom SMTP provider before broad public onboarding.
- For a project still in private testing, restrict who can sign up, and ensure domain / email verification safeguards.
- Link verification needs a browser test after deploying this branch (not yet merged).

## Test plan
1. Create two different test accounts using email magic links; verify each session has a different `auth.uid()`.
2. Account A saves a practice answer and preferences, signs out, then signs back in from another browser: confirm cloud values load.
3. Account B signs in: must **not** see A's preferences or answers.
4. Guest mode: draft and settings remain local; cloud-save button asks for sign-in.
5. Invalid / expired email link: show an error; no protected data visible.
6. A user cannot select/update another user's `learner_profiles` or `learning_submissions` through API (RLS test).
7. Confirm no service_role / OPENAI_API_KEY appears in the GitHub Pages files.
8. Clear data / sign-out on shared devices; app currently keeps per-account browser draft caches, so this is not appropriate for high-privacy shared terminals.
9. Confirm GitHub Pages works on the exact subpath, including email redirects.
10. JavaScript syntax checks: `node --check web/app.js` and `node --check web/auth.js` from repository root.

## Remaining limitations
- The PR has not been merged and live GitHub Pages still runs the earlier version.
- Cannot configure Supabase Auth Redirect URLs through the available connector; set these manually.
- No actual browser sign-in test has been completed.
- Saved submissions are append-only; edits append another row, loading prefers newest. Cloud answers clear from browser does **not** delete historical cloud records.
- No account deletion/export workflow, privacy policy, production security audit, abuse protection, production billing guardrails or AI runtime integration yet.
- This is not a certified A2–C1 platform.
