# Auditoria Jurídica: Valtrea Finance e site da Valtrea

**Data:** 04/11/2026 · **Gerado com:** skill blindagem-juridica (versão `66c8cef`) · **Modo:** corrigir

> ⚖️ Este relatório é uma auditoria técnica automatizada e **não constitui parecer jurídico**.
> Ele reduz riscos, mas não garante ausência de questionamentos. Termos de uso, Política de privacidade e o uso por adolescentes devem ser revisados por advogado(a).

## Placar

| # | Item | Antes | Depois | Observação |
|---|------|-------|--------|-----------|
| 1 | Política de privacidade | ⚠️ | ✅ | Encarregado/canal, bases legais por finalidade, tabela de retenção, GitHub (backup) como operador, site da Valtrea coberto |
| 2 | Termos de uso | ⚠️ | ✅ | Sem aceite tácito de nova versão, regra de idade, direito de explicação antes de suspensão, limitação de responsabilidade em destaque, letra de 16 px |
| 3 | Aviso de cookies | ✅ | ✅ | Só armazenamento essencial; aviso informativo; link descritivo |
| 4 | Política de reembolso | ➖ | ➖ | Valtrea Finance é gratuito; os serviços do site são contratados por proposta escrita (veja "O que depende de você") |
| 5 | Formulários (LGPD) | ⚠️ | ✅ | Cadastro com "estou ciente da Política" separado do aceite dos Termos e declaração de idade; aviso na recuperação de senha; rodapé legal em todas as telas de login |
| 6 | Só dados necessários | ⚠️ | ✅ | Só nome, sobrenome, e-mail e senha; cadastros nunca confirmados apagados após 30 dias |
| 7 | Scripts de rastreamento | ⚠️ | ✅ | Nenhum rastreador; fonte Mulish agora servida pelo próprio site (o Google não recebe mais o IP de quem visita) |
| 8 | Acessibilidade geral | ⚠️ | ✅ | Declaração de acessibilidade publicada; `lang="pt-BR"`; testes axe nas principais páginas a cada mudança |
| 9 | Alt nas imagens | ✅ | ✅ | Ícones decorativos com `aria-hidden`; gráficos com descrição |
| 10 | Contraste | ⚠️ | ✅ | Botões verdes dos e-mails com texto escuro (6,98:1) |
| 11 | Navegação por teclado | ⚠️ | ✅ | "Pular para o conteúdo" no app e no site; foco preso dentro das janelas |
| 12 | Avaliações e depoimentos | ✅ | ✅ | Não há depoimentos nem notas |
| 13 | Promessas e publicidade | ✅ | ✅ | Alegações factuais; prévias do painel marcadas como "Exemplo com valores fictícios" |
| 14 | Direitos autorais | ✅ | ✅ | Ícones e imagens de compartilhamento feitos a partir do logotipo; fonte Mulish (licença OFL, arquivo incluído); ícones Lucide (ISC) |
| 15 | Dados da empresa | ⚠️ | ⚠️ | Responsável pessoa física, por decisão sua; nome, cidade e e-mail no site e nos documentos, sem CPF nem endereço |
| 16 | Conformidade LGPD | ⚠️ | ✅ | "Baixar meus dados" (acesso e portabilidade), novo aceite quando os termos mudam, retenção automática, registro de operações e plano de incidentes |
| 17 | Outros riscos jurídicos | ⚠️ | ⚠️ | Adolescentes com autorização (ECA Digital) e Valtrea Pay (veja abaixo) |

Legenda: ✅ Conforme · ⚠️ Parcial · ❌ Não conforme · ➖ Não se aplica

**Riscos restantes mais importantes:**
1. **Adolescentes com autorização dos pais.** A regra está nos Termos, na Política e no cadastro, mas o ECA Digital (Lei 15.211/2025) traz obrigações para serviços de acesso provável por adolescentes que dependem de regulamentação. É área de alto risco: peça revisão jurídica específica.
2. **Valtrea Pay.** Se a carteira movimentar dinheiro de verdade, ela pode estar sujeita às regras do Banco Central para instituições de pagamento. O Valtrea Pay não foi auditado aqui.
3. **Identificação como pessoa física.** Enquanto o Finance for gratuito e os serviços do site forem contratados por proposta, o risco é baixo. Se passar a cobrar ou vender online, o Decreto 7.962/2013 (art. 2º, I e II) exige nome empresarial e CNPJ (ou CPF) e endereço físico em destaque.

## O que foi corrigido

### 1 e 16. Política de privacidade e governança LGPD
- **Problema:** sem menção ao encarregado nem ao canal de pequeno porte (LGPD art. 41; Res. CD/ANPD 2/2022); bases legais incompletas; retenção vaga ("período limitado"); GitHub, que guarda o backup diário, não aparecia como operador; o site da Valtrea linkava a política sem estar coberto por ela.
- **Correção:** seção do encarregado com o canal; base legal em cada finalidade (arts. 7º, II, V, VI e IX); tabela "Por quanto tempo guardamos"; GitHub (backup) e Google (Gmail, que recebe o contato@) na lista de operadores, Google Fonts removido, Sentry sem guardar IP; política passa a valer também para www.valtrea.com.br; seção de crianças e adolescentes conforme a decisão tomada (art. 14). Arquivos: `web/src/pages/privacy.jsx`, `web/src/lib/legal.js` (versão 2026-11-04).

