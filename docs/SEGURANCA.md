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
| 13 | Dependências vulneráveis | Nenhuma falha conhecida hoje; auditoria no CI (reprova falha crítica) e Dependabot semanal |
| 14 | Tokens | Curta duração, segredos diferentes para acesso e renovação, aviso no Sentry se os segredos tiverem menos de 32 caracteres. Guardados no navegador e protegidos pela CSP contra scripts de terceiros |
| 15 | Rate limit | 300 requisições a cada 5 min por IP; 20 a cada 15 min no cadastro e nos e-mails; limite próprio para o Valtrea Pay |
| 16 | Dados sensíveis expostos | Respostas nunca trazem a senha; painel de administração só com números agregados; backup criptografado |
| 17 | SSRF | Não se aplica: a API não acessa endereços informados pelo usuário |
| 18 | Cookies inseguros | Não se aplica: o sistema não usa cookies |
| 19 | CORS | Só os domínios da Valtrea, mesmo se a variável CORS_ORIGIN faltar |

Também: HTTPS obrigatório (HSTS), CSP no app e no site, proteção contra exibição em iframe, `nosniff` e política de referência em todas as respostas.

## 20 itens antes de lançar (revisão de 04/11/2026)

| # | Item | Como está |
| --- | --- | --- |
| 1 | Esconder chaves de API | O app só recebe o endereço da API e o DSN do Sentry, que são públicos por natureza. Conferido no arquivo publicado em produção: nenhuma chave, senha ou string de conexão |
| 2 | Segredos fora do Git | Histórico inteiro (74 commits) varrido: só valores de exemplo. O CI agora roda o **gitleaks** em todo o histórico a cada mudança e reprova se aparecer uma senha ou chave |
| 3 | Chave pública do banco | Não se aplica: o navegador nunca fala com o banco. Só a API conecta, com a string de conexão guardada no Render e nos segredos do GitHub |
| 4 | RLS (Row Level Security) | Não se aplica do jeito do Supabase/Firebase, em que o navegador acessa o banco. Aqui toda consulta passa pela API, que filtra pelo usuário do token. Isso é testado a cada mudança (outro usuário não vê, não edita e não cria dados em nome de ninguém) |
| 5 | Criptografia de dados | HTTPS em tudo (TLS 1.2/1.3); banco Neon criptografado em repouso (AES-256) e com conexão obrigatoriamente criptografada; backup diário com AES-256; senhas com bcrypt; links de e-mail e código do Valtrea Pay guardados só como hash |
| 6 | Autenticação no servidor | Todo acesso é validado na API (JWT HS256 conferido a cada requisição). Quem é administrador é decidido pela API, nunca pelo app |
| 7 | Restringir acessos | Cada usuário só acessa os próprios dados (403/404 para os dos outros, testado); painel de administração só com números agregados |
| 8 | Bloquear mass assignment | A API só grava campos validados. Campos internos (confirmação de e-mail, id, dono da transação) são recusados ou trocados pelo valor do servidor (testado) |
| 9 | Proteger cookies | Não se aplica: o sistema não usa cookies. A sessão fica no navegador, protegida pela CSP, que só aceita scripts do próprio site |
| 10 | Hash nas senhas | bcrypt; a senha nunca sai da API |
| 11 | Rate limit | 300 requisições a cada 5 min por IP; 20 a cada 15 min no cadastro e nos e-mails; bloqueio de 15 min após 5 senhas erradas |
| 12 | Proteção contra robôs | Campo invisível no cadastro e no "esqueci a senha" (robô que preenche é recusado), mais limites por IP, bloqueio de login e confirmação de e-mail. Sem captcha e sem mandar dados a terceiros |
| 13 | Queries parametrizadas | Prisma em todas as consultas; as três consultas SQL manuais (saldo, relatório mensal e administração) usam parâmetros (`$queryRaw` com template), nunca texto montado |
| 14 | Validação dos dados | Zod em todas as rotas, no app e na API; corpo limitado a 100 KB; JSON quebrado responde 400 |
| 15 | Vazamento de conteúdo | Erros genéricos (testado em produção); sem mapas do código-fonte publicados; sem `X-Powered-By`; Sentry sem senhas, tokens nem IP; `.env` e `.git` não existem no site publicado |
| 16 | Restringir uploads | Não se aplica: o sistema não recebe arquivos |
| 17 | Respostas enxutas | A API devolve só os campos que o app usa: nada de hash de senha, controle de sessões, último acesso, id do dono das transações ou identificadores internos (testado) |
| 18 | Cabeçalhos de segurança | HSTS, CSP, `X-Frame-Options: DENY`, `nosniff`, política de referência e de permissões no app, no site e na API |
| 19 | Forçar HTTPS | `http://` redireciona para `https://` no app, no site e na API (testado em produção); HSTS faz o navegador lembrar |
| 20 | Varredura de dependências | `npm audit` a cada mudança (reprova falha crítica) e Dependabot semanal; nenhuma falha conhecida hoje |

Ponto de atenção que fica: o cadastro avisa quando um e-mail já tem conta, o que permite descobrir se alguém usa o Valtrea. É o comportamento comum em apps, e o limite de 20 tentativas a cada 15 minutos por IP impede a varredura em massa.

## Dependências

Em 03/11/2026, `npm audit` sem nenhuma falha conhecida na API, no app e no site:

- API: zod 4, bcrypt 6, `uuid` substituído pelo `randomUUID` nativo, `npm audit fix`, e versões corrigidas de `glob` e `minimatch` forçadas (`overrides` no `package.json`) dentro do plugin de build do Sentry.
- App: zod 4, react-router 7, axios e react-hook-form atualizados, e `follow-redirects` corrigido por `overrides`.

Quando o Dependabot atualizar essas bibliotecas, confira se os `overrides` ainda são necessários (`npm ls glob minimatch` e `npm ls follow-redirects`).
