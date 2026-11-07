-- SQL privilege regression against a DISPOSABLE PostgreSQL service only.
-- Fixtures and status updates are rolled back; NEVER run on production.
\set ON_ERROR_STOP on
begin;
insert into public.rede_comments(post_id,author_id,content)
values (1,'00000000-0000-0000-0000-000000000001','Comentário fictício para testar identidade da linha');
insert into public.rede_requests(author_id,kind,category,title,details)
values ('00000000-0000-0000-0000-000000000001','ajuda','programacao',
 'Pedido isolado','Solicitação fictícia sem mensagens vinculadas ao identificador');
insert into public.rede_reports(reporter_id,post_id,reason)
values ('00000000-0000-0000-0000-000000000001',1,'Denúncia fictícia de auditoria de integridade');

set local role authenticated;
set local request.jwt.claim.is_anonymous='false';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';

select public.rede_assert(
  not has_column_privilege('authenticated','public.rede_posts','author_id','UPDATE')
  and not has_column_privilege('authenticated','public.rede_posts','id','UPDATE')
  and not has_column_privilege('authenticated','public.rede_comments','id','UPDATE')
  and not has_column_privilege('authenticated','public.rede_requests','id','UPDATE')
  and not has_column_privilege('authenticated','public.rede_reports','id','UPDATE')
  and not has_column_privilege('authenticated','public.rede_requests','author_id','UPDATE')
  and not has_column_privilege('authenticated','public.rede_reports','reporter_id','UPDATE'),
  'identity and authorship columns cannot be changed by authenticated clients');

select public.rede_assert(
  has_column_privilege('authenticated','public.rede_posts','title','UPDATE')
  and has_column_privilege('authenticated','public.rede_posts','content','UPDATE')
  and has_column_privilege('authenticated','public.rede_posts','status','UPDATE')
  and has_column_privilege('authenticated','public.rede_comments','status','UPDATE')
  and has_column_privilege('authenticated','public.rede_requests','status','UPDATE')
  and has_column_privilege('authenticated','public.rede_reports','status','UPDATE'),
  'post edits and moderation status retain their intended privileges');

select public.rede_assert((select count(*) from public.rede_comments where content like 'Comentário fictício para testar%')=1,
  'moderator can read comment fixture');
select public.rede_assert((select count(*) from public.rede_requests where title='Pedido isolado')=1,
  'moderator can read request fixture');
select public.rede_assert((select count(*) from public.rede_reports where reason like 'Denúncia fictícia de auditoria%')=1,
  'moderator can read report fixture');

do $audit$
declare updated_row boolean;
begin
  updated_row := false;
  begin
    update public.rede_comments set id=default where content like 'Comentário fictício para testar%';
    updated_row := found;
  exception when insufficient_privilege then null;
  end;
  if updated_row then raise exception 'comment primary key changed'; end if;

  updated_row := false;
  begin
    update public.rede_requests set id=default where title='Pedido isolado';
    updated_row := found;
  exception when insufficient_privilege then null;
  end;
  if updated_row then raise exception 'request primary key changed'; end if;

  updated_row := false;
  begin
    update public.rede_reports set id=default where reason like 'Denúncia fictícia de auditoria%';
    updated_row := found;
  exception when insufficient_privilege then null;
  end;
  if updated_row then raise exception 'report primary key changed'; end if;
end $audit$;

update public.rede_comments set status='approved'
  where content like 'Comentário fictício para testar%';
update public.rede_requests set status='em_analise' where title='Pedido isolado';
update public.rede_reports set status='reviewed'
  where reason like 'Denúncia fictícia de auditoria%';
select public.rede_assert((select count(*) from public.rede_comments where status='approved' and content like 'Comentário fictício para testar%')=1,
 'moderator approval persists in transaction');
select public.rede_assert((select count(*) from public.rede_requests where status='em_analise' and title='Pedido isolado')=1,
 'moderator may change request status');
select public.rede_assert((select count(*) from public.rede_reports where status='reviewed' and reason like 'Denúncia fictícia de auditoria%')=1,
 'moderator may change report status');

set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
update public.rede_posts set title='Outra dúvida pendente editada'
  where title='Outra dúvida pendente' and status='pending';
select public.rede_assert((select count(*) from public.rede_posts where title='Outra dúvida pendente editada')=1,
 'author may continue editing own pending post');
\echo RLS IMMUTABLE IDENTIFIER AND LEGITIMATE WORKFLOW TESTS PASSED
rollback;
