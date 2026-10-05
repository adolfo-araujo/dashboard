# Finance Dashboard

Dashboard de finanças pessoais full stack: cadastro e login com JWT, registro de ganhos, gastos e investimentos, saldo por período, gráfico de distribuição e gestão da conta.

| Parte | Stack |
| --- | --- |
| `api/` | Node.js, Express, Prisma, PostgreSQL, Zod, JWT (access + refresh), bcrypt, Swagger |
| `web/` | React 18, Vite, Tailwind CSS, TanStack Query, React Hook Form + Zod, Recharts |
| Banco | PostgreSQL 16 com migrations do Prisma e seed de demonstração |

## Rodando tudo com Docker (recomendado)

Pré-requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build
```

Na primeira vez o container da API aplica as migrations e cria um usuário de demonstração com 6 meses de transações.

- Dashboard: http://localhost:3000
- API: http://localhost:8080/api
- Documentação Swagger: http://localhost:8080/docs
- Login demo: `demo@finance.app` / `123456`

Para apagar o banco e começar do zero: `docker compose down -v`.

## Rodando em modo desenvolvimento

```bash
# 1. banco
docker compose up -d postgres

# 2. API (porta 8080)
cd api
cp .env.example .env
npm install
npx prisma migrate deploy
npm run seed
npm run start:dev

# 3. dashboard (porta 5173) — em outro terminal
cd web
npm install
npm run dev
```

O Vite encaminha `/api` para `http://localhost:8080`, então não é preciso configurar CORS em desenvolvimento.

## Funcionalidades

- Cadastro, login, logout e renovação automática do token (refresh token) quando o access token expira
- Saldo do período com totais de ganhos, gastos e investimentos
- Gráfico de rosca com a distribuição percentual
- Filtro de período com atalhos (este mês, mês passado, últimos 3 meses, este ano) ou datas personalizadas; o período fica na URL
- Criar, editar e excluir transações, com busca por nome e filtro por tipo
- Editar nome, e-mail e senha; excluir a conta (e todas as transações, em cascata)
- Layout responsivo (tabela no desktop, lista no celular)

## Endpoints da API

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/users` | Cadastro (retorna tokens) |
| POST | `/api/users/login` | Login (retorna tokens) |
| POST | `/api/users/refresh-token` | Gera novos tokens |
| GET | `/api/users/me` | Usuário autenticado |
| PATCH | `/api/users/me` | Atualiza usuário |
| DELETE | `/api/users/me` | Exclui usuário |
| GET | `/api/users/me/balance?from=YYYY-MM-DD&to=YYYY-MM-DD` | Saldo do período |
| GET | `/api/transactions/me?from=…&to=…` | Lista transações |
| POST | `/api/transactions/me` | Cria transação |
| PATCH | `/api/transactions/me/:id` | Edita transação |
| DELETE | `/api/transactions/me/:id` | Exclui transação |

## Testes

- `cd api && npm run test:smoke` roda um teste de ponta a ponta contra a API em execução (cadastro, login, CRUD de transações, saldo, permissões, refresh token).
- O GitHub Actions (`.github/workflows/ci.yml`) sobe um PostgreSQL, aplica as migrations, roda o seed, inicia a API e executa esse teste a cada push; também faz o build do dashboard.
- Os testes unitários/e2e originais com Jest continuam em `api/src` (`npm test`, usa o `api/docker-compose.yml` com o banco de teste na porta 5433 e um `.env.test` — veja `api/.env.test.example`).

## Correções em relação à API original

- Login aceitava qualquer senha: a comparação do bcrypt (assíncrona) não era aguardada.
- Qualquer usuário autenticado conseguia editar transações de outro; agora retorna 403.
- Excluir transação de outro usuário retornava 500 em vez de 403.
- O hash da senha era devolvido nas respostas de usuário; agora é removido.
- Transações agora vêm ordenadas por data (mais recentes primeiro).

## Publicando no GitHub

Crie um repositório vazio em https://github.com/new e rode na pasta do projeto:

```bash
./push-to-github.sh https://github.com/SEU-USUARIO/finance-dashboard.git
```

No Windows (PowerShell): `.\push-to-github.ps1 https://github.com/SEU-USUARIO/finance-dashboard.git`

Com o GitHub CLI logado (`gh auth login`) dá para criar o repositório e enviar de uma vez: `./push-to-github.sh --gh finance-dashboard`.

## Deploy

- Banco: qualquer PostgreSQL gerenciado (Neon, Supabase, Render).
- API: Render/Railway apontando para a pasta `api` com o `Dockerfile`; defina `DATABASE_URL`, `JWT_ACCESS_TOKEN_SECRET`, `JWT_REFRESH_TOKEN_SECRET` e, opcionalmente, `CORS_ORIGIN`.
- Dashboard: Vercel/Netlify na pasta `web`, com `VITE_API_URL=https://sua-api.com/api` nas variáveis de build.
