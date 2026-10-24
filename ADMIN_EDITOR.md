# Painel administrativo Meca Tiger — MVP seguro de edição sem código

**Status:** implementado na branch de desenvolvimento, sem publicação ou instalação no Supabase hospedado. Não é uma senha pronta nem uma conta administrativa real. A homologação usa apenas usuários descartáveis no Supabase CLI local.

## Como a equipe usará o painel

1. Acessar `admin.html` pelo link **Painel da equipe** no rodapé.
2. Escolher **Entrar pelo e-mail**, solicitar Magic Link e confirmar o e-mail pessoal de cada integrante.
3. O painel verifica no servidor se o usuário está presente em `meca_site_editors`. Quem não estiver recebe acesso negado.
4. Após aprovação de acesso por operador autorizado, o integrante pode atualizar quatro textos existentes da Home/Rede sem editar HTML.
5. O formulário de imagens recebe PNG/JPEG/WebP, converte para WebP, reduz o tamanho e publica uma foto com legenda na nova galeria da Home. O arquivo final não excede **2 MiB**.

**Nenhuma senha fixa é criada ou enviada pelo chat.** O login é individual por Magic Link (senha descartável de uso único); um usuário só vira editor depois que o acesso é concedido explicitamente no banco. Nunca disponibilizar `service_role`, chaves secretas ou tokens no código estático nem compartilhá-los com participantes. Não implementar senha hardcoded ou permitir criar editor por formulário público.

## O que pode ser editado sem programação

- Home — apresentação (texto).
- Home — introdução dos projetos (texto).
- Home — apresentação da comunidade (texto).
- Rede — texto de abertura (texto).
- Home — galeria: adicionar imagens aprovadas e legenda.

**Não é um construtor livre do site:** mover seções, editar programas/HTML, criar rotas, alterar banco, excluir imagens e editar todos os parágrafos ainda dependem de desenvolvimento futuro. Não confundir administração de conteúdo com permissões de moderação da comunidade.

Quando a tabela CMS não está presente ou ainda não tem conteúdo, as páginas mantêm os textos HTML originais. A galeria só aparece com fotos reais. O CMS é aplicado por `textContent`, evitando injeção de HTML.

## Como ativar os primeiros editores DEPOIS da homologação e autorização

**Isto é somente instrução; NÃO executar agora em projeto hospedado.**

- Preparar migrations e Auth em ambiente de homologação; revisar políticas RLS e o bucket.
- Configurar redirecionamentos permitidos para `.../entrar.html?next=admin.html`, SMTP e domínio definitivo.
- Cada integrante faz login por um e-mail que controla, com confirmação real.
- Operador autorizado verifica identidade e e-mail confirmado usando ferramenta administrativa protegida; concede o papel somente ao UUID verificado. Exemplo ilustrativo, **não executar sem autorização**:

```sql
insert into public.meca_site_editors(user_id)
select id from auth.users
where email = '<email-verificado-da-equipe>'
  and email_confirmed_at is not null;
```

- Conferir em outra sessão que integrantes não autorizados não conseguem selecionar/adicionar registros nem enviar imagens. Remover permissões apenas com procedimento aprovado.
- Preferir uma conta individual por integrante; não usar conta/senha compartilhada.

## Segurança implementada

- `meca_site_editors`: tabela separada de `rede_moderators`, com SELECT do próprio cadastro para o usuário e **sem INSERT/UPDATE/DELETE** em clientes públicos.
- `meca_site_copy`: quatro slots permitidos, texto de 8 a 700 caracteres, RLS para alterar apenas por editores autenticados não anônimos; qualquer visitante lê o conteúdo editado.
- `meca_site_gallery`: publicação de foto associada ao usuário editor, RLS para INSERT e leitura pública; navegador sem permissão não grava.
- `meca-site-gallery`: bucket público somente para imagens destinadas ao site, upload WebP até 2 MiB com RLS no `storage.objects`, caminho limitado a pasta UUID do editor e nome UUID aleatório.
- No navegador, cada imagem é reprocessada num canvas e convertida para WebP, descartando metadados embutidos. SVG e arquivos executáveis não são aceitos.
- Clientes públicos nunca recebem chave administrativa; o dashboard e a UI não substituem as políticas RLS.

## Riscos e pendências

- As imagens no bucket são **públicas**: nunca enviar fotos privadas/de menores sem consentimento adequado. Não há fluxo de apagar fotos neste MVP; a remediação exige operador autorizado.
- A conta administradora pode publicar conteúdo imediatamente. Definir responsáveis, revisão de imagens e procedimento de retirada antes de abrir para vários integrantes.
- Não há editor livre de páginas; conteúdos hardcoded fora dos quatro campos continuam sendo modificados via GitHub.
- Storage e serviços de e-mail podem consumir cotas da conta Supabase. A hospedagem local de testes é descartável; antes de habilitar em produção verificar limite gratuito e permissões, sem contratar serviço pago.
- Se o upload for concluído e o registro da galeria falhar, um arquivo sem referência pode permanecer no bucket; documentar processo de limpeza operacional, sem exclusão automática.
- GitHub Pages é público: o JavaScript do editor pode ser baixado por qualquer pessoa; **segurança depende inteiramente de Auth/RLS e Storage**, não de ocultar a URL.
- O primeiro administrador real precisa de autorização humana e de um e-mail verificado; **nenhuma credencial real foi provisionada**.
- O checkout na `main` continua sem estes recursos até merge explícito e deploy subsequente autorizado.
- Legislação e política sobre dados de menores e retenção seguem revisão independente.

## Homologação e custos

- GitHub Actions executa testes de contratos (Node), RLS (PostgreSQL), integração Supabase CLI + Storage em Docker e testes Playwright de navegador; usar somente `ubuntu-latest`.
- Comandos obrigatórios: `npm run test:unit`, `python3 -m unittest discover -s tests -p 'test_rede_contract.py' -v`, `npm run test:local-supabase`, `node tests/local-cms-e2e.mjs`, `npm run test:ui`.
- Homologação deve testar duas contas reais **somente na stack local**; apenas um usuário recebe permissão de editor; tentativas de outro usuário de editar e elevar privilégios devem falhar.
- Não executar `supabase login`, `supabase link`, `supabase db push`, `supabase functions deploy`, nem modificar produção, criar usuários reais, fazer merge ou provisionar cobrança.

**Critério de conclusão de engenharia:** 4 famílias de checks verdes no commit final e evidências documentadas. **Critério de publicação pública:** SMTP e Auth real, migrações autorizadas, privilégio do primeiro editor verificado, LGPD/moderação revistos e teste de fumaça hospedado. São etapas diferentes.
