# MECATIGER FTC #32578

Este repositório contém o Hub da equipe como site estático em HTML, CSS e JavaScript. Não há build obrigatório: os arquivos podem ser servidos por qualquer hospedagem estática.

## Preview e hospedagem

A branch codex/hub-preview-mecasim-2026-10-17 é uma proposta reversível para revisão. A hospedagem recomendada para preview é Cloudflare Pages conectada a esta branch, com diretório de saída na raiz do repositório e sem comando de build. Não conecte domínio personalizado até a equipe aprovar a publicação e provisionar o domínio.

GitHub Pages é uma alternativa estática, mas sua configuração depende de habilitar Pages no repositório. Nenhuma hospedagem, domínio ou DNS é configurado por este repositório.

### Configuração de preview no Cloudflare Pages

1. Crie um projeto Pages conectado ao GitHub e selecione a branch codex/hub-preview-mecasim-2026-10-17.
2. Use a raiz do repositório como diretório de saída. Deixe o comando de build vazio.
3. Mantenha o preview em URL pages.dev; não adicione domínio próprio nesta etapa.
4. Teste as páginas e o cadastro antes de considerar promoção para produção.
5. Para abandonar o preview, desconecte ou exclua o projeto Pages. O repositório e a branch permanecem disponíveis; nenhum DNS é alterado.

O deploy de produção requer aprovação explícita separada e deve ser configurado na branch principal após revisão do PR.

## Cadastro e métricas da comunidade

Ao entrar, a página apresenta uma explicação curta e um cadastro opcional para e-mail, perfil (incluindo entusiasta de robótica), equipe/escola, estado e país. Para revisar o formulário em toda entrada durante a prévia, use index.html#cadastro-teste: o envio é simulado e não grava no banco.

Sem o modo de teste, o formulário registra um cadastro consentido no Supabase e trata o e-mail duplicado pelo índice único. As métricas são agregadas; o navegador lê somente a linha de métricas e não consulta a lista de e-mails. A chave publishable/anon usada no navegador é pública por natureza e depende das políticas RLS; nunca coloque service_role, secret keys ou credenciais privilegiadas no HTML.

O esquema documentado está em supabase/schema.sql. A revisão do arquivo SQL não prova, por si só, que este esquema esteja aplicado no projeto Supabase conectado. Antes de produção, confirme as políticas efetivas no Supabase e execute cadastro/duplicidade usando contas de teste. Não use e-mails reais de visitantes para testes.

## Meca Sim

A página mecasim.html explica o estado atual: não existe demonstração remota disponível neste Hub. Ela aponta ao repositório Meca Sim e descreve como encontrar instruções locais no README do próprio projeto. O Meca Sim permanece fora do escopo deste repositório; esta página não embute nem modifica seu código.

## Verificações

O checklist de validação antes da publicação, incluindo estado de execução dos testes e limites do preview, está em DEPLOYMENT.md. Não considere HTTPS/DNS de domínio próprio validados até que um domínio seja provisionado e configurado em etapa autorizada.

## Rollback

Antes da produção, preserve o deploy anterior. Para rollback, reverta a versão do Pages para o último deploy conhecido como funcional ou desative o novo deploy; reverta este PR se a mudança de navegação ou documentação gerar regressão. Não altere o DNS como mecanismo de rollback sem autorização explícita.