### 16. Direitos do titular, prova do aceite e retenção
- **Baixar meus dados:** `GET /api/users/me/export` devolve cadastro, transações, recorrentes, orçamentos e conexão com o Valtrea Pay em JSON, sem senha nem códigos (LGPD art. 18, II e V). Botão em Minha conta. Arquivos: `api/src/routes/users.js`, `web/src/components/account-dialog.jsx`, `web/src/lib/csv.js`.
- **Novo aceite quando os termos mudam:** quem aceitou uma versão anterior vê um aviso no painel com links para os documentos e o botão "Li e concordo", que registra data e versão (`POST /api/users/me/terms`). Isso também cumpre a promessa de avisar sobre mudanças. Arquivos: `web/src/components/terms-update-notice.jsx`, `api/src/routes/users.js`.
- **Retenção automática:** cadastros nunca confirmados e sem lançamentos são apagados 30 dias depois; links vencidos são apagados um dia depois de vencer (LGPD arts. 15 e 16). Contas com dados que só trocaram de e-mail não são apagadas. Arquivos: `api/src/jobs/retention.js`, `api/index.js`, teste em `api/scripts/retention-test.js` (roda no CI).
- **Documentos internos:** `docs/lgpd/registro-de-operacoes.md` (art. 37) e `docs/lgpd/plano-de-resposta-a-incidentes.md` (art. 48; Res. CD/ANPD 15/2024).

### 2. Termos de uso
- **Problema:** aceite tácito de nova versão ("se continuar usando, estará concordando"); idade conflitante com a Política; suspensão sem direito de explicação; cláusula de limitação sem destaque (CDC art. 54, §4º); letra de 15 px.
- **Correção:** nova versão pede confirmação e quem discordar pode excluir a conta sem custo; idade 18+ ou adolescentes de 12 a 17 com autorização, crianças não; aviso e oportunidade de explicação antes de suspender; limitação em negrito; texto dos documentos com 16 px; os serviços do site seguem a proposta escrita, não os Termos. Arquivos: `web/src/pages/terms.jsx`, `web/src/components/legal-layout.jsx`.

### 5. Formulários
- **Cadastro:** "Tenho 18 anos ou mais (ou autorização dos meus pais ou responsáveis), li e aceito os Termos de uso e estou ciente da Política de privacidade" (a Política informa, não é "aceita"). Arquivo: `web/src/pages/signup.jsx`.
- **Recuperação de senha:** "Seu e-mail é usado só para isso." Arquivo: `web/src/pages/forgot-password.jsx`.

### 7. Rastreamento (Google Fonts)
- **Problema:** a fonte vinha de `fonts.googleapis.com`, que recebe o IP de quem visita.
- **Correção:** fonte Mulish (OFL) servida pelo próprio site, com cache de um ano e uso offline no app; CSP do app e do site sem domínios do Google. Arquivos: `web/src/fonts.css`, `site/src/fonts.css`, `web/public/fonts/`, `site/public/fonts/`, `web/index.html`, `site/index.html`, `web/vercel.json`, `site/vercel.json`, `web/public/sw.js`.

### 8 a 11. Acessibilidade
- **Declaração de acessibilidade** em `/acessibilidade` (LBI art. 63; NBR 17225), com o que foi feito, limitações conhecidas e canal. Linkada no rodapé do app e do site e no sitemap. Arquivos: `web/src/pages/accessibility.jsx`, `web/src/components/legal-links.jsx`, `site/src/App.jsx`, `site/vercel.json`.
- **"Pular para o conteúdo"** como primeiro item de cada página, levando o foco ao conteúdo principal (WCAG 2.4.1). Arquivos: `web/src/components/skip-link.jsx`, páginas com `<main id="conteudo">`, `site/src/App.jsx`.
- **Janelas** mantêm o foco dentro delas até serem fechadas (WCAG 2.4.3). Arquivo: `web/src/components/ui/dialog.jsx`.
- **Gráfico mês a mês** com tabela equivalente para leitores de tela (WCAG 1.1.1). Arquivo: `web/src/components/monthly-evolution.jsx`.
- **Contraste dos e-mails:** texto do botão de `#ffffff` (2,75:1) para `#0D0F12` (6,98:1) (WCAG 1.4.3). Arquivos: `api/src/routes/email-verification.js`, `api/src/routes/password-reset.js`, `api/src/security/login-protection.js`.
- Link "Saiba mais" do aviso de cookies virou "Saiba mais sobre cookies" (WCAG 2.4.4).

### 13 e 15. Publicidade e identificação
- Prévias do painel no app e no site marcadas como "Exemplo com valores fictícios".
- Rodapé do site com o responsável e a cidade. Arquivos: `site/src/config.js`, `site/src/App.jsx`.

