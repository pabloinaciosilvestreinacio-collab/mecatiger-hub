# Checklist de preview e publicação

## Estado atual

- Baseline inspecionado: branch main, commit ef8fcdb31ffba7c7132074fbc41970eab803b071 (17/10/2026).
- Site: HTML/CSS/JavaScript estático; sem etapa de build.
- Supabase: inspeção remota somente leitura confirmou RLS nas tabelas de cadastro e métricas. Este PR propõe uma RPC em supabase/schema.sql; ela ainda não foi aplicada ao projeto remoto.
- Meca Sim: o Hub aponta para uma página informativa e para o repositório; ainda não existe demonstração web hospedada.
- Publicação: não iniciada. Domínio e DNS não foram tocados.

## Configuração de preview recomendada

Cloudflare Pages conectado à branch do PR, diretório de saída /, build command vazio. Usar somente URL temporária pages.dev; não associar domínio personalizado até autorização de produção.

Alternativa: GitHub Pages publicado a partir de branch dedicada ou workflow, após ativação explícita nas configurações. Não usar produção para testes de cadastro.

## Matriz de verificação

| Verificação | Estado | Evidência / próximo passo |
|---|---|---|
| Inspeção de estrutura e baseline | Executado | main contém index.html, styles.css, contato.html, evidencias.html, public/ e supabase/schema.sql. |
| Leitura do README e fluxo de cadastro | Executado | Confirmados cadastro, perfil entusiasta, modo #cadastro-teste simulado e tratamento documentado de e-mail duplicado. |
| Revisão estática do SQL versionado nesta branch | Executado | RLS ativada; anon/authenticated sem INSERT direto nem acesso à sequence; RPC valida consentimento e só insere, métricas permanecem limitadas a id = 1. |
| Verificação somente leitura da RLS e grants remotos | Executado | RLS ativa; anon/authenticated têm INSERT direto no cadastro sem SELECT; métricas só permitem SELECT em id = 1; refresh_community_metrics não é executável pelos papéis públicos. Veja o aviso separado sobre rls_auto_enable. |
| Revisão de enumeração de e-mail | Executado; achado no código | O fluxo anterior distinguia a resposta 409 esperada pela restrição UNIQUE e informava que o e-mail já existia; isso permitia inferência pelo endpoint. A branch substitui o fluxo por RPC com resposta igual para novo/duplicado; SQL ainda não aplicado ao Supabase. |
| Busca estática por credenciais privilegiadas e sinks dinâmicos | Executado | Nenhuma service-role/secret key encontrada; a chave publishable é pública. Uso de innerHTML na página de contato recebe somente rótulos de uma lista fixa; cadastro usa textContent. |
| Revisão do patch e integração Meca Sim | Executado | index.html leva a mecasim.html; API do GitHub confirmou repositório público. Página aponta às instruções e descreve execução local com Python 3.10+ e JDK 17+, sem alegar demo web. Ainda não há demo web publicada. |
| Estado efetivo de RLS/grants remotos | Executado, somente leitura | RLS ativa nas duas tabelas; anon/authenticated têm INSERT direto em community_registrations, sem SELECT; métricas têm SELECT limitado a id = 1. A função refresh_community_metrics não pode ser executada pelos papéis públicos. O remoto ainda não tem a RPC proposta nesta branch. |
| Supabase Security Advisors e trigger remoto | Executado, somente leitura; aviso para revisão | Os advisors reportaram EXECUTE público em SECURITY DEFINER para public.rls_auto_enable() (avisos anon e authenticated). A inspeção confirmou que a função é vinculada ao event trigger ensure_rls em ddl_command_end, filtra criação de tabelas no schema public e usa search_path=pg_catalog. Não revogar nem alterar automaticamente: avaliar a dependência do trigger e confirmar se o endpoint RPC é invocável antes de qualquer mudança remota. |
| Build | Não aplicável | Site sem build step. |
| Sintaxe JavaScript e modo #cadastro-teste (simulação local) | Executado | Node --check passou nos scripts inline; handler simulado confirmou mensagem de teste sem chamadas fetch; campo Outro país alterna rótulo/campo e limpa valor ao voltar para Brasil. |
| Validação HTML completa e links externos | Não executado | Executar validator e abrir os links no preview. |
| Parse das páginas, links locais e labels de formulário | Executado | Quatro páginas analisadas; links/âncoras locais resolvidos, IDs sem duplicidade e labels associados. Campo condicional Outro país recebeu rótulo visível quando ativado. |
| Preview rápido via HTMLPreview (desktop) | Executado | Commit b50f2a2 carregou no Chromium em viewport 1363×936; `#cadastro-teste` confirmou envio simulado com dados fictícios; a página do Meca Sim abriu. Nenhum erro de console da página foi observado. |
| Preview atualizado da página Meca Sim via HTMLPreview | Executado | Commit e64e319 carregou no Chromium; a página informa ausência de demo web, privacidade do repositório, requisitos locais e risco do Java executado; CTA abre o README correto. Verificação via árvore de acessibilidade, sem inspeção de console nesta rodada. |
| Ajustes responsivos e navegação móvel | Implementado; revisão estática executada | Adicionados menu móvel com estado acessível, grade de métricas em duas colunas em telas pequenas, espaçamentos/tipografia adaptados, foco visível e redução de movimento. |
| Chromium em viewport mobile | Não executado | O navegador disponível nesta sessão não oferece controle de viewport; validar em celular ou viewport de 390 px antes da aprovação final. |
| Contraste e acessibilidade | Não executado | Testar foco visível, labels, nomes acessíveis, contraste e movimento reduzido no preview. |
| Cadastro com usuário de teste | Não executado | Aplicar a mudança RPC em branch de desenvolvimento Supabase e usar e-mail controlado; comparar resposta para cadastro novo/duplicado e verificar métricas. |
| Preview hospedado | Pendente | Conectar a branch do PR ao Cloudflare Pages. Não foi criada URL de preview. |
| HTTPS do preview | Pendente | Validar após provisionamento do preview. |
| Domínio próprio, DNS e HTTPS final | Não executado | Só após compra/provisionamento do domínio e autorização expressa para DNS/publicação. |

