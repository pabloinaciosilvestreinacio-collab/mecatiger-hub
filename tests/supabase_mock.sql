-- Isolated PostgreSQL test shim. Not part of production migrations.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create schema storage;
grant usage on schema storage to anon, authenticated;
create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text not null
);
create or replace function storage.foldername(name text)
returns text[] language sql immutable
as $ select array[split_part(name,'/',1)] $;

grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
create table auth.users (
  id uuid primary key,
  email text not null unique,
  email_confirmed_at timestamptz
);
create or replace function auth.uid() returns uuid language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
grant execute on function auth.uid() to anon, authenticated;
-- Supabase Auth JWT claim accessor; simulation only (not a cryptographic JWT).
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select case
    when nullif(current_setting('request.jwt.claim.is_anonymous',true),'') is null
      then '{}'::jsonb
    else jsonb_build_object('is_anonymous',
      current_setting('request.jwt.claim.is_anonymous',true)::boolean)
  end
$$;
grant execute on function auth.jwt() to anon, authenticated;
insert into auth.users(id,email) values
  ('00000000-0000-0000-0000-000000000001','test-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000002','test-b@example.invalid'),
  ('00000000-0000-0000-0000-000000000003','test-mod@example.invalid');
