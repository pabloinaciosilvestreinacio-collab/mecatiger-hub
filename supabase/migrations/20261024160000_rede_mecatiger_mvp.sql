-- Meca Tiger Rede MVP. REVIEW BEFORE APPLYING IN PRODUCTION.
-- This migration is additive. It does not alter existing registrations or metrics.
-- A moderator must be provisioned by a trusted database operator, never by client code.
begin;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table if not exists public.rede_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 60),
  created_at timestamptz not null default now()
);

create table if not exists public.rede_moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.rede_posts (
  id bigint generated always as identity primary key,
  author_id uuid not null references public.rede_profiles(id) on delete cascade,
  kind text not null check (kind in ('conhecimento', 'duvida')),
  category text not null check (category in ('programacao','mecanica','eletronica','ftc','projetos','ajuda','conhecimento')),
  title text not null check (char_length(btrim(title)) between 6 and 120),
  content text not null check (char_length(btrim(content)) between 15 and 5000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  moderated_by uuid references auth.users(id),
  moderation_note text check (moderation_note is null or char_length(moderation_note) <= 350),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rede_posts_public_idx on public.rede_posts (created_at desc, id desc) where status='approved';
create index if not exists rede_posts_author_idx on public.rede_posts (author_id, created_at desc);

create table if not exists public.rede_comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.rede_posts(id) on delete cascade,
  author_id uuid not null references public.rede_profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 3 and 1500),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  moderated_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists rede_comments_public_idx on public.rede_comments (post_id, created_at asc) where status='approved';

create table if not exists public.rede_requests (
  id bigint generated always as identity primary key,
  author_id uuid not null references public.rede_profiles(id) on delete cascade,
  kind text not null check (kind in ('ajuda','conexao')),
  category text not null check (category in ('programacao','mecanica','eletronica','ftc','projetos','ajuda','conhecimento')),
  title text not null check (char_length(btrim(title)) between 6 and 120),
  details text not null check (char_length(btrim(details)) between 15 and 2500),
  status text not null default 'pending' check (status in ('pending','em_analise','concluido','rejeitado')),
  created_at timestamptz not null default now()
);
create index if not exists rede_requests_author_idx on public.rede_requests (author_id, created_at desc);

create table if not exists public.rede_reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.rede_profiles(id) on delete cascade,
  post_id bigint references public.rede_posts(id) on delete cascade,
  comment_id bigint references public.rede_comments(id) on delete cascade,
  reason text not null check (char_length(btrim(reason)) between 10 and 500),
  status text not null default 'pending' check (status in ('pending','reviewed','dismissed')),
  created_at timestamptz not null default now(),
  constraint exactly_one_target check ((post_id is not null) <> (comment_id is not null))
);
create index if not exists rede_reports_status_idx on public.rede_reports(status, created_at);

create table if not exists public.rede_moderation_log (
  id bigint generated always as identity primary key,
  moderator_id uuid references auth.users(id),
  entity text not null check (entity in ('post','comment','request','report')),
  entity_id bigint not null,
  previous_status text,
  new_status text not null,
  logged_at timestamptz not null default now()
);

-- RLS defaults to deny: no policies on moderator membership or audit writes.
alter table public.rede_profiles enable row level security;
alter table public.rede_moderators enable row level security;
alter table public.rede_posts enable row level security;
alter table public.rede_comments enable row level security;
alter table public.rede_requests enable row level security;
alter table public.rede_reports enable row level security;
alter table public.rede_moderation_log enable row level security;

revoke all on public.rede_profiles, public.rede_moderators, public.rede_posts,
  public.rede_comments, public.rede_requests, public.rede_reports, public.rede_moderation_log
  from public, anon, authenticated;
grant select on public.rede_profiles, public.rede_posts, public.rede_comments to anon, authenticated;
grant insert, update on public.rede_profiles to authenticated;
grant select on public.rede_moderators, public.rede_requests, public.rede_reports, public.rede_moderation_log to authenticated;
grant insert, update, delete on public.rede_posts, public.rede_comments to authenticated;
grant insert, update on public.rede_requests, public.rede_reports to authenticated;
grant usage on sequence public.rede_posts_id_seq, public.rede_comments_id_seq,
  public.rede_requests_id_seq, public.rede_reports_id_seq to authenticated;

