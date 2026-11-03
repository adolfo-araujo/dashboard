# Testes, carga e alertas

Este guia explica os testes automáticos do Valtrea Finance, o teste de capacidade e o alerta de lentidão.

## O que roda a cada mudança (CI)

Todo pull request e todo push na `main` rodam, no GitHub Actions:

| Etapa | O que verifica |
| --- | --- |
| API + banco | Teste de ponta a ponta da API (`api/scripts/smoke-test.js`): conta, transações, relatórios, orçamento, recorrentes, Valtrea Pay, administração e segurança |
| QA no navegador | Testes com Playwright (`e2e/`) no computador e no celular: página inicial, termos, login, cadastro, confirmação de e-mail, painel, transações, período, exportação, recorrentes, administração e exclusão de conta |
| Teste de carga | 100 pessoas usando ao mesmo tempo por 90 segundos (`loadtest/`), com a API limitada como o plano Starter do Render e o atraso real até o banco. Reprova se 5% das respostas passarem de 1 segundo ou se mais de 1% der erro |
| Builds | O app e o site da empresa compilam sem erro |

### Publicar só depois dos testes

Para o Render só publicar a API quando tudo passar: no painel do Render, abra o serviço **dashboard-api** > **Settings** > **Auto-Deploy** e escolha **After CI Checks Pass**.

## Teste de capacidade (sob demanda)

Mede quantas pessoas o sistema aguenta em cada plano do Render. Roda numa cópia isolada, nunca no site em produção.

1. GitHub > **Actions** > **Teste de capacidade** > **Run workflow**.
2. Escolha o cenário (ou "todos"). Deixe a latência em branco para usar a distância real até o banco, medida na hora, ou use `2` para simular o banco na mesma região da API.
3. O resultado aparece no resumo da execução e nos arquivos anexados (Artifacts).

Critério de aprovação: 95% das respostas em menos de 1 segundo (login: 2 segundos) e menos de 1% de erros.

A primeira etapa ("Sondagem da produção") faz cerca de 30 requisições leves no sistema real, sem criar nada: mede a distância até o banco, confere se o limite por IP pode ser enganado e verifica os cabeçalhos de segurança e de cache.

### Rodar no seu computador

Com Docker e [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) instalados:

```bash
USERS=100 CPUS=0.5 MEMORY=512m DB_LATENCY_MS=120 bash loadtest/run.sh
```

## Alerta de lentidão

Toda resposta da API que passa de 1 segundo vira um aviso no Sentry ("Resposta lenta: GET /api/... levou 1530 ms"), agrupado por rota e no máximo um a cada 15 minutos por rota. Também aparece no log do Render como `[lento]`. Todas as respostas trazem o cabeçalho `Server-Timing` com o tempo gasto na API.

Para receber o e-mail na hora:

1. No Sentry, abra **Alerts** > **Create Alert** > **Issues**.
2. Projeto **valtrea-api**. Em "When", escolha **A new issue is created** e **The issue changes state from resolved to unresolved**.
3. Em "If", adicione **The event's tags match** `tipo` igual a `resposta-lenta`.
4. Em "Then", escolha **Send a notification to** você (e-mail). Salve com o nome "Resposta lenta".

Depois de corrigir uma lentidão, marque o aviso como **Resolved** no Sentry: se voltar a acontecer, você recebe outro e-mail.

Para mudar o limite, defina `SLOW_RESPONSE_MS` no Render (em milissegundos).
