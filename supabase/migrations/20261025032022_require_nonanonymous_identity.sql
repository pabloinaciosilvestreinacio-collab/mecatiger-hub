-- Defense-in-depth for Supabase Auth anonymous identities.
-- Anonymous Auth users assume the authenticated Postgres role; simple TO authenticated is not enough.
-- Permissive ownership/moderation policies exist in the preceding Rede MVP migration.
-- This migration was applied to the hosted project on 2026-10-25.
begin;

-- Fail closed: missing is_anonymous claim must not grant write permission.
-- Public SELECT policies stay intact so everyone can read approved posts/comments.
create policy "Only verified identities can create profiles" on public.rede_profiles
  as restrictive for insert to authenticated
  with check ((select (auth.jwt()->>'is_anonymous')::boolean) is false);
create policy "Only verified identities can edit profiles" on public.rede_profiles
  as restrictive for update to authenticated
  using ((select (auth.jwt()->>'is_anonymous')::boolean) is false)
  with check ((select (auth.jwt()->>'is_anonymous')::boolean) is false);

create policy "Only verified identities can publish" on public.rede_posts
  as restrictive for insert to authenticated
  with check ((select (auth.jwt()->>'is_anonymous')::boolean) is false);
create policy "Only verified identities can edit publications" on public.rede_posts
  as restrictive for update to authenticated
  using ((select (auth.jwt()->>'is_anonymous')::boolean) is false)
  with check ((select (auth.jwt()->>'is_anonymous')::boolean) is false);
create policy "Only verified identities can remove publications" on public.rede_posts
  as restrictive for delete to authenticated
  using ((select (auth.jwt()->>'is_anonymous')::boolean) is false);
create policy "Anonymous identity sees only approved publications" on public.rede_posts
  as restrictive for select to authenticated
  using (status = 'approved' or ((select (auth.jwt()->>'is_anonymous')::boolean) is false));

create policy "Only verified identities can comment" on public.rede_comments
  as restrictive for insert to authenticated
  with check ((select (auth.jwt()->>'is_anonymous')::boolean) is false);
create policy "Only verified identities can moderate comments" on public.rede_comments
  as restrictive for update to authenticated
  using ((select (auth.jwt()->>'is_anonymous')::boolean) is false)
  with check ((select (auth.jwt()->>'is_anonymous')::boolean) is false);
create policy "Only verified identities can remove comments" on public.rede_comments
  as restrictive for delete to authenticated
  using ((select (auth.jwt()->>'is_anonymous')::boolean) is false);
create policy "Anonymous identity sees only approved comments" on public.rede_comments
  as restrictive for select to authenticated
  using (status = 'approved' or ((select (auth.jwt()->>'is_anonymous')::boolean) is false));

create policy "Only verified identities can request assistance" on public.rede_requests
  as restrictive for insert to authenticated
  with check ((select (auth.jwt()->>'is_anonymous')::boolean) is false);
create policy "Only verified identities can manage requests" on public.rede_requests
  as restrictive for update to authenticated
  using ((select (auth.jwt()->>'is_anonymous')::boolean) is false)
  with check ((select (auth.jwt()->>'is_anonymous')::boolean) is false);
create policy "Anonymous identities cannot read private requests" on public.rede_requests
  as restrictive for select to authenticated
  using ((select (auth.jwt()->>'is_anonymous')::boolean) is false);

create policy "Only verified identities can file reports" on public.rede_reports
  as restrictive for insert to authenticated
  with check ((select (auth.jwt()->>'is_anonymous')::boolean) is false);
create policy "Only verified identities can resolve reports" on public.rede_reports
  as restrictive for update to authenticated
  using ((select (auth.jwt()->>'is_anonymous')::boolean) is false)
  with check ((select (auth.jwt()->>'is_anonymous')::boolean) is false);
create policy "Anonymous identities cannot read private reports" on public.rede_reports
  as restrictive for select to authenticated
  using ((select (auth.jwt()->>'is_anonymous')::boolean) is false);

create policy "Anonymous identities cannot inspect moderator status" on public.rede_moderators
  as restrictive for select to authenticated
  using ((select (auth.jwt()->>'is_anonymous')::boolean) is false);
create policy "Anonymous identities cannot inspect moderation logs" on public.rede_moderation_log
  as restrictive for select to authenticated
  using ((select (auth.jwt()->>'is_anonymous')::boolean) is false);

commit;
