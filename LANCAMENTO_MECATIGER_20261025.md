# Estado de lançamento — Meca Tiger Hub (25/10/2026)

Site publicado: https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/

## Estado confirmado

| Área | Status |
|---|---|
| Hub institucional e Meca Sim demonstrativo | Publicados |
| Feed público | Consulta o Supabase; exibe somente posts aprovados; vazio neste momento |
| Banco da Rede/CMS/Meca Sim | Migrações aditivas aplicadas; novas tabelas com RLS |
| Ajuda, conexão e denúncias pelo site | Código e tabelas prontos, envio ainda bloqueado sem Auth e responsável moderador |
| Login público | Bloqueado: SMTP externo não homologado |
| Administração/upload | Código e bucket prontos; nenhum editor autenticado provisionado |
| Moderação | Nenhuma conta moderadora provisionada |

## Links

- [Home](https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/)
- [Comunidade](https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/rede.html)
- [Conteúdo](https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/conteudo.html)
- [Administração](https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/admin.html)

## Para liberar escrita e administração

1. Configurar SMTP externo autorizado e validar links Magic Link/PKCE; autenticação por e-mail serve somente para login, os pedidos ficam no site.
2. Confirmar a conta individual da pessoa responsável e conceder separadamente os papéis de editor/moderador.
3. Testar publicação, comentário, ajuda, conexão, denúncia e upload WebP em navegador real; acompanhar solicitações dentro do painel.
4. Definir operação de moderação, privacidade e recuperação antes de anunciar a Rede como aberta.

**Veredito: GO parcial.** Feed somente leitura está ativo. Cadastro/login comunitário, escrita e upload ainda não estão operacionais.