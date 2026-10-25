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
set local request.jwt.claim.is_anonymous='false';
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
set local request.jwt.claim.is_anonymous='false';
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
set local request.jwt.claim.is_anonymous='false';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into public.rede_requests(author_id,kind,category,title,details) values
 ('00000000-0000-0000-0000-000000000001','ajuda','programacao',
  'Preciso de mentoria','Ajuda com o código e sensores do robô.')
 returning id as test_request_id \gset
insert into public.rede_request_messages(request_id,sender_id,body)
 values(:'test_request_id','00000000-0000-0000-0000-000000000001','Mensagem privada inicial do solicitante');
select public.rede_assert((select count(*) from public.rede_requests)=1,'owner can read own request');
select public.rede_assert((select count(*) from public.rede_request_messages where request_id=:'test_request_id')=1,
 'request author can write and read own private messages');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.is_anonymous='false';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select public.rede_assert((select count(*) from public.rede_requests)=0,'other member cannot view request A');
select public.rede_assert((select count(*) from public.rede_request_messages where request_id=:'test_request_id')=0,
 'other member cannot read request messages');
do $$
declare allowed boolean:=false;
begin
  begin
    insert into public.rede_request_messages(request_id,sender_id,body)
      select id,'00000000-0000-0000-0000-000000000002','Unauthorized reply'
      from public.rede_requests where title='Preciso de mentoria';
    allowed:=true;
  exception when insufficient_privilege then null;
  end;
  if allowed then raise exception 'other member wrote to request messages'; end if;
end $$;
commit;

-- Moderator can see all pending posts, manage moderation and inspect audit trail.
begin;
set local role authenticated;
set local request.jwt.claim.is_anonymous='false';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.rede_assert((select count(*) from public.rede_posts)=2,'moderator sees all posts');
select public.rede_assert((select count(*) from public.rede_requests)=1,'moderator sees private queue');
select public.rede_assert((select count(*) from public.rede_request_messages where request_id=:'test_request_id')=1,
 'moderator can read private request messages');
insert into public.rede_request_messages(request_id,sender_id,body)
 values(:'test_request_id','00000000-0000-0000-0000-000000000003','Resposta privada da equipe');
update public.rede_posts set status='approved' where id=2;
select public.rede_assert((select count(*) from public.rede_moderation_log)=1,'moderation status change logged');
commit;
begin;
set local role anon;
select public.rede_assert((select count(*) from public.rede_posts)=2,'approved post became public');
commit;


-- User A must not bypass comment moderation or choose another author.
begin;
set local role authenticated;
set local request.jwt.claim.is_anonymous='false';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$
declare success boolean:=false;
begin
  begin
    insert into public.rede_comments(post_id,author_id,content,status)
      values(1,'00000000-0000-0000-0000-000000000001','Comentário de teste suficiente','approved');
    success:=true;
  exception when insufficient_privilege then null;
  end;
  if success then raise exception 'Author bypassed comment moderation'; end if;
end $$;
insert into public.rede_comments(post_id,author_id,content)
  values(1,'00000000-0000-0000-0000-000000000001','Comentário legítimo em aprovação');
commit;

begin;
set local role anon;
select public.rede_assert((select count(*) from public.rede_comments)=0,'guest cannot read pending comment');
commit;

-- User B cannot impersonate A or make themselves moderator.
begin;
set local role authenticated;
set local request.jwt.claim.is_anonymous='false';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$
declare success boolean:=false;
begin
  begin
    insert into public.rede_posts(author_id,kind,category,title,content)
      values('00000000-0000-0000-0000-000000000001','conhecimento','programacao',
        'Post falsificado','Tentativa de falsificar a autoria de outro usuário');
    success:=true;
  exception when insufficient_privilege then null;
  end;
  if success then raise exception 'User B impersonated user A'; end if;
end $$;
do $$
declare success boolean:=false;
begin
  begin
    insert into public.rede_moderators(user_id) values('00000000-0000-0000-0000-000000000002');
    success:=true;
  exception when insufficient_privilege then null;
  end;
  if success then raise exception 'User B self-appointed as moderator'; end if;
end $$;
select public.rede_assert((select count(*) from public.rede_comments)=0,'B cannot see pending comments from A');
commit;

-- Moderator approves comment; the public can now read it.
begin;
set local role authenticated;
set local request.jwt.claim.is_anonymous='false';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
update public.rede_comments set status='approved' where content='Comentário legítimo em aprovação';
commit;
begin;
set local role anon;
select public.rede_assert((select count(*) from public.rede_comments)=1,'approved comment is public');
commit;

-- Check post quota and prevent backdated inserts bypassing it.
begin;
set local role authenticated;
set local request.jwt.claim.is_anonymous='false';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into public.rede_posts(author_id,kind,category,title,content,created_at) values
('00000000-0000-0000-0000-000000000001','conhecimento','programacao','Novo post 01','Texto legítimo de postagem 01','2001-01-01'),
('00000000-0000-0000-0000-000000000001','conhecimento','programacao','Novo post 02','Texto legítimo de postagem 02','2001-01-01'),
('00000000-0000-0000-0000-000000000001','conhecimento','programacao','Novo post 03','Texto legítimo de postagem 03','2001-01-01');
select public.rede_assert(
  (select count(*) from public.rede_posts where author_id='00000000-0000-0000-0000-000000000001'
    and created_at<'2020-01-01')=0,'user cannot backdate posts');
