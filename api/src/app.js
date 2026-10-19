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
import {
    apiLimiter,
    securityHeaders,
    sensitiveLimiter,
} from './middlewares/security.js'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

// Não anunciar que a API usa Express
app.disable('x-powered-by')
app.use(securityHeaders)

app.use(
    cors({
        origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    }),
)
app.use(express.json())

// Fica antes do limite de requisições: o cron-job.org chama a cada 10 minutos.
app.get('/api/health', (request, response) => {
    response.status(200).send({ status: 'ok' })
})

// Também antes do limite por IP: todos os envios do Valtrea Pay saem do mesmo servidor.
// Cada chamada exige um código de conexão de 192 bits, que não dá para adivinhar.
app.use('/api/integrations/pay', payEventsRouter)

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
app.use('/api/admin', adminRouter)
app.use('/api/integrations/pay', payIntegrationRouter)

const swaggerDocument = JSON.parse(
    fs.readFileSync(join(__dirname, '../docs/swagger.json'), 'utf8'),
)

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// JSON inválido no corpo da requisição
// eslint-disable-next-line no-unused-vars
app.use((error, request, response, next) => {
    if (error instanceof SyntaxError && 'body' in error) {
        return response.status(400).send({ message: 'Invalid JSON body.' })
    }
    console.error(error)
    return response.status(500).send({ message: 'Internal server error' })
})

export { app }
