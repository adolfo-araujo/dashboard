# Contas e acessos: o que só você pode fazer

Guia das melhorias 18, 91, 93 e 100 da lista "100 melhorias para a Valtrea". Nenhuma delas envolve código; todas protegem a empresa inteira.

## 1. Destravar os testes automáticos do GitHub (melhoria 91)

Hoje todo teste falha antes de começar com a mensagem "recent account payments have failed or your spending limit needs to be increased". Enquanto isso não for resolvido, o backup diário e as mudanças no servidor ficam parados.

1. Entre em github.com → foto no canto → **Settings** → **Billing and licensing** → **Payment information**.
2. Confira o cartão: se aparecer pagamento recusado, troque o cartão ou pague a fatura pendente.
3. Em **Budgets and alerts**, deixe o orçamento do Actions em US$ 0 com "Stop usage when budget limit is reached". Os repositórios privados têm 2.000 minutos grátis por mês, e a Valtrea usa bem menos que isso; o orçamento zerado garante que nunca haverá cobrança.
4. Me avise. Eu rodo os testes de novo, confiro o backup e sigo com as melhorias do servidor.

## 2. Verificação em duas etapas em tudo (melhoria 93)

Se alguém entrar em uma destas contas, derruba ou copia todos os produtos. Ative a verificação em duas etapas com um app autenticador (Google Authenticator, Microsoft Authenticator ou o do gerenciador de senhas), não por SMS, e guarde os códigos de recuperação no gerenciador de senhas.

| Conta | Onde ativar | Feito |
| --- | --- | --- |
| GitHub | Settings → Password and authentication | ☐ |
| Render | Account Settings → Security | ☐ |
| Neon | Account settings → Security | ☐ |
| Vercel | Account Settings → Authentication | ☐ |
| Registro.br | Painel → Segurança da conta | ☐ |
| Resend | Settings → Security | ☐ |
| Sentry | User settings → Security | ☐ |
| Google (e-mail usado nos cadastros) | myaccount.google.com → Segurança | ☐ |
| Google Play Console (quando criar) | Usa a do Google | ☐ |
| Gerenciador de senhas | Configurações → Segurança | ☐ |

## 3. E-mails que não caem no spam (melhoria 18)

Os produtos enviam e-mail pelo Resend com o domínio valtrea.com.br. Três registros no DNS (Registro.br) dizem aos provedores que esses e-mails são legítimos:

- **SPF e DKIM**: o Resend mostra os registros em Domains → valtrea.com.br. O domínio precisa aparecer como **Verified**. Se algum registro estiver pendente, copie-o para o DNS no Registro.br.
- **DMARC**: crie um registro TXT com nome `_dmarc` e valor `v=DMARC1; p=none; rua=mailto:contato@valtrea.com.br`. Depois de 30 dias sem problemas, troque `p=none` por `p=quarantine`.

Para conferir: crie uma conta de teste em qualquer produto usando um Gmail, abra o e-mail de código, toque nos três pontos → **Mostrar original**. As linhas SPF, DKIM e DMARC devem dizer **PASS**.

## 4. Revisão de acessos a cada 6 meses (melhoria 100)

Marque na agenda para maio e novembro de cada ano.

1. **Quem tem acesso**: em cada conta da tabela acima, veja membros, chaves de API e aplicativos conectados. Remova o que não reconhecer ou não usar mais.
2. **Trocar as chaves**: gere segredos novos (pelo menos 32 caracteres) no gerenciador de senhas e troque no Render e nos segredos do GitHub:
   - segredos do login (JWT) de cada API. Trocar esses desconecta todo mundo, que só precisa entrar de novo;
   - chave do Resend;
   - senha do banco no Neon (Reset password) e a string de conexão no Render e no GitHub.
3. **Backup**: baixe o backup mais recente e restaure num banco de teste no Neon para ter certeza de que ele abre (melhoria 92).
4. **Registro**: anote a data da revisão no fim deste arquivo.

| Data | O que foi feito |
| --- | --- |
| | |
