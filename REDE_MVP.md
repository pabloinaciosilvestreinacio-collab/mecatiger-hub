# Rede Meca Tiger — implementação em branch e limites de segurança

**Estado:** IMPLEMENTADO EM BRANCH, PENDENTE DE BANCO, CONFIGURAÇÃO DO AUTH E TESTES REAIS. NÃO PUBLICAR EM PRODUÇÃO AINDA.

## Arquitetura confirmada

O site atualmente publicado usa HTML, CSS e JavaScript estáticos no GitHub Pages. Não usa React/Vite no ramo main.

- rede.html: leitura pública, publicações, comentários, denúncias, pedidos privados e moderação.
- entrar.html: solicitação de link por e-mail, sem senha. O envio/validação é feito no Supabase Auth.
- js/rede-client.js: Supabase JS versionado, chave somente publishable, cliente PKCE.
- js/rede.js: operações reais com Supabase, sem conteúdo fictício; controle de acesso no banco.
- supabase/migrations/20261024160000_rede_mecatiger_mvp.sql: schema ADITIVO, sem alterar community_registrations ou community_metrics.
- supabase/migrations/20261024163000_require_nonanonymous_identity.sql: reforço de políticas RLS, sem executar em produção.
- js/sim-gate.js: barreira visual/de navegação; NÃO bloqueia leitura do HTML público no GitHub Pages.

## Configuração necessária para autenticação por e-mail

