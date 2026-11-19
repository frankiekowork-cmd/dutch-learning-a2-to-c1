-- The service-side quota transaction is invoked only by the authenticated
-- Edge Function through its server-held service role key.
create or replace function public.consume_ai_quota(p_user_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare changed integer;
begin
 if p_user_id is null then return false; end if;
 insert into public.ai_daily_usage(user_id,usage_day,request_count)
 values(p_user_id,(now() at time zone 'utc')::date,1)
 on conflict(user_id,usage_day)
 do update set request_count=public.ai_daily_usage.request_count+1
 where public.ai_daily_usage.request_count < 20;
 get diagnostics changed = row_count;
 return changed > 0;
end;
$$;
revoke all on function public.consume_ai_quota(uuid) from PUBLIC,anon,authenticated;
grant execute on function public.consume_ai_quota(uuid) to service_role;
revoke all on function public.claim_ai_daily_quota() from PUBLIC,anon,authenticated;
