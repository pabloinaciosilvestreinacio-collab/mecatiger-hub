# Migração controlada do Hub para mecatiger.com.br — 07/11/2026

> Estado: domínio informado como **registrado pelo responsável**. NÃO confundir registro com DNS propagado, TLS emitido, GitHub Pages configurado ou SMTP em funcionamento. Este arquivo é preparação; não modifica zona DNS, CNAME, SMTP ou Auth hospedado.

## Base preservada

- PR #37 (biblioteca privada do Meca Sim) e PR #38 (recuperação de senha) estão integradas; não reverter.
- URL operacional de referência: `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/`.
- Objetivo: `https://mecatiger.com.br/` (canônico proposto) e `https://www.mecatiger.com.br/` (alternativo).
- Projeto Supabase: `rnnzumzqilkuecvgsjnv`.
- **Mudança preparatória de código:** a Edge Function poderá aceitar EXCLUSIVAMENTE os HTTPS origins antigo, apex e www, além dos dois loopbacks da homologação. Isto não muda o Auth nem desativa JWT/RLS. A nova versão precisa ser testada e implantada separadamente para produzir efeito hospedado.

## Fase 1 — DNS e GitHub Pages (dependência do responsável)

1. Confirmar em GitHub > repositório `mecatiger-hub` > Settings > Pages que a origem de publicação continua correta. Em Custom domain definir `mecatiger.com.br` **quando estiver pronto para a transição**. GitHub pode criar/alterar automaticamente o arquivo CNAME; não adicioná-lo antecipadamente nesta branch.
2. **Somente após definir o domínio em Pages**, no painel do registrador autorizado (Registro.br ou DNS efetivamente delegado) apontar `@` para os quatro `A` oficiais do GitHub Pages:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
   Opcional: os quatro `AAAA` oficiais, conforme documentação do GitHub. Não misturar com registros antigos conflitantes.
3. Para `www`, criar `CNAME` apontando **diretamente** a `pabloinaciosilvestreinacio-collab.github.io` (sem `/mecatiger-hub`, sem protocolo), desde que não exista registro incompatível nesse nome.
4. Evitar DNS curinga (`*.mecatiger.com.br`); pode expor takeover. Confirmar A/CNAME com ferramentas DNS, verificar HTTPS, certificado e links; GitHub pode levar até 24h para propagar configurações.
5. Antes de selecionar `Enforce HTTPS`, validar emissão de certificado, acesso por HTTPS e redirecionamento correto entre apex e www. Não remover a URL antiga da allowlist Auth enquanto links antigos puderem estar circulando.

Fonte oficial: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## Fase 2 — Auth no Supabase hospedado (não aplicada)

Em Supabase > Authentication > URL Configuration, **após** confirmar HTTPS do domínio, definir Site URL candidata `https://mecatiger.com.br/` e autorizar URLs exatas, sem curinga:

- `https://mecatiger.com.br/entrar.html?next=rede.html`
- `https://mecatiger.com.br/entrar.html?next=mecasim-demo.html`
- `https://mecatiger.com.br/entrar.html?next=mecasim.html`
- `https://mecatiger.com.br/entrar.html?next=admin.html`
- `https://mecatiger.com.br/entrar.html?next=rede.html&recovery=1`

Se o `www` tiver navegação direta sem redirecionamento canônico garantido, adicionar TAMBÉM suas cinco variantes exatas. Durante migração, **preservar as cinco URLs antigas do GitHub Pages** já documentadas em `AUTH_SMTP_GRATUITO_20261024.md` para links em trânsito. Depois, diminuir a allowlist conforme teste, sem cortar links ativos.

O JavaScript usa caminhos relativos e monta redirects a partir da página acessada. Não configurar `https://mecatiger.com.br/mecatiger-hub/` como destino por engano: domínio próprio serve a raiz do Pages.

Validar com contas consentidas: confirmação, login por senha, Magic Link, recovery, expiração e reutilização dos links, logout, sessão renovada, conta sem e-mail confirmado, papel administrativo, retorno `next` inesperado. **Nenhum teste Mailpit equivale a envio real.**

## Fase 3 — Meca Sim privado

- A migração precisa da nova versão da Edge Function `mecasim-trajectories` implantada no Supabase. Essa preparação **não faz deploy da função** por si só.
- `allowedOrigins` fica em `supabase/functions/mecasim-trajectories/origins.mjs`, sem padrões curingas.
- Depois do deploy, testar preflight CORS da função no domínio novo e confirmação/autorização com sessão real: listar, salvar, carregar e excluir trajetória; negar acesso de outro usuário e de visitante.
- JWT no gateway, `auth.getUser()` e RLS continuam responsáveis pelas permissões. CORS sozinho NÃO é mecanismo de autenticação.

## Fase 4 — SMTP Resend (proposto, não habilitado)

- Plano Free anunciado em https://resend.com/pricing: 3.000 e-mails/mês e limite de 100 por dia, sujeito a elegibilidade e confirmação na conta.
- Recomenda-se **avaliar** o subdomínio `auth.mecatiger.com.br` para o remetente, isolando reputação de envio. Exemplo somente após verificação: `noreply@auth.mecatiger.com.br`; não afirmar que esse remetente existe hoje.
- Criar conta/aceitar termos e adicionar domínio em Resend requer ação autorizada. Copiar **os registros específicos fornecidos pela conta** para SPF, DKIM e eventual Return-Path; inspecionar conflitos e DMARC antes da escrita. Nunca inventar chaves, tokens, seletores ou duplicar SPF.
- SMTP do Resend: host `smtp.resend.com`; usuário `resend`; senha = API key criada e armazenada **somente no painel secreto do Supabase**; porta `465` (TLS implícito) ou `587` (STARTTLS). Não publicar nem colar a chave em chat/issue.
- Supabase > Authentication > SMTP Settings: habilitar SMTP próprio com remetente verificado; em Email Templates revisar `release/auth-email-templates/{confirmation,magic_link,recovery}.html`. Desligar click tracking para links de Auth.
- Aferir envio de confirmação e recuperação para caixa consentida, recebimento, expiração, SPF/DKIM/DMARC e limites, sem divulgar links/tokens.

Fontes: https://resend.com/docs/send-with-smtp e https://resend.com/docs/dashboard/domains/introduction

## Critérios de saída (sem falso positivo)

- **Código preparado:** imports e testes CORS com os novos origins passaram no CI.
- **Edge preparada, mas não hospedada:** não inferir sucesso de `npm run test:unit` como deploy da função.
- **Domínio pronto:** DNS, Pages, redirect e TLS validados no destino real.
- **Auth pronto:** Site URL, redirects, templates e fluxos hospedados comprovados.
- **SMTP pronto:** domínio/remetente verificados e entrega real comprovada.

Registro de pendências e verificações: https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/issues/39
