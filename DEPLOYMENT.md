# Publicação e operação — Meca Tiger Hub

## Estado atual (25/10/2026)

- Site estático publicado no GitHub Pages: https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/
- PRs #26, #27 e #28 mesclados; último merge: ed508f387f01f402032fcddfd33d58a8dc44a317.
- Feed público consulta posts aprovados do Supabase e apresenta estado vazio sem conteúdo aprovado.
- Quatro migrations de Rede, identidade não anônima, trajetórias privadas e CMS aplicadas. Ver release/hosted-baseline-20261025.json.
- Todas as novas tabelas têm RLS habilitado; regras de acesso continuam sem escrita anônima.
- Pedidos de ajuda/conexão e denúncias são fluxos internos planejados; o formulário não envia e-mail.

## Recursos ainda bloqueados

- Login público Magic Link: requer SMTP de envio externo verificado e redirects estritos.
- Publicar, comentar, enviar pedidos e denunciar: requer conta confirmada.
- Moderação: requer moderador individual provisionado e responsável designado.
- CMS e upload WebP: requer editor individual provisionado.
- Ainda não foi possível validar restauração de backup; não declarar rollback do banco testado.
- O RPC de cadastro de métricas legado permanece; o Advisor alerta para SECURITY DEFINER exposto. Não revogar sem substituto.

## Verificações e segurança

- Supabase hospedado saudável; migrations aplicadas em 25/10/2026.
- Inventário pós-migração confirmou todas as tabelas novas com RLS e nenhuma linha nova de conteúdo.
- Workflows no SHA fd3d530691ca55d034d26e1a04568e261addb8c9: validação estática, RLS, segredo, preview visual e Supabase descartável passaram.
- Não use db push, migration repair ou db reset sem conferir o inventário e testar recuperação. Os nomes locais das quatro migrations devem permanecer alinhados às versões remotas.

## Reversão

O commit anterior do GitHub Pages permite reverter somente o site estático. Isso não reverte migrations. Para mudanças de banco, aplicar uma migration corretiva compatível com os dados existentes; nunca declarar restauração até testá-la.