do $$
declare success boolean:=false;
begin
  begin
    insert into public.rede_posts(author_id,kind,category,title,content) values
      ('00000000-0000-0000-0000-000000000001','conhecimento','programacao',
       'Sexto post proibido','Texto para testar limite de envios.');
    success:=true;
  exception when sqlstate 'P0001' then null;
  end;
  if success then raise exception 'server quota bypassed'; end if;
end $$;
commit;


-- Reset post-quota fixtures so that anonymous-policy tests cannot be masked
-- by the independent per-hour write limit enforced in BEFORE INSERT triggers.
delete from public.rede_posts where title like 'Novo post %';
insert into public.rede_posts(author_id,kind,category,title,content,status)
values('00000000-0000-0000-0000-000000000001','duvida','ajuda',
  'Outra dúvida pendente','Teste de visibilidade do próprio conteúdo pendente.','pending');
-- A Supabase Anonymous Sign-In JWT uses the authenticated Postgres role,
-- despite not having an email-verified permanent identity.
-- Force the same author UUID to prove the restrictive policy denies writes,
-- not merely because the simulated user lacks ownership.
begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claim.is_anonymous='true';
select public.rede_assert((select count(*) from public.rede_posts where status='approved')=2,
 'anonymous Auth identity can read approved posts');
select public.rede_assert((select count(*) from public.rede_posts where status='pending')=0,
 'anonymous Auth identity cannot read own pending posts');
select public.rede_assert((select count(*) from public.rede_comments)=1,
 'anonymous Auth identity can read approved comments');
select public.rede_assert((select count(*) from public.rede_requests)=0,
 'anonymous Auth identity cannot read private requests');
select public.rede_assert((select count(*) from public.rede_reports)=0,
 'anonymous Auth identity cannot read reports');
do $$
declare
 allowed boolean;
begin
 allowed := false;
 begin
   insert into public.rede_profiles(id,display_name) values
     ('00000000-0000-0000-0000-000000000004','Anonymous Profile');
   allowed := true;
 exception when insufficient_privilege then null;
 end;
 if allowed then raise exception 'anonymous Auth created profile'; end if;
 allowed := false;
 begin
   update public.rede_profiles set display_name='Anonymous Takeover'
   where id='00000000-0000-0000-0000-000000000001';
   allowed := found;
 exception when insufficient_privilege then null;
 end;
 if allowed then raise exception 'anonymous Auth edited profile'; end if;
 allowed := false;
 begin
   insert into public.rede_posts(author_id,kind,category,title,content)
   values('00000000-0000-0000-0000-000000000001','conhecimento','programacao',
     'Anonymous publish','Posting from an anonymous JWT must fail.');
   allowed := true;
 exception when insufficient_privilege then null;
 end;
 if allowed then raise exception 'anonymous Auth published'; end if;
 allowed := false;
 begin
   update public.rede_posts set title='Anonymous Update' where id=1;
   allowed := found;
 exception when insufficient_privilege then null;
 end;
 if allowed then raise exception 'anonymous Auth edited post'; end if;
 allowed := false;
 begin
   delete from public.rede_posts where id=1;
   allowed := found;
 exception when insufficient_privilege then null;
 end;
 if allowed then raise exception 'anonymous Auth deleted post'; end if;
 allowed := false;
 begin
   insert into public.rede_comments(post_id,author_id,content)
     values(1,'00000000-0000-0000-0000-000000000001','Anonymous comment');
   allowed := true;
 exception when insufficient_privilege then null;
 end;
 if allowed then raise exception 'anonymous Auth commented'; end if;
 allowed := false;
 begin
   insert into public.rede_requests(author_id,kind,category,title,details)
     values('00000000-0000-0000-0000-000000000001','ajuda','programacao',
       'Anonymous help','Private help from an anonymous JWT must fail.');
   allowed := true;
 exception when insufficient_privilege then null;
 end;
 if allowed then raise exception 'anonymous Auth submitted request'; end if;
 allowed := false;
 begin
   insert into public.rede_reports(reporter_id,post_id,reason)
     values('00000000-0000-0000-0000-000000000001',1,'Anonymous report must fail');
   allowed := true;
 exception when insufficient_privilege then null;
 end;
 if allowed then raise exception 'anonymous Auth reported'; end if;
end $$;
commit;

-- Fail closed when the JWT claim is missing, instead of silently trusting
-- a token that cannot prove it comes from a permanent Auth account.
begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.rede_assert((select count(*) from public.rede_posts)=2,
 'missing claim still allows approved posts');
do $$
declare allowed boolean:=false;
begin
  begin
    insert into public.rede_posts(author_id,kind,category,title,content)
      values('00000000-0000-0000-0000-000000000001','duvida','ajuda',
      'Missing JWT claim','Missing is_anonymous claim must fail closed');
    allowed:=true;
  exception when insufficient_privilege then null;
  end;
  if allowed then raise exception 'missing is_anonymous claim bypassed policy'; end if;
end $$;
commit;

select 'RLS TEST SUITE PASSED' as result;
