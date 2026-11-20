import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { usersRouter, transactionsRouter } from './routes/index.js'
import { passwordResetRouter } from './routes/password-reset.js'
import { emailVerificationRouter } from './routes/email-verification.js'
import { reportsRouter } from './routes/reports.js'
import { recurringRouter } from './routes/recurring.js'
import { budgetsRouter } from './routes/budgets.js'
import { adminRouter } from './routes/admin.js'
import { payEventsRouter, payIntegrationRouter } from './routes/pay-integration.js'
import { waitlistRouter } from './routes/waitlist.js'
import { assistenteRouter } from './routes/assistente.js'
import {
    apiLimiter,
    payLimiter,
    securityHeaders,
    sensitiveLimiter,
    waitlistLimiter,
} from './middlewares/security.js'
import { responseTime } from './middlewares/response-time.js'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

// Mede o tempo de cada resposta e avisa no Sentry quando passa de 1 segundo
app.use(responseTime)

// Não anunciar que a API usa Express
app.disable('x-powered-by')
app.use(securityHeaders)

// Só os sites da Valtrea podem chamar a API pelo navegador. Sem a variável
// CORS_ORIGIN, usa os endereços oficiais (nunca "qualquer site").
const DEFAULT_ORIGINS = [
    'https://finance.valtrea.com.br',
    'https://www.valtrea.com.br',
    'https://valtrea.com.br',
]
app.use(
    cors({
        origin: process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
            : DEFAULT_ORIGINS,
        // O site manda o cookie da sessão (middlewares/sessao.js); só as origens acima podem
        credentials: true,
    }),
)
app.use(express.json({ limit: '100kb' }))

// Segredos curtos podem ser adivinhados: avisa no Sentry se isso acontecer no Render
if (process.env.RENDER) {
    for (const name of ['JWT_ACCESS_TOKEN_SECRET', 'JWT_REFRESH_TOKEN_SECRET']) {
        if ((process.env[name] ?? '').length < 32) {
            console.error(`Segurança: ${name} tem menos de 32 caracteres. Gere um segredo longo.`)
        }
    }
}

// Fica antes do limite de requisições: o cron-job.org chama a cada 10 minutos.
app.get('/api/health', (request, response) => {
    response.status(200).send({ status: 'ok' })
})

// Também antes do limite por IP: todos os envios do Valtrea Pay saem do mesmo servidor.
// Cada chamada exige um código de conexão de 192 bits, que não dá para adivinhar.
app.use('/api/integrations/pay', payLimiter, payEventsRouter)

// Lista de espera do site: os pedidos chegam pela Vercel (vários visitantes com o mesmo IP),
// por isso tem um limite próprio, mais alto, em vez do geral.
app.use('/api/lista-de-espera', waitlistLimiter, waitlistRouter)

app.use('/api', apiLimiter)
app.post(
    [
        '/api/users',
        '/api/users/forgot-password',
        '/api/users/reset-password',
        '/api/users/verify-email',
        '/api/users/me/resend-verification',
    ],
    sensitiveLimiter,
)

app.use('/api/users', passwordResetRouter)
app.use('/api/users', emailVerificationRouter)
app.use('/api/users', usersRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/recurring', recurringRouter)
app.use('/api/budgets', budgetsRouter)
app.use('/api/assistente', assistenteRouter)
app.use('/api/admin', adminRouter)
app.use('/api/integrations/pay', payIntegrationRouter)

// Rota inexistente: resposta curta em JSON, sem revelar detalhes do servidor
app.use('/api', (request, response) => {
    response.status(404).send({ message: 'Not found' })
})

const swaggerDocument = JSON.parse(
    fs.readFileSync(join(__dirname, '../docs/swagger.json'), 'utf8'),
)

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use((request, response) => {
    response.status(404).send({ message: 'Not found' })
})

// JSON inválido no corpo da requisição
// eslint-disable-next-line no-unused-vars
app.use((error, request, response, next) => {
    if (error instanceof SyntaxError && 'body' in error) {
        return response.status(400).send({ message: 'Invalid JSON body.' })
    }
    if (error?.type === 'entity.too.large') {
        return response.status(413).send({ message: 'Requisição grande demais.' })
    }
    console.error(error)
    return response.status(500).send({ message: 'Internal server error' })
})

export { app }
