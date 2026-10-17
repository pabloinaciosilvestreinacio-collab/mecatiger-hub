# MECATIGER FTC #32578

Este repositório contém o Hub da equipe como site estático em HTML, CSS e JavaScript. Abra index.html diretamente no navegador ou sirva a raiz com qualquer servidor estático. Não há build step nem runtime JavaScript separado.

## Páginas e hospedagem

A branch codex/hub-preview-mecasim-2026-10-17 contém uma proposta reversível para revisão. A hospedagem recomendada para preview é Cloudflare Pages conectada a esta branch, com diretório de saída na raiz e comando de build vazio. Mantenha o preview em URL pages.dev; não associe domínio personalizado nesta etapa.

GitHub Pages é uma alternativa estática, mas exige habilitação nas configurações do repositório. Nenhuma hospedagem, domínio ou DNS é configurado por este repositório. Deploy de produção requer aprovação explícita separada.

Configuração de preview e rollback: DEPLOYMENT.md.

## Cadastro e métricas da comunidade

A página apresenta cadastro opcional com e-mail, perfil (incluindo entusiasta de robótica), equipe/escola, estado e país. Links de ajuda, mentoria, compartilhamento e iniciação direcionam para comunidades e recursos existentes da FTC/FIRST.

As métricas exibidas são agregadas no Supabase: pessoas cadastradas, estados brasileiros distintos, países, estudantes e professores/mentores. O navegador pode inserir um cadastro consentido e ler somente a linha agregada de métricas; a lista de e-mails não é exposta pela API pública. O schema persistente está em supabase/schema.sql.

Para revisar o formulário em toda entrada durante a prévia, use index.html#cadastro-teste. Esse modo força o painel de cadastro e simula o envio sem gravar no banco. Sem o modo de teste, a página envia o cadastro consentido à função RPC do Supabase. O índice único evita contagem duplicada, e a resposta não informa se um e-mail já existe. A alteração proposta em supabase/schema.sql precisa estar aplicada em um ambiente Supabase de desenvolvimento antes de testar o cadastro real.

A chave publishable/anon usada no navegador é pública por natureza e depende das políticas RLS. A função RPC de cadastro reduz a exposição da tabela ao retirar INSERT direto do papel público. Nunca coloque service_role, secret keys ou credenciais privilegiadas no HTML. A revisão de supabase/schema.sql não comprova que o SQL foi aplicado nem que a configuração remota atual seja igual ao arquivo. Antes de produção, confirme a RLS efetiva e teste com contas descartáveis.

## Projetos e Meca Sim

Os cards de projetos, evidências, comunidade e simulador mostram EM DESENVOLVIMENTO ou EM PREPARAÇÃO até que os materiais reais sejam publicados.

A página mecasim.html informa que ainda não existe demonstração web hospedada neste Hub e direciona ao repositório Meca Sim. Ela é apenas informativa e não executa o simulador. O projeto Meca Sim não foi modificado por este repositório.

## Verificações e rollback

O checklist de testes, estado de execução, critérios de promoção e rollback está em DEPLOYMENT.md. Não considere domínio próprio, DNS ou HTTPS final validados até que o domínio seja provisionado e a configuração autorizada.
