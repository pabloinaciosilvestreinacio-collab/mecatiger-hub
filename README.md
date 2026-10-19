# MECATIGER FTC #32578

Este repositório contém o Hub da equipe como site estático em HTML, CSS e JavaScript. Abra index.html diretamente no navegador ou sirva a raiz com qualquer servidor estático. Não há build step nem runtime JavaScript separado.

## Páginas e hospedagem

O site foi preparado para publicação estática pelo GitHub Pages a partir da raiz da branch `main`. O arquivo `.nojekyll` impede processamento Jekyll desnecessário. O domínio padrão esperado, depois de habilitar Pages, é `https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/`.

Domínio próprio e DNS continuam fora do repositório e devem ser configurados somente após o domínio ser provisionado.

Configuração de preview e rollback: DEPLOYMENT.md.

## Cadastro e métricas da comunidade

A página apresenta cadastro opcional com e-mail, perfil (incluindo entusiasta de robótica), equipe/escola, estado e país. Links de ajuda, mentoria, compartilhamento e iniciação direcionam para comunidades e recursos existentes da FTC/FIRST.

As métricas exibidas são agregadas no Supabase: pessoas cadastradas, estados brasileiros distintos, países, estudantes e professores/mentores. O navegador pode inserir um cadastro consentido e ler somente a linha agregada de métricas; a lista de e-mails não é exposta pela API pública. O schema persistente está em supabase/schema.sql.

Para revisar o formulário sem gravar dados, use `index.html#cadastro-teste`. Esse modo força o painel de cadastro e simula o envio. Sem o modo de teste, a página envia o cadastro consentido à função RPC do Supabase. O índice único evita contagem duplicada, e a resposta não informa se um e-mail já existe.

A chave publishable usada no navegador é pública por natureza e depende das políticas RLS. A função RPC de cadastro reduz a exposição da tabela ao retirar INSERT direto do papel público. Nunca coloque `service_role`, secret keys ou credenciais privilegiadas no HTML. Antes de produção, confirme a RLS efetiva e teste com dados descartáveis.

## Projetos e Meca Sim

Os cards de projetos, evidências, comunidade e simulador mostram EM DESENVOLVIMENTO ou EM PREPARAÇÃO até que os materiais reais sejam publicados.

O Hub inclui `mecasim-demo.html`, uma prévia interativa estática e responsiva: mostra o campo BIOBUZZ, permite marcar até 16 pontos e reproduzir visualmente uma trajetória. Ela não simula física, colisões, sensores, pontuação ou teleoperação e não executa Java nem código enviado. A página `mecasim.html` explica esses limites e liga à demonstração, ao repositório público Meca Sim e às instruções locais. A versão completa requer Python 3.10+ e JDK 17+ e executa Java com as permissões da conta do usuário; use apenas código confiável. O projeto Meca Sim não foi modificado por este repositório.

## Verificações e rollback

O checklist de testes, estado de execução, critérios de promoção e rollback está em DEPLOYMENT.md. Não considere domínio próprio, DNS ou HTTPS final validados até que o domínio seja provisionado e a configuração autorizada.
