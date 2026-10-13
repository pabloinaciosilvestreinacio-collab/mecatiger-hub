# MECATIGER FTC #32578

This is a static HTML/CSS site. Open `index.html` directly in a browser or serve the folder with any static web server.

The page uses the images in `public/` and the stylesheet in `styles.css`. No build step or JavaScript runtime is required.

## Cadastro e métricas da comunidade

Ao entrar, a página apresenta uma explicação curta e um cadastro opcional para e-mail, perfil (incluindo entusiasta de robótica), equipe/escola, estado e país. Os links de ajuda, mentoria, compartilhamento e iniciação apontam para comunidades e recursos existentes da FTC/FIRST.

As métricas exibidas são agregadas no Supabase: pessoas cadastradas, estados brasileiros distintos, países, estudantes e professores/mentores. O navegador pode inserir um cadastro consentido e ler somente a linha agregada de métricas; a lista de e-mails não é exposta pela API pública. O esquema persistente está em [`supabase/schema.sql`](supabase/schema.sql).

Para revisar o formulário em toda entrada durante a prévia, use `index.html#cadastro-teste` (o hash força o painel de cadastro e o envio fica simulado, sem gravar no banco). Sem esse hash, a versão final respeita o cadastro salvo no navegador e confirma duplicidade pelo e-mail único no banco, sem contar a mesma pessoa ou estado duas vezes.

Os cards de projetos, evidências, comunidade e simulador mostram `EM DESENVOLVIMENTO` ou `EM PREPARAÇÃO` até que os materiais reais sejam publicados. O branch oficial de revisão é `codex/final-site-2026-10-13`; o branch `codex/team-tab-functional-2026-10-13` mantém a prévia funcional da aba Equipe.
