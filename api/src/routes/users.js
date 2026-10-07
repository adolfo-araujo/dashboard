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
    const deleteUserController = makeDeleteUserController()

    const { statusCode, body } = await deleteUserController.execute({
        ...request,
        params: {
            userId: request.userId,
        },
    })

    response.status(statusCode).send(sanitize(body))
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
