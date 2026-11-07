-- Editable project cards for the public Home and evidence page.
-- New initiatives are seeded as drafts so an editor must review and publish them.
begin;

create table public.meca_site_projects (
  id bigint generated always as identity primary key,
  slug text not null unique check (
    char_length(slug) between 2 and 64 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  title text not null check (char_length(btrim(title)) between 2 and 100),
  category text not null check (char_length(btrim(category)) between 2 and 64),
  status_label text not null check (status_label in (
    'EM PLANEJAMENTO','EM ESTRUTURAÇÃO','EM DESENVOLVIMENTO','EM ANDAMENTO','CONCLUÍDO'
  )),
  summary text not null check (char_length(btrim(summary)) between 16 and 600),
  detail text not null default '' check (char_length(btrim(detail)) <= 600),
  evidence_note text not null check (char_length(btrim(evidence_note)) between 5 and 260),
  sort_order integer not null default 100 check (sort_order between 0 and 9999),
  published boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index meca_site_projects_public_order_idx
  on public.meca_site_projects (sort_order, title) where published;
create index meca_site_projects_updated_by_idx
  on public.meca_site_projects (updated_by);

alter table public.meca_site_projects enable row level security;
revoke all on public.meca_site_projects from public, anon, authenticated;
grant select on public.meca_site_projects to anon, authenticated;
grant insert, update, delete on public.meca_site_projects to authenticated;
grant usage, select on sequence public.meca_site_projects_id_seq to authenticated;

create policy "Published projects are public"
  on public.meca_site_projects for select to anon, authenticated
  using (published);
create policy "Editors can see draft projects"
  on public.meca_site_projects for select to authenticated
  using (
    (auth.jwt()->>'is_anonymous') = 'false'
    and exists (select 1 from public.meca_site_editors e where e.user_id=(select auth.uid()))
  );
create policy "Editors insert projects"
  on public.meca_site_projects for insert to authenticated
  with check (
    updated_by=(select auth.uid())
    and (auth.jwt()->>'is_anonymous') = 'false'
    and exists (select 1 from public.meca_site_editors e where e.user_id=(select auth.uid()))
  );
create policy "Editors update projects"
  on public.meca_site_projects for update to authenticated
  using (
    (auth.jwt()->>'is_anonymous') = 'false'
    and exists (select 1 from public.meca_site_editors e where e.user_id=(select auth.uid()))
  )
  with check (
    updated_by=(select auth.uid())
    and (auth.jwt()->>'is_anonymous') = 'false'
    and exists (select 1 from public.meca_site_editors e where e.user_id=(select auth.uid()))
  );
create policy "Editors delete projects"
  on public.meca_site_projects for delete to authenticated
  using (
    (auth.jwt()->>'is_anonymous') = 'false'
    and exists (select 1 from public.meca_site_editors e where e.user_id=(select auth.uid()))
  );

insert into public.meca_site_projects
  (slug,title,category,status_label,summary,detail,evidence_note,sort_order,published)
values
  ('do-0-a-first','Do 0 à FIRST','Iniciativa educacional','EM DESENVOLVIMENTO',
    'Um projeto para aproximar estudantes do universo da robótica e da FIRST, oferecendo conhecimentos, experiências práticas e a oportunidade de conhecer uma equipe de competição.',
    'Nasceu a partir de mentorias com duas turmas do 1º ano do SESI SENAI Maracanaú.',
    'Fotos, relatos e registros desta atividade serão adicionados aqui.',10,true),
  ('robotica-no-ipred','Robótica no IPRED','Ação comunitária','EM DESENVOLVIMENTO',
    'Atividades de interação e aprendizagem que usam a robótica para despertar curiosidade e aproximar tecnologia de novos públicos.',
    'A proposta registra a aproximação entre tecnologia, comunidade e novos estudantes.',
    'Fotos, relatos e registros desta atividade serão adicionados aqui.',20,true),
  ('meca-academy','Meca Academy','Formação interna','EM ESTRUTURAÇÃO',
    'Programa interno de formação da Meca Tiger, com trilhas de programação, mecânica, eletrônica, comunicação e gestão para desenvolver novos integrantes.',
    'A estrutura será construída de forma contínua para preservar conhecimento entre temporadas.',
    'Plano de formação, materiais e registros serão adicionados após a organização da equipe.',30,false),
  ('meca-conecta','Meca Conecta','Conexões STEM','EM ESTRUTURAÇÃO',
    'Iniciativa para aproximar a equipe de empresas, universidades e profissionais STEM por meio de mentorias, visitas técnicas e troca de conhecimentos.',
    'As conexões serão registradas com consentimento e conforme forem confirmadas.',
    'Parcerias, encontros e aprendizados serão registrados quando acontecerem.',40,false),
  ('ftc-nas-escolas','FTC nas Escolas','Expansão educacional','EM PLANEJAMENTO',
    'Projeto para levar oficinas de robótica a outras escolas, apresentar a FIRST e incentivar novos estudantes e equipes a entrarem na FTC.',
    'O formato, as escolas participantes e o calendário serão definidos antes da execução.',
    'Materiais, oficinas e impactos serão publicados após o início do projeto.',50,false)
on conflict (slug) do nothing;

commit;
