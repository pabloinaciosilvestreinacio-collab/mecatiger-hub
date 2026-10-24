# Auditoria e reconciliação de migrações — Meca Tiger

**Data:** 24/10/2026. **Decisão:** NO-GO para execução de migrations em produção. Este documento não é autorização, procedimento automatizado de reparo nem promessa de equivalência entre o banco local e o remoto.

## 1. Investigação com fonte da verdade

Repositório: `pabloinaciosilvestreinacio-collab/mecatiger-hub`, sobre o PR #16. Projeto Supabase conectado: `rnnzumzqilkuecvgsjnv`.

Consultas **somente leitura** realizadas nesta auditoria: `list_migrations`, `list_tables`, e `SELECT` nos catálogos `supabase_migrations.schema_migrations`, `pg_class`, `pg_policies` e `pg_proc`. **Não houve** `INSERT`, `UPDATE`, `DELETE`, DDL, deploy, Supabase CLI com credenciais hospedadas nem consulta ao conteúdo pessoal de cadastros.

### Histórico aplicado no Supabase hospedado

| Ordem | Versão | Nome |
|---|---|---|
| 1 | `20261013171020` | `create_community_registration_metrics` |
| 2 | `20261013173230` | `count_competitors_as_students` |
| 3 | `20261013174946` | `add_brazilian_state_metrics` |
| 4 | `20261019231824` | `secure_public_registration_rpc_v2` |

Objetos hospedados existentes na schema `public`: `community_registrations` (RLS ativo, **0 policies**, 1 trigger específico) e `community_metrics` (RLS ativo, 1 policy). O Supabase havia informado **nenhuma Edge Function** e nenhuma das novas tabelas da Rede, Meca Sim ou CMS.

### Histórico de migrations versionadas nesta branch

| Ordem pretendida | Versão | Arquivo | Escopo |
|---|---|---|---|
| 5 | `20261024160000` | `20261024160000_rede_mecatiger_mvp.sql` | Estruturas da Rede, políticas de postagens, comentários, denúncias, pedidos e moderação |
| 6 | `20261024163000` | `20261024163000_require_nonanonymous_identity.sql` | Restrição RLS adicional contra identidades Auth anônimas |
| 7 | `20261024170000` | `20261024170000_mecasim_private_trajectories.sql` | Trajetórias privadas e validações |
| 8 | `20261024190000` | `20261024190000_mecatiger_site_cms.sql` | Editores, texto, galeria e bucket Storage |

A branch contém **somente as versões 5–8**. Portanto, a cadeia de migrations aplicada no hospedado **não está representada integralmente** no checkout, apesar de as versões locais serem posteriores e seus objetos serem distintos dos já presentes no servidor. Esse é um bloqueio operacional, não uma falha comprovada no SQL. Nunca presumir que `db push` é seguro.

## 2. Auditoria de risco do SQL novo

Os arquivos novos foram inspecionados por nome, operação e objetos alterados. **Não contêm migrações que apaguem ou atualizem diretamente `community_registrations`, `community_metrics` ou substituam `register_community_member`.** As novas migrações criam tabelas de Rede/CMS e serviços próprios; algumas têm `ON DELETE CASCADE` em **novas relações de usuários**, o que não é uma exclusão imediata de usuários, mas precisa de avaliação sobre retenção e exclusão futura.

**Limite da garantia:** inspeção automática de sintaxe e padrões não substitui revisão semântica do SQL, do estado atual do Postgres, das dependências de `auth.users` e `storage.objects` ou das permissões globais. Os testes RLS/Postgres e Supabase local são evidências independentes. A auditoria offline **não lê o banco remoto durante o CI**; a fotografia `release/hosted-baseline-20261024.json` é histórica e deve ser atualizada por leitura autorizada antes da implantação.

### Conformidade do código e bloqueios

- `node scripts/audit-migration-reconciliation.mjs`: auditável **sem rede**, verifica conjunto/ordem das quatro migrações, versão sem duplicidade, SQL não destrutivo, objetos antigos protegidos e RLS no inventário hospedado. Saída JSON com `historyAligned=false` e `requiresManualReconciliation=true` mesmo se as verificações locais forem aprovadas.
- `node scripts/audit-migration-reconciliation.mjs --require-aligned`: **exit code 3 proposital**, enquanto o histórico não estiver reconciliado.
- `node scripts/audit-migration-reconciliation.mjs --authorize-production`: **exit code 4 proposital**; não existe autorização via este script.
- `npm run test:unit` inclui testes negativos (DROP/TRUNCATE, GRANT/REVOKE e escrita nas tabelas antigas, migração inesperada, duplicação, colisão de versões).
- GitHub Actions `rede-validate.yml` executa este script e os testes de regressão. Outros workflows continuam validando RLS em PostgreSQL descartável e Auth/Storage/UI em Supabase CLI local.
- Teste de compatibilidade legada em PostgreSQL **descartável**: `tests/legacy-schema-before.sql` monta uma **aproximação sintética** (com dados `@mecatiger.invalid`) das tabelas, RPC e policy antigos a partir dos metadados inspecionados; o CI aplica as migrações novas em seguida e `tests/legacy-schema-after.sql` compara fingerprints das estruturas, verifica conservação de registros fictícios e exercita novamente a RPC pública. O **trigger antigo verdadeiro não foi capturado**; o trigger sintético é apenas um marcador de preservação, não prova de equivalência com produção. Isto não recupera os quatro SQL históricos originais.
- Não foi criado nenhum arquivo falso das migrations antigas. **Não inserir uma baseline inventada na linha do tempo.**

