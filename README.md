# MECATIGER FTC #32578

O Meca Tiger Hub é um site estático em HTML, CSS e JavaScript, publicado no GitHub Pages.

Site: https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/

## Acesso e comunidade

A Home apresenta um convite de cadastro, com opção para continuar explorando. O cadastro de métricas da equipe é separado da conta usada para entrar.

A Rede tem leitura pública do feed aprovado. Para publicar, comentar, pedir ajuda, solicitar conexão STEM ou denunciar conteúdo, é necessário entrar com e-mail confirmado. Os pedidos são gravados no Supabase e acompanhados pela equipe dentro do painel; não dependem de aplicativos externos de e-mail. O cadastro e o envio de Magic Link ainda dependem de configuração de SMTP e URL/redirects no Supabase.

A interface usa login por e-mail; não oferece botão de login GitHub. Os links do Magic Link precisam retornar a `entrar.html` no domínio publicado, nunca a localhost.

## Administração e edição

A Home tem o link **Sou administrador**. O endereço `admin.html` pode ser aberto diretamente, mas só contas com papel autorizado pelo banco recebem acesso. Entrar com e-mail, por si só, não concede privilégios.

O painel permite:

- acompanhar solicitações e moderação;
- conceder ou retirar papéis de editor, moderador e administrador para contas já confirmadas;
- editar textos, páginas e abas;
- fazer upload de fotos WebP e editar perfis de integrantes.

A primeira conta administradora foi associada pelo banco à única conta confirmada que já possuía os papéis de editor e moderador. Não existe senha compartilhada ou credencial fixa. Consulte [ADMIN_EDITOR.md](ADMIN_EDITOR.md).

## Cadastro de métricas e privacidade

O formulário opcional da Home grava inscrições consentidas para contagem agregada. Visitantes podem consultar apenas métricas agregadas; a lista de e-mails não é exposta pela API pública. O modo `#cadastro-teste` é exclusivo para revisão local e simula o formulário.

A chave publishable do Supabase no navegador é pública por natureza; RLS e Auth são os controles de segurança. Nunca coloque `service_role`, chaves secretas ou credenciais no HTML.

## Projetos e Meca Sim

`mecasim-demo.html` é uma demonstração interativa: permite marcar e reproduzir trajetórias no campo. Ela não simula física, colisões, sensores, pontuação nem teleoperação e não executa código Java. Salvar e carregar trajetórias privadas usa uma Edge Function autenticada e requer e-mail confirmado.

O simulador completo pertence ao repositório [meca-sim](https://github.com/pabloinaciosilvestreinacio-collab/meca-sim), que não é modificado por este projeto.

## Operação

O estado de publicação, os bloqueios externos, testes e reversão estão em [DEPLOYMENT.md](DEPLOYMENT.md) e [LANCAMENTO_MECATIGER_20261025.md](LANCAMENTO_MECATIGER_20261025.md).