## Documentos criados

| Documento | Arquivo | URL/rota | Linkado em |
|-----------|---------|----------|-----------|
| Declaração de acessibilidade | `web/src/pages/accessibility.jsx` | `/acessibilidade` (e `www.valtrea.com.br/acessibilidade`) | Rodapé do app, das telas de login e dos documentos; rodapé do site; sitemap |
| Registro das operações (interno) | `docs/lgpd/registro-de-operacoes.md` | — | — |
| Plano de resposta a incidentes (interno) | `docs/lgpd/plano-de-resposta-a-incidentes.md` | — | — |

## O que depende de você

- [ ] 🟠 Revisão por advogado(a) dos Termos, da Política e da regra para adolescentes (ECA Digital). Deixado para depois, por decisão sua em 04/11/2026.
- [x] 🟠 No Sentry, ativar **Prevent Storing of IP Addresses** (feito em 04/11/2026 nos projetos da API e do app).
- [x] 🟠 Confirmar para qual caixa o ImprovMX encaminha o contato@: uma caixa do Gmail. O Google (Gmail) entrou na lista de fornecedores da Política.
- [ ] 🟡 Verificar os termos de tratamento de dados (DPA) de Vercel, Render, Neon, GitHub, Resend, ImprovMX, Sentry e Google (transferência internacional, Res. CD/ANPD 19/2024).
- [ ] 🟡 Nas propostas de serviço do site para pessoas físicas, incluir o direito de arrependimento de 7 dias quando a contratação for a distância (CDC art. 49).
- [ ] 🟡 Antes de cobrar pelo Finance ou vender online: abrir CNPJ (ou decidir publicar CPF) e endereço, e criar política de reembolso. Deixado para depois, por decisão sua em 04/11/2026.
- [ ] 🔵 Quando possível, testar o app com leitor de tela (NVDA no Windows ou TalkBack no Android).

### Marcadores pendentes `[[PREENCHER]]`

Nenhum.

### Achados do scanner que não são problema

| Achado | Por quê |
|--------|---------|
| `reembolso-ausente` | O scanner entende "orçamento" e "recorrente" como venda; o Finance é gratuito |
| `formulario-sem-aviso` (transações, recorrentes, login) | Transações são registros do próprio usuário; login e recuperação de senha mostram o rodapé com a Política |
| `clique-sem-teclado` em `dialog.jsx` | O fundo escuro só fecha a janela com o mouse; no teclado, `Esc` e o botão Fechar fazem o mesmo |
| `clausula-abusiva` (foro) | A cláusula já ressalva o foro do domicílio do consumidor (CDC art. 101, I) |
| `termos-incompletos` e `declaracao-acessibilidade-ausente` | O texto fica dentro de listas em JSX, que o scanner não lê; os itens existem nas páginas |
| `renovacao-sem-cancelamento` | Refere-se à renovação do token de login, não a cobrança |
| `log-dado-pessoal` em `load-seed.js` | Usuários fictícios do teste de carga |

## Perfil e respostas (usado na próxima execução)

- **Tipo de negócio:** SaaS gratuito de finanças pessoais (Valtrea Finance) e site institucional que vende desenvolvimento de sites e sistemas por proposta.
- **Stack:** API Node/Express/Prisma (Render, EUA) + Postgres (Neon, São Paulo); app React/Vite/Tailwind (Vercel); site React/Vite/Tailwind (Vercel).
- **Responsável:** João Adolfo Martins Araújo, pessoa física, Rio de Janeiro/RJ, contato@valtrea.com.br. Sem CNPJ por enquanto. Não publicar CPF nem endereço.
- **Encarregado/canal:** sem encarregado indicado (agente de pequeno porte); canal contato@valtrea.com.br.
- **Público:** consumidores no Brasil; 18+ ou adolescentes de 12 a 17 com autorização dos pais; crianças não; sem público no exterior.
- **Retenção:** conta enquanto existir (exclusão imediata); cadastros nunca confirmados 30 dias; backups 30 dias; tentativas de login 24 h; contatos sem contrato até 24 meses (prazo padrão sugerido pela skill, ajuste se quiser).
- **Mapa de dados:** veja `docs/lgpd/registro-de-operacoes.md`.
- **Rastreadores:** nenhum. Armazenamento essencial: tokens de sessão e escolha do aviso de cookies (localStorage).
- **Decisões tomadas em 04/11/2026:** continuar como pessoa física; permitir adolescentes com autorização; não nomear encarregado; apagar cadastros nunca confirmados após 30 dias.

## Como manter

- Rode a skill de novo ao adicionar formulários, scripts de terceiros, novos fornecedores ou cobrança.
- Ao mudar os Termos ou a Política, troque `version` e `updatedAt` em `web/src/lib/legal.js` e `TERMS_VERSION` em `api/src/routes/users.js`: o aviso de nova versão aparece sozinho para quem aceitou a anterior.
- Revise este relatório a cada 12 meses.
