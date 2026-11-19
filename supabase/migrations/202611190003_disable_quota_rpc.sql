-- Block browser-callable quota function until the AI backend is refactored and reviewed.
-- Supabase AI function scaffold is NOT deployed.
revoke execute on function public.claim_ai_daily_quota() from authenticated;