## 3. Revisão de segurança do cadastro antigo

O catálogo hospedado confirma `public.register_community_member(...)` com `SECURITY DEFINER`, `SET search_path TO ''` e `EXECUTE` permitido a `anon` e `authenticated`. Pelo corpo atualmente inspecionado, exige `p_consent=true`, normaliza o e-mail, insere apenas em `public.community_registrations` e usa `ON CONFLICT(email) DO NOTHING`. Uma função de inscrição pública pode precisar dessa permissão; **revogá-la sem substituto quebraria o formulário atual**.

Os avisos do Supabase Advisor para `SECURITY DEFINER` são legítimos **pontos de revisão**, não prova de comprometimento. O perigo operacional restante é abuso/bots/flood de inscrições e ausência de um plano documentado de monitoramento e retenção. A tabela de registros com RLS sem policy é coerente com acesso direto bloqueado e cadastro mediado pela RPC, mas isso precisa ser confirmado continuamente.

Referência oficial: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable

### Sem alterar produção, recomenda-se antes de ativar a Rede

1. Revisar regra de consentimento e limites dos argumentos da RPC; testar spam, limites de inscrições e observabilidade em ambiente isolado.
2. Confirmar que o painel de métricas usa apenas informações agregadas e que o cadastro opcional não confere sessão/role na Rede.
3. Estabelecer rate limiting/CAPTCHA e responsável pelo atendimento a titulares e menores, conforme disponibilidade gratuita e autorização.
4. Não publicar e-mails nem valores reais nos logs ou PRs.

## 4. Reconciliação correta — sequência para uma decisão posterior

**Etapa A (sem escrita, já feita):** exportar **somente metadados** do histórico e dos objetos públicos; guardar a fotografia sem dados pessoais. Confirmar `main` e PRs, e não alterar o banco.

**Etapa B (não concluída):** localizar a **fonte original exata** dos quatro scripts de migração antigos (histórico do projeto, arquivos do time ou backups válidos). Se não existirem, derivar um baseline da estrutura real com ferramenta apropriada, revisão humana de funções, políticas e triggers, e registrar explicitamente o procedimento. **Não fabricar conteúdo de migrations aplicadas apenas porque seus nomes são conhecidos.** Se o histórico e o SQL original não coincidirem, parar e decidir estratégia com operador autorizado.

**Etapa C (isolada, após obtenção de fonte):** montar novo ambiente Supabase **local** com as migrations antigas autenticamente reconstruídas e, depois, as quatro novas na ordem. Executar integralmente integração Postgres RLS, Auth, CMS Storage, Edge Function, API e navegador. Verificar que o cadastro/métricas funciona sem regressão. Não usar dados da produção como fixtures.

**Etapa D (revisão pré-operação):** obter inventário fresco do hosted (versões, existência dos objetos, `pg_get_functiondef`, policies, trigger DDL) e comparar diffs/versões do checkout. Confirmar backup/restauração e limites gratuitos. Revisar dry-run ou plano de mudanças **sem aplicar**. Qualquer operação que exija autenticar/linkar/provisionar ou que escreva no banco precisa de autorização separada do responsável.

**Etapa E (somente com autorização explícita futura):** aprovar uma estratégia de migração específica para manter os quatro registros históricos íntegros, aplicar as novas alterações na ordem e verificar funções/permissions. O comando exato dependerá da reconciliação e de `supabase --help` na versão realmente usada. Proibido presumir que `migration repair` serve para isso; jamais rodá-lo automaticamente.

**Etapa F (pós-implantação autorizada):** confirmar existência das tabelas, policies, bucket, restrições, Edge Function e rotas/Auth hospedadas; guardar evidências sanitizadas e plano de retorno. Sem aprovação de SMTP e acesso real, Rede pública continua NO-GO.

### NÃO EXECUTAR neste ciclo

`supabase login`, `supabase link`, `supabase db push`, `supabase migration repair`, `supabase functions deploy`, `db reset` contra hosted, criação de Supabase branch paga, merge de PR, deploy de Pages, provisionamento de usuários reais, inclusão de chaves privadas em arquivos.

## 5. Evidências e limites

- Fotografia do projeto: `release/hosted-baseline-20261024.json` (sem registros pessoais).
- Scanner: `scripts/audit-migration-reconciliation.mjs`.
- Regressão: `tests/migration-reconciliation.test.mjs`.
- Roteiro geral: `LANCAMENTO_MECATIGER_20261025.md`.
- Fonte da verdade neste ciclo: GitHub PR draft; manter hashes dos workflows do **head atual** na descrição do PR ao concluir.
- Bloqueio remanescente mais importante: **origem do SQL histórico antigo não confirmada**. Sem ela, não há reconciliação plena, mesmo que todos os testes locais estejam verdes.
