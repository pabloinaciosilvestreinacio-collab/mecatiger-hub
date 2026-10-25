# Reconciliação e recuperação — inventário de 25/10/2026

**Estado:** inventário concluído por leitura do catálogo; banco hospedado não foi alterado. A fotografia sanitizada está em `release/hosted-baseline-20261025.json`.

## Fonte da verdade

O histórico hospedado contém quatro migrations históricas (13 e 19/10/2026). O checkout contém quatro migrations posteriores para Rede, Meca Sim e CMS. Os SQLs históricos originais não estão no repositório. Não foram inventados arquivos antigos, nem inseridas versões falsas no histórico do Supabase.

O catálogo lido nesta data mostra projeto saudável no plano Free, duas tabelas legadas, zero inscrições individuais, uma linha agregada com contagens zero, zero usuários Auth, nenhum bucket customizado e nenhuma função Edge. As tabelas da Rede, CMS e Meca Sim ainda não existem no hosted.

A fixture `tests/legacy-schema-before.sql` continua sendo uma aproximação isolada de CI, não uma baseline histórica. O JSON é somente metadado e não é cópia de segurança nem permite restauração.

## Revisão de integridade e risco

- As migrations novas são aditivas em relação a `community_registrations`, `community_metrics` e `register_community_member`; não as substituem.
- A tabela agregada legada deve permanecer intacta. A tabela de inscrições está vazia neste snapshot.
- O Advisor informa RLS sem policy direta na tabela de inscrições (INFO) e função `SECURITY DEFINER` pública (WARN). Não revoguei sua permissão; o cadastro legado depende dela. Limites contra abuso ainda precisam de decisão e monitoramento.
- CMS criará um bucket público destinado a imagens aprovadas. A equipe deve publicar somente fotos autorizadas, com cuidado especial para imagens de menores.
- Nenhum método de backup/restauração foi validado no plano Free durante esta auditoria.

## Etapas para ativar sem improvisar

1. Rodar os workflows descartáveis no SHA candidato: RLS PostgreSQL, Supabase local Auth/Storage, Meca Sim, Playwright, responsividade e axe-core.
2. Confirmar cópia/backup recuperável por mecanismo suportado no projeto. Se não houver backup sem custo, registrar a limitação antes de qualquer escrita persistente.
3. Revisar o SQL final e a sequência das quatro migrations sem usar `db push`, `migration repair` ou alteração manual do histórico.
4. Instalar schema e políticas somente pela via oficial aprovada após revisão completa; conferir que métricas e RPC antigas continuam iguais.
5. Configurar SMTP externo verificado e redirects PKCE para login público. O SMTP padrão não libera magic links livremente a visitantes.
6. Provisionar editor e moderador apenas para UUIDs de contas confirmadas, depois de definir responsáveis de moderação. Não existe conta administrativa provisionada.
7. Testar feed aprovado/pendente, comentários, ajuda, conexão, denúncias, uploads WebP e edição de páginas com usuários descartáveis. Em produção, usar apenas contas de teste autorizadas e apagar seus dados pelo procedimento aprovado.

## Resposta a falha

Sem um backup restaurável comprovado, não declarar rollback de banco. Se uma migration já tiver sido aplicada e alguma verificação falhar, suspender novos envios, preservar dados e corrigir com migration aditiva. Nunca executar `db reset`, apagar tabelas que receberam dados, ou tentar “voltar” o histórico com `migration repair`. O recurso de retorno da camada estática é o commit anterior do GitHub Pages; isso não reverte DDL.

**Decisão atual:** o código do feed e CMS pode ser preparado e homologado, mas Feed, login, solicitações e edição hospedados permanecem bloqueados até que migrações, SMTP/Auth e papéis sejam validados.
