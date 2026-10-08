import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { usersRouter, transactionsRouter } from './routes/index.js'
import { passwordResetRouter } from './routes/password-reset.js'
import { emailVerificationRouter } from './routes/email-verification.js'
import { reportsRouter } from './routes/reports.js'
import { recurringRouter } from './routes/recurring.js'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

app.use(
    cors({
        origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    }),
)
app.use(express.json())

app.get('/api/health', (request, response) => {
    response.status(200).send({ status: 'ok' })
})

app.use('/api/users', passwordResetRouter)
app.use('/api/users', emailVerificationRouter)
app.use('/api/users', usersRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/recurring', recurringRouter)

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
