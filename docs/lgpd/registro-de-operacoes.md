# Registro das Operações de Tratamento de Dados Pessoais

Documento interno (LGPD art. 37), no formato simplificado para agente de tratamento de pequeno porte (Resolução CD/ANPD nº 2/2022). Não publicar.

- **Controlador:** João Adolfo Martins Araújo (pessoa física), Rio de Janeiro/RJ
- **Encarregado / canal:** sem encarregado indicado (dispensa de pequeno porte); canal: contato@valtrea.com.br
- **Elaborado em:** 04/11/2026 · **Atualizado em:** 07/11/2026 · **Revisar:** a cada 12 meses ou a cada nova funcionalidade que trate dados
- **Serviços cobertos:** Valtrea Finance (finance.valtrea.com.br, app instalável e API) e site da Valtrea (www.valtrea.com.br)

## Operações

| # | Operação | Titulares | Dados pessoais | Sensíveis? | Finalidade | Base legal | Origem no sistema | Operadores | Transferência internacional | Retenção | Segurança |
|---|----------|-----------|----------------|-----------|-----------|-----------|-------------------|-----------|-----------------------------|----------|-----------|
| 1 | Cadastro e login | Usuários (18+ e adolescentes autorizados) | Nome, sobrenome, e-mail, senha (hash), datas de confirmação e de último acesso | Não | Criar a conta e autenticar | Art. 7º, V | `web/src/pages/signup.jsx`, `login.jsx` → `POST /api/users`, `/api/users/login` | Render, Neon | Sim (Render, EUA) | Enquanto a conta existir | HTTPS, bcrypt, JWT curto, bloqueio por tentativas |
| 2 | Lançamentos financeiros | Usuários | Transações (nome, valor, data, tipo, categoria), recorrentes, orçamentos | Não | Prestar o serviço | Art. 7º, V | Painel → `/api/transactions`, `/api/recurring`, `/api/budgets` | Render, Neon | Sim (Render, EUA) | Enquanto a conta existir | Acesso só ao próprio usuário (testado) |
| 3 | Integração Valtrea Pay | Usuários que conectam | Pagamentos da carteira (nome, valor, data, tipo), saldo, hash do código | Não | Lançar pagamentos a pedido do usuário | Art. 7º, V | `/api/integrations/pay` | Render, Neon | Sim (Render, EUA) | Até desconectar (código) / até o usuário apagar (transações) | Código de 192 bits guardado só como hash; só escrita |
| 4 | E-mails do sistema | Usuários | Nome, e-mail, links de uso único | Não | Confirmar e-mail, recuperar senha, avisos de segurança e exclusão | Art. 7º, V | `api/src/routes/email-verification.js`, `password-reset.js`, `security/login-protection.js` | Resend | Não (São Paulo) | Links: 24 h / 30 min, apagados 1 dia após vencer | Links guardados só como hash |
| 5 | Prova do aceite | Usuários | Data e versão do aceite dos Termos e da Política | Não | Comprovar o aceite | Art. 7º, VI | Cadastro e aviso de nova versão → `POST /api/users/me/terms` | Render, Neon | Sim (Render, EUA) | Enquanto a conta existir | — |
| 6 | Proteção contra abuso | Usuários e visitantes | E-mail tentado, endereço IP, data/hora | Não | Bloquear força bruta | Art. 7º, IX | `api/src/security/login-protection.js` | Render, Neon | Sim (Render, EUA) | 24 horas | Apagado automaticamente |
| 7 | Registro de erros | Usuários e visitantes | Dados técnicos do erro (sem senhas, tokens nem corpo das requisições) | Não | Corrigir falhas | Art. 7º, IX | `api/instrument.js`, `web/src/components/error-boundary.jsx` | Sentry | Sim (EUA) | Prazo do plano do Sentry | `sendDefaultPii: false`, sem gravação de sessão, IP não guardado (ativado no Sentry em 04/11/2026, na API e no app) |
| 8 | Backup do banco | Todos os usuários | Cópia completa do banco | Não | Recuperar dados em caso de falha | Art. 7º, IX | `.github/workflows/backup.yml` | GitHub | Sim (EUA) | 30 dias | AES-256 com senha guardada fora do GitHub |
| 9 | Contato e orçamento | Visitantes e clientes em potencial | Nome, e-mail, mensagem e o que a pessoa enviar | Não | Responder e preparar proposta | Art. 7º, V | Links `mailto:` do site e do app | ImprovMX, Google (Gmail, caixa que recebe o encaminhamento) | Sim (EUA) | Até 24 meses após o último contato, se não virar contrato | — |
| 10 | Registros de acesso da hospedagem | Visitantes e usuários | IP, data/hora, navegador | Não | Segurança e funcionamento | Art. 7º, IX | Vercel e Render (automático) | Vercel, Render | Sim (EUA) | Prazo de cada provedor | — |
| 11 | Retenção automática | Cadastros nunca confirmados e lista de espera | Cadastro sem lançamentos; inscrições não confirmadas ou antigas | Não | Princípio da necessidade | Arts. 15 e 16 | `api/src/jobs/retention.js` | Render, Neon | — | Apagados 30 dias após a criação | Testado no CI (`api/scripts/retention-test.js`) |
| 12 | Lista de espera do site | Visitantes que pedem aviso de lançamento | E-mail, produto, datas do pedido e da confirmação | Não | Avisar quando o produto estiver disponível | Art. 7º, I (consentimento, com confirmação dupla) | `site/src/projetos.jsx` → `POST /api/lista-de-espera` (`api/src/routes/waitlist.js`) | Vercel (encaminha o pedido), Render, Neon, Resend | Sim (EUA) | Até sair da lista ou o aviso ser enviado, no máximo 24 meses; sem confirmação: 7 dias | Código do link só como hash; resposta igual exista ou não a inscrição; 1 e-mail a cada 2 min por endereço |

