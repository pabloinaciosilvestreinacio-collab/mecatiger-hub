# Domínio e DNS para SMTP gratuito — Meca Tiger

**Data:** 24/10/2026. **Situação:** preparo de engenharia em PR draft, não ativação. Nenhum domínio, conta SMTP, registro DNS ou dado da produção foi criado/modificado.

## 1. Evidência do GitHub e o que ela não prova

O repositório `pabloinaciosilvestreinacio-collab/mecatiger-hub` tem o GitHub Pages habilitado. Na **raiz da branch-base PR #18**, inspecionada no GitHub, não havia `CNAME`; `main` permanece no SHA `b4b814e6487848b11425bec5a99a67c0a33ac56a`. A API de configuração do GitHub Pages não pôde ser consultada pela conexão de leitura disponível. **Não concluir que a equipe não possui domínio.** Só não foi encontrada evidência de configuração de domínio próprio no checkout. Também não foi apresentado documento de controle DNS de um domínio institucional.

**Separação essencial:** o endereço da *página* pode continuar `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/`. O *domínio do remetente* do SMTP pode ser outro domínio/subdomínio previamente autorizado, sem alterar a URL do GitHub Pages. Um domínio de e-mail institucional não exige automaticamente domínio personalizado de website. Não criar `CNAME` para o site nem mudar a configuração de Pages como condição para SMTP.

Fonte GitHub: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## 2. Caminhos sem custo novo (escolher apenas com comprovação)

| Caminho | Condição | Situação |
|---|---|---|
| **A. Subdomínio institucional já existente ou delegado (recomendado se autorizado)** | Responsável legítimo do DNS da instituição autoriza expressamente um subdomínio de envio transacional e os registros pedidos pelo provedor; sem compra ou interrupção de serviços atuais | **Autorização não fornecida** |
| **B. Domínio que a equipe já possui, com DNS administrável** | Comprovação de posse/gerenciamento por pessoa autorizada, e nenhum custo adicional para os registros DNS | **Propriedade não comprovada** |
| **C. Continuar apenas no domínio gratuito GitHub Pages** | Válido para preparar/publicar a parte estática em etapa futura autorizada, mas **insuficiente para SMTP público** de um remetente `github.io`; deixar Auth pública dependente de SMTP bloqueada | **Fallback técnico disponível, não autorizado para deploy** |

**Não comprar domínio, pedir cartão de crédito, usar plano pago, solicitar senha DNS ou supor que o SESI/SENAI já concedeu autorização.** Uma conta `@gmail.com` pode ser contato, mas não permite publicar registros TXT/CNAME do domínio `gmail.com`.

## 3. Provedor recomendado condicionalmente: Resend Free

Em consulta pública de 24/10/2026, Resend anuncia **US$ 0/mês**, **3.000 mensagens/mês**, **100/dia**, **3 domínios de envio** e SMTP. Essa cota vale apenas conforme a elegibilidade atual da conta/termos e não equivale a limite de usuários da Rede.

Fonte primária: https://resend.com/pricing e histórico do plano https://resend.com/changelog/three-domains-on-the-free-tier

Resend **não foi cadastrado nem vinculado**. Se a equipe não obtiver domínio/subdomínio legítimo sem custo, nenhum provedor foi escolhido; manter Brevo/MailerSend como alternativas a conferir com suas políticas vigentes. DNS pode ser gerenciado gratuitamente em Cloudflare **se já existir um domínio próprio e houver autorização de alterar os nameservers**, mas o DNS Free não fornece um domínio registrado gratuito. Fonte: https://developers.cloudflare.com/dns/faq/

## 4. DNS: informação mínima a obter do responsável autorizado

**Não usar valores inventados:** é o provedor aprovado que fornece os nomes/valores exatos de verificação, SPF, DKIM, configuração de Return-Path/MX quando aplicável. Não apagar SPF/MX existentes, não criar um segundo SPF no mesmo nome, não enfraquecer DMARC existente e não alterar nameservers sem revisão.

Após aprovação da instituição e da conta gratuita:

