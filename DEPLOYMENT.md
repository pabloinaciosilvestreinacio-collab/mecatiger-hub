# Checklist de preview e publicação

## Estado atual

- Baseline inspecionado: branch main, commit ef8fcdb31ffba7c7132074fbc41970eab803b071 (17/10/2026).
- Site: HTML/CSS/JavaScript estático; sem etapa de build.
- Supabase: inspeção remota somente leitura confirmou RLS nas tabelas de cadastro e métricas; grants/policies observados são descritos abaixo. O arquivo versionado ainda não contém a correção RPC aplicada no projeto remoto.
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
| Revisão estática do SQL versionado | Executado | RLS ativada; cadastro aceita INSERT com consentimento; métricas têm SELECT limitado a id = 1; tabela de e-mails sem SELECT público. |
| Verificação somente leitura da RLS e grants remotos | Executado | RLS ativa nas duas tabelas; anon/authenticated têm INSERT no cadastro e SELECT apenas na linha agregada; função trigger SECURITY DEFINER sem EXECUTE público. |
| Revisão de enumeração de e-mail | Executado; achado confirmado no código | A restrição UNIQUE devolve HTTP 409 e o frontend informa que o e-mail existe. A RLS não remove esse canal lateral. PR propõe RPC com resposta idêntica em novo/duplicado; SQL ainda não aplicado ao Supabase. |
| Busca estática por credenciais privilegiadas e sinks dinâmicos | Executado | Nenhuma service-role/secret key encontrada; a chave publishable é pública. Uso de innerHTML na página de contato recebe somente rótulos de uma lista fixa; cadastro usa textContent. |
| Revisão do patch e links internos novos | Executado | PR altera quatro arquivos; index.html direciona para mecasim.html; a nova página aponta para o repositório existente. |
| Estado efetivo de RLS/grants remotos | Executado, somente leitura | RLS nas duas tabelas; cadastro público com INSERT (antes da RPC), sem SELECT; métricas com SELECT em id = 1; função de trigger SECURITY DEFINER com EXECUTE restrito. |
| Build | Não aplicável | Site sem build step. |
| Validação HTML completa e links externos | Não executado | Executar validator e abrir os links no preview. |
| Chromium desktop e mobile | Não executado | Ainda não existe URL de preview; testar layout, teclado, foco, console e requests de rede. |
| Contraste e acessibilidade | Não executado | Testar foco visível, labels, nomes acessíveis, contraste e movimento reduzido no preview. |
| Cadastro com usuário de teste | Não executado | Aplicar a mudança RPC em branch de desenvolvimento Supabase e usar e-mail controlado; comparar resposta para cadastro novo/duplicado e verificar métricas. |
| Preview hospedado | Pendente | Conectar a branch do PR ao Cloudflare Pages. Não foi criada URL de preview. |
| HTTPS do preview | Pendente | Validar após provisionamento do preview. |
| Domínio próprio, DNS e HTTPS final | Não executado | Só após compra/provisionamento do domínio e autorização expressa para DNS/publicação. |

## Segurança do Supabase

A chave publishable/anon no navegador é pública por definição. A segurança depende de RLS e grants. Nunca enviar service-role/secret key ao browser. Confirmar que SELECT de community_registrations está revogado para anon e authenticated, enquanto a leitura de métricas é limitada à linha agregada autorizada. Avaliar abuso automatizado de inscrições e rate limiting antes da produção; não introduzir CAPTCHA ou serviço externo sem avaliar custo e privacidade.

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
