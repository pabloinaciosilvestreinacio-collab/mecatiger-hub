-- Generated via Supabase CLI 2.122.0 in disposable GitHub Actions.
-- Non-destructive: reduce the set of client-editable columns; leave RLS,
-- existing data, indexes, triggers, service_role and privileged RPCs unchanged.
-- Moderation is status-only; pending post authors edit title/content.
-- DO NOT apply to production without approval and disposable E2E verification.
begin;

revoke update on table public.rede_posts, public.rede_comments,
  public.rede_requests, public.rede_reports from authenticated;

grant update (title, content, status) on table public.rede_posts to authenticated;
grant update (status) on table public.rede_comments to authenticated;
grant update (status) on table public.rede_requests to authenticated;
grant update (status) on table public.rede_reports to authenticated;

commit;