create policy "Public display names" on public.rede_profiles for select to anon, authenticated using (true);
create policy "Users create only own profiles" on public.rede_profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "Users update only own profiles" on public.rede_profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Clients can read only THEIR OWN membership; INSERT/UPDATE/DELETE intentionally not granted.
create policy "Read own moderator membership" on public.rede_moderators for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Visitors see approved posts" on public.rede_posts for select to anon, authenticated using (status='approved');
create policy "Authors read own posts" on public.rede_posts for select to authenticated using (author_id=(select auth.uid()));
create policy "Moderators read posts" on public.rede_posts for select to authenticated
  using (exists (select 1 from public.rede_moderators m where m.user_id=(select auth.uid())));
create policy "Authors submit pending posts" on public.rede_posts for insert to authenticated
  with check (author_id=(select auth.uid()) and status='pending' and moderated_by is null and moderation_note is null);
create policy "Authors edit pending posts" on public.rede_posts for update to authenticated
  using (author_id=(select auth.uid()) and status='pending')
  with check (author_id=(select auth.uid()) and status='pending');
create policy "Moderators update posts" on public.rede_posts for update to authenticated
  using (exists (select 1 from public.rede_moderators m where m.user_id=(select auth.uid())))
  with check (exists (select 1 from public.rede_moderators m where m.user_id=(select auth.uid())));
create policy "Authors remove own posts" on public.rede_posts for delete to authenticated
  using (author_id=(select auth.uid()));
create policy "Moderators remove posts" on public.rede_posts for delete to authenticated
  using (exists (select 1 from public.rede_moderators m where m.user_id=(select auth.uid())));

create policy "Visitors see approved comments" on public.rede_comments for select to anon, authenticated using
  (status='approved' and exists (select 1 from public.rede_posts p where p.id=post_id and p.status='approved'));
create policy "Authors read own comments" on public.rede_comments for select to authenticated using (author_id=(select auth.uid()));
create policy "Moderators read comments" on public.rede_comments for select to authenticated
  using (exists (select 1 from public.rede_moderators m where m.user_id=(select auth.uid())));
create policy "Authors submit pending comments" on public.rede_comments for insert to authenticated
  with check (author_id=(select auth.uid()) and status='pending' and moderated_by is null
    and exists (select 1 from public.rede_posts p where p.id=post_id and p.status='approved'));
create policy "Authors remove own comments" on public.rede_comments for delete to authenticated using (author_id=(select auth.uid()));
create policy "Moderators update comments" on public.rede_comments for update to authenticated
  using (exists (select 1 from public.rede_moderators m where m.user_id=(select auth.uid())))
  with check (exists (select 1 from public.rede_moderators m where m.user_id=(select auth.uid())));

create policy "Authors read own private requests" on public.rede_requests for select to authenticated using (author_id=(select auth.uid()));
create policy "Moderators read requests" on public.rede_requests for select to authenticated
  using (exists (select 1 from public.rede_moderators m where m.user_id=(select auth.uid())));
create policy "Authors submit requests" on public.rede_requests for insert to authenticated
  with check (author_id=(select auth.uid()) and status='pending');
create policy "Moderators manage request status" on public.rede_requests for update to authenticated
  using (exists (select 1 from public.rede_moderators m where m.user_id=(select auth.uid())))
  with check (exists (select 1 from public.rede_moderators m where m.user_id=(select auth.uid())));

create policy "Reporters read own reports" on public.rede_reports for select to authenticated using (reporter_id=(select auth.uid()));
create policy "Moderators read reports" on public.rede_reports for select to authenticated
  using (exists (select 1 from public.rede_moderators m where m.user_id=(select auth.uid())));
create policy "Users create reports" on public.rede_reports for insert to authenticated
  with check (reporter_id=(select auth.uid()) and status='pending');
create policy "Moderators resolve reports" on public.rede_reports for update to authenticated
  using (exists (select 1 from public.rede_moderators m where m.user_id=(select auth.uid())))
  with check (exists (select 1 from public.rede_moderators m where m.user_id=(select auth.uid())));

create policy "Moderators inspect decisions" on public.rede_moderation_log for select to authenticated
  using (exists (select 1 from public.rede_moderators m where m.user_id=(select auth.uid())));

-- These triggers run outside the exposed API schema; they enforce immutable ownership,
-- prevent privilege changes and apply server-side quotas irrespective of browser code.
create or replace function app_private.rede_guard_write() returns trigger
language plpgsql security definer set search_path='' as $$
declare
  uid uuid := auth.uid();
  is_mod boolean := coalesce(exists (select 1 from public.rede_moderators where user_id=uid),false);
  max_actions integer;
  window_length interval;
  recent_count bigint;
