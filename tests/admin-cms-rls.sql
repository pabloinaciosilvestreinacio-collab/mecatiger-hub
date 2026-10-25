-- Test only: apply after the Supabase shim and all product migrations.
\\set ON_ERROR_STOP on

update auth.users set email_confirmed_at=now();
insert into public.meca_site_admins(user_id)
values('00000000-0000-0000-0000-000000000003')
on conflict do nothing;

-- Non-admin authenticated users cannot inspect the private administrator table,
-- and cannot invoke the role-management RPC.
begin;
set local role authenticated;
set local request.jwt.claim.is_anonymous='false';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$
begin
  begin
    perform * from public.meca_site_list_access();
    raise exception 'non-admin read access list';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.meca_site_set_access('test-b@example.invalid',true,false,false);
    raise exception 'non-admin granted access';
  exception when insufficient_privilege then null;
  end;
end $$;
commit;

-- An administrator can promote only an existing confirmed Auth account.
begin;
set local role authenticated;
set local request.jwt.claim.is_anonymous='false';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.meca_site_set_access('test-b@example.invalid',true,false,false);
select public.rede_assert(
  exists(select 1 from public.meca_site_editors where user_id='00000000-0000-0000-0000-000000000002'),
  'administrator can grant editor role to confirmed user');
select public.rede_assert(
  (select count(*) from public.meca_site_list_access())=2,
  'administrator can list only authorized accounts');
commit;

-- Editor writes a draft; visitors cannot see it until it is published.
begin;
set local role authenticated;
set local request.jwt.claim.is_anonymous='false';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
insert into public.meca_site_team_members
  (slug,full_name,team_role,bio,photo_alt,sort_order,published,updated_by)
values
  ('member-test','Pessoa Teste','integrante','Perfil fictício usado apenas no teste de autorização.','Foto de teste sem imagem',1,false,
   '00000000-0000-0000-0000-000000000002');
select public.rede_assert((select count(*) from public.meca_site_team_members)=1,
  'editor can read their unpublished profile');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.is_anonymous='false';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.rede_assert((select count(*) from public.meca_site_team_members)=0,
  'non-editor cannot view draft profile');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.is_anonymous='false';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
update public.meca_site_team_members set published=true,
  updated_by='00000000-0000-0000-0000-000000000002'
where slug='member-test';
commit;

begin;
set local role anon;
select public.rede_assert((select count(*) from public.meca_site_team_members)=1,
  'published profile is public');
do $$
begin
  begin
    perform public.meca_site_is_admin();
    raise exception 'anonymous user can call admin check';
  exception when insufficient_privilege then null;
  end;
end $$;
commit;
