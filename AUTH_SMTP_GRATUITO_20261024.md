# Meca Tiger — Auth, SMTP gratuito e primeiro administrador | Preparação sem deploy

**Fotografia: 24/10/2026. Status: PR draft, somente planejamento verificado + testes locais.** Não houve criação de provedor, domínio, usuário real, gasto, login no dashboard, escrita no Supabase hospedado ou merge. Esta documentação não concede autorização para mudança em produção.

## 1. Resultado da investigação

A Rede Meca Tiger usa Supabase Auth com `signInWithOtp()`, fluxo PKCE, e-mail confirmado e allowlist de retorno em `js/rede-client.js`/`js/rede-auth.js`; administradores precisam ser usuários confirmados e estar na tabela `meca_site_editors` via operação administrativa autorizada. O cliente não pode promover um usuário à função de editor. `supabase/config.toml` configura **apenas a homologação local** com Mailpit, não o projeto hospedado.

O Supabase **padrão** entrega e-mails Auth apenas a endereços pré-autorizados da equipe do projeto e limita envios (na documentação consultada, cerca de 2/h). Ele é insuficiente para uma comunidade pública aberta, sem SMTP customizado. Fonte: https://supabase.com/docs/guides/auth/auth-smtp .

## 2. Comparação de SMTP gratuito em fontes oficiais

| Provedor | Cota gratuita publicada | SMTP | Condições e riscos |
|---|---|---|---|
| **Resend (preferência condicionada)** | **3.000/mês; até 100/dia**, US$ 0 no Free; até 3 domínios | Sim | Domínio de envio verificado e gerenciamento de DNS; confirmar elegibilidade e custos finais na própria conta antes de ativar. https://resend.com/pricing |
| **Brevo (alternativa)** | **300/dia**, US$ 0 no Free | Sim | Domínio remetente autenticado, DKIM e DMARC; limites e disponibilidade de SMTP podem depender da aprovação da conta. https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan |
| **MailerSend (reserva)** | **500/mês; 100/dia** no Free | Sim | Precisa de aprovação de conta/domínio; a página informa que podem ser exigidos dados de cartão para aderir ao plano Free. Não fornecer cartão sem decisão explícita. https://www.mailersend.com/pricing |

**Não confundir cota de e-mails com número garantido de usuários.** Cada acesso, confirmação, troca de dispositivo ou solicitação repetida pode consumir mais envios; o Supabase também aplica seus próprios limites por hora. Os valores são públicos e **podem mudar**; não comprovaram que a Meca Tiger possui conta aprovada ou DNS preparado.

### Dependência crítica: domínio remetente

- Os serviços exigem domínio de envio sob controle da equipe e registros DNS para validar/remeter corretamente (SPF, DKIM e DMARC). **GitHub Pages `github.io` não é um domínio próprio do projeto para criar esses registros**.
- Um endereço `@gmail.com` pode ser usado como contato pessoal, mas não significa que a equipe controla o DNS `gmail.com` nem que os provedores o aceitarão como domínio remetente autenticado.
- **Se a equipe não dispõe de domínio próprio/institucional delegável sem novo custo, o SMTP público permanece BLOQUEADO.** Não contratar domínio, usar cartão nem ativar plano pago para contornar isso sem permissão.
- Uma possibilidade sem custo novo é autorização formal para utilizar subdomínio de instituição parceira que já controle DNS e autorize o envio; não presumir que essa autorização existe.

## 3. E-mails de autenticação preparados (sem implantação)

Rascunhos versionados: `release/auth-email-templates/confirmation.html` e `magic_link.html`, usando variável oficial `{{ .ConfirmationURL }}`, **sem CPF, nomes, e-mails pessoais, chaves ou senha fixa**. Estes arquivos **NÃO** modificam os modelos do Supabase hospedado; deverão ser revistos e colados manualmente no dashboard quando autorizado.

- O fluxo local Mailpit, confirmação/OTP, login e logout já é coberto pelo GitHub Actions descartável; não usar evidência de Mailpit para afirmar entrega externa por SMTP.
- A URL de confirmação é individual e temporária. Proteções de rastreamento automático: **desativar click tracking** no provedor para não quebrar o link. Alguns filtros de e-mail fazem *prefetch* e podem consumir links antes do usuário. Caso isso ocorra, considerar OTP digitado ou confirmação em duas etapas com nova rodada de testes antes de lançamento, sem desabilitar confirmação.
- Não registrar `token_hash`, códigos OTP nem links completos em logs do GitHub, issues, prints públicos ou relatórios.
- Conferir na prática ambos os templates (confirmação de conta nova e Magic Link em conta existente), erros de token expirado, uso repetido, login em outro dispositivo e finalização de sessão.
- Fontes: https://supabase.com/docs/guides/auth/auth-email-templates e https://supabase.com/docs/guides/auth/redirect-urls .

