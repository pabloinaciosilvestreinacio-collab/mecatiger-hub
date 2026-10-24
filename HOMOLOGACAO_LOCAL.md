# Homologação local — Rede Meca Tiger e Meca Sim

Estado: ambiente descartável preparado na branch de testes. Nada neste fluxo vincula, migra ou implanta o projeto Supabase hospedado.

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
- Pilha Supabase completa: não executada aqui porque Docker não está instalado; deve ser comprovada pelo workflow descartável.
- Primeira execução do workflow: as migrações, Mailpit e os três usuários OTP funcionaram, mas o teste encontrou uma inicialização duplicada do Edge Runtime; o workflow foi corrigido e precisa ser reexecutado.

## Limitações e riscos pendentes

- O workflow precisa ser executado no GitHub Actions para produzir evidência real da pilha Supabase e do navegador.
- A interface continua usando a configuração hospedada quando publicada; o teste de navegador bloqueia tráfego não local e valida apenas estrutura, acessibilidade e responsividade. Auth/RLS/Edge são validados separadamente contra a pilha local.
- JWT de acesso já emitido pode continuar válido até expirar mesmo após logout; o teste confirma a revogação do refresh token e rejeita explicitamente um JWT expirado.
- A proteção de trajetórias cobre os dados armazenados. Os arquivos estáticos do simulador no GitHub Pages continuam publicamente recuperáveis, conforme já documentado em `MECASIM_SECURITY.md`.
- Rate limiting local comprova as configurações e os limites de banco existentes, mas não reproduz comportamento de IP/proxy de produção.
