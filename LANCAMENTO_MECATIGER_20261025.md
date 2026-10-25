# Estado de lançamento — Meca Tiger Hub

Atualizado em 25/10/2026. Site: https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/

## Estado operacional

| Área | Estado |
|---|---|
| Home, navegação e onboarding de cadastro | Publicados; continuar explorando é opcional |
| Cadastro de métricas | Mantido como fluxo separado de conta Auth |
| Comunidade/feed | Leitura pública ativa; pedidos, publicações e denúncias usam backend privado |
| Administração | Migração/RLS aplicadas; conta administradora existente reconhecida pelo banco |
| CMS de textos, páginas, fotos e perfis | Interface e políticas implementadas; upload visual real ainda não foi homologado |
| Meca Sim demonstrativo | Disponível após login confirmado, como demonstração limitada |
| Biblioteca privada de trajetórias | Edge Function ativa com JWT obrigatório; gravação ligada à conta confirmada |
| Login e cadastro por e-mail | Ainda bloqueados para lançamento público pelo SMTP padrão/redirects do Supabase |

## Links

- [Home](https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/)
- [Comunidade](https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/rede.html)
- [Login](https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/entrar.html)
- [Conteúdo](https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/conteudo.html)
- [Sou administrador](https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/admin.html)
- [Meca Sim demo](https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/mecasim-demo.html)

## Para liberar o acesso real

No Supabase Dashboard → Authentication → URL Configuration, ajuste o Site URL para o GitHub Pages e permita redirects em `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/**`. Configure SMTP externo autorizado em Authentication → SMTP Settings. Sem isso, Auth já retornou 429 por limite de envio e links para localhost.

Depois, faça login com a conta individual já confirmada, abra **Sou administrador**, confira a aba Segurança e cadastre outros editores/moderadores usando e-mails que já criaram e confirmaram conta. Não existe senha administrativa para compartilhar.

## Evidências e limitações

Migrações aditivas e correção da RPC estão registradas no baseline hospedado. O teste real confirmou que a conta elegível é administradora, a função lista um único acesso e anon não pode ler a tabela de admins. Testes automatizados de RLS/Storage não substituem upload com uma foto aprovada no domínio público.

O Advisor alerta a função legada de cadastro público `register_community_member` SECURITY DEFINER; não foi revogada para preservar o formulário e as métricas antigas. Auth leaked-password protection continua desligada. Fotos publicadas são públicas no bucket; moderação, consentimento e regras para dados de menores precisam de responsáveis da equipe.

**Veredito: GO parcial.** Site institucional público; Rede, administração e simulador exigem conta confirmada; banco de pedidos e biblioteca privada estão preparados; o acesso real por e-mail e o upload público ainda exigem configuração e teste da equipe.