1. Registrar **somente o FQDN autorizado**, por exemplo um subdomínio real especificado pela instituição — nunca usar `exemplo.edu.br` como se fosse propriedade da Meca Tiger.
2. Documentar o responsável pelo DNS e a autorização fora do repositório público; não anexar e-mails privados, senhas, chaves de API ou prints contendo segredos aos PRs.
3. Obter as instruções DNS **geradas pelo Resend** para a conta/domínio aprovado. Verificar colisão com TXT/SPF existentes antes de qualquer escrita.
4. Confirmar que cada registro é compatível com a zona e o serviço; aplicar DNS somente após autorização específica pelo responsável do domínio.
5. Conferir propagação, verificação de domínio no provedor, DKIM, SPF e DMARC; evitar habilitar rastreamento/click tracking nos Magic Links, que podem ser consumidos por scanners de segurança.
6. Verificar cota $0 e bloqueio de cobrança antes de qualquer serviço. Não encaminhar SMTP username/password por GitHub, chat, JS ou logs.
7. **Somente após autorização posterior**, configurar Supabase Auth SMTP, remetente, templates, rate limits/CAPTCHA compatível com frontend e redirects estritos documentados em `AUTH_SMTP_GRATUITO_20261024.md`.
8. Validar envio com contas de teste consentidas e nenhuma conta/dado real aleatório; autenticação deve continuar exigindo e-mail confirmado e papéis de administrador concedidos separadamente via banco.

Fonte Supabase SMTP: https://supabase.com/docs/guides/auth/auth-smtp

### Verificações opcionais SEM escrita DNS

O script deste ciclo não faz consultas por padrão:

```bash
node scripts/sender-domain-preflight.mjs
npm run test:unit
```

Depois que um responsável informar um **domínio aprovado**, será possível fazer inspeção de DNS público apenas de leitura (não é requisito para o CI):

```bash
node scripts/sender-domain-preflight.mjs --probe DOMINIO_AUTORIZADO
node scripts/sender-domain-preflight.mjs --probe DOMINIO_AUTORIZADO --selector SELETOR_DKIM_DO_PROVEDOR
```

No Windows PowerShell:

```powershell
Resolve-DnsName -Name DOMINIO_AUTORIZADO -Type TXT
Resolve-DnsName -Name _dmarc.DOMINIO_AUTORIZADO -Type TXT
```

**Importante:** SPF/DKIM/DMARC visíveis não provam posse, autorização, correspondência exata com os registros exigidos pelo Resend nem entrega real de e-mail. O script exibe **somente resumos e flags**, nunca valores dos registros, tokens ou senhas. Erros de DNS ou ausência de seletor resultam em sinalização, não em aprovação.

## 5. Auditoria e testes do ciclo

- `release/sender-domain-status-20261024.json`: estado real de evidências **sem nome de domínio presumido**, com bloqueios de DNS/provedor/SMTP.
- `scripts/sender-domain-preflight.mjs`: inspeção offline por padrão; `--probe` faz apenas consultas DNS públicas read-only. Não modifica GitHub, Supabase ou DNS.
- `tests/sender-domain-preflight.test.mjs`: rejeita domínios compartilhados, URLs arbitrárias, domínios inexistentes, conflito SPF, ausência de DMARC/DKIM; simula consultas para provar ausência de efeitos colaterais. Mesmo com registros DNS presentes e permissão relatada, `productionReady=false`.
- `npm run test:unit` e `rede-validate.yml`: executam esses testes/inspeções sem rede de produção.
- CI de PostgreSQL/RLS, scanner de segredos e Supabase/Mailpit+Storage+Playwright continuam independentes.

## 6. Critério de saída e bloqueios

**Preparado para decisão humana** quando os checks da branch estiverem verdes. **Não liberado para Auth público real** enquanto faltarem (i) DNS de um domínio aprovado, (ii) autorização institucional, (iii) conta SMTP $0 validada, (iv) configuração hospedada autorizada, (v) migrations do backend reconciliadas, (vi) confirmação de primeiro editor e política adequada para menores/privacidade.

Nem o script offline nem um teste de DNS aprovarão produção. Todo merge/deploy, configuração no Supabase hospedado, adição de DNS e ativação de provedor exige autorização específica e posterior.
