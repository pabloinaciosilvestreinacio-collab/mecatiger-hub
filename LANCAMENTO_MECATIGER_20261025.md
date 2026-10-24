# Publicação controlada Meca Tiger — roteiro de homologação e autorização

**Preparado em 24/10/2026 para a possibilidade de uma publicação em 25/10/2026.** Este documento é um **roteiro**, não uma autorização de deploy. Não cria serviço cloud, não muda usuários, não roda migrações hospedadas e não faz merge. Os testes GitHub Actions usam serviços Supabase locais e descartáveis.

## Decisão de escopo

O usuário decidiu que **cinco publicações iniciais NÃO são obrigatórias**. A Rede pode começar com o feed vazio, com aviso honesto de que ainda não há publicações aprovadas. É permitido melhorar depois da publicação. Portanto, não inventar posts, equipe/moderadores ou fotos apenas para preencher a interface.

Pode ser alterado depois sem editar HTML: os **quatro textos** e a galeria de fotos suportados por `admin.html`, desde que o banco/CMS/SMTP estejam configurados, o editor autorizado e o site publicado. Outras alterações ainda requerem alteração de código e atualização do GitHub Pages; o editor não é um construtor de páginas completo.

## 1. Fonte da verdade e estado confirmado (somente leitura)

- GitHub: `pabloinaciosilvestreinacio-collab/mecatiger-hub`.
- `main` permanece em `b4b814e6487848b11425bec5a99a67c0a33ac56a`, sem a nova Rede/CMS.
- Dependências de branch: `main` → [PR #8](https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/pull/8) → [#9](https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/pull/9) → [#11](https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/pull/11) → [#12](https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/pull/12) → [#13](https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/pull/13) → [#14](https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/pull/14) → [#15](https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/pull/15) → este PR. Todos drafts, sem merge autorizado.
- Último head validado antes deste ciclo: `e375a1d30ec00f1ed5435c528e492fbb767cd176` (PR #15), 4 famílias de checks verdes; Supabase+Storage+Playwright: 9 testes de navegador, run [40125677681](https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/actions/runs/40125677681).
- Supabase hospedado `rnnzumzqilkuecvgsjnv`, consultado **sem escrita** em 24/10/2026: `public.community_registrations` (RLS), `public.community_metrics` (RLS); quatro migrações históricas de métricas; **nenhuma função Edge**. Sem `rede_*`, `meca_site_*` ou `mecasim_trajectories` nessa inspeção.
- Auditor de segurança hospedado (somente leitura) apontou `INFO` para a tabela `community_registrations` com RLS sem policy e `WARN` para o RPC público `register_community_member` com `SECURITY DEFINER` acessível por `anon` e `authenticated`. O RPC público pode ser intencional, mas verificar implementação/limite de abuso antes de promover a nova Rede; **não revogar sem análise**, porque quebraria o cadastro antigo.

## 2. Ordem das migrações (apenas inventário; sem executá-las)

1. `20261024160000_rede_mecatiger_mvp.sql`: perfis, feed, moderação, pedidos/denúncias e quotas básicas.
2. `20261024163000_require_nonanonymous_identity.sql`: políticas RLS restritivas e isolamento de usuários anônimos.
3. `20261024170000_mecasim_private_trajectories.sql`: trajetórias privadas por proprietário.
4. `20261024190000_mecatiger_site_cms.sql`: editores, textos, imagens/legendas e bucket público com upload WebP autenticado.

A tabela antiga `community_registrations` e as métricas **não** devem ser sobrescritas ou vinculadas automaticamente a contas Auth. O histórico de migrações do Supabase hospedado é diferente do histórico local, pois foi criado em outubro antes desses arquivos. **Antes de uma implantação autorizada**, reconciliar com rigor esse histórico e conferir o SQL gerado no plano de migrações; não assumir que a CLI ignorará versões ausentes nem escolher `repair` automaticamente.

### Gates de banco (requere autorização explícita)

- Revisão humana das quatro migrações e SQL de funções/triggers; confirmar ausência de DROP, TRUNCATE, alterações destrutivas e permissões indesejadas sobre tabelas existentes.
- Verificar limites/backup disponíveis no plano **sem contratar** novo serviço; elaborar cópia e recuperação compatíveis com política aprovada e verificar opções gratuitas realmente disponíveis.
- Rodar a suíte já existente **apenas** em Supabase CLI/Docker isolados; nenhuma execução de migração sobre hosted até autorização.
- Após uma execução hospedada expressamente aprovada: leitura de tabelas/policies, controle de dados de teste, RLS anônimos e assinados; não usar dados reais da comunidade como fixtures.
- Migração não é revertida com `db reset` em produção. Para incidente, suspender o lançamento e usar migração corretiva aprovada e/ou estratégia de restauração validada.

## 3. SMTP/Auth — bloqueio para acesso público real

O SMTP padrão do Supabase é apenas para desenvolvimento; envia para endereços previamente autorizados na equipe, não para uma comunidade aberta. A documentação oficial informa esse limite: https://supabase.com/docs/guides/auth/auth-smtp .

**Sem SMTP próprio validado, o login público e o painel NÃO estarão operacionais para todas as pessoas.** Não publicar comunicação prometendo cadastro funcional enquanto isso não estiver resolvido.

Para ativação posterior, mediante escolha explícita do responsável e **confirmação de cota/preço zero** do plano gratuito escolhido:

1. Selecionar provedor SMTP com entrega externa e limites de preço/cota conhecidos. Não inserir credenciais de e-mail no GitHub, no chat ou no código JS público.
2. Configurar remetente/domínio verificado e DNS SPF/DKIM/DMARC quando aplicável, sem criar recurso pago; revisar CAPTCHA/rate-limits contra abuso de pedidos de link.
3. Manter confirmação de e-mail e login anônimo **desativado**, com restrições RLS independentes.
4. No dashboard do projeto hospedado, Site URL do GitHub Pages: `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/` (verificar URL final do Pages antes).
5. Liberar **somente** os redirects estritos `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/entrar.html?next=rede.html`, `...next=mecasim-demo.html`, `...next=mecasim.html` e `...next=admin.html`. Nenhum wildcard irrestrito.
6. Verificar **duas classes de e-mail** (confirmação e Magic Link), o template do ambiente hospedado — que é diferente de `supabase/templates/local-access.html` — e o retorno PKCE. O front `rede-auth.js` aceita `token_hash` com `type=email`; configurar template compatível e conferir link genuíno por teste autorizado, sem registrar token em log.
7. Testar fluxos inválidos/expirados e logout. Usar contas de teste autorizadas somente após aprovação específica, nunca dados reais não consentidos.

Referências: https://supabase.com/docs/guides/auth/auth-email-templates e https://supabase.com/docs/guides/auth/redirect-urls .

## 4. Papéis e operação (separados)

- **Participante autenticado:** perfil público com apelido; envia pedidos privados e publicações pendentes.
- **Moderador:** somente depois de atribuição manual e restrita em `rede_moderators`; revisa conteúdo, solicitações e denúncias.
- **Editor do site:** permissão separada em `meca_site_editors`, atribuída apenas depois de confirmar identidade do integrante e sua autorização; edita quatro textos e publica WebP de até 2 MiB.
- Um usuário não ganha nenhum desses papéis por cadastro opcional de métricas da Home. Moderador não ganha edição do site automaticamente. **Sem conta ou senha compartilhada.**
- Antes de abrir inscrições, confirmar equipe responsável por moderação, política mínima de conteúdo/menores, canal de suporte e rotina de exclusão/revogação de acesso.

## 5. Sequência controlada da promoção — NÃO EXECUTAR neste ciclo

**Fase A — Código:** revisar os PRs em ordem, diff acumulado e CI no mesmo SHA da versão candidata. Preparar uma promoção sequencial/consolidada **apenas quando autorizada**, sem merge automático. Se algo mudou em `main`, investigar novo delta, não assumir merge limpo.

**Fase B — Auth:** escolher/configurar SMTP e URLs de retorno sob supervisão; testar entrega sem expor senhas. Ainda sem anunciar a Rede aberta.

**Fase C — Banco:** após autorização de migração e revisão de impacto, implantar de forma controlada no projeto autorizado; verificar RLS, Storage e Edge Function `mecasim-trajectories` com JWT obrigatório. O endpoint precisa de testes pós-implantação antes de ativar interface dependente.

**Fase D — Papéis:** um responsável autoriza o primeiro editor e o primeiro moderador por contas individuais verificadas. Não criar senhas genéricas nem conceder acesso público aos papéis.

**Fase E — Site:** apenas então autorizar promoção do conteúdo estático para `main`/GitHub Pages. Verificar publicação, navegação, aviso do feed vazio, login e logout, painel autorizado versus participante sem permissão, fotos públicas e endpoints. A Home antiga deve continuar disponível até o go/no-go.

**Fase F — Comunicação:** equipe anuncia comunidade quando o fluxo real estiver validado. As cinco publicações iniciais são opcionais; um feed vazio é aceitável.

## 6. Falhas e retorno seguro

- **SMTP sem entrega:** não abrir inscrições públicas; manter versão antiga ou informar temporariamente indisponível. Nunca desabilitar confirmação de e-mail para contornar.
- **Erro RLS/autorização:** bloquear a promoção da Home/Rede; preservar dados; corrigir em migration de reparo revisada e homologada. Não afrouxar policy e não entregar chave privilegiada ao navegador.
- **Falha de Storage/painel:** manter editor indisponível para uploads até corrigir; o site mantém textos estáticos caso não haja CMS.
- **Falha no GitHub Pages:** restabelecer a última revisão aprovada do código estático via GitHub **somente após autorização específica**, sem apagar bancos ou usuários. Anotar SHA conhecido e validar URL novamente.
- **Exposição de dados:** interromper novas interações e seguir processo de incidente; não colocar provas com informações pessoais em issue público.
- **Custo:** se SMTP, DNS, quotas ou Storage exigirem compra, **parar e pedir escolha explícita**; não criar infraestrutura paga.

## 7. Checklist de evidências pré-autorização

- [ ] `node scripts/release-preflight.mjs`: checks **estruturais** aprovados; a mensagem final deve dizer **produção não autorizada**.
- [ ] GitHub Actions `Rede Meca Tiger static validation` verde no head do PR mais recente.
- [ ] GitHub Actions `Rede PostgreSQL RLS security tests` verde.
- [ ] GitHub Actions `Supabase disposable homologation` verde; provas de e-mail local, Edge, CMS, Storage e navegador.
- [ ] GitHub Actions `Prevent accidental secret publication` verde.
- [ ] Reavaliação dos avisos Supabase de produção, incluindo o RPC `register_community_member`, sem quebrar cadastro antigo.
- [ ] Revisão humana dos fluxos LGPD e proteção de menores concluída.
- [ ] Responsáveis por SMTP/Auth e moderação designados; teste hospedado autorizado, sem recursos pagos.
- [ ] Autorização explícita separada para cada operação de promoção, banco e entrega de e-mail.

**Veredito deste roteiro:** estrutura em preparação, execução local/testes automatizados admissíveis, **NO-GO em produção até autorizações e verificações operacionais**.

**Comando de bloqueio para evitar erro de interpretação:** `node scripts/release-preflight.mjs --require-production` retorna código **2** deliberadamente: essa ferramenta jamais autoriza implantação sozinha.


## Auditoria complementar de migrações (24/10/2026)

A auditoria exclusiva da reconciliação do banco está documentada em [`RECONCILIACAO_MIGRACOES_20261024.md`](RECONCILIACAO_MIGRACOES_20261024.md), com fotografia somente de metadados do histórico hospedado e verificador `node scripts/audit-migration-reconciliation.mjs`. As versões 20261013/20261019 aplicadas remotamente ainda não possuem SQL histórico original comprovado na branch. **Não executar `db push`, `migration repair` ou outra escrita como solução automática**; recuperar/validar o baseline histórico antes de autorizar qualquer implantação.
