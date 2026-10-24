-- ONLY FOR EPHEMERAL POSTGRES RLS CI: fail if old objects were changed.
do $$
declare rpc_actual text; reg_actual text; metrics_actual text; trigger_actual text;
begin
  select md5(pg_get_functiondef('public.register_community_member(text,text,text,text,text,boolean)'::regprocedure))
   into rpc_actual;
  select md5(string_agg(column_name||':'||data_type||':'||is_nullable,'|' order by ordinal_position))
   into reg_actual from information_schema.columns
   where table_schema='public' and table_name='community_registrations';
  select md5(string_agg(column_name||':'||data_type||':'||is_nullable,'|' order by ordinal_position))
   into metrics_actual from information_schema.columns
   where table_schema='public' and table_name='community_metrics';
  select md5(pg_get_triggerdef(oid)) into trigger_actual from pg_trigger
   where tgrelid='public.community_registrations'::regclass and tgname='legacy_registration_trigger';
  if (select fingerprint from public.legacy_fixture_snapshot where label='rpc') is distinct from rpc_actual
    or (select fingerprint from public.legacy_fixture_snapshot where label='registration-columns') is distinct from reg_actual
    or (select fingerprint from public.legacy_fixture_snapshot where label='metrics-columns') is distinct from metrics_actual
    or (select fingerprint from public.legacy_fixture_snapshot where label='registration-trigger') is distinct from trigger_actual
  then raise exception 'Legacy registration structure/function changed by new migrations'; end if;
  if (select count(*) from public.community_registrations where email in
    ('before@mecatiger.invalid','visitor@mecatiger.invalid')) <> 2
  then raise exception 'Legacy fixture records modified'; end if;
  if (select people_count from public.community_metrics where id=1)<>1
  then raise exception 'Legacy metrics fixture modified'; end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='community_metrics')
  then raise exception 'Legacy metrics policy removed'; end if;
  if (select count(*) from pg_policies where schemaname='public' and tablename='community_registrations')<>0
  then raise exception 'Legacy registrations direct-data policies changed'; end if;
  if not has_function_privilege('anon','public.register_community_member(text,text,text,text,text,boolean)','EXECUTE')
  then raise exception 'Legacy public registration RPC access broken'; end if;
end $$;
-- Confirm additional legacy registration still works as anon AFTER new migrations:
set role anon;
select public.register_community_member('after@mecatiger.invalid','entusiasta','Equipe Teste','CE','Brasil',true);
reset role;
do $$
begin
  if (select count(*) from public.community_registrations where email='after@mecatiger.invalid')<>1
  then raise exception 'Legacy RPC no longer works after new migrations'; end if;
end $$;
select 'LEGACY REGISTRATION COMPATIBILITY PASSED' AS result;
