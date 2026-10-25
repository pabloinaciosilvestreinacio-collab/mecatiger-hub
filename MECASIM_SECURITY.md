# Meca Sim — biblioteca privada de trajetórias (Alternativa 2)

**Status em 25/10/2026:** schema e RLS da biblioteca foram aplicados ao Supabase hospedado. A Edge Function ainda não foi implantada e não há usuários Auth; salvar trajetórias continua indisponível. Este arquivo registra o modelo de segurança, não a ativação completa.

## Objetivo e escopo

A prévia do Meca Sim existente em `mecasim-demo.html` continua sendo uma visualização HTML/JavaScript pública no GitHub Pages. O que se torna privado após a configuração é o **armazenamento de trajetórias por conta**, com ações `save`, `list`, `load` e `remove` processadas por Supabase Edge Functions. A lógica Java completa do Meca Sim **não** é executada na nuvem por esta entrega.

Os dados privados são apenas um **nome de até 70 caracteres e 1–16 pontos {x,y}**, números limitados à arena demonstrativa (0,25–3,41 metros). Não são enviados projetos Java, credenciais, imagens, arquivos, telemetria de hardware nem dados sensíveis.

## Arquivos criados ou modificados

- `supabase/migrations/20261025032028_mecasim_private_trajectories.sql`: tabela privada por usuário, RLS, checagem de pontos no banco, limite de 30 rotas armazenadas e 10 criações por hora/identidade.
- `supabase/functions/mecasim-trajectories/index.ts`: ponto de entrada Deno usando cliente Supabase com chave **publishable**, sem `service_role`, e autorização por JWT.
- `supabase/functions/mecasim-trajectories/handler.mjs`: endpoint POST com ações `list`, `save`, `load` e `remove` e validação de token via `auth.getUser(token)`.
- `supabase/functions/mecasim-trajectories/trajectory-validation.mjs`: saneamento e validação de coordenadas e nomes.
- `supabase/config.toml`: `verify_jwt = true` para recusa de tokens inválidos no gateway da função.
- `js/mecasim-private.js`: interface autenticada com listagem, salvamento, carregamento e exclusão.
- `mecasim-demo.html`: controles de biblioteca e integração limitada às rotas desenhadas na prévia.
- `tests/mecasim-trajectories.test.mjs`: testes HTTP em Node com autenticação simulada e clientes de dados falsos.
- `tests/mecasim_rls.sql`: testes PostgreSQL de isolamento entre usuários, RLS anônima e validação real de dados.
- CI da branch: workflows `rede-validate.yml` e `rede-rls.yml`.

## Modelo de segurança

1. A sessão real do usuário deve existir via Supabase Auth, com e-mail confirmado; `is_anonymous === false`.
2. O cliente envia o JWT do usuário por `supabase.functions.invoke`, nunca uma chave privilegiada.
3. O gateway requer JWT (`verify_jwt = true`) e a Edge Function ainda consulta `auth.getUser(token)`.
4. A função constrói um cliente por requisição, encaminha a autorização recebida e confia no RLS para isolar os dados.
5. `owner_id` vem de `user.id` validado pelo Auth e é filtrado em todas as leituras, exclusões e inserções. O cliente não escolhe outro proprietário.
6. A tabela pública no PostgREST **não** é pública nos dados: grants apenas para `authenticated` e RLS restritiva `owner_id=auth.uid()` e `is_anonymous=false`. Operações REST diretas ficam sob as mesmas políticas.
7. A validação é duplicada: na função e em `CHECK (public.mecasim_valid_points(points))` no PostgreSQL. Quem contornar a UI não pode enviar pontos inválidos para a própria tabela.
8. Inserção aciona lock transacional por proprietário antes de avaliar cotas. Evita disputar as cotas por requisições simultâneas à tabela.
9. CORS autoriza somente a origem conhecida do GitHub Pages; isso restringe o uso por navegadores, mas **não substitui** JWT/RLS. Tokens roubados ainda precisam ser revogados/expirar.
10. Respostas têm `Cache-Control: no-store`, não exibem SQL, JWT, chave ou detalhes internos.

### Limitações relevantes

- O código HTML/JS e os recursos da arena no GitHub Pages continuam recuperáveis publicamente, mesmo após login visual. A alternativa 2 protege somente operações e informações no backend.
- **Isolamento de origem:** o Supabase Auth da Rede atualmente persiste sessão no armazenamento do navegador. GitHub Pages usa como origem `https://pabloinaciosilvestreinacio-collab.github.io`, compartilhada por eventuais outros sites do mesmo proprietário sob diferentes caminhos. Qualquer JavaScript não confiável executado nessa mesma origem pode acessar armazenamento da sessão. Antes de receber dados privados reais, preferir um domínio dedicado ao Hub, políticas CSP e auditoria de todos os conteúdos servidos na origem; um path como `/mecatiger-hub/` sozinho não isola localStorage.
- A função não foi testada com um JWT emitido pelo Supabase real: testes Node usam mocks e testes RLS usam claims simulados por PostgreSQL. É obrigatório testar com duas contas reais em ambiente isolado.
- Não existe antiabuso por IP ou CAPTCHA específico da Edge Function, além dos limites por conta e dos controles de infraestrutura. O limite de 10/h conta rotas **ainda armazenadas** e criadas na última hora; se forem excluídas, o contador cai. Monitorar abuso após o lançamento.
- `SUPABASE_PUBLISHABLE_KEYS` e `SUPABASE_ANON_KEY` são configurações públicas de acesso ao serviço, **não** são segredos de administrador; esta função não recebe `service_role` nem `sb_secret`.
- O nome da rota pode conter informação pessoal digitada pelo usuário. Informar finalidade, retenção, exclusão, moderação eventual e política LGPD antes de expor o recurso a menores.

## Para validar antes de publicar

1. Schema aplicado em produção; validar a Edge Function em Supabase local descartável antes de implantá-la no projeto hospedado.
2. Não reaplicar migrations: as versões 20261025032012, 20261025032022, 20261025032028 e 20261025032035 já estão no histórico hospedado.
3. Configurar Supabase Auth com redirect URL de teste, envio de e-mail e login real. Desativar Anonymous Sign-Ins e manter as políticas defensivas.
4. Implantar `mecasim-trajectories` somente depois de Auth e JWT verificados; o endpoint deve manter `verify_jwt=true`.
5. Usar duas identidades reais A e B: A salva rota; A lista e carrega a sua; B não lista/abre/exclui a rota de A (inclusive por API direta).
6. Executar: token ausente → 401; JWT inválido/expirado → bloqueio; anônimo → 403; origem hostil → 403; corpo excessivo → 400; nome/pontos inválidos → 422; quota → 429.
7. Conferir rollback: excluir a função do ambiente e deixar a interface desabilitada ou retornar à branch anterior. Retenção/exclusão de registros requer consentimento e plano específico; **não executar DROP TABLE em produção**.
8. Só considerar merge após revisar custos, Auth, testes de dois usuários, mobile, auditoria LGPD e autorização explícita.

## Testes automatizados desta branch

CI de JS: `node --check js/mecasim-private.js`, `node --check supabase/functions/mecasim-trajectories/handler.mjs` e `node --test tests/rede-identity.test.mjs tests/mecasim-trajectories.test.mjs`.

CI de PostgreSQL: aplica mock de Auth, migrações, `tests/rls_smoke.sql` e `tests/mecasim_rls.sql` em banco descartável. Sem produção, e com RLS simulada por papéis `anon` e `authenticated`.

Scanner de segredos preexistente continua obrigatório em push e PR. Resultados devem ser verificados no commit final do PR, não inferidos de execuções antigas.
