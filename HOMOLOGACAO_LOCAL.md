# Homologação local — Rede Meca Tiger e Meca Sim

Estado: ambiente descartável implementado e aprovado no GitHub Actions. Nada neste fluxo vincula, migra ou implanta o projeto Supabase hospedado.

## Escopo e fronteiras de segurança

- Supabase CLI fixado em `2.122.0` no workflow.
- Node.js 24 e runner padrão `ubuntu-latest`.
- Banco, Auth, Mailpit, REST e Edge Runtime são containers locais e descartáveis; serviços fora do escopo são excluídos no CI.
- O teste recusa qualquer `SUPABASE_URL` ou `MAILPIT_URL` cujo host não seja `127.0.0.1` ou `localhost`.
- Nenhum `supabase login`, `supabase link`, `supabase db push` ou `supabase functions deploy` é executado.
- Chaves locais efêmeras são gravadas apenas em arquivo temporário do runner, não são exibidas nem versionadas.
- Os e-mails usam o domínio reservado `.invalid` e ficam capturados no Mailpit.
- Ao final, inclusive após falha, `supabase stop --no-backup` remove os volumes locais.

## Execução local

Pré-requisitos gratuitos:

1. Docker compatível com a Supabase CLI.
2. Node.js 24 ou superior.
3. `npm ci`.

Comandos:

```bash
npx --yes supabase@2.122.0 start
```

