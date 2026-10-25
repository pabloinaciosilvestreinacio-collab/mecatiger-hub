# Painel administrativo Meca Tiger

## Acesso atual

Abra **Sou administrador** no menu da Home ou acesse diretamente:

https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/admin.html

A rota não é secreta. O servidor Supabase confere a sessão e o papel antes de mostrar qualquer função administrativa; digitar um e-mail ou abrir o endereço não concede acesso.

A administração está protegida por funções do banco. A migração de produção concedeu o papel de administrador à única conta confirmada que já possuía, simultaneamente, os papéis de editor e moderador. Nenhuma senha compartilhada ou conta fictícia foi criada.

## Bloqueio atual do login

O frontend usa Magic Link por e-mail e não exibe login GitHub. A solicitação de link já foi observada falhar por limite do SMTP padrão do Supabase (`429 over_email_send_rate_limit`); links também foram redirecionados para localhost quando o domínio publicado não estava permitido.

Para liberar entrada pública, em Supabase Dashboard → **Authentication → URL Configuration**:

1. Defina **Site URL** como `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/`.
2. Adicione a allow-list de redirects para `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/**`.
3. Em **Authentication → SMTP Settings**, configure SMTP externo com remetente/domínio que a equipe controla. Não compartilhe senha SMTP no chat nem no repositório.

Depois, solicite um Magic Link em `entrar.html`, abra no mesmo navegador e confirme que retorna para o Hub. O Supabase padrão tem limites de entrega e não é suficiente para cadastro público confiável.

## O que editores e moderadores podem fazer

- **Solicitações:** revisar pedidos privados de ajuda e conexão, filtrar por status, abrir detalhes, responder/encaminhar internamente e acompanhar histórico.
- **Moderação:** revisar publicações e denúncias e aprovar ou rejeitar conteúdo.
- **Textos:** editar os campos institucionais disponíveis no CMS.
- **Páginas e abas:** criar/editar texto, slug, resumo, ordem e publicação.
- **Fotos:** enviar PNG/JPEG/WebP; o navegador reprocessa a imagem como WebP, remove metadados e limita o arquivo final a 2 MiB. Fotos publicadas ficam no bucket público do site.
- **Integrantes:** criar/editar nome, função, descrição, alternativa textual, posição e publicação do perfil na Home.
- **Segurança:** administrador pode conceder/remover papel para um e-mail de conta já criada e confirmada. Administrador também recebe editor e moderador.

A aprovação do pedido só aparece ao visitante após gravação real. A aplicação não envia solicitações por aplicativo de e-mail.

## Segurança e limites

- RLS protege as tabelas; usuários comuns não podem consultar pedidos de terceiros, rascunhos de integrantes ou lista de acessos.
- O papel não é concedido com base no e-mail digitado pelo visitante. A RPC procura uma conta Auth existente e confirmada e exige que o solicitante já seja administrador.
- A última conta administradora não pode se remover.
- O bucket é público para leitura porque contém imagens do site. Publique somente fotos autorizadas, com consentimento apropriado, especialmente para menores.
- O painel não apaga arquivos de imagem nem edita HTML/CSS/JavaScript ou seções fixas. Mudanças estruturais continuam no repositório.
- O teste de Storage/RLS foi executado em CI; ainda falta um upload visual autenticado com uma imagem aprovada pela equipe no domínio publicado.
