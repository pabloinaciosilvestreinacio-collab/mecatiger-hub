# Ciclo de engenharia — inicialização de identidade e permissões da Rede

**Escopo:** alteração mínima, funcional e autorizada, somente na branch `fix/rede-identity-initialization-20261024`, derivada do head validado do PR #12 (`edad8b0ec9`). Nenhum merge, deploy ou banco hospedado. GitHub Actions usa runners padrão e containers Supabase descartáveis.

## Investigação e causa

- Em `js/rede.js`, a rotina `refreshIdentity()` atribuía `currentUser` e exibia `Sessão autenticada` imediatamente após o `getUser()`.
- As consultas `rede_profiles` e `rede_moderators` ainda estavam pendentes. Nesse intervalo, a página mostrava partes autenticadas e o usuário podia tentar salvar o perfil ou interagir antes de o estado de permissões estar definido.
- Respostas tardias de consultas de perfil, publicações próprias, moderação ou feed poderiam alterar a interface após o início de uma nova verificação de identidade.
- O PR #12 teve um teste anterior ajustado para esperar o carregamento, mas isso não corrigia o comportamento real de inicialização da interface.

## Implementação

1. `refreshIdentity()` agora inicia em estado bloqueado, exibe `Verificando sessão e permissões...` e só libera recursos após as consultas de perfil **e** de papel moderador concluírem sem erro.
2. Formulários de perfil/publicação e botões de pedido de ajuda/conexão são bloqueados durante a verificação. Ações públicas de leitura não são bloqueadas, e nenhuma política do banco é afrouxada.
3. Em falha de consulta de perfil ou moderação, mantém as ações privadas bloqueadas e exibe mensagem genérica; não concede permissões na dúvida (**fail closed**).
4. `identityEpoch` invalida respostas de verificações anteriores; a troca de sessão limpa itens próprios e fila de moderação da interface para impedir exposição cruzada de informações.
5. `loadFeed`, `loadOwn` e `loadModeration` recusam resultados obsoletos. O logout invalida operações de identidade pendentes **antes** de chamar Supabase Auth.
6. A mensagem de publicação passa a refletir quando o perfil foi salvo com sucesso, sem alterar o design ou introduzir recursos novos.

## Testes e critérios de aceitação

- **Contratos estáticos:** `python3 -m unittest discover -s tests -p 'test_rede_contract.py' -v` deve confirmar os guardas de estado, descarte de resultados antigos, bloqueio de botões e limpeza de informações por usuário.
- **Sintaxe/Node:** `.github/workflows/rede-validate.yml` verifica JavaScript existente e testes de cliente/Edge.
- **Navegador E2E real:** em `tests/ui/local-auth-flow.spec.mjs`, a primeira consulta de perfil é retida temporariamente usando Playwright `page.route`. Antes da liberação, banner deve indicar verificação; o botão de salvar deve estar desativado; publicação invisível; ações de ajuda e conexão desativadas. Após liberar a resposta, o fluxo normal de OTP, perfil, publicação, trajeto do Meca Sim e logout deve continuar funcionando.
- **Integração Supabase local descartável:** `.github/workflows/supabase-local-homologation.yml` executa `npm run test:local-supabase` e `npm run test:ui`; reportar o número real de casos aprovados baseado no log.
- **PostgreSQL RLS:** `.github/workflows/rede-rls.yml` mantém a verificação de acesso por proprietário, moderador e sessões anônimas.
- **Scanner de segredos:** `.github/workflows/secret-scan.yml` continua obrigatório.

**Importante:** só declarar aprovação integral depois de conferir `conclusion=success` em cada check do SHA final do novo PR. Simulações/contratos Node não equivalem a testes de navegador ou implantação. Tokens de teste, contas fictícias e chaves efêmeras ficam apenas nos containers/runner local descartável.

## Diagnóstico da primeira homologação deste ciclo

- [`40120629192`](https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/actions/runs/40120629192) terminou com falha no cenário Playwright que segura a primeira consulta de perfil: `route.continue: Route is already handled!`.
- **Causa real:** o próprio teste chamava `page.unroute(...)` imediatamente após `releaseProfileRead()`, enquanto o interceptador aguardava a liberação. Remover uma rota em processamento provocou manipulação concorrente.
- **Correção confinada aos testes:** não remover o interceptador durante a requisição pendente. O bloqueio permanece de uso único (`heldOnce`), e o Playwright descarta automaticamente a interceptação ao encerrar o contexto.
- Validação de frontend, segurança, RLS e regressões continuam exigindo um workflow completo de sucesso no commit final.
## Auditoria: riscos e limites

- Os bloqueios de frontend **não** são a fronteira de autorização; RLS, JWT e validação na Edge Function seguem responsáveis pelo isolamento de dados.
- As mudanças cobrem a corrida da inicialização e troca de usuário na Rede; não transformam o GitHub Pages em hospedagem privada do código do simulador.
- Interações já iniciadas antes de uma revogação de sessão ainda dependem da validação do servidor e das políticas RLS.
- O contexto de teste não equivale a produção: SMTP real, domínio dedicado, privacidade/LGPD e testes de lançamento permanecem pendentes.
- Se o E2E ou outro check falhar, ler logs, corrigir apenas nesta branch e registrar o novo run antes de solicitar revisão.

## Dependência dos PRs

`main` → PR #8 (Rede) → PR #9 (Meca Sim backend) → PR #11 (Supabase descartável) → PR #12 (browser E2E) → **este ciclo**.

**Proibido sem autorização:** merge na `main`, `supabase login`, `supabase link`, `supabase db push`, `functions deploy`, alterações de dados reais, recursos pagos e tarefas destrutivas.