## Segurança do Supabase

A chave publishable/anon no navegador é pública por definição. A inspeção remota não encontrou SELECT público de community_registrations; observou INSERT direto para anon/authenticated, que combinado com a resposta de UNIQUE era um canal de enumeração. Os advisors remotos também sinalizaram a função event trigger public.rls_auto_enable() como SECURITY DEFINER executável por anon/authenticated; confirmar a exposição efetiva via RPC e a configuração do trigger antes de considerar essa advertência resolvida. A proposta nesta branch remove esses grants e expõe apenas uma RPC de inserção com consentimento, search_path vazio e EXECUTE concedido aos papéis públicos. A proposta ainda não está aplicada no Supabase remoto. Nunca enviar service-role/secret key ao browser. A leitura de métricas continua limitada à linha agregada autorizada. Avaliar abuso automatizado de inscrições e rate limiting antes da produção; não introduzir CAPTCHA ou serviço externo sem avaliar custo e privacidade.

## Critério de promoção

Promover somente após:
- PR revisado e preview hospedado;
- todas as rotas, âncoras, formulários e links testados;
- nenhuma chave privilegiada em HTML ou rede;
- teste real de RLS e cadastro com dados descartáveis;
- teclado, foco, contraste e viewport móvel verificados;
- decisão explícita sobre domínio, DNS e publicação de produção.

## Rollback

1. No provedor, reimplantar o último deploy funcional ou desligar o projeto/branch de preview.
2. Se já promovido, reverter o PR para o commit anterior e observar o novo deploy.
3. Não mudar DNS no rollback sem autorização expressa.
4. Preservar o log de testes e a URL do deploy que foi revertido.