## Direitos do titular

- Corrigir dados e excluir a conta: Minha conta (exclusão apaga tudo na hora).
- Acesso e portabilidade: Minha conta > **Baixar meus dados** (`GET /api/users/me/export`, JSON).
- Demais pedidos: contato@valtrea.com.br, resposta em até 15 dias.

## Operadores (fornecedores)

| Fornecedor | Serviço | Dados tratados | País | Contrato/DPA verificado? |
|-----------|---------|----------------|------|--------------------------|
| Vercel | Hospedagem do app e do site | Registros de acesso | EUA e rede global | Pendente |
| Render | Servidor da API | Todos os dados da API em trânsito, logs | EUA | Pendente |
| Neon | Banco de dados | Todos os dados | Brasil (São Paulo) | Pendente |
| GitHub | Backup criptografado | Cópia do banco (criptografada) | EUA | Pendente |
| Resend | E-mails do sistema | Nome, e-mail, conteúdo dos e-mails | Brasil (São Paulo) | Pendente |
| ImprovMX | Encaminhamento do e-mail de contato | Mensagens recebidas | EUA | Pendente |
| Google (Gmail) | Caixa que recebe o encaminhamento do contato@ | Mensagens recebidas e respostas | EUA | Pendente |
| Sentry | Registro de erros | Dados técnicos dos erros | EUA | Pendente |

## Pendências

- Confirmar se os termos de tratamento de dados (DPA) de cada fornecedor incluem cláusulas para transferência internacional (Resolução CD/ANPD nº 19/2024).
- Se o número de usuários adolescentes crescer, reavaliar se o tratamento passa a ser de alto risco (nesse caso, a dispensa de encarregado deixa de valer).

## Revisão de 07/11/2026

- Finance: previsão do fim do mês, relatório do ano e gráfico do saldo mês a mês são calculados no navegador com os lançamentos que a pessoa já tem. Nenhum dado novo é coletado, guardado ou enviado.
- Site da empresa: versões em inglês (/en) e espanhol (/es) e seção Segurança, sem formulários novos. A preferência de tema já está na Política de privacidade.
- Busca rápida (Ctrl+K) e mensagens de erro mais claras: sem dados novos.
