begin;

create table public.meca_site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);
alter table public.meca_site_admins enable row level security;
revoke all on public.meca_site_admins from public, anon, authenticated;

-- Bootstrap the already verified owner account identified during production audit.
-- The initial administrator also receives editor and moderator roles so the panel works immediately.
insert into public.meca_site_admins (user_id)
values ('bc7eac84-0c89-460e-b9a9-e55a4be08d1d')
on conflict (user_id) do nothing;
insert into public.meca_site_editors (user_id)
values ('bc7eac84-0c89-460e-b9a9-e55a4be08d1d')
on conflict (user_id) do nothing;
insert into public.rede_moderators (user_id)
values ('bc7eac84-0c89-460e-b9a9-e55a4be08d1d')
on conflict (user_id) do nothing;

create or replace function public.meca_site_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.meca_site_admins
    where user_id = (select auth.uid())
  );
$$;

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
    select u.id, u.email,
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

create or replace function public.meca_site_set_access(
  target_email text,
  grant_editor boolean,
  grant_moderator boolean,
  grant_admin boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
  actor_id uuid := (select auth.uid());
  active_admins bigint;
begin
  if actor_id is null or not public.meca_site_is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if target_email is null or char_length(btrim(target_email)) > 320 then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  select u.id into target_id from auth.users u
    where lower(u.email)=lower(btrim(target_email))
      and u.email_confirmed_at is not null
    limit 1;
  if target_id is null then
    raise exception 'confirmed_user_not_found' using errcode = 'P0002';
  end if;

  if target_id=actor_id and not grant_admin then
    select count(*) into active_admins from public.meca_site_admins;
    if active_admins <= 1 then
      raise exception 'cannot_remove_last_admin' using errcode = '23514';
    end if;
  end if;

  if grant_admin then
    grant_editor := true;
    grant_moderator := true;
    insert into public.meca_site_admins(user_id) values(target_id)
      on conflict(user_id) do nothing;
  else
    delete from public.meca_site_admins where user_id=target_id;
  end if;

  if grant_editor then
    insert into public.meca_site_editors(user_id) values(target_id)
      on conflict(user_id) do nothing;
  else
    delete from public.meca_site_editors where user_id=target_id;
  end if;

  if grant_moderator then
    insert into public.rede_moderators(user_id) values(target_id)
      on conflict(user_id) do nothing;
  else
    delete from public.rede_moderators where user_id=target_id;
  end if;
end;
$$;

revoke all on function public.meca_site_is_admin() from public, anon;
revoke all on function public.meca_site_list_access() from public, anon;
revoke all on function public.meca_site_set_access(text,boolean,boolean,boolean) from public, anon;
grant execute on function public.meca_site_is_admin() to authenticated;
grant execute on function public.meca_site_list_access() to authenticated;
grant execute on function public.meca_site_set_access(text,boolean,boolean,boolean) to authenticated;

create table public.meca_site_team_members (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
  team_role text not null check (team_role in ('integrante','tecnico','mentor')),
  bio text not null check (char_length(btrim(bio)) between 10 and 600),
  photo_path text,
  photo_alt text not null check (char_length(btrim(photo_alt)) between 3 and 160),
  sort_order integer not null default 0 check (sort_order between 0 and 999),
  published boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (photo_path is null or photo_path ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.webp$')
);
create index meca_site_team_members_public_order_idx
  on public.meca_site_team_members (published, sort_order, id);
alter table public.meca_site_team_members enable row level security;
revoke all on public.meca_site_team_members from public, anon, authenticated;
grant select on public.meca_site_team_members to anon, authenticated;
grant insert, update, delete on public.meca_site_team_members to authenticated;
grant usage, select on sequence public.meca_site_team_members_id_seq to authenticated;

create policy "Published team members are public; editors see drafts"
  on public.meca_site_team_members for select to anon, authenticated
  using (
    published
    or exists (
      select 1 from public.meca_site_editors e
      where e.user_id=(select auth.uid())
    )
  );
create policy "Editors insert team members"
  on public.meca_site_team_members for insert to authenticated
  with check (
    exists(select 1 from public.meca_site_editors e where e.user_id=(select auth.uid()))
    and updated_by=(select auth.uid())
  );
create policy "Editors update team members"
  on public.meca_site_team_members for update to authenticated
  using (exists(select 1 from public.meca_site_editors e where e.user_id=(select auth.uid())))
  with check (
    exists(select 1 from public.meca_site_editors e where e.user_id=(select auth.uid()))
    and updated_by=(select auth.uid())
  );
create policy "Editors delete team members"
  on public.meca_site_team_members for delete to authenticated
  using (exists(select 1 from public.meca_site_editors e where e.user_id=(select auth.uid())));

commit;