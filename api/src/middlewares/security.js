import { clientIp } from '../security/login-protection.js'

// Cabeçalhos de segurança (o mesmo que a biblioteca Helmet faria, sem dependência nova).
export const securityHeaders = (request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('X-Frame-Options', 'DENY')
    response.setHeader('Referrer-Policy', 'no-referrer')
    response.setHeader('X-DNS-Prefetch-Control', 'off')
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')

    // A API só devolve JSON: nada nela deve rodar script ou ser exibido dentro de outra página.
    // A página /docs (Swagger) precisa de scripts próprios, por isso fica de fora.
    if (!request.path.startsWith('/docs')) {
        response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
    }
    next()
}

// Limite de requisições por IP, em memória (a API roda em uma única instância).
// Janela fixa: conta as requisições de cada IP e zera ao fim da janela.
export function rateLimit({ name, windowMs, max, message }) {
    const hits = new Map()

    const cleanup = setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of hits) {
            if (entry.resetAt <= now) hits.delete(key)
        }
    }, windowMs)
    cleanup.unref()

    return (request, response, next) => {
        const ip = clientIp(request) || 'desconhecido'
        const now = Date.now()
        let entry = hits.get(ip)
        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs }
            hits.set(ip, entry)
        }
        entry.count++

        const remaining = Math.max(0, max - entry.count)
        const resetSeconds = Math.ceil((entry.resetAt - now) / 1000)
        response.setHeader('RateLimit-Limit', String(max))
        response.setHeader('RateLimit-Remaining', String(remaining))
        response.setHeader('RateLimit-Reset', String(resetSeconds))

        if (entry.count > max) {
            response.setHeader('Retry-After', String(resetSeconds))
            if (entry.count === max + 1) {
                console.warn(`[limite] ${name}: IP atingiu ${max} requisições`)
            }
            return response.status(429).send({
                message: message ?? 'Muitas requisições em pouco tempo. Aguarde alguns minutos e tente de novo.',
            })
        }
        next()
    }
}

// Limite geral: 300 requisições a cada 5 minutos por IP.
// O uso normal do painel fica bem abaixo disso (umas 10 requisições por tela).
export const apiLimiter = rateLimit({
    name: 'geral',
    windowMs: 5 * 60 * 1000,
    // Só o ambiente de testes automáticos aumenta o limite (variável API_RATE_LIMIT).
    max: Number(process.env.API_RATE_LIMIT) || 300,
})

// Rotas abertas que criam contas ou disparam e-mails: 20 a cada 15 minutos por IP.
export const sensitiveLimiter = rateLimit({
    name: 'cadastro/e-mails',
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Muitas tentativas em pouco tempo. Aguarde 15 minutos e tente de novo.',
})

// Rotas usadas pelo servidor do Valtrea Pay (todas as chamadas vêm do mesmo IP):
// limite alto, só para impedir abuso com códigos inventados.
export const payLimiter = rateLimit({
    name: 'valtrea-pay',
    windowMs: 5 * 60 * 1000,
    max: 3000,
})
