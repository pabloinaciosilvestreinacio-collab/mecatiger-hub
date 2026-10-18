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
| Verificação somente leitura da RLS e grants remotos | Executado | RLS ativa nas duas tabelas; anon/authenticated têm INSERT no cadastro e SELECT apenas na linha agregada; função trigger SECURITY DEFINER sem EXECUTE público. |
| Revisão de enumeração de e-mail | Executado; achado no código | O fluxo anterior distinguia a resposta 409 esperada pela restrição UNIQUE e informava que o e-mail já existia; isso permitia inferência pelo endpoint. A branch substitui o fluxo por RPC com resposta igual para novo/duplicado; SQL ainda não aplicado ao Supabase. |
| Busca estática por credenciais privilegiadas e sinks dinâmicos | Executado | Nenhuma service-role/secret key encontrada; a chave publishable é pública. Uso de innerHTML na página de contato recebe somente rótulos de uma lista fixa; cadastro usa textContent. |
| Revisão do patch e links internos | Executado | PR altera nove arquivos/itens; páginas apontam para favicon MecaTiger existente; index.html direciona para mecasim.html e a página aponta para o repositório existente. |
| Estado efetivo de RLS/grants remotos | Executado, somente leitura | No projeto remoto: RLS nas duas tabelas; anon/authenticated com INSERT no cadastro, sem SELECT; métricas com SELECT em id = 1; função trigger SECURITY DEFINER com EXECUTE restrito. Isso é distinto da proposta RPC nesta branch. |
| Build | Não aplicável | Site sem build step. |
| Validação HTML completa e links externos | Não executado | Executar validator e abrir os links no preview. |
| Parse das páginas e labels de formulário | Executado | Quatro páginas analisadas; IDs sem duplicidade e labels associados. Campo condicional Outro país recebeu rótulo visível quando ativado. |
| Chromium desktop e mobile | Não executado | Ainda não existe URL de preview; testar layout, teclado, foco, console e requests de rede. |
| Contraste e acessibilidade | Não executado | Testar foco visível, labels, nomes acessíveis, contraste e movimento reduzido no preview. |
| Cadastro com usuário de teste | Não executado | Aplicar a mudança RPC em branch de desenvolvimento Supabase e usar e-mail controlado; comparar resposta para cadastro novo/duplicado e verificar métricas. |
| Preview hospedado | Pendente | Conectar a branch do PR ao Cloudflare Pages. Não foi criada URL de preview. |
| HTTPS do preview | Pendente | Validar após provisionamento do preview. |
| Domínio próprio, DNS e HTTPS final | Não executado | Só após compra/provisionamento do domínio e autorização expressa para DNS/publicação. |

## Segurança do Supabase

A chave publishable/anon no navegador é pública por definição. A inspeção remota não encontrou SELECT público de community_registrations; observou INSERT direto para anon/authenticated, que combinado com a resposta de UNIQUE era um canal de enumeração. A proposta nesta branch remove esses grants e expõe apenas uma RPC de inserção com consentimento, search_path vazio e EXECUTE concedido aos papéis públicos. A proposta ainda não está aplicada no Supabase remoto. Nunca enviar service-role/secret key ao browser. A leitura de métricas continua limitada à linha agregada autorizada. Avaliar abuso automatizado de inscrições e rate limiting antes da produção; não introduzir CAPTCHA ou serviço externo sem avaliar custo e privacidade.

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
