# Publicação e operação — Meca Tiger Hub

## Estado atual — 25/10/2026

- O site está publicado no GitHub Pages: https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/
- A Home, a Rede, a página de login e o painel são páginas estáticas. O link **Sou administrador** aparece separado da Comunidade.
- Feed aprovado: leitura pública. Escrita, solicitações e denúncias usam Supabase e exigem e-mail confirmado.
- As migrações de Rede, mensagens de solicitação, CMS, administração e perfis de integrantes foram aplicadas, sem substituir o histórico antigo. A última fotografia hospedada está em `release/hosted-baseline-20261025.json`.
- A primeira conta administradora foi criada a partir da única conta confirmada que já tinha papéis de editor e moderador.
- A Edge Function `mecasim-trajectories` está ativa com JWT obrigatório. RLS limita trajetórias ao proprietário.
- O bucket `meca-site-gallery` está configurado para WebP até 2 MiB. As políticas de upload passaram por teste PostgreSQL; falta concluir um upload real autenticado com imagem aprovada.
- O login público por e-mail segue bloqueado para homologação: logs registraram `429 over_email_send_rate_limit` no SMTP padrão e houve redirect para localhost quando a URL publicada não estava autorizada.

## Ação necessária no Supabase Dashboard

Em **Authentication → URL Configuration**, defina o Site URL como `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/` e inclua `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/**` na allow-list de redirects. Em **Authentication → SMTP Settings**, configure remetente SMTP autorizado para envio público confiável. Não publique credenciais em código nem as envie no chat.

Depois dessa configuração, testar envio e retorno do Magic Link em `entrar.html`. Os links precisam abrir `entrar.html` no GitHub Pages, sem localhost. E-mails devem ser confirmados antes de acessar recursos privados.

## Testes e segurança

O CI valida código estático, segredos, integração PostgreSQL/RLS, homologação Supabase descartável e preview visual. Esses testes não equivalem a uma sessão real com a conta da equipe no site publicado.

O cadastro legado de métricas continua preservado. O Advisor ainda alerta para a função pública `register_community_member` com `SECURITY DEFINER`; ela permanece necessária ao formulário legado e não foi revogada. Os novos RPCs administrativos também usam `SECURITY DEFINER`, mas exigem papel de administrador internamente, têm `search_path` vazio e não são executáveis por `anon`. A proteção contra senhas vazadas permanece desativada nas configurações de Auth.

Não foi verificada restauração de backup. As migrações novas são aditivas; para voltar a versão do site, reverta o commit do Pages. Não remova dados ou tabelas no banco como procedimento de rollback.

## PRs relacionados

PR #34 concentra os papéis de administração, perfis da equipe, correções de Auth/UX e controles do simulador. PR #20 é diagnóstico de Pages e declara explicitamente que não deve ser mesclado. PR #10 é homologação local baseada em branch antiga; PR #2 é baseado na arquitetura React/TanStack desatualizada. Não são necessários para a versão estática atual.
