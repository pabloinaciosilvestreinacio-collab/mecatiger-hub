# Auditoria de integridade — Rede MecaTiger (07/11/2026)

## Escopo e resultado comprovado

**Gravidade:** alta (integridade e rastreabilidade de registros moderados), **não** evidência de vazamento de dados ou de escalação de um usuário comum a moderador.

Todas as 17 tabelas `public` verificadas no Supabase hospedado estavam com RLS habilitada. O gatilho `app_private.rede_guard_write()` já bloqueia alteração de autoria, dados protegidos, backdating e bypass de moderação. O problema comprovado é mais específico:

- O papel `authenticated` tinha permissão `UPDATE` para todas as colunas de `rede_comments`, `rede_requests` e `rede_reports`.
- Os três gatilhos `BEFORE UPDATE` não comparam `new.id` com `old.id` para essas tabelas.
- Embora o PostgreSQL recuse `UPDATE id = id + ...` em coluna `GENERATED ALWAYS`, ele aceita `UPDATE id = DEFAULT`. Isso regenera o ID, mesmo sem alterar `status`, e não gera um evento no histórico de moderação.
- Demonstração **somente em PostgreSQL descartável**: workflow https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/actions/runs/42391763524; log do teste registrou `PROOF: three primary keys mutated by moderator without a status change`. A transação terminou com `ROLLBACK`. A primeira tentativa com expressão numérica falhou pelo próprio mecanismo `GENERATED ALWAYS`, sem demonstrar problema.

## Correção preparatória e testes

A migration gerada com Supabase CLI `2.122.0` em GitHub Actions é:

`supabase/migrations/20261107163418_restrict_rede_mutable_columns.sql`

Ela **não remove nem altera** tabelas, linhas, RLS, triggers ou o registro de administradores, editores e moderadores. Restringe o papel `authenticated` para atualizar apenas:

| Tabela | Colunas atualizáveis pelo cliente |
| --- | --- |
| `rede_posts` | `title`, `content`, `status` |
| `rede_comments` | `status` |
| `rede_requests` | `status` |
| `rede_reports` | `status` |

Os gatilhos continuam preenchendo os campos de auditoria no servidor; RLS define quem pode editar cada linha. Os testes novos em `tests/rls_pk_probe.sql` asseguram bloqueio de edição de identidade e id, mas também preservam alteração de título pendente pelo autor e decisões de moderação legítimas.

`scripts/audit-migration-reconciliation.mjs` conserva sete migrações históricas na lista **aplicada** e reconhece esta oitava como **pendente**. O verificador de release não pode afirmar que o banco de produção já recebeu a correção.

## Estado de implantação e decisão

**Código versionado e testado em descartável ≠ correção de produção.**

- [x] Falha reproduzida em banco descartável, sem usuário real.
- [x] Migração não destrutiva e teste de regressão preparados.
- [ ] Homologação completa com Supabase local e Playwright aprovados no commit da PR (conferir CI).
- [ ] Avaliação da janela de implantação, autorização e snapshot/rollback do banco hospedado.
- [ ] Aplicar migration somente após decisão explícita sobre a produção.
- [ ] Depois da aplicação, verificar em produção com consultas **somente leitura** se as permissões passaram a ser por coluna, e homologar com contas consentidas.

**Não aplicar manualmente a migration no banco real apenas porque a PR está verde**; GitHub Pages não implanta migrations automaticamente. Durante a pendência, a função administrativa de moderação não deve ser usada para alterar PKs — a UI atual apenas altera `status`.

## Outros pontos examinados

- `register_community_member` permanece `SECURITY DEFINER`, executável por `anon` intencionalmente para cadastro público com consentimento e acesso privado à tabela. Há risco de abuso/volume; antispam e rate limiting ainda requerem estudo sem quebrar o cadastro público.
- `meca_site_is_admin`, `meca_site_list_access` e `meca_site_set_access` exigem papel autenticado e autorização interna de administrador, com `search_path` vazio. Não substituir indiscriminadamente por `SECURITY INVOKER`.
- `mecasim-trajectories` segue exigindo JWT e autorização com RLS por proprietário. Essa auditoria não alterou Edge Function, DNS, Auth hospedado, SMTP nem GitHub Pages.
- Permanecem as tarefas de SMTP, redirects reais, domínio e ruleset documentadas na Issue #39.

Referências: [Supabase — Column Level Security](https://supabase.com/docs/guides/database/postgres/column-level-security) e [PostgreSQL — GRANT](https://www.postgresql.org/docs/current/sql-grant.html).