begin
  if tg_op='INSERT' then
    if uid is not null then
      -- Prevent backdating records to bypass quotas or falsify chronology.
      if tg_table_name in ('rede_posts','rede_comments','rede_requests','rede_reports') then
        new.created_at := now();
      end if;
      if tg_table_name='rede_posts' then max_actions:=5; window_length:=interval '1 hour';
        select count(*) into recent_count from public.rede_posts where author_id=uid and created_at>now()-window_length;
      elsif tg_table_name='rede_comments' then max_actions:=10; window_length:=interval '10 minutes';
        select count(*) into recent_count from public.rede_comments where author_id=uid and created_at>now()-window_length;
      elsif tg_table_name='rede_requests' then max_actions:=5; window_length:=interval '1 day';
        select count(*) into recent_count from public.rede_requests where author_id=uid and created_at>now()-window_length;
      elsif tg_table_name='rede_reports' then max_actions:=5; window_length:=interval '1 day';
        select count(*) into recent_count from public.rede_reports where reporter_id=uid and created_at>now()-window_length;
      else max_actions:=null; end if;
      if max_actions is not null and recent_count>=max_actions then
        raise exception 'Rate limit reached' using errcode='P0001';
      end if;
    end if;
    return new;
  end if;

  if tg_table_name='rede_posts' then
    if new.author_id is distinct from old.author_id or new.id is distinct from old.id
      or new.created_at is distinct from old.created_at then
      raise exception 'Immutable post identity' using errcode='42501';
    end if;
    if uid is not null and not is_mod and (
      new.status is distinct from old.status
      or new.moderated_by is distinct from old.moderated_by
      or new.moderation_note is distinct from old.moderation_note
    ) then raise exception 'Only moderators can change moderation' using errcode='42501'; end if;
    if uid is not null and is_mod and new.status is distinct from old.status then new.moderated_by:=uid; end if;
    new.updated_at:=now();
  elsif tg_table_name='rede_comments' then
    if new.author_id is distinct from old.author_id or new.post_id is distinct from old.post_id
      or new.content is distinct from old.content or new.created_at is distinct from old.created_at then
      raise exception 'Comment content is immutable after submission' using errcode='42501'; end if;
    if uid is not null and not is_mod then raise exception 'Moderator only' using errcode='42501'; end if;
    if uid is not null and new.status is distinct from old.status then new.moderated_by:=uid; end if;
  elsif tg_table_name='rede_requests' then
    if new.author_id is distinct from old.author_id or new.kind is distinct from old.kind
      or new.category is distinct from old.category or new.title is distinct from old.title
      or new.details is distinct from old.details or new.created_at is distinct from old.created_at then
      raise exception 'Only request status can change' using errcode='42501'; end if;
  elsif tg_table_name='rede_reports' then
    if new.reporter_id is distinct from old.reporter_id or new.post_id is distinct from old.post_id
      or new.comment_id is distinct from old.comment_id or new.reason is distinct from old.reason
      or new.created_at is distinct from old.created_at then
      raise exception 'Only report status can change' using errcode='42501'; end if;
  end if;
  return new;
end $$;
revoke all on function app_private.rede_guard_write() from public, anon, authenticated;

create or replace function app_private.rede_log_status_change() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.status is distinct from old.status then
    insert into public.rede_moderation_log(moderator_id,entity,entity_id,previous_status,new_status)
    values(auth.uid(),case tg_table_name
      when 'rede_posts' then 'post' when 'rede_comments' then 'comment'
      when 'rede_requests' then 'request' else 'report' end,
      new.id,old.status,new.status);
  end if;
  return new;
end $$;
revoke all on function app_private.rede_log_status_change() from public, anon, authenticated;

create trigger rede_guard_posts before insert or update on public.rede_posts
  for each row execute function app_private.rede_guard_write();
create trigger rede_guard_comments before insert or update on public.rede_comments
  for each row execute function app_private.rede_guard_write();
create trigger rede_guard_requests before insert or update on public.rede_requests
  for each row execute function app_private.rede_guard_write();
create trigger rede_guard_reports before insert or update on public.rede_reports
  for each row execute function app_private.rede_guard_write();

create trigger rede_log_posts after update of status on public.rede_posts
  for each row execute function app_private.rede_log_status_change();
create trigger rede_log_comments after update of status on public.rede_comments
  for each row execute function app_private.rede_log_status_change();
create trigger rede_log_requests after update of status on public.rede_requests
  for each row execute function app_private.rede_log_status_change();
create trigger rede_log_reports after update of status on public.rede_reports
  for each row execute function app_private.rede_log_status_change();

commit;

-- To grant moderator access, an authorized administrator must run:
-- insert into public.rede_moderators(user_id) values ('<auth-user-uuid>');
-- DO NOT ship admin UUIDs or privileged service keys in public source code.
