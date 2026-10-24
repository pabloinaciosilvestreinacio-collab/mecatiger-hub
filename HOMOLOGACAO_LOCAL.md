# Homologação local — Rede Meca Tiger + Meca Sim

**Escopo:** usar Supabase CLI/Docker somente no PC, sem gastar quota cloud, sem alterar a produção, sem `push`/merge na `main`. Branch: `test/homologacao-local-rede-mecasim-20261024` (base PR #9, que depende do PR #8).

**NÃO execute `supabase link`, `supabase db push`, `supabase functions deploy`, `supabase secrets set`, nem `supabase projects create` neste ciclo.** Eles podem atuar em serviços remotos. Os testes aqui usam apenas `127.0.0.1`.

## 1. Custo, sistema e ferramentas

- **Supabase local:** roda no computador e não cria recursos Supabase Cloud. Custo de nuvem do Supabase: R$ 0 para este fluxo. Consome memória, armazenamento, processamento e rede local; a primeira inicialização pode baixar imagens Docker.
- **Docker Desktop:** gratuito para uso pessoal/educacional e outras categorias elegíveis, conforme https://docs.docker.com/subscription-billing/desktop-license/. Confirme os termos aplicáveis antes de instalar. Nenhum plano pago é necessário para testes educativos.
- **Windows 10/11:** Docker Desktop com WSL 2 operacional; Node.js **20+**; Supabase CLI. A CLI não funciona como instalação global via `npm install -g supabase`. Pode ser instalada com Scoop ou binário oficial (https://supabase.com/docs/guides/local-development/cli/getting-started).
- Não exige criar uma conta Supabase adicional, cadastrar cartão, contratar SMTP ou enviar e-mails externos. O Mailpit captura os e-mails em `http://127.0.0.1:54324`.
- **Limite deste chat:** nosso ambiente tem Node, mas não possui Docker nem Supabase CLI. Foram feitos testes offline e PostgreSQL do CI; as interações abaixo com a stack Supabase real ainda precisam de execução no seu PC.

## 2. Preparação e verificação no PowerShell

Abra o PowerShell **na raiz do repositório**. Primeiro execute os comandos a seguir (verifique as instruções do Scoop/Docker Desktop antes de instalar):

```powershell
git fetch origin
git switch --track origin/test/homologacao-local-rede-mecasim-20261024
node --version
docker version
supabase --help
supabase start --help
supabase functions serve --help
```

Se a branch já existir no PC, use `git switch test/homologacao-local-rede-mecasim-20261024` em vez de `git switch --track`. Se `supabase` não existir, use o método de instalação oficial do Supabase CLI (por exemplo, Scoop no Windows) e reabra o PowerShell. Se Docker/WSL 2 não estiverem operacionais, **não inicie** o teste.

O arquivo `supabase/config.toml` **já existe**. Não rode `supabase init`: evitar sobrescrever a configuração de Auth, Mailpit e Edge JWT.

## 3. Levantar os serviços sem expor as portas

Crie uma rede Docker com binding em loopback (documentado pelo Supabase para redes não confiáveis):

```powershell
docker network create -o 'com.docker.network.bridge.host_binding_ipv4=127.0.0.1' mecatiger-local
supabase start --network-id mecatiger-local
```

Se a rede já existir, não precisa recriá-la. Não compartilhe o retorno completo de `supabase status -o env`: ele contém chaves temporárias do ambiente local. Verifique que os endereços no status são locais (`127.0.0.1:54321` a `54324`).

A CLI aplica as migrações SQL presentes no diretório em ordem de nome. Elas criam as tabelas da Rede e das trajetórias em um Postgres **descartável local**, sem tocar em `rnnzumzqilkuecvgsjnv`, o ID do Supabase de produção.

**Observação:** o cadastro antigo de métricas do Hub não faz parte destas migrações e não é o foco desta homologação. Não considerar a ausência dessa parte como validação do fluxo de cadastro antigo.

## 4. Preparar navegador e função

Com a stack ativa, no **Terminal A**, rode:

```powershell
node scripts/local-prepare.mjs
node scripts/local-web.mjs
```

O primeiro comando cria `js/rede-local-config.mjs` com somente a **chave pública LOCAL** e o endpoint `http://127.0.0.1:54321`. O arquivo é ignorado pelo Git. Não contém chave administrativa. O segundo abre o Hub em `http://127.0.0.1:8080`, bloqueando leitura HTTP de `.git`, SQL, scripts e pastas internas.

Em um **Terminal B**, execute:

```powershell
supabase functions serve mecasim-trajectories
```

Não acrescente `--no-verify-jwt`. A configuração exige `verify_jwt = true`.

## 5. Testar automaticamente a integração real

Com os dois terminais anteriores ativos, no **Terminal C** execute:

```powershell
node scripts/local-homologate.mjs
```

Este teste não usa mocks: conversa via HTTP com GoTrue/Auth, Mailpit, PostgREST e Edge Function **locais**. Ele cria três contas aleatórias descartáveis, testa o Magic Link, a moderação de conteúdo, as solicitações privadas e as rotas do simulador, então tenta eliminar só essas contas de teste. **Não envia e-mails externos.**

| Verificação | Critério de aprovação |
| --- | --- |
| Autenticação | 3 JWTs reais, e-mail confirmado, sessão anônima recusada |
| Magic Link | E-mail recebido no Mailpit, token válido uma vez, replay recusado |
| Rede | Post pendente invisível para B, aprovação só por moderador |
| Privacidade | Solicitação de A invisível para B e visível para moderador |
| Meca Sim | A salva, lista, carrega e exclui sua rota |
| Isolamento | B não consegue ver/excluir rota de A nem escolher `owner_id` de A via REST |
| Robustez | JWT ausente/inválido e coordenadas fora da arena recusados |

O comando sinaliza falha com código de saída diferente de zero, sem revelar os tokens. Caso falhe, copie **somente** a mensagem de erro sanitizada e as etapas PASS (nunca chaves nem cookies). Não declare homologação aprovada até que todas as verificações passem.

## 6. Verificação manual do site

Abra exatamente `http://127.0.0.1:8080/entrar.html` (**127.0.0.1**, não `localhost`). Solicite acesso usando um e-mail de teste local, confira o Magic Link em `http://127.0.0.1:54324` (Mailpit) e abra o link. A conta verificada deve retornar para a Rede. Em seguida, examine `http://127.0.0.1:8080/rede.html` e a biblioteca em `http://127.0.0.1:8080/mecasim-demo.html`.

Teste também: atualizar a página mantendo sessão, sair da conta, voltar sem sessão, erro de rede, nome inválido da rota, tentativas de acessar outras rotas e layout no celular. O conteúdo HTML e JS do simulador ainda é **público**: somente os dados salvos são protegidos no backend.

## 7. Parada e rollback

Encerre os servidores Node/Edge com Ctrl+C e rode:

```powershell
supabase stop
```

Isso para os containers; não implica excluir arquivos SQL nem migrar nada para a nuvem. Se quiser reiniciar do zero, **`supabase db reset --local` apaga os dados do banco local**: use somente se aceitar a perda das contas e trajetórias locais de teste. Nunca use `--linked` neste fluxo.

Não publique `js/rede-local-config.mjs`, screenshots de `supabase status -o env`, logs com JWT, arquivos `.env` ou credenciais.

## 8. Evidências e bloqueios de lançamento

- Os testes unitários Node e os testes de segurança PostgreSQL já foram exercitados em GitHub Actions, mas **não substituem o teste local com serviços reais**.
- A verificação do Magic Link depende do template do Mailpit; produção tem URLs e configuração de SMTP próprias, ainda pendentes.
- Para publicar a Rede, ainda é preciso revisar privacidade/LGPD, abuso/denúncias, proteção da origem do site e Auth real na nuvem com autorização explícita.
- Este ciclo não altera `main`, não altera o banco de produção e não faz deploy da Edge Function.

Fontes de configuração: https://supabase.com/docs/guides/local-development/cli/config ; https://supabase.com/docs/guides/local-development/cli/testing-and-linting ; https://supabase.com/docs/guides/local-development ; https://docs.docker.com/subscription-billing/desktop-license/ .
