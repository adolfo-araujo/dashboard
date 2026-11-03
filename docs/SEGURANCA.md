# Segurança

Revisão de 03/11/2026 com os 19 pontos mais comuns de falha em sites e sistemas. O CI confere boa parte deles a cada mudança (`api/scripts/smoke-test.js`, `e2e/` e auditoria de dependências).

| # | Ponto | Como está |
| --- | --- | --- |
| 1 | Variáveis de ambiente expostas | `.env` fora do Git; nenhuma senha ou chave no código nem no histórico. No app só vão o endereço da API e o DSN do Sentry, que são públicos por natureza |
| 2 | Validação no app | Todos os formulários validam com Zod antes de enviar |
| 3 | Validação na API | Todas as rotas validam com Zod; só os campos validados chegam ao banco; corpo limitado a 100 KB |
| 4 | SQL injection | Prisma com consultas parametrizadas; nenhuma consulta montada com texto |
| 5 | Autenticação fraca | Senha nova com 8 a 72 caracteres, letras e números; JWT só HS256; acesso de 15 min e renovação de 30 dias; trocar ou redefinir a senha encerra as outras sessões; conta excluída não renova sessão |
| 6 | IDOR (acessar dados de outro) | Toda consulta filtra pelo usuário do token; tentar mexer no de outro dá 403 ou 404 (testado) |
| 7 | Senhas no banco | bcrypt; links de e-mail e código do Valtrea Pay guardados só como hash |
| 8 | Força bruta | Bloqueio de 15 min após 5 senhas erradas por e-mail ou 20 por IP (também na exclusão de conta), com aviso por e-mail |
| 9 | Bloquear durante envio | Botões ficam desativados enquanto a ação está em andamento |
| 10 | CSRF | Não se aplica: a sessão vai no cabeçalho Authorization, não em cookie |
| 11 | Upload sem validação | Não se aplica: o sistema não recebe arquivos |
| 12 | Revelar informação | Erros genéricos (500 sem detalhes, 404 em JSON); login responde igual para e-mail inexistente e senha errada; sem cabeçalho X-Powered-By; Sentry sem senhas, tokens ou corpo das requisições |
| 13 | Dependências vulneráveis | Auditoria no CI (reprova falha crítica) e Dependabot semanal |
| 14 | Tokens | Curta duração, segredos diferentes para acesso e renovação, aviso no Sentry se os segredos tiverem menos de 32 caracteres. Guardados no navegador e protegidos pela CSP contra scripts de terceiros |
| 15 | Rate limit | 300 requisições a cada 5 min por IP; 20 a cada 15 min no cadastro e nos e-mails; limite próprio para o Valtrea Pay |
| 16 | Dados sensíveis expostos | Respostas nunca trazem a senha; painel de administração só com números agregados; backup criptografado |
| 17 | SSRF | Não se aplica: a API não acessa endereços informados pelo usuário |
| 18 | Cookies inseguros | Não se aplica: o sistema não usa cookies |
| 19 | CORS | Só os domínios da Valtrea, mesmo se a variável CORS_ORIGIN faltar |

Também: HTTPS obrigatório (HSTS), CSP no app e no site, proteção contra exibição em iframe, `nosniff` e política de referência em todas as respostas.

## Pendências conhecidas

- **zod 3 na API:** há um alerta de nível alto que só se resolve migrando para o zod 4, que muda a forma de escrever as validações. Fazer com calma, com os testes do CI.
- **glob e minimatch (moderado):** vêm de dentro do Sentry e só são usados na inicialização, sem receber dados dos usuários.
- **No app (navegador):** `follow-redirects` (alto) só é usado pelo axios no Node, não no navegador; `react-router` (moderado) afeta links com endereço digitado pelo usuário ou renderização no servidor, que o Valtrea não usa. Somem com as atualizações do Dependabot.
- **zod:** o alerta é de consumo de memória com listas enormes; a API já recusa requisições acima de 100 KB, o que limita o efeito.
