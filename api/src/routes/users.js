import { Router } from 'express'
import {
    makeCreateUserController,
    makeDeleteUserController,
    makeGetUserBalanceController,
    makeGetUserByIdController,
    makeLoginUserController,
    makeRefreshTokenController,
    makeUpdateUserController,
} from '../factories/controllers/user.js'
import { auth } from '../middlewares/auth.js'
import bcrypt from 'bcrypt'
import { sendEmail } from '../adapters/email-sender.js'
import { prisma } from '../../prisma/prisma.js'
import { sendVerificationEmail } from './email-verification.js'

export const usersRouter = Router()

// nunca devolver o hash da senha para o cliente
const sanitize = (body) => {
    if (body && typeof body === 'object' && 'password' in body) {
        // eslint-disable-next-line no-unused-vars
        const { password, ...rest } = body
        return rest
    }
    return body
}

usersRouter.get('/me', auth, async (request, response) => {
    const getUserByIdController = makeGetUserByIdController()

    const { statusCode, body } = await getUserByIdController.execute({
        ...request,
        params: {
            userId: request.userId,
        },
    })

    response.status(statusCode).send(sanitize(body))
})

usersRouter.get('/me/balance', auth, async (request, response) => {
    const getUserBalanceController = makeGetUserBalanceController()

    const { statusCode, body } = await getUserBalanceController.execute({
        ...request,
        params: {
            userId: request.userId,
        },
        query: {
            from: request.query.from,
            to: request.query.to,
        },
    })

    response.status(statusCode).send(sanitize(body))
})

usersRouter.post('/', async (request, response) => {
    const createUserController = makeCreateUserController()

    const { statusCode, body } = await createUserController.execute(request)

    // Conta criada: envia o e-mail de confirmação.
    // Se o envio falhar, a conta continua criada e a pessoa pode pedir outro e-mail.
    if (statusCode === 201) {
        try {
            await sendVerificationEmail(body)
        } catch (error) {
            console.error(error)
        }
    }

    response.status(statusCode).send(sanitize(body))
})

usersRouter.patch('/me', auth, async (request, response) => {
    const updateUserController = makeUpdateUserController()

    const previous = await prisma.user.findUnique({
        where: { id: request.userId },
    })

    const { statusCode, body } = await updateUserController.execute({
        ...request,
        params: {
            userId: request.userId,
        },
    })

    // Trocou o e-mail: o novo endereço precisa ser confirmado.
    const emailChanged =
        statusCode === 200 &&
        previous &&
        body?.email &&
        body.email.toLowerCase() !== previous.email.toLowerCase()

    if (emailChanged) {
        await prisma.user.update({
            where: { id: request.userId },
            data: { email_verified_at: null },
        })
        body.email_verified_at = null
        try {
            await sendVerificationEmail(body)
        } catch (error) {
            console.error(error)
        }
    }

    response.status(statusCode).send(sanitize(body))
})

usersRouter.delete('/me', auth, async (request, response) => {
    try {
        const password = request.body?.password
        if (typeof password !== 'string' || password.length === 0) {
            return response
                .status(400)
                .send({ message: 'Informe sua senha para excluir a conta.' })
        }

        const user = await prisma.user.findUnique({
            where: { id: request.userId },
        })
        if (!user) {
            return response.status(404).send({ message: 'User not found.' })
        }

        // 403 (e não 401) para o site não confundir com sessão expirada
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return response.status(403).send({ message: 'Senha incorreta.' })
        }

        // Apaga o usuário de verdade. Pelas regras do banco (onDelete: Cascade),
        // as transações e os links de senha/confirmação são apagados junto.
        const deleteUserController = makeDeleteUserController()
        const { statusCode, body } = await deleteUserController.execute({
            ...request,
            params: {
                userId: request.userId,
            },
        })

        if (statusCode === 200) {
            try {
                await sendEmail({
                    to: user.email,
                    subject: 'Sua conta no Valtrea foi excluída',
                    text: `Olá, ${user.first_name}.\n\nConfirmamos a exclusão da sua conta no Valtrea. Seus dados e todas as suas transações foram apagados de forma permanente.\n\nSe quiser voltar a usar o Valtrea, é só criar uma nova conta.`,
                    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c2026">
  <h2 style="color:#55B02E;margin-bottom:8px">Valtrea</h2>
  <p>Olá, ${user.first_name}.</p>
  <p>Confirmamos a exclusão da sua conta no Valtrea. Seus dados e todas as suas transações foram <strong>apagados de forma permanente</strong>.</p>
  <p style="font-size:13px;color:#5f6670">Se quiser voltar a usar o Valtrea, é só criar uma nova conta.</p>
</div>`,
                })
            } catch (error) {
                console.error(error)
            }
        }

        response.status(statusCode).send(sanitize(body))
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

usersRouter.post('/login', async (request, response) => {
    const loginUserController = makeLoginUserController()

    const { statusCode, body } = await loginUserController.execute(request)

    response.status(statusCode).send(sanitize(body))
})

usersRouter.post('/refresh-token', async (request, response) => {
    const refreshTokenController = makeRefreshTokenController()

    const { statusCode, body } = await refreshTokenController.execute(request)

    response.status(statusCode).send(sanitize(body))
})
