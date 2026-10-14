// Monitoramento de erros (Sentry). Precisa ser carregado antes do restante da API.
// Sem a variável SENTRY_DSN (ex.: no seu computador), nada é enviado.
import 'dotenv/config.js'
import * as Sentry from '@sentry/node'

// Erros esperados que não indicam falha no sistema: não vale gastar a cota com eles.
const IGNORED_ERRORS = new Set([
    'TokenExpiredError', // sessão expirada (renovada automaticamente)
    'JsonWebTokenError', // token inválido
    'NotBeforeError',
    'ZodError', // dados inválidos enviados pelo usuário
    'UnauthorizedError',
    'UserNotFoundError',
    'InvalidPasswordError',
])

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'production',
        // Não envia dados pessoais (IP, cookies) automaticamente
        sendDefaultPii: false,
        // Só erros, sem medição de desempenho (economiza a cota gratuita)
        tracesSampleRate: 0,
        // Os erros da API são registrados com console.error: captura esses registros
        integrations: [Sentry.captureConsoleIntegration({ levels: ['error'] })],
        beforeSend(event) {
            const type = event.exception?.values?.[0]?.type
            if (type && IGNORED_ERRORS.has(type)) return null

            // Nunca enviar corpo da requisição (pode ter senha) nem credenciais
            if (event.request) {
                delete event.request.data
                delete event.request.cookies
                if (event.request.headers) {
                    delete event.request.headers.authorization
                    delete event.request.headers.cookie
                }
            }
            return event
        },
    })
    console.log('Monitoramento de erros ativo.')
}
