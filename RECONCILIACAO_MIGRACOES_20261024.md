# Reconciliação de migrações — estado pós-ativação (25/10/2026)

Este documento substitui a fotografia de 24/10. O estado atual e o inventário pós-migração estão em MIGRATION_RECOVERY_PLAN_20261025.md e release/hosted-baseline-20261025.json.

## Histórico hospedado verificado

O Supabase contém oito migrações, em ordem:

| Versão | Nome |
|---|---|
| 20261013171020 | create_community_registration_metrics |
| 20261013173230 | count_competitors_as_students |
| 20261013174946 | add_brazilian_state_metrics |
| 20261019231824 | secure_public_registration_rpc_v2 |
| 20261025032012 | rede_mecatiger_mvp |
| 20261025032022 | require_nonanonymous_identity |
| 20261025032028 | mecasim_private_trajectories |
| 20261025032035 | mecatiger_site_cms |

As quatro últimas versões estão alinhadas aos arquivos em supabase/migrations. Os SQLs históricos de outubro não estão no checkout; não inventar baselines nem reparar o histórico manualmente.

## Resultado e limites

- As migrações novas são aditivas; as duas tabelas antigas de cadastro e métricas, e a RPC de cadastro, foram preservadas.
- As 12 tabelas novas estão com RLS habilitado; as contagens começam em zero.
- O bucket meca-site-gallery aceita WebP público até 2 MiB.
- O feed público foi ligado em modo somente leitura.
- Login, gravação de posts, ajuda, conexão, denúncia e CMS ainda dependem de Auth/SMTP e contas de equipe.
- O Security Advisor ainda avisa que register_community_member é SECURITY DEFINER e executável por anon/authenticated. Não revogar sem substituir o cadastro legado.
- Nenhum backup/restauração do plano Free foi validado. O inventário sanitizado não é backup.

Não usar db push, migration repair ou db reset até consultar novamente o histórico e confirmar o estado do checkout. Para alterações futuras, usar a sequência de versões sincronizada e migrations corretivas aditivas.
