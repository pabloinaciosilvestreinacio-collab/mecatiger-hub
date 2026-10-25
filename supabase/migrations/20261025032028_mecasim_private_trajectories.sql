-- MECA SIM private trajectory storage, additive migration, NOT applied to production.
-- Depends on Supabase Auth. The GitHub Pages HTML/JS itself remains public.
begin;
create or replace function public.mecasim_valid_points(p_points jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $function$
declare p jsonb; x numeric; y numeric;
begin
  if p_points is null or pg_catalog.jsonb_typeof(p_points) <> 'array' then return false; end if;
  if pg_catalog.jsonb_array_length(p_points) not between 1 and 16 then return false; end if;
  for p in select value from pg_catalog.jsonb_array_elements(p_points) loop
    if pg_catalog.jsonb_typeof(p) <> 'object'
       or pg_catalog.jsonb_typeof(p->'x') <> 'number'
       or pg_catalog.jsonb_typeof(p->'y') <> 'number'
       or (select count(*) from pg_catalog.jsonb_object_keys(p)) <> 2
    then return false; end if;
    x := (p->>'x')::numeric; y := (p->>'y')::numeric;
    if x not between 0.25 and 3.41 or y not between 0.25 and 3.41 then return false; end if;
  end loop;
  return true;
exception when others then return false;
end $function$;
revoke all on function public.mecasim_valid_points(jsonb) from public, anon, authenticated;
grant execute on function public.mecasim_valid_points(jsonb) to authenticated;

create table public.mecasim_trajectories (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 3 and 70)
    check (name !~ '[[:cntrl:]]'),
  points jsonb not null check (public.mecasim_valid_points(points)),
  created_at timestamptz not null default now()
);
create index mecasim_trajectories_owner_idx on public.mecasim_trajectories (owner_id, created_at desc, id desc);
alter table public.mecasim_trajectories enable row level security;
revoke all on public.mecasim_trajectories from public, anon, authenticated;
grant select, insert, delete on public.mecasim_trajectories to authenticated;
grant usage on sequence public.mecasim_trajectories_id_seq to authenticated;

create policy "Owner may read only personal routes" on public.mecasim_trajectories
  for select to authenticated
  using (owner_id = (select auth.uid())
    and ((select (auth.jwt()->>'is_anonymous')::boolean) is false));
create policy "Owner may create only personal routes" on public.mecasim_trajectories
  for insert to authenticated
  with check (owner_id = (select auth.uid())
    and ((select (auth.jwt()->>'is_anonymous')::boolean) is false));
create policy "Owner may delete only personal routes" on public.mecasim_trajectories
  for delete to authenticated
  using (owner_id = (select auth.uid())
    and ((select (auth.jwt()->>'is_anonymous')::boolean) is false));

-- Defense in depth: no client can override created_at or evade the per-user limit
-- through the REST API, even if it bypasses the Edge Function HTTP endpoint.
create or replace function app_private.mecasim_guard_insert() returns trigger
language plpgsql security definer set search_path = '' as $function$
declare uid uuid := auth.uid(); current_total integer; hourly_total integer;
begin
  if uid is not null then
    if new.owner_id is distinct from uid then
      raise exception 'Not owner' using errcode='42501';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text, 0));
    select count(*), count(*) filter (where created_at > now() - interval '1 hour')
      into current_total, hourly_total
      from public.mecasim_trajectories where owner_id = uid;
    if current_total >= 30 or hourly_total >= 10 then
      raise exception 'Trajectory quota exceeded' using errcode='P0001';
    end if;
  end if;
  new.created_at := now();
  return new;
end $function$;
revoke all on function app_private.mecasim_guard_insert() from public, anon, authenticated;
create trigger mecasim_guard_insert before insert on public.mecasim_trajectories
for each row execute function app_private.mecasim_guard_insert();
commit;
