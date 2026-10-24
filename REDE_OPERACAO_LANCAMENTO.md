# Rede Meca Tiger — separação de cadastro e critérios de lançamento

**Estado: checklist pré-lançamento em branch, NÃO operação em produção.** Cadeia: PR #8 → #9 → #11 → #12 → #13 → este PR.

## Decisões confirmadas por inspeção do repositório

- **`index.html`:** painel opcional de participação do Hub alimenta métricas; explicitamente **não cria uma conta autenticada**.
- **`entrar.html` e `js/rede-client.js`:** login separado, por e-mail Supabase Auth/PKCE, para usar a Rede.
- **`rede.html`:** feed público de posts aprovados, envios privados, moderação e contas autenticadas.
- **`index.html#comunidade`:** três caminhos centrais já apontam para âncoras da Rede; fórum FIRST, Reddit e mentores FIRST continuam como recursos externos adicionais, não como substitutos da Rede.
- **`supabase/migrations`:** tabelas da Rede aditivas, sem alterar `community_registrations`/`community_metrics` do cadastro antigo.
- **`supabase/functions/mecasim-trajectories`:** salva/lista/carrega/exclui trajetórias com JWT/RLS. O HTML/JS do simulador no GitHub Pages continua público.

## Coexistência dos cadastros (regra do MVP)

| Sistema | Função | O que NÃO faz |
|---|---|---|
| Cadastro opcional de participação/métricas no Hub | Estatísticas agregadas e interesse em robótica | Não autentica, não concede permissão na Rede |
| Supabase Auth por link de e-mail | Identidade para postar, pedir ajuda, comentar, moderar quando autorizado | Não implica cadastro nas métricas ou newsletter |
| Perfil público da Rede (`rede_profiles`) | Apelido para atribuição de conteúdo | Não divulga o e-mail nem substitui a identidade Auth |

**Não executar backfill, sincronização automática, deduplicação cruzada por e-mail ou migração do cadastro antigo.** Essas operações precisam de decisão específica sobre finalidade, informação aos usuários, privacidade e autorização.

## Checklist de segurança e operação bloqueante

| Item | Condição verificável para lançamento | Situação |
|---|---|---|
| Conteúdo inicial | Cinco pautas revisadas, submetidas e aprovadas, IDs evidenciados | Pendente; ver `REDE_CONTEUDOS_INICIAIS.md` |
| Manual de participação | Percurso explicativo e separação dos cadastros acessíveis | Implementado nesta branch; aguardando testes |
| LGPD/menores | Política aprovada, responsáveis, finalidade, retenção e procedimento de exclusão | Pendente; ver `REDE_PRIVACIDADE_REVISAO.md` |
| SMTP e Auth hospedado | Domínio/redirect autorizado, Magic Link testado com conta de teste legitimamente autorizada, provedor anônimo revisado | Pendente de autorização e infraestrutura |
| Moderação | Responsáveis designados, contas moderadoras com mínimo privilégio, escala e resposta a denúncias | Pendente de decisão humana |
| Migrações | Revisão/backup adequado, validação RLS em projeto de homologação, plano de rollback e autorização | Pendente de autorização |
| Confiabilidade | Testes de unidade/contratos, PostgreSQL/RLS, navegador, segurança, mobile e acessibilidade verdes no SHA final | Pendente de CI desta branch |
| Integração da main | Promoção controlada e revisada de PRs em ordem de dependências | Pendente; **não fazer merge** |

## Procedimento humano de moderação proposto (revisão obrigatória)

1. Revisar conteúdo `pending` por fonte, direitos autorais, dados pessoais e risco para menores.
2. Aprovar apenas conteúdo suficientemente verificado; rejeitar material inseguro ou spam conforme diretrizes validadas.
3. Encaminhar pedidos privados por canal autorizado, sem exposição de detalhes no feed.
4. Tratar denúncias com registro interno adequado e acesso restrito; não publicar evidências com dados privados.
5. Manter responsável e plano de escalonamento; não pressupor atendimento imediato nem correspondência automática de mentores.

## Testes autorizados

Usar unicamente o runner GitHub Actions padrão com Supabase CLI/Docker descartáveis. Executar `python3 -m unittest discover -s tests -p 'test_rede_contract.py' -v`, validação Node, RLS, scanner de segredos e Playwright com teste de estrutura mobile. Não consultar/alterar produção para verificar conteúdo: ausência de IDs comprovados = conteúdo inicial **não validado**.

**Não executar** `supabase login`, `supabase link`, `supabase db push`, `supabase functions deploy`, merge, exclusões de dados reais, uso de tokens administrativos ou criação de serviços pagos.

## Encerramento do ciclo

Registrar o head de branch, URL do PR rascunho, runs e causas de falha/correção. Dar ao responsável três opções futuras: (1) submissão supervisionada de conteúdo real, (2) política operacional/LGPD e menores, (3) homologação de SMTP/produção apenas após autorização explícita. Até lá, declarar exatamente os bloqueios restantes.
