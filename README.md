# MECATIGER FTC #32578

This is a static HTML/CSS site. Open `index.html` directly in a browser or serve the folder with any static web server.

The page uses the images in `public/` and the stylesheet in `styles.css`. No build step or JavaScript runtime is required.

## Cadastro e métricas da comunidade

Ao entrar, a página apresenta uma explicação curta e um cadastro opcional para e-mail, perfil, equipe/escola, estado e país. Os links de ajuda, mentoria, compartilhamento e iniciação apontam para comunidades e recursos existentes da FTC/FIRST.

As métricas exibidas são agregadas no Supabase: pessoas cadastradas, países, estudantes e professores/mentores. O navegador pode inserir um cadastro consentido e ler somente a linha agregada de métricas; a lista de e-mails não é exposta pela API pública. O esquema persistente está em [`supabase/schema.sql`](supabase/schema.sql).
