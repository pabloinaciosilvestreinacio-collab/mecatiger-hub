# Checklist de preview e publicação

## Estado atual

- Baseline inspecionado: branch `main`, commit `ef8fcdb31ffba7c7132074fbc41970eab803b071` (17/10/2026).
- Site: HTML/CSS/JavaScript estático; sem etapa de build.
- Supabase: a migração `secure_public_registration_rpc_v2` foi aplicada em 19/10/2026. O cadastro público usa uma RPC limitada; leitura e INSERT diretos na tabela de e-mails estão bloqueados para `anon` e `authenticated`.
- Meca Sim: há uma prévia estática interativa no Hub para campo e trajetória visual; a aplicação completa segue local no repositório público.
- Publicação: não iniciada. Domínio e DNS não foram tocados.

## Configuração de preview recomendada

GitHub Pages publicado a partir da raiz da branch `main`, sem etapa de build. O arquivo `.nojekyll` está presente. A URL esperada depois da ativação é `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/`.

## Matriz de verificação

| Verificação | Estado | Evidência / próximo passo |
|---|---|---|
| Inspeção de estrutura e baseline | Executado | main contém index.html, styles.css, contato.html, evidencias.html, public/ e supabase/schema.sql. |
| Leitura do README e fluxo de cadastro | Executado | Confirmados cadastro, perfil entusiasta, modo #cadastro-teste simulado e tratamento documentado de e-mail duplicado. |
| Revisão estática do SQL versionado nesta branch | Executado | RLS ativada; `anon`/`authenticated` sem INSERT direto nem acesso à sequence; RPC valida consentimento e só insere, métricas permanecem limitadas a `id = 1`. |
| RLS e grants remotos após migração | Executado | RPC pública existe; `anon` pode executá-la, não pode inserir/ler a tabela de e-mails diretamente e pode ler somente métricas agregadas. `rls_auto_enable()` deixou de ser executável pelos papéis públicos. |
| Revisão de enumeração de e-mail | Executado; corrigido | A RPC responde da mesma forma para cadastro novo ou duplicado e usa `ON CONFLICT DO NOTHING`. A tabela não pode ser consultada pelos papéis públicos. |
| Busca estática por credenciais privilegiadas e sinks dinâmicos | Executado | Nenhuma service-role/secret key encontrada; a chave publishable é pública. Uso de innerHTML na página de contato recebe somente rótulos de uma lista fixa; cadastro usa textContent. |
| Revisão do patch e integração Meca Sim | Executado | index.html e mecasim.html levam à prévia limitada; API do GitHub confirmou o repositório público e ausência de Pages/homepage. A demo é independente e não altera o repositório Meca Sim. |
| Teste transacional da RPC | Executado | Duas chamadas como `anon` com o mesmo e-mail produziram uma linha durante o teste e não geraram erro; a transação foi revertida e nenhuma linha de teste permaneceu. |
| Supabase Security Advisors | Executado após migração | O aviso anterior de `rls_auto_enable()` foi resolvido. Permanecem avisos esperados para a RPC pública `SECURITY DEFINER`, cuja exposição é intencional e limitada ao INSERT validado, e uma informação de tabela sem policy porque o acesso direto foi totalmente revogado. |
| Build | Não aplicável | Site sem build step. |
| Sintaxe JavaScript e modo #cadastro-teste (simulação local) | Executado | Node --check passou nos scripts inline; handler simulado confirmou mensagem de teste sem chamadas fetch; campo Outro país alterna rótulo/campo e limpa valor ao voltar para Brasil. |
| Parse HTML, referências locais e sintaxe JavaScript | Executado | Cinco páginas analisadas; 89 referências `href`/`src` verificadas, sem arquivo/âncora ausente; quatro scripts inline passaram em `node --check`; `git diff --check` passou. |
| Parse das páginas, links locais e labels de formulário | Executado | Quatro páginas analisadas; links/âncoras locais resolvidos, IDs sem duplicidade e labels associados. Campo condicional Outro país recebeu rótulo visível quando ativado. |
| Preview rápido via HTMLPreview (desktop) | Executado | Commit 3a04e88 carregou no Chromium; o cartão SIMULADOR apresenta o link direto da prévia Meca Sim. O modo `#cadastro-teste` e envio simulado com dados fictícios haviam sido conferidos em commit anterior. |
| Preview da demo Meca Sim via HTMLPreview | Executado | Commit 6c04f4f carregou no Chromium; controles acessíveis, adição de ponto pelo campo e reprodução da rota conferidos. A prévia terminou e voltou ao estado inicial. Nenhum erro da página; um aviso de extensão do navegador foi observado. |
| Ajustes responsivos e navegação móvel | Implementado; revisão estática executada | Adicionados menu móvel com estado acessível, grade de métricas em duas colunas em telas pequenas, espaçamentos/tipografia adaptados, foco visível e redução de movimento. |
| Chromium em viewport mobile | Não executado | Estilos responsivos e controles por toque estão preparados; a emulação de viewport mobile não foi disponível nesta sessão. Revisar em celular ou viewport de 390 px antes da aprovação final. |
| Contraste e acessibilidade | Não executado | Testar foco visível, labels, nomes acessíveis, contraste e movimento reduzido no preview. |
| Cadastro com usuário de teste | Executado com rollback | Teste transacional como `anon`, incluindo duplicidade; nenhum dado fictício persistiu. O modo `#cadastro-teste` continua sem gravar. |
| Preview hospedado | Pendente | Mesclar o PR e habilitar GitHub Pages em `main`/raiz. |
| HTTPS do preview | Pendente | Validar após provisionamento do preview. |
| Domínio próprio, DNS e HTTPS final | Não executado | Só após compra/provisionamento do domínio e autorização expressa para DNS/publicação. |

## Segurança do Supabase

A chave publishable no navegador é pública por definição. A migração removeu acesso direto à tabela de cadastros e expõe somente a RPC de inserção com consentimento, `search_path` vazio e resposta indistinguível para novo/duplicado. Nunca enviar `service_role` ou secret key ao navegador. A leitura pública permanece limitada à linha agregada de métricas. A RPC anônima pode receber abuso automatizado; acompanhar volume e considerar rate limiting se ele ocorrer.

## Critério de promoção

Promover somente após:
- PR revisado e GitHub Pages habilitado;
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
