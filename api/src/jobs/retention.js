// Rotina de retenção (LGPD, princípio da necessidade): apaga o que não precisa mais ser guardado.
// - Cadastros que nunca confirmaram o e-mail e não têm nenhum lançamento, 30 dias depois de criados.
//   Quem já usa o Valtrea e só trocou o e-mail (sem confirmar o novo) não é apagado, porque tem dados.
// - Links de confirmação de e-mail e de nova senha vencidos há mais de um dia.
// As tentativas de login erradas já são apagadas depois de 24 horas (security/login-protection.js).
import { prisma } from '../../prisma/prisma.js'

export const UNVERIFIED_ACCOUNT_DAYS = 30
const DAY = 24 * 60 * 60 * 1000
const EVERY_HOURS = 12

export async function runRetentionCleanup(now = new Date()) {
    const accountLimit = new Date(now.getTime() - UNVERIFIED_ACCOUNT_DAYS * DAY)

    const { count: accounts } = await prisma.user.deleteMany({
        where: {
            email_verified_at: null,
            created_at: { lt: accountLimit },
            transactions: { none: {} },
            recurringTransactions: { none: {} },
            budgets: { none: {} },
            payIntegration: { is: null },
        },
    })

    // Um dia de folga depois do vencimento, para o link antigo ainda mostrar "link vencido" nesse meio-tempo
    const expired = { expires_at: { lt: new Date(now.getTime() - DAY) } }
    const [{ count: verificationLinks }, { count: passwordLinks }] = await Promise.all([
        prisma.emailVerificationToken.deleteMany({ where: expired }),
        prisma.passwordResetToken.deleteMany({ where: expired }),
    ])

    return { accounts, verificationLinks, passwordLinks }
}

// Roda um minuto depois de a API subir e depois a cada 12 horas.
export function startRetentionSchedule() {
    const run = async () => {
        try {
            const result = await runRetentionCleanup()
            if (result.accounts || result.verificationLinks || result.passwordLinks) {
                console.log(
                    `[retenção] cadastros não confirmados apagados: ${result.accounts}; links vencidos apagados: ${result.verificationLinks + result.passwordLinks}`,
                )
            }
        } catch (error) {
            console.error('[retenção] falhou', error)
        }
    }
    setTimeout(run, 60 * 1000).unref()
    setInterval(run, EVERY_HOURS * 60 * 60 * 1000).unref()
}