## 4. URLs exatas para revisão no Supabase hospedado

**URL-base candidata GitHub Pages:** `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/` (verificar no Pages efetivamente publicado antes).

**Redirect URLs propostos — sem coringas:**

- `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/entrar.html?next=rede.html`
- `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/entrar.html?next=mecasim-demo.html`
- `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/entrar.html?next=mecasim.html`
- `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/entrar.html?next=admin.html`

A configuração publicada deve preservar retorno somente nessas rotas, rejeitar `next=https://outro-site` e não introduzir wildcard irrestrito. `scripts/auth-smtp-preflight.mjs` inspeciona código e recusa URLs modificadas. **Isso não valida a configuração real do painel hospedado**, que não foi alterada.

## 5. Como liberar o primeiro administrador de forma segura (etapa futura)

1. Um responsável da equipe autoriza **qual e-mail institucional/pessoal verificado** será o primeiro editor. Não publicar o e-mail individual no GitHub.
2. Configurar e testar Auth/SMTP no ambiente hospedado **somente após autorização**. O integrante entra normalmente usando Magic Link no endereço que controla.
3. Operador com permissão administrativa válida verifica a conta `auth.users`: UUID e `email_confirmed_at`, além da autorização formal da equipe. **Não aceitar UUID ou endereço enviado por participante desconhecido sem confrontar o cadastro do servidor.**
4. Conceder **somente** o privilégio `meca_site_editors` ao UUID confirmado pelo operador, via fluxo seguro e restrito. Nunca gerar senha compartilhada, habilitar inserção pública nessa tabela, entregar chaves de administração ao navegador ou ao GitHub.
5. Testar uma conta sem privilégio: painel deve ser negado; editor confirmado deve alterar um dos quatro textos e enviar WebP autorizado. Verificar logs sem dados sensíveis.
6. Registrar procedimento de revogação, responsável, auditoria de imagens (especialmente menores) e recuperação caso um integrante perca acesso.

O papel de **moderador** da Rede (`rede_moderators`) permanece separado do papel de **editor**. O cadastro opcional do Hub é estatístico e não concede login.

## 6. Antispam, privacidade e custo zero

- Ativar limites adequados do Supabase Auth e, se necessário, CAPTCHA/Turnstile **somente quando a integração de frontend estiver pronta e testada**; ativar CAPTCHA no servidor sem frontend compatível bloqueia todos os logins. Fonte: https://supabase.com/docs/guides/auth/auth-captcha .
- Não desabilitar confirmação de e-mail, não permitir logins anônimos como participantes e não elevar quotas à revelia do teto gratuito contratado.
- **Não usar o mesmo SMTP para newsletter/marketing e links de autenticação** sem política clara. Login não implica consentimento de newsletter.
- Privacidade/LGPD, tratamento de menores, retenção de dados, responsável por moderação e domínio/remetente ainda exigem decisões humanas.

## 7. Evidências automatizadas e portas de decisão

- `node scripts/auth-smtp-preflight.mjs`: verificação estrutural offline, lista de blockers, sempre `productionReady=false`, `smtpProvisioned=false`, `firstAdminProvisioned=false`.
- `node scripts/auth-smtp-preflight.mjs --require-hosted` retorna **3** intencionalmente: não confundir config estática com hosted validado.
- `node scripts/auth-smtp-preflight.mjs --authorize-production` retorna **4** intencionalmente.
- `npm run test:unit` inclui testes de URLs exatas e bloqueio de redirecionamentos externos, sem criar recursos.
- GitHub Actions de Supabase local/Playwright continua verificando login, e-mail via Mailpit, separação de usuários e RLS; scanner de segredos e RLS de PostgreSQL independentes.

**Veredito deste ciclo:** preparação de provedores/fluxos, sem contas ou credenciais. **SMTP e primeira conta administradora reais NÃO ESTÃO ATIVADOS.** Para iniciar uma configuração hospedada, obter escolha explícita do remetente/domínio gratuito e autorização separada para operações no Supabase/SMTP, além das migrations e privacidade ainda bloqueadas.
