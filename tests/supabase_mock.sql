-- Isolated PostgreSQL test shim. Not part of production migrations.
create role anon nologin;
create role authenticated nologin;
create schema auth;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
create table auth.users (
  id uuid primary key,
  email text not null unique
);
create or replace function auth.uid() returns uuid language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
grant execute on function auth.uid() to anon, authenticated;
insert into auth.users(id,email) values
  ('00000000-0000-0000-0000-000000000001','test-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000002','test-b@example.invalid'),
  ('00000000-0000-0000-0000-000000000003','test-mod@example.invalid');
