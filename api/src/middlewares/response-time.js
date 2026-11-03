import * as Sentry from '@sentry/node'

// Alerta de lentidão: toda resposta da API que passar do limite (padrão: 1 segundo)
// vira um aviso no Sentry, que manda e-mail. Assim dá para saber do problema antes
// dos usuários reclamarem.
//
// - O aviso é agrupado por rota (ex.: "GET /api/transactions/me"), então cada rota
//   lenta aparece como um item só no Sentry, com a contagem de vezes.
// - Para não gastar a cota gratuita, cada rota manda no máximo um aviso a cada 15 minutos.
// - Todas as respostas levam o cabeçalho Server-Timing, visível no navegador (aba Rede).

const SLOW_MS = Number(process.env.SLOW_RESPONSE_MS) || 1000
const ALERT_INTERVAL_MS = 15 * 60 * 1000
const lastAlertAt = new Map()

// Troca IDs por ":id" para agrupar "/api/recurring/3f2a..." e "/api/recurring/9b1c..."
const routeKey = (request) => {
    const path = request.route?.path
        ? `${request.baseUrl}${request.route.path}`
        : request.originalUrl.split('?')[0].replace(/[0-9a-f-]{36}/gi, ':id')
    return `${request.method} ${path}`
}

export const responseTime = (request, response, next) => {
    const start = process.hrtime.bigint()
    const elapsedMs = () => Number(process.hrtime.bigint() - start) / 1e6

    // Cabeçalho escrito logo antes da resposta sair
    const writeHead = response.writeHead
    response.writeHead = function (...args) {
        if (!response.headersSent) {
            response.setHeader('Server-Timing', `app;dur=${elapsedMs().toFixed(1)}`)
        }
        return writeHead.apply(this, args)
    }

    response.on('finish', () => {
        const ms = Math.round(elapsedMs())
        if (ms < SLOW_MS) return

        const key = routeKey(request)
        console.warn(`[lento] ${key} levou ${ms} ms (status ${response.statusCode})`)

        const now = Date.now()
        if (now - (lastAlertAt.get(key) ?? 0) < ALERT_INTERVAL_MS) return
        lastAlertAt.set(key, now)
        if (lastAlertAt.size > 500) lastAlertAt.clear()

        Sentry.withScope((scope) => {
            scope.setLevel('warning')
            scope.setFingerprint(['resposta-lenta', key])
            scope.setTag('tipo', 'resposta-lenta')
            scope.setTag('rota', key)
            scope.setExtra('duracao_ms', ms)
            scope.setExtra('limite_ms', SLOW_MS)
            scope.setExtra('status', response.statusCode)
            Sentry.captureMessage(`Resposta lenta: ${key} levou ${ms} ms`)
        })
    })

    next()
}
