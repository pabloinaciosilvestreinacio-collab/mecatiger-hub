-- Execute only in disposable CI PostgreSQL, after mock Auth, Rede and MecaSim migrations.
\set ON_ERROR_STOP on

-- Deterministic valid owner fixtures inserted by administrator (no JWT context).
insert into public.mecasim_trajectories(owner_id,name,points) values
('00000000-0000-0000-0000-000000000001','First private route','[{"x":1.83,"y":0.65}]'),
('00000000-0000-0000-0000-000000000002','Other private route','[{"x":1.12,"y":2.15}]');

select public.rede_assert(public.mecasim_valid_points('[{"x":0.25,"y":3.41}]'),'valid waypoint');
select public.rede_assert(not public.mecasim_valid_points('[{"x":9,"y":1}]'),'out of bounds refused');
select public.rede_assert(not public.mecasim_valid_points('[{"x":1}]'),'missing coordinate refused');
select public.rede_assert(not public.mecasim_valid_points('[{"x":1,"y":1,"owner_id":"other"}]'),'extra fields refused');
select public.rede_assert(not public.mecasim_valid_points('[]'),'empty route refused');

-- Site visitor cannot read private routes.
begin;
set local role anon;
do $$
declare leaked boolean := false;
begin
  begin perform 1 from public.mecasim_trajectories limit 1; leaked := true;
  exception when insufficient_privilege then null;
  end;
  if leaked then raise exception 'visitor read private routes'; end if;
end $$;
commit;

-- Authenticated member A reads only A and cannot update any route.
begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claim.is_anonymous='false';
select public.rede_assert((select count(*) from public.mecasim_trajectories)=1,'A sees only personal routes');
select public.rede_assert((select count(*) from public.mecasim_trajectories where id=2)=0,'A cannot read B route');
do $$
declare changed boolean := false;
begin
  begin
    update public.mecasim_trajectories set name='Unauthorized edit' where id=1;
    changed := true;
  exception when insufficient_privilege then null;
  end;
  if changed then raise exception 'A was allowed direct UPDATE'; end if;
end $$;
delete from public.mecasim_trajectories where id=2;
select public.rede_assert((select count(*) from public.mecasim_trajectories)=1,'deletion of B route blocked');
do $$
declare worked boolean:=false;
begin
  begin
    insert into public.mecasim_trajectories(owner_id,name,points)
      values('00000000-0000-0000-0000-000000000002','Forged route','[{"x":1,"y":2}]');
    worked:=true;
  exception when insufficient_privilege then null;
  end;
  if worked then raise exception 'A forged B route owner'; end if;
end $$;
commit;

-- User B reads only own data.
begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claim.is_anonymous='false';
select public.rede_assert((select count(*) from public.mecasim_trajectories)=1,'B sees only B route');
select public.rede_assert((select name from public.mecasim_trajectories)='Other private route','B did not see A data');
commit;

-- Anonymous Supabase Auth user also has role 'authenticated': still no route access.
begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claim.is_anonymous='true';
select public.rede_assert((select count(*) from public.mecasim_trajectories)=0,'anonymous Auth cannot list even own routes');
do $$
declare saved boolean:=false;
begin
  begin
    insert into public.mecasim_trajectories(owner_id,name,points)
      values('00000000-0000-0000-0000-000000000001','Anonymous route','[{"x":1,"y":1}]');
    saved:=true;
  exception when insufficient_privilege then null;
  end;
  if saved then raise exception 'anonymous Auth saved route'; end if;
end $$;
commit;

-- Missing anonymous flag must fail closed.
begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.rede_assert((select count(*) from public.mecasim_trajectories)=0,'missing JWT flag denied');
commit;

-- Malformed coordinates must be rejected by DB even bypassing Edge Function.
begin;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claim.is_anonymous='false';
do $$
declare accepted boolean:=false;
begin
  begin
    insert into public.mecasim_trajectories(owner_id,name,points)
      values('00000000-0000-0000-0000-000000000001','Invalid route','[{"x":1,"y":1,"owner_id":"B"}]');
    accepted:=true;
  exception when check_violation then null;
  end;
  if accepted then raise exception 'invalid points bypassed database validation'; end if;
end $$;
-- Per-user storage capped at 10 creations per hour, max 30 stored.
insert into public.mecasim_trajectories(owner_id,name,points,created_at)
select '00000000-0000-0000-0000-000000000001','Quota route '||i,
       '[{"x":1.15,"y":2.15}]'::jsonb,'2001-01-01'::timestamptz
from generate_series(1,9) i;
select public.rede_assert(
  (select count(*) from public.mecasim_trajectories where owner_id='00000000-0000-0000-0000-000000000001')=10,
  'A holds exactly 10 saved routes');
select public.rede_assert(
  (select count(*) from public.mecasim_trajectories where created_at<'2020-01-01')=0,
  'client cannot backdate route creation');
do $$
declare accepted boolean:=false;
begin
  begin
    insert into public.mecasim_trajectories(owner_id,name,points)
    values('00000000-0000-0000-0000-000000000001','Quota bypass','[{"x":1.1,"y":2.2}]');
    accepted:=true;
  exception when sqlstate 'P0001' then null;
  end;
  if accepted then raise exception 'route creation quota bypassed'; end if;
end $$;
commit;

select 'MECASIM RLS TESTS PASSED' as result;
