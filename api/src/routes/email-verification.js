import { Router } from 'express'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../../prisma/prisma.js'
import { sendEmail } from '../adapters/email-sender.js'
import { auth } from '../middlewares/auth.js'

export const emailVerificationRouter = Router()

const TOKEN_TTL_HOURS = 24

const hashToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex')

const appUrl = () =>
    (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')

// Gera um link novo (invalidando os anteriores) e envia o e-mail de confirmação.
export async function sendVerificationEmail(user) {
    const token = crypto.randomBytes(32).toString('hex')

    await prisma.$transaction([
        prisma.emailVerificationToken.deleteMany({
            where: { user_id: user.id, used_at: null },
        }),
        prisma.emailVerificationToken.create({
            data: {
                user_id: user.id,
                token_hash: hashToken(token),
                expires_at: new Date(
                    Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000,
                ),
            },
        }),
    ])

    const link = `${appUrl()}/verify-email?token=${token}`

    await sendEmail({
        to: user.email,
        subject: 'Confirme seu e-mail no Valtrea',
        text: `Olá, ${user.first_name}!\n\nFalta pouco para começar a usar o Valtrea. Confirme seu e-mail acessando o link abaixo (válido por ${TOKEN_TTL_HOURS} horas):\n\n${link}\n\nSe você não criou uma conta no Valtrea, ignore este e-mail.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c2026">
  <h2 style="color:#55B02E;margin-bottom:8px">Valtrea</h2>
  <p>Olá, ${user.first_name}!</p>
  <p>Falta pouco para começar a usar o Valtrea. Confirme seu e-mail clicando no botão abaixo.</p>
  <p style="margin:28px 0">
    <a href="${link}" style="background:#55B02E;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Confirmar e-mail</a>
  </p>
  <p style="font-size:13px;color:#5f6670">O link vale por ${TOKEN_TTL_HOURS} horas. Se você não criou uma conta no Valtrea, ignore este e-mail.</p>
</div>`,
    })
}

const verifySchema = z.object({
    token: z.string().regex(/^[a-f0-9]{64}$/, {
        message: 'Link inválido ou expirado. Peça um novo.',
    }),
})

emailVerificationRouter.post('/verify-email', async (request, response) => {
    const parsed = verifySchema.safeParse(request.body)
    if (!parsed.success) {
        return response
            .status(400)
            .send({ message: parsed.error.errors[0].message })
    }

    try {
        const record = await prisma.emailVerificationToken.findUnique({
            where: { token_hash: hashToken(parsed.data.token) },
        })

        if (!record) {
            return response
                .status(400)
                .send({ message: 'Link inválido ou expirado. Peça um novo.' })
        }

        // Link já usado (ex.: clicado duas vezes): o e-mail já está confirmado.
        if (record.used_at) {
            return response.status(200).send({ message: 'E-mail confirmado.' })
        }

        if (record.expires_at < new Date()) {
            return response
                .status(400)
                .send({ message: 'Link inválido ou expirado. Peça um novo.' })
        }

        const now = new Date()
        await prisma.$transaction([
            prisma.user.update({
                where: { id: record.user_id },
                data: { email_verified_at: now },
            }),
            prisma.emailVerificationToken.update({
                where: { id: record.id },
                data: { used_at: now },
            }),
            prisma.emailVerificationToken.deleteMany({
                where: { user_id: record.user_id, used_at: null },
            }),
        ])

        return response.status(200).send({ message: 'E-mail confirmado.' })
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

emailVerificationRouter.post(
    '/me/resend-verification',
    auth,
    async (request, response) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: request.userId },
            })

            if (!user) {
                return response
                    .status(404)
                    .send({ message: 'User not found.' })
            }

            if (user.email_verified_at) {
                return response
                    .status(400)
                    .send({ message: 'Seu e-mail já está confirmado.' })
            }

            // No máximo um envio por minuto.
            const recent = await prisma.emailVerificationToken.findFirst({
                where: {
                    user_id: user.id,
                    created_at: { gt: new Date(Date.now() - 60 * 1000) },
                },
            })
            if (recent) {
                return response.status(429).send({
                    message:
                        'Aguarde um minuto antes de pedir outro e-mail.',
                })
            }

            await sendVerificationEmail(user)
            return response
                .status(200)
                .send({ message: 'E-mail de confirmação enviado.' })
        } catch (error) {
            console.error(error)
            return response
                .status(500)
                .send({ message: 'Internal server error' })
        }
    },
)
