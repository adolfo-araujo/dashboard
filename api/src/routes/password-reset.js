import { Router } from 'express'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../../prisma/prisma.js'
import { PasswordHasherAdapter } from '../adapters/password-hasher.js'
import { sendEmail } from '../adapters/email-sender.js'

export const passwordResetRouter = Router()

const TOKEN_TTL_MINUTES = 30

// No banco guardamos só o hash do token: se o banco vazar, os links não servem.
const hashToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex')

// Resposta igual exista ou não a conta, para não revelar quais e-mails são cadastrados.
const GENERIC_RESPONSE = {
    message:
        'Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha.',
}

const forgotSchema = z.object({
    email: z.string().trim().email({ message: 'Informe um e-mail válido.' }),
})

const resetSchema = z.object({
    token: z.string().regex(/^[a-f0-9]{64}$/, {
        message: 'Link inválido ou expirado. Peça um novo.',
    }),
    password: z
        .string()
        .min(6, { message: 'A senha precisa ter pelo menos 6 caracteres.' }),
})

const buildEmail = (firstName, link) => ({
    subject: 'Redefinir sua senha do Valtrea',
    text: `Olá, ${firstName}!\n\nRecebemos um pedido para redefinir a senha da sua conta no Valtrea.\nPara criar uma senha nova, acesse o link abaixo (válido por ${TOKEN_TTL_MINUTES} minutos):\n\n${link}\n\nSe não foi você, ignore este e-mail. Sua senha atual continua valendo.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c2026">
  <h2 style="color:#55B02E;margin-bottom:8px">Valtrea</h2>
  <p>Olá, ${firstName}!</p>
  <p>Recebemos um pedido para redefinir a senha da sua conta no Valtrea.</p>
  <p style="margin:28px 0">
    <a href="${link}" style="background:#55B02E;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Criar nova senha</a>
  </p>
  <p style="font-size:13px;color:#5f6670">O link vale por ${TOKEN_TTL_MINUTES} minutos. Se não foi você, ignore este e-mail: sua senha atual continua valendo.</p>
</div>`,
})

passwordResetRouter.post('/forgot-password', async (request, response) => {
    const parsed = forgotSchema.safeParse(request.body)
    if (!parsed.success) {
        return response
            .status(400)
            .send({ message: parsed.error.errors[0].message })
    }

    try {
        const user = await prisma.user.findFirst({
            where: {
                email: { equals: parsed.data.email, mode: 'insensitive' },
            },
        })

        if (!user) {
            return response.status(200).send(GENERIC_RESPONSE)
        }

        // Evita abuso: no máximo um pedido por minuto para a mesma conta.
        const recent = await prisma.passwordResetToken.findFirst({
            where: {
                user_id: user.id,
                created_at: { gt: new Date(Date.now() - 60 * 1000) },
            },
        })
        if (recent) {
            return response.status(200).send(GENERIC_RESPONSE)
        }

        const token = crypto.randomBytes(32).toString('hex')

        await prisma.passwordResetToken.create({
            data: {
                user_id: user.id,
                token_hash: hashToken(token),
                expires_at: new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000),
            },
        })

        const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(
            /\/$/,
            '',
        )
        const link = `${appUrl}/reset-password?token=${token}`

        await sendEmail({ to: user.email, ...buildEmail(user.first_name, link) })

        return response.status(200).send(GENERIC_RESPONSE)
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

passwordResetRouter.post('/reset-password', async (request, response) => {
    const parsed = resetSchema.safeParse(request.body)
    if (!parsed.success) {
        return response
            .status(400)
            .send({ message: parsed.error.errors[0].message })
    }

    try {
        const { token, password } = parsed.data

        const record = await prisma.passwordResetToken.findUnique({
            where: { token_hash: hashToken(token) },
        })

        if (!record || record.used_at || record.expires_at < new Date()) {
            return response
                .status(400)
                .send({ message: 'Link inválido ou expirado. Peça um novo.' })
        }

        const hashedPassword = await new PasswordHasherAdapter().execute(password)

        // Troca a senha e invalida todos os links pendentes dessa conta.
        await prisma.$transaction([
            prisma.user.update({
                where: { id: record.user_id },
                data: { password: hashedPassword },
            }),
            prisma.passwordResetToken.updateMany({
                where: { user_id: record.user_id, used_at: null },
                data: { used_at: new Date() },
            }),
        ])

        return response.status(200).send({ message: 'Senha redefinida.' })
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})
