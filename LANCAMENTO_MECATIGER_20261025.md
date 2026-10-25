# Estado de lançamento — Meca Tiger Hub (25/10/2026)

## Estado confirmado

O site está publicado em [GitHub Pages](https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/). A `main` que iniciou este ciclo era `3782fd9195c4b2b614ec586a2f54b4799fb210c8`; PR #25 já está mesclado.

| Área | Status |
|---|---|
| Site institucional e navegação | Publicados |
| Cadastro opcional de métricas | Publicado e usa RPC legado; cadastro não cria conta da Rede |
| Demonstração Meca Sim | Pública e demonstrativa; não é simulação de física nem o app completo |
| Feed de comunidade | Código pronto, banco hospedado ainda sem tabelas Rede |
| Ajuda, conexão e denúncias pelo site | Formulários dependem das tabelas e login da Rede |
| Login público | Bloqueado: SMTP externo/domínio remetente ainda não homologados |
| Painel de edição | Código inclui textos, galeria WebP e páginas/abas; backend e usuário editor não estão ativos |
| Moderadores | Nenhum usuário real provisionado |
| Banco | Quatro migrations históricas diferem das quatro locais; inventário sanitizado e plano em `release/hosted-baseline-20261025.json` e `MIGRATION_RECOVERY_PLAN_20261025.md` |

## O que o painel permitirá

Depois de ativado com RLS e um editor autorizado, `admin.html` permite editar textos, enviar fotos convertidas para WebP de até 2 MiB, escrever/revisar páginas, publicar rascunhos e criar abas de navegação. `conteudo.html` lista páginas publicadas; `pagina.html?slug=...` exibe o conteúdo como texto simples.

## O que falta para uma rede operacional

- Aplicar as migrations hospedadas após reconciliação documentada e revisão do retorno.
- Homologar Auth por e-mail e SMTP de envio externo com redirects PKCE.
- Provisionar usuários individualmente para editor/moderação; definir quem atende pedidos e denúncias.
- Rodar homologação ponta a ponta com publicação, comentário, fila, ajuda, conexão, denúncia e uploads de fotos.
- Verificar acessibilidade manual além dos testes automatizados.

Não inserir postagens ou fotos fictícias. Não habilitar escrita anônima: isso abriria espaço para spam e conteúdo abusivo sem identidade responsável. Ajuda, conexão e denúncias serão tratadas dentro do site quando o serviço estiver ativo; não são encaminhadas por e-mail.

## Critério de liberação

**GO parcial:** apresentar o Hub institucional e a demonstração Meca Sim.  
**NO-GO para recursos de comunidade/admin:** enquanto Auth, banco, permissões e equipe de moderação não passarem pelos testes. A presença de botões ou arquivos no Git não significa que o serviço hospedado está ativo.

Acompanhar implantação e reversão estática em `DEPLOYMENT.md`. Nenhuma compra de domínio, plano pago, alteração DNS ou segredo foi feita.
