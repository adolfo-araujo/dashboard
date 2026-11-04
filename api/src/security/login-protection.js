import { prisma } from '../../prisma/prisma.js'
import { sendEmail } from '../adapters/email-sender.js'

// Regras de bloqueio
const WINDOW_MINUTES = 15
const MAX_FAILURES_PER_EMAIL = 5
const MAX_FAILURES_PER_IP = 20
const KEEP_HOURS = 24

const windowStart = () => new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)

export const normalizeEmail = (email) =>
    String(email ?? '')
        .trim()
        .toLowerCase()
        .slice(0, 100)

// IP real de quem acessa. O Render fica atrás da Cloudflare, que envia o
// IP original no cabeçalho cf-connecting-ip.
export const clientIp = (request) =>
    String(
        request.headers['cf-connecting-ip'] ||
            request.headers['x-forwarded-for']?.split(',')[0] ||
            request.socket?.remoteAddress ||
            '',
    )
        .trim()
        .slice(0, 64) || null

// Minutos até liberar quando a contagem da janela atingiu o limite
const minutesUntilFree = (failures, limit) => {
    const oldestThatCounts = failures[failures.length - limit]
    const freeAt = oldestThatCounts.created_at.getTime() + WINDOW_MINUTES * 60 * 1000
    return Math.max(1, Math.ceil((freeAt - Date.now()) / 60000))
}

// Retorna quantos minutos faltam se estiver bloqueado, ou null se puder tentar
export async function checkLoginBlock(email, ip) {
    const since = windowStart()

    const byEmail = email
        ? await prisma.loginAttempt.findMany({
              where: { email, created_at: { gte: since } },
              orderBy: { created_at: 'asc' },
              select: { created_at: true },
          })
        : []
    if (byEmail.length >= MAX_FAILURES_PER_EMAIL) {
        return minutesUntilFree(byEmail, MAX_FAILURES_PER_EMAIL)
    }

    if (ip) {
        const byIp = await prisma.loginAttempt.findMany({
            where: { ip, created_at: { gte: since } },
            orderBy: { created_at: 'asc' },
            select: { created_at: true },
        })
        if (byIp.length >= MAX_FAILURES_PER_IP) {
            return minutesUntilFree(byIp, MAX_FAILURES_PER_IP)
        }
    }

    return null
}

// Registra uma senha errada. Se a conta acabou de ser bloqueada, avisa o dono por e-mail.
export async function registerLoginFailure(email, ip) {
    if (!email) return

    await prisma.loginAttempt.create({ data: { email, ip } })

    // limpeza dos registros antigos
    await prisma.loginAttempt.deleteMany({
        where: { created_at: { lt: new Date(Date.now() - KEEP_HOURS * 60 * 60 * 1000) } },
    })

    const count = await prisma.loginAttempt.count({
        where: { email, created_at: { gte: windowStart() } },
    })

    if (count === MAX_FAILURES_PER_EMAIL) {
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
        })
        if (user) await sendLockEmail(user)
    }
}

export async function clearLoginFailures(email) {
    if (!email) return
    await prisma.loginAttempt.deleteMany({ where: { email } })
}

async function sendLockEmail(user) {
    const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')
    const resetLink = `${appUrl}/forgot-password`

    await sendEmail({
        to: user.email,
        subject: 'Bloqueamos temporariamente o acesso à sua conta',
        text: `Olá, ${user.first_name}.\n\nDetectamos ${MAX_FAILURES_PER_EMAIL} tentativas de login com senha errada na sua conta do Valtrea. Por segurança, novas tentativas ficam bloqueadas por ${WINDOW_MINUTES} minutos.\n\nSe foi você, é só esperar e tentar de novo, ou criar uma senha nova em:\n${resetLink}\n\nSe não foi você, recomendamos trocar a senha assim que possível.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c2026">
  <h2 style="color:#55B02E;margin-bottom:8px">Valtrea</h2>
  <p>Olá, ${user.first_name}.</p>
  <p>Detectamos <strong>${MAX_FAILURES_PER_EMAIL} tentativas de login com senha errada</strong> na sua conta. Por segurança, novas tentativas ficam bloqueadas por ${WINDOW_MINUTES} minutos.</p>
  <p>Se foi você, é só esperar e tentar de novo. Se não foi, recomendamos trocar sua senha:</p>
  <p style="margin:28px 0">
    <a href="${resetLink}" style="background:#55B02E;color:#0D0F12;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Criar nova senha</a>
  </p>
</div>`,
    })
}
