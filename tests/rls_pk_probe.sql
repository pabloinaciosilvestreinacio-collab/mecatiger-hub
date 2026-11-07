-- Proof of current identifier-mutability gap. Disposable PostgreSQL ONLY.
-- This initial version probes UPDATE id = DEFAULT; replace with denial
-- assertions after a validated hardening patch. Do not execute on production.
\set ON_ERROR_STOP on
begin;
insert into public.rede_comments(post_id,author_id,content)
values (1,'00000000-0000-0000-0000-000000000001','Comentário fictício para testar identidade da linha')
returning id as original_comment_id \gset
insert into public.rede_requests(author_id,kind,category,title,details)
values ('00000000-0000-0000-0000-000000000001','ajuda','programacao',
 'Pedido isolado','Solicitação fictícia sem mensagens vinculadas ao identificador')
returning id as original_request_id \gset
insert into public.rede_reports(reporter_id,post_id,reason)
values ('00000000-0000-0000-0000-000000000001',1,'Denúncia fictícia de auditoria de integridade')
returning id as original_report_id \gset

set local role authenticated;
set local request.jwt.claim.is_anonymous='false';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';

update public.rede_comments set id=DEFAULT where id=:'original_comment_id'
 returning id as mutated_comment_id \gset
update public.rede_requests set id=DEFAULT where id=:'original_request_id'
 returning id as mutated_request_id \gset
update public.rede_reports set id=DEFAULT where id=:'original_report_id'
 returning id as mutated_report_id \gset

select public.rede_assert(:'mutated_comment_id'::bigint<>:'original_comment_id'::bigint,
 'DISPOSABLE REPRO: moderator may alter comment primary key');
select public.rede_assert(:'mutated_request_id'::bigint<>:'original_request_id'::bigint,
 'DISPOSABLE REPRO: moderator may alter request primary key');
select public.rede_assert(:'mutated_report_id'::bigint<>:'original_report_id'::bigint,
 'DISPOSABLE REPRO: moderator may alter report primary key');
\echo PROOF: three primary keys mutated by moderator without a status change
rollback;
