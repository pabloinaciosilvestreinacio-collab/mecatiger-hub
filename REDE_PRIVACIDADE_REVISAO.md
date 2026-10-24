# Rede Meca Tiger — avaliação de privacidade e LGPD antes do lançamento

**Status: RASCUNHO DE CONTROLE / checklist operacional. Não é política de privacidade final, parecer jurídico ou comprovação de conformidade.** Exige validação de responsável pela Rede, escola/equipe e orientação jurídica/LGPD apropriada antes da publicação.

## Inventário confirmado pelo código

| Fluxo | Dados identificados no código | Visibilidade/limite vigente |
|---|---|---|
| Supabase Auth | e-mail, identificador de usuário, sessão/token | Sistema de autenticação; e-mail não aparece nos perfis públicos |
| Perfil na Rede | identificador interno, apelido público | `rede_profiles` legível como perfil público |
| Publicações e comentários | autor, texto, categoria, status e horário | Apenas aprovados para visitantes; pendentes para autor/moderação conforme RLS |
| Pedidos de ajuda/conexão | autor, tema, descrição, status | Autor e moderação |
| Denúncias | denunciante, alvo, motivo, status | Denunciante e moderação, conforme RLS |
| Biblioteca Meca Sim | dono, nome e pontos de trajetória | Dono autenticado via JWT e RLS |
| Cadastro opcional no Hub | e-mail, categoria de participação e informações de região para métricas | Fluxo distinto do Auth; código da main permanece sem vínculo automático |

## Decisões não concluídas: BLOQUEIOS antes de produção

- **Responsáveis:** designar responsável institucional pelo atendimento a titulares, equipe de moderação e supervisão para menores; registrar quem recebe a solicitação e quem pode responder.
- **Finalidades/base legal:** explicitar com precisão finalidade e fundamento de cada coleta, inclusive indicadores geográficos e comunicações; revisão por profissional competente.
- **Minimização:** proibir coleta de CPF, endereço completo, telefone, identificação de alunos, listas escolares e demais informações desnecessárias em campos abertos. Moderar dados pessoais indevidamente enviados.
- **Menores de idade:** definir faixa etária admitida, procedimento compatível com a legislação aplicável, responsáveis e autorização ou outras medidas exigíveis; não afirmar que simples login por e-mail resolve o problema.
- **Prazos de retenção:** definir e aprovar períodos separados para login/contas, perfis, posts, solicitações privadas, denúncias, logs de moderação e inscrições de métricas. **Não inventar prazos** nem apagar dados automaticamente sem decisão.
- **Exclusão e acesso:** estabelecer fluxo de identificação proporcional, análise, resposta e exclusão quando aplicável; verificar dependências, preservação de registros necessários e consequências para comentários/denúncias. Não prometer remoção imediata.
- **Segurança:** revisar logs, permissões administrativas, localização/região dos serviços, controles de acesso, antiabuso e incidentes. Não armazenar chaves secretas no navegador.
- **Transparência:** separar claramente cadastro opcional de métricas de inscrição no Supabase Auth, e explicar visibilidade dos pedidos privados e das publicações.
- **Comunicações:** definir se existe consentimento distinto para newsletter ou comunicados; autenticar-se na Rede não deve inscrever automaticamente usuário em mailing.

## Procedimento provisório de atendimento (para validação)

A página exibe o contato institucional `mecatiger6@gmail.com` para denúncia ou pedido de acesso/exclusão. O time deve confirmar quem monitora esse canal e desenhar o registro interno de solicitações sem expor dados pessoais em issues públicas. Respostas e prazos devem seguir a política aprovada, não promessas genéricas.

**Risco remanescente:** mesmo com testes de Auth, JWT, RLS e navegador concluídos no runner descartável, conformidade LGPD e segurança operacional em produção não estão homologadas.

**Regra:** não alterar nem apagar cadastro real, não executar migrações em produção e não alterar Auth hospedado sem autorização.