Em outro terminal, obtenha as variáveis locais sem publicá-las, mapeie `API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `JWT_SECRET` e `INBUCKET_URL` para os nomes esperados por `tests/local-supabase-e2e.mjs`, e execute:

```bash
npm run test:local-supabase
npm run test:ui
npx --yes supabase@2.122.0 stop --no-backup
```

O procedimento automatizado e reproduzível está em `.github/workflows/supabase-local-homologation.yml`.

## Matriz de verificação

| Área | Verificação | Tipo | Evidência esperada no log |
|---|---|---|---|
| Migrações | Aplicação das três migrações em banco novo | Integração local | `supabase start` concluído |
| E-mail | Três OTPs capturados no Mailpit, sem envio externo | Integração local | criação de usuários fictícios |
| Auth | confirmação, sessão, JWT expirado, logout e revogação do refresh token | Integração local | `LOCAL SUPABASE HOMOLOGATION PASSED` |
| Identidades | aluno A, aluno B e moderador descartáveis | Integração local | perfis e concessão local de moderador |
| Rede | pendente invisível para visitante/B, visível e aprovável por moderador | Integração/RLS | etapa `checking Rede moderation` |
| Meca Sim | salvar, listar, carregar e excluir | Integração/Edge | etapa `checking Edge Function CRUD` |
| Isolamento | B não lista, carrega ou exclui a rota de A | Integração/RLS | etapa `owner isolation` |
| Abuso | sem token, token forjado, token expirado e origem hostil | Segurança | respostas 401/403 |
| Anônimo | cadastro anônimo desabilitado e políticas restritivas já cobertas em SQL | Segurança | tentativa rejeitada + workflow RLS |
| Interface | páginas públicas, WCAG A/AA e largura móvel de 360 px | Homologação de UI | sete testes Playwright |
| Contratos | renderização segura, rotas, limites e ausência de chave privilegiada no browser | Teste estático | suíte Python |

## Evidência disponível neste ambiente Work

Em 24/10/2026 foram executados localmente, sem Docker:

- 16 testes unitários Node: aprovados.
- 9 testes estáticos/contratuais Python: aprovados.
- Parse do `supabase/config.toml`: aprovado.
- Download do Chromium para Playwright: bloqueado pela restrição de rede deste ambiente; nenhum resultado de navegador foi declarado.
- Pilha Supabase completa: não executada no Work porque Docker não está instalado; comprovada no runner descartável do GitHub Actions.
- Primeira execução do workflow: as migrações, Mailpit e os três usuários OTP funcionaram, mas o teste encontrou uma inicialização duplicada do Edge Runtime; o workflow foi corrigido e precisa ser reexecutado.
- Segunda execução: toda a homologação de backend passou; o navegador encontrou dois links sem distinção não baseada apenas em cor e overflow horizontal da Rede em 360 px. A correção CSS mínima foi autorizada e aplicada, pendente de nova execução.
- Terceira execução (`40116188243`): homologação Supabase aprovada, 7/7 testes Playwright aprovados e stack local removido ao final. No mesmo commit, scanner de segredos, validação estática e testes PostgreSQL/RLS também foram aprovados.

## Limitações e riscos pendentes

- A evidência é de homologação descartável no CI; não representa validação real em produção.
- A interface continua usando a configuração hospedada quando publicada; o teste de navegador bloqueia tráfego não local e valida apenas estrutura, acessibilidade e responsividade. Auth/RLS/Edge são validados separadamente contra a pilha local.
- JWT de acesso já emitido pode continuar válido até expirar mesmo após logout; o teste confirma a revogação do refresh token e rejeita explicitamente um JWT expirado.
- A proteção de trajetórias cobre os dados armazenados. Os arquivos estáticos do simulador no GitHub Pages continuam publicamente recuperáveis, conforme já documentado em `MECASIM_SECURITY.md`.
- Rate limiting local comprova as configurações e os limites de banco existentes, mas não reproduz comportamento de IP/proxy de produção.

## Ciclo PR #12 — correção do bundle de navegador (24/10/2026)

- **Falha observada:** workflow `Supabase disposable homologation`, run [`40117111539`](https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/actions/runs/40117111539), commit `b114b78d`: `ENOENT: no such file or directory, open 'test-results/supabase-browser.mjs'` durante carregamento dos arquivos Playwright.
- **Causa raiz:** `scripts/build-test-browser-client.mjs` produzia o bundle ESM dentro de `test-results/`; Playwright limpa a pasta de resultados ao iniciar e `tests/ui/local-app.mjs` tentava carregar o arquivo excluído.
- **Correção limitada a testes:** saída e leitura movidas para `.mecatiger-browser-build/supabase-browser.mjs`; diretório ignorado pelo Git, distinto de `test-results/` e de artefatos publicados. Não alterar interface, produção, Auth ou RLS.
- **Comando de verificação:** `npm run test:ui` (que executa `node scripts/build-test-browser-client.mjs && playwright test`) no job `disposable-stack` de `.github/workflows/supabase-local-homologation.yml`.
- **Critério objetivo:** o workflow deve concluir com sucesso **no SHA final do PR #12**. A execução antiga falhada continua registrada como evidência histórica; nunca a tratar como aprovada.
- **Segurança:** somente runners GitHub hospedados padrão, arquivos temporários locais e `supabase stop --no-backup`; nenhum `supabase login/link/db push/functions deploy`, nenhuma gravação em produção, nenhum merge.
- **Limites de validação:** unitários/contratos não substituem navegador. Somente uma execução Playwright + Supabase descartável com conclusão `success` comprova esta etapa; ainda não equivale a homologação em produção.

### Segunda tentativa de homologação — erros distintos identificados

- Workflow [`40117705356`](https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/actions/runs/40117705356), commit `967c5526`, **falhou com 6/8 testes Playwright aprovados**: o arquivo ESM temporário já foi encontrado (primeira correção efetiva).
- **Login UI falhou:** o teste insere a chave local `ANON_KEY` da Supabase CLI, que é JWT legado com role `anon`, mas `resolveSupabaseConfig` aceitava exclusivamente chaves `sb_publishable_*`. A configuração local era descartada e o navegador tentava contatar o projeto hospedado; a regra de bloqueio de tráfego remoto no teste impedia corretamente o envio. A solução mantém a restrição a `127.0.0.1`/`localhost`, porta `54321`, e verifica que o JWT legado de teste declara exclusivamente `role=anon`, recusando `service_role`, `sb_secret` e endereços remotos. A verificação da assinatura/validade real é feita pelo Supabase, não pelo parser de configuração do navegador.
- **Teste de página protegida incorreto:** a suíte pública esperava o título `Meca Sim` na prévia sem autenticação, mas o sistema redirecionava corretamente para `entrar.html?next=mecasim-demo.html`. O teste agora verifica o redirecionamento; a navegação com sessão real continua no teste E2E autenticado.
- **Contratos reforçados:** `tests/rede-runtime-config.test.mjs` cobre JWT sintético não privilegiado, negação de credencial administrativa, porta incorreta e host de produção. Nenhum token verdadeiro é escrito em código ou log.
- **Veredito final:** consultar o workflow `Supabase disposable homologation` no SHA atual do PR #12. A aprovação anterior de Node/RLS ou do PR #11 não representa sucesso do fluxo de navegador do PR #12.

### Terceira tentativa — sincronização de estado no navegador

- Run [`40118092347`](https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/actions/runs/40118092347): falhou com **6/7 testes Playwright aprovados**. O login via Mailpit e Magic Link avançou até a Rede, comprovando que o override local com JWT `anon` funcionou.
- O `#rede-identity` exibe a autenticação antes de completar as consultas assíncronas do perfil e permissões (`refreshIdentity`); o teste começava a salvar/publicar nesse intervalo.
- O fluxo automatizado agora espera `#post-status` informar que o perfil inicial foi consultado antes de executar `Salvar perfil`. Isso elimina o falso avanço do teste baseado somente no banner de sessão.
- **Risco residual real:** a UI permite que uma pessoa muito rápida interaja antes da resolução inicial do perfil. Um ciclo futuro pode proteger a interface durante o carregamento; nenhuma mudança visual/funcional foi introduzida neste ciclo sem escolha do responsável.
- A execução final continua pendente de um run GitHub Actions com `conclusion=success` no SHA final; não inferir sucesso destes marcos intermediários.

### Quarta tentativa — erro no ciclo de vida de eventos assíncronos

- Run [`40118464483`](https://github.com/pabloinaciosilvestreinacio-collab/mecatiger-hub/actions/runs/40118464483): **6/7 testes Playwright passaram**; após perfil salvo, o status da publicação permaneceu inalterado.
- **Causa localizada no código:** `js/rede.js` acessava `event.currentTarget.reset()` **depois** de `await supabase.from(...).insert(...)` nos formulários de postagem e de pedido. O `currentTarget` pode ser `null` após a etapa síncrona do dispatch, impedindo `reset()` e a mensagem de sucesso.
- **Correção funcional indispensável:** guardar `const form=event.currentTarget` durante o evento, antes de aguardar a chamada de rede, e usar `form.reset()` nos dois formulários. Não modifica layout nem o esquema do banco.
- **Regressão estática:** `python3 -m unittest discover -s tests -p 'test_rede_contract.py' -v` agora inclui verificação explícita contra `event.currentTarget.reset()`.
- **Confirmação exigida:** novo `npm run test:ui` deve passar com a stack Supabase local descartável. Se não passar, investigar o log subsequente sem atribuir sucesso por inferência.
