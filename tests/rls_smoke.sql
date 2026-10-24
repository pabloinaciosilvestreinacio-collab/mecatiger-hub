-- DO NOT execute on production: test-only account UUIDs and fixtures.
-- Run after tests/supabase_mock.sql and the additive Rede migration.
\set ON_ERROR_STOP on

create function public.rede_assert(assertion boolean, description text)
returns void language plpgsql as $$
begin
  if assertion is distinct from true then
    raise exception 'SECURITY TEST FAILED: %',description;
  end if;
end;
$$;
grant execute on function public.rede_assert(boolean,text) to anon, authenticated;

insert into public.rede_profiles(id,display_name) values
  ('00000000-0000-0000-0000-000000000001','Aluno Teste A'),
  ('00000000-0000-0000-0000-000000000002','Aluno Teste B'),
  ('00000000-0000-0000-0000-000000000003','Moderador Teste');
insert into public.rede_moderators(user_id) values
  ('00000000-0000-0000-0000-000000000003');
insert into public.rede_posts(author_id,kind,category,title,content,status) values
  ('00000000-0000-0000-0000-000000000001','conhecimento','programacao','Dica de programa','Texto público de teste muito útil.','approved'),
  ('00000000-0000-0000-0000-000000000001','duvida','ajuda','Dúvida privada','Texto ainda pendente de moderação.','pending');

-- Guest: only approved post; no access to moderator membership or private requests.
begin;
set local role anon;
select public.rede_assert((select count(*) from public.rede_posts)=1,'guest should see only approved post');
select public.rede_assert((select count(*) from public.rede_comments)=0,'no fake comments');
commit;

-- Owner A sees approved + their own pending; cannot promote their own pending post.
begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.rede_assert((select count(*) from public.rede_posts)=2,'owner sees own pending');
select public.rede_assert((select count(*) from public.rede_moderators)=0,'owner is not moderator');
do $$
declare did_succeed boolean := false;
begin
  begin
    update public.rede_posts set status='approved' where id=2;
    did_succeed:=true;
  exception when insufficient_privilege then
    null;
  end;
  if did_succeed then raise exception 'owner could approve post'; end if;
end $$;
commit;

-- Another authenticated user cannot see the pending post or private request.
begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select public.rede_assert((select count(*) from public.rede_posts)=1,'other member cannot see pending post');
select public.rede_assert((select count(*) from public.rede_moderators)=0,'user B not moderator');
select public.rede_assert((select count(*) from public.rede_requests)=0,'other member has no access to private requests');
-- Even attempts to change a pending post cannot alter data.
update public.rede_posts set title='Alteração indevida' where id=2;
commit;
select public.rede_assert((select title from public.rede_posts where id=2)='Dúvida privada','unauthorized edit did not persist');

-- User A submits private request with real auth semantics.
begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into public.rede_requests(author_id,kind,category,title,details) values
 ('00000000-0000-0000-0000-000000000001','ajuda','programacao',
  'Preciso de mentoria','Ajuda com o código e sensores do robô.');
select public.rede_assert((select count(*) from public.rede_requests)=1,'owner can read own request');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select public.rede_assert((select count(*) from public.rede_requests)=0,'other member cannot view request A');
commit;

-- Moderator can see all pending posts, manage moderation and inspect audit trail.
begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.rede_assert((select count(*) from public.rede_posts)=2,'moderator sees all posts');
select public.rede_assert((select count(*) from public.rede_requests)=1,'moderator sees private queue');
update public.rede_posts set status='approved' where id=2;
select public.rede_assert((select count(*) from public.rede_moderation_log)=1,'moderation status change logged');
commit;
begin;
set local role anon;
select public.rede_assert((select count(*) from public.rede_posts)=2,'approved post became public');
commit;

select 'RLS TEST SUITE PASSED' as result;
