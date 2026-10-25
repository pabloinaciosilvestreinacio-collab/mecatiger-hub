begin;

create or replace function public.meca_site_list_access()
returns table (
  user_id uuid,
  email text,
  is_editor boolean,
  is_moderator boolean,
  is_admin boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.meca_site_is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text,
      exists(select 1 from public.meca_site_editors e where e.user_id=u.id),
      exists(select 1 from public.rede_moderators m where m.user_id=u.id),
      exists(select 1 from public.meca_site_admins a where a.user_id=u.id)
    from auth.users u
    where exists(select 1 from public.meca_site_editors e where e.user_id=u.id)
       or exists(select 1 from public.rede_moderators m where m.user_id=u.id)
       or exists(select 1 from public.meca_site_admins a where a.user_id=u.id)
    order by lower(u.email);
end;
$$;

revoke all on function public.meca_site_list_access() from public, anon;
grant execute on function public.meca_site_list_access() to authenticated;

commit;
