# Estado de migrações e recuperação — 25/10/2026

## Resultado da ativação

As quatro migrações aditivas foram aplicadas ao Supabase hospedado em sequência, sem erro. As versões abaixo foram registradas pelo serviço e agora correspondem aos nomes dos arquivos no repositório:

- 20261025032012_rede_mecatiger_mvp
- 20261025032022_require_nonanonymous_identity
- 20261025032028_mecasim_private_trajectories
- 20261025032035_mecatiger_site_cms

A verificação posterior confirmou as tabelas novas, todas com RLS habilitado; contagem inicial zero, sem usuários Auth, sem moderadores/editors e sem Edge Functions. O bucket meca-site-gallery foi criado para WebP público de até 2 MiB. As duas tabelas legadas e o RPC de cadastro não foram alterados.

## Limite de recuperação

O inventário anterior mostrava zero inscrições individuais e uma linha agregada de métricas. As migrations não apagaram nem reescreveram essas tabelas. Não foi possível verificar uma restauração de backup no plano atual; por isso, não declarar rollback de banco testado. As mudanças são aditivas e, em caso de falha futura, corrigir com migration nova. Nunca usar db reset ou migration repair em produção.

O arquivo release/hosted-baseline-20261025.json registra metadados pós-implantação; ele não é backup.

## Estado funcional

- O site público já consulta o feed e mostra publicações aprovadas; está vazio, como esperado.
- Publicações, comentários, pedidos privados, denúncias e upload exigem uma conta autenticada e papéis autorizados.
- Ainda não há SMTP público, usuário editor ou moderador. Os formulários de escrita e o painel permanecem bloqueados no site.
- Ajuda, conexão e denúncias continuam previstas para dentro do site; não serão enviadas por e-mail.
- O aviso existente do RPC legado register_community_member continua. Removê-lo sem substituir o cadastro de métricas poderia causar regressão; revisar rate limits separadamente.

Antes de habilitar escrita, concluir Auth/SMTP, redirects estritos, provisionamento individual de editor/moderador e teste ponta a ponta.