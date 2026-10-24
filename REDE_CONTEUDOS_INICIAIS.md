# Ideias opcionais para o feed — NÃO publicações cadastradas

**Pautas OPCIONAIS, não são critério de lançamento. Estado auditado (24/10/2026):** as cinco pautas abaixo foram sugeridas para inaugurar a Rede Meca Tiger, mas **não há evidência de INSERT, IDs de posts, aprovação pela moderação ou publicação no feed hospedado**. Este arquivo não cria contas, não insere dados e não deve ser contabilizado como conteúdo existente.

## Pautas para validação e publicação real

| # | Pauta | Informação que a equipe precisa validar | Evidência mínima antes de aprovar | Status |
|---|---|---|---|---|
| 1 | Apresentação da Meca Tiger FTC #32578 | Texto institucional atualizado, autoria, autorização de imagem se houver | Revisão pela equipe e referência ao Hub | Pendente de conteúdo/autoria |
| 2 | Introdução à FIRST Tech Challenge | Explicação acessível, temporada vigente, fonte oficial e atribuições | Link oficial e revisão do conteúdo técnico | Pendente de conteúdo/autoria |
| 3 | Projeto ou aprendizado do robô Mequinha | Aprendizado técnico efetivamente realizado, escopo e resultado verificado | Diário de engenharia / testes identificados; não chamar simulação de teste físico | Pendente de conteúdo/autoria |
| 4 | Oportunidade real de colaboração | Necessidade concreta, critérios de contato, disponibilidade, responsável e data de validade | Responsável confirmado e consentimento para divulgar | Pendente de oportunidade real |
| 5 | Aviso de comunidade em fase inicial | Como participar, como funciona a moderação, limites e canal de suporte | Texto final aprovado e política operacional revisada | Pendente de aprovação |

## Procedimento seguro (após autorização humana)

1. O autor com conta Supabase Auth de teste ou, posteriormente, conta real **autorizada** envia a publicação.
2. O sistema cria em `rede_posts` com `status='pending'`; nenhum texto passa direto à vitrine.
3. Moderador autorizado verifica direitos de uso, fontes e eventuais dados de terceiros/menores.
4. Somente o moderador altera o status para `approved`; a política RLS continua aplicada.
5. O responsável registra **IDs, status, autor, data, fonte e revisão** sem copiar emails, JWTs ou dados privados para logs públicos.
6. O feed publicado deve mostrar apenas conteúdo aprovado; se estiver vazio, informar honestamente que ainda não existem publicações aprovadas.

**Não inserir conteúdo usando chave administrativa, script automático ou usuário fictício.** Os testes E2E descartáveis usam apenas textos sintéticos e não comprovam a existência destas publicações reais.

**Se a equipe decidir publicar essas pautas futuramente:** preparar textos/autores aprovados, links de referência e provas de cadastro e moderação em ambiente autorizado. **O feed vazio não impede o lançamento técnico** se as funções operacionais, privacidade e Auth tiverem aprovação. Não presumir quantidade nem publicar por conta própria.