1. O projeto Supabase precisa de Auth por e-mail habilitado e quotas/SMTP adequadas.
2. Em Authentication > URL Configuration, configurar Site URL como https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/ e autorizar como redirect https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/entrar.html.
3. Para o fluxo PKCE por link, ajustar o template Magic Link para incluir o destino permitido e o hash: {{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email. Testar com link verdadeiro. O template padrão pode não funcionar com este fluxo.
4. Ativar medidas anti-spam e analisar CAPTCHA e SMTP. Supabase Auth possui limites de solicitação de e-mail, mas isso não substitui controles de abuso de aplicação.
5. O login atual oferece link de e-mail. A interface de digitação de OTP ficará para outra etapa. Nunca pedir que usuários compartilhem códigos.
6. Após um login de teste e verificação do ID real do usuário, um administrador deve cadastrar o moderador no banco protegido, usando INSERT em public.rede_moderators via console administrativo. Não atribuir papeis por user_metadata nem no JavaScript.

## Banco de dados

A migração está apenas em arquivo. NÃO foi executada no Supabase de produção. Revisar/aplicar em ambiente de testes isolado com contas descartáveis antes de qualquer migração de produção. O schema atual de métricas e a RPC register_community_member permanecem intactos.

Verificações de autorização obrigatórias após instalar o schema no ambiente de testes:

| Ação | Visitante | Usuário A | Usuário B | Moderador |
| --- | --- | --- | --- | --- |
| Ler publicação aprovada | Sim | Sim | Sim | Sim |
| Ler publicação pendente de A | Não | Sim | Não | Sim |
| Criar publicação como aprovada | Não | Não | Não | Não |
| Aprovar publicação de A | Não | Não | Não | Sim |
| Ler pedido privado de A | Não | Sim | Não | Sim |
| Alterar status de denúncia | Não | Não | Não | Sim |
| Atribuir-se papel de moderador | Não | Não | Não | Somente operador do banco |

Testes SQL feitos com o proprietário postgres NÃO representam testes de RLS. Usar JWTs reais com papéis anon/authenticated.

## Ciclo de segurança: alternativa 3 — defesa dupla contra Auth anônimo

**Estado: implementado e testado somente na branch. A opção de Anonymous Sign-Ins em produção NÃO foi alterada e seu estado atual não foi confirmado.**

- Migração aditiva `supabase/migrations/20261024163000_require_nonanonymous_identity.sql`: RLS `AS RESTRICTIVE` obriga `auth.jwt()->>'is_anonymous' = false` para INSERT, UPDATE e DELETE nos recursos da Rede. Claims ausentes também não passam; donos e moderadores continuam sujeitos às políticas de autoria/autorização.
- Consultas públicas a publicações e comentários aprovados continuam permitidas; sessões anônimas não conseguem consultar conteúdo pendente privado, pedidos ou denúncias.
- `js/rede-identity.mjs`: interface trata como participante somente usuário com identidade, e-mail confirmado e `is_anonymous === false`. Frontend não é uma barreira de segurança independente do banco.
- `tests/rls_smoke.sql` agora testa a sessão Auth anônima usando papel `authenticated` e marca JWT `is_anonymous=true`, inclusive tentativa de inserir, alterar, apagar e visualizar conteúdo privado. Testa também a falta do claim, com negação por padrão.
- `tests/rede-identity.test.mjs`: testes Node de e-mail confirmado, e-mail não confirmado, anônimo e claim ausente.

### Configuração do Supabase Auth — passo obrigatório ainda pendente

1. Acesse [Supabase > Authentication > Providers](https://supabase.com/dashboard/project/rnnzumzqilkuecvgsjnv/auth/providers).
2. Localize **Anonymous Sign-Ins** (ou provedor Anonymous) e configure como **desativado**. Não confunda com a chave pública `anon`/`sb_publishable_*`, necessária para o feed e métricas.
3. Confira no painel que o provedor Anonymous permanece desativado. O conector disponível nesta sessão não expõe leitura nem atualização dessa preferência; **não afirmar que foi desativada até inspeção real**.
4. Em projeto de teste, verificar que `signInAnonymously()` é rejeitado e que um usuário novo autenticado por link de e-mail consegue interagir após confirmação.
5. Manter as políticas restritivas mesmo com Anonymous Sign-Ins desativado: protege contra tokens/sessões antigos, mudanças posteriores de configuração e erros operacionais.

### Magic Link e retorno à página

O link de e-mail deve preservar somente as rotas autorizadas (`rede.html`, `mecasim-demo.html`, `mecasim.html`). A tela `entrar.html` agora envia `emailRedirectTo` com o parâmetro seguro `?next=...`. Por isso, ao configurar o template PKCE do Magic Link, a sintaxe deve **acrescentar** parâmetros usando `&`:

`{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`

Não duplicar `?` na URL. Configure redirects permitidos e teste em caixa de entrada real antes de publicar. O template e o SMTP de produção não foram alterados.

**Escopo de teste:** a suíte PostgreSQL usa simulação de claims fornecidos à conexão; não emite nem verifica a assinatura criptográfica de um JWT real. A autenticidade do JWT no Supabase é responsabilidade do Auth/PostgREST. Teste end-to-end com um usuário temporário ainda é exigido.

## Segurança e privacidade

- Todas as novas tabelas estão planejadas com RLS. Grupos moderadores são mantidos no banco e sem GRANT de escrita pública.
- Publicações e comentários entram como pending, ficam fora do feed até aprovação.
- Pedidos de ajuda, solicitações STEM e denúncias não aparecem no feed público.
- Cotas por identidade no trigger: 5 posts/h, 10 comentários/10min, 5 pedidos/dia, 5 denúncias/dia. São básicas: sem IP rate limiting forte nem trava de concorrência.
- No front-end, o texto submetido é exibido via textContent, não como HTML.
- Nunca adicionar service_role, sb_secret ou outros tokens privilegiados no repositório.
- Manter políticas de privacidade e exclusão LGPD, regras para menores e mecanismos reais de atendimento às denúncias. Exigirá análise humana.
- O SDK é importado por CDN ESM fixo (versão 2.117.2); em produção avaliar bundle local, SRI e CSP.
- A chave publishable é deliberadamente pública. A autorização efetiva depende de JWT validado e RLS.

## Simulador e privacidade dos arquivos

A nova tela só exibe a prévia após getUser. Isso NÃO impede alguém de baixar ou inspecionar o arquivo do GitHub Pages por URL. Para uma proteção REAL do simulador será necessário hospedá-lo em uma origem que valide a sessão do Supabase antes de entregar conteúdo ou processar chamadas privadas. Não descrever a prévia atual como arquivo privado.

## Verificações de código

- CI: Node --check nos novos arquivos JS, teste de links locais e contratos de segurança com unittest.
- Verificar também o scanner de segredos já instalado na main.
- O site não possui processo de build; HTML/CSS/JS são enviados diretamente pelo GitHub Pages.
- NÃO afirmar que esses testes provam email delivery, login, RLS, LGPD ou resistência a ataques.

## Próximo ciclo

1. Validar SQL em base de desenvolvimento e testar políticas com contas de teste.
2. Configurar URLs/SMTP/template e autenticar no navegador real.
3. Testar interações e moderação end-to-end, acessibilidade em dispositivos.
4. Mover o simulador para serviço de origem autenticada, se o código precisar ser privado.
5. Revisar política de privacidade, retenção, conteúdo de menores, denúncias e exclusão.
6. Somente depois solicitar revisão e autorização explícita para promover a main.
7. Fase posterior: IA informativa com conteúdo público aprovado; nada de segredos no prompt/contexto.

Regra operacional: o trabalho desta branch NÃO está pronto para lançamento até concluir as validações e eliminar falhas críticas conhecidas.