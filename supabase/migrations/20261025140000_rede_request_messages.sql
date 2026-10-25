begin;

create table public.rede_request_messages (
  id bigint generated always as identity primary key,
  request_id bigint not null references public.rede_requests(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(btrim(body)) between 1 and 3000),
  created_at timestamptz not null default now()
);

create index rede_request_messages_thread_idx
  on public.rede_request_messages (request_id, created_at, id);

alter table public.rede_request_messages enable row level security;

revoke all on public.rede_request_messages from public, anon, authenticated;
grant select, insert on public.rede_request_messages to authenticated;
grant usage, select on sequence public.rede_request_messages_id_seq to authenticated;

create policy "Request authors and moderators read request messages"
  on public.rede_request_messages for select to authenticated
  using (
    exists (
      select 1
      from public.rede_requests r
      where r.id = request_id
        and (
          r.author_id = (select auth.uid())
          or exists (
            select 1 from public.rede_moderators m
            where m.user_id = (select auth.uid())
          )
        )
    )
  );

create policy "Authors and moderators add request messages"
  on public.rede_request_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.rede_requests r
      where r.id = request_id
        and (
          (
            r.author_id = (select auth.uid())
            and r.status in ('pending','em_analise')
          )
          or exists (
            select 1 from public.rede_moderators m
            where m.user_id = (select auth.uid())
          )
        )
    )
  );

commit;
