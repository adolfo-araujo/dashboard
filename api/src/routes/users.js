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
import {
    checkLoginBlock,
    clearLoginFailures,
    clientIp,
    normalizeEmail,
    registerLoginFailure,
} from '../security/login-protection.js'
import { prisma } from '../../prisma/prisma.js'
import jwt from 'jsonwebtoken'
import { TokensGeneratorAdapter } from '../adapters/tokens-generator.js'
import { sendVerificationEmail } from './email-verification.js'
import { publicUser } from '../security/serializers.js'
import { isBot } from '../security/bot-protection.js'

export const usersRouter = Router()

// Versão vigente dos Termos de uso e da Política de privacidade.
// Ao publicar uma nova versão dos textos, atualize aqui e em web/src/lib/legal.js.
const TERMS_VERSION = '2026-11-04'

// Dados de usuário saem só com os campos que o app usa (nunca o hash da senha
// nem o controle de sessões). Outras respostas, como o saldo, passam como estão.
const sanitize = (body) =>
    body && typeof body === 'object' && 'password' in body ? publicUser(body) : body

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
            today: request.query.today,
        },
    })

    response.status(statusCode).send(sanitize(body))
})

// Portabilidade e acesso (LGPD art. 18, II e V): todos os dados da conta em um arquivo JSON.
// Nunca inclui o hash da senha nem os códigos de links e da conexão com o Valtrea Pay.
usersRouter.get('/me/export', auth, async (request, response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: request.userId },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                email_verified_at: true,
                created_at: true,
                last_seen_at: true,
                terms_accepted_at: true,
                terms_version: true,
                transactions: {
                    orderBy: { date: 'asc' },
                    select: { id: true, name: true, date: true, amount: true, type: true, category: true, created_at: true, recurring_id: true },
                },
                recurringTransactions: true,
                budgets: true,
                assistenteMemorias: { select: { tipo: true, termo: true, categoria: true, usos: true, created_at: true, updated_at: true } },
                payIntegration: { select: { created_at: true, last_used_at: true, balance: true, balance_at: true } },
            },
        })
        if (!user) {
            return response.status(404).send({ message: 'User not found.' })
        }

        const { transactions, recurringTransactions, budgets, assistenteMemorias, payIntegration, ...account } = user
        const today = new Date().toISOString().slice(0, 10)
        response.setHeader('Content-Disposition', `attachment; filename="valtrea-meus-dados-${today}.json"`)
        response.status(200).send({
            exported_at: new Date().toISOString(),
            service: 'Valtrea Finance (https://finance.valtrea.com.br)',
            account,
            transactions,
            recurring_transactions: recurringTransactions,
            budgets,
            assistant_memory: assistenteMemorias,
            pay_integration: payIntegration
                ? { connected: true, connected_at: payIntegration.created_at, ...payIntegration, created_at: undefined }
                : { connected: false },
        })
    } catch (error) {
        console.error(error)
        response.status(500).send({ message: 'Internal server error' })
    }
})

// Aceite de uma nova versão dos Termos de uso e da Política de privacidade (prova de consentimento)
usersRouter.post('/me/terms', auth, async (request, response) => {
    if (request.body?.version !== TERMS_VERSION) {
        return response.status(400).send({ message: 'Versão dos termos desatualizada. Recarregue a página.' })
    }
    try {
        const acceptance = await prisma.user.update({
            where: { id: request.userId },
            data: { terms_accepted_at: new Date(), terms_version: TERMS_VERSION },
            select: { terms_accepted_at: true, terms_version: true },
        })
        response.status(200).send(acceptance)
    } catch (error) {
        console.error(error)
        response.status(500).send({ message: 'Internal server error' })
    }
})

usersRouter.post('/', async (request, response) => {
    if (isBot(request)) {
        return response.status(400).send({ message: 'Não foi possível concluir o cadastro.' })
    }
    const createUserController = makeCreateUserController()

    const { statusCode, body } = await createUserController.execute(request)

    // Conta criada: envia o e-mail de confirmação.
    // Se o envio falhar, a conta continua criada e a pessoa pode pedir outro e-mail.
    if (statusCode === 201) {
        // Registra quando e qual versão dos termos a pessoa aceitou (prova de consentimento)
        try {
            const acceptance = {
                terms_accepted_at: new Date(),
                terms_version: TERMS_VERSION,
            }
            await prisma.user.update({
                where: { id: body.id },
                data: acceptance,
            })
            Object.assign(body, acceptance)
        } catch (error) {
            console.error(error)
        }

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

    // Trocou a senha: as sessões em outros aparelhos deixam de ser renovadas
    // e este aparelho recebe tokens novos para continuar conectado.
    if (statusCode === 200 && typeof request.body?.password === 'string') {
        await prisma.user.update({
            where: { id: request.userId },
            data: { sessions_valid_after: new Date() },
        })
        body.tokens = new TokensGeneratorAdapter().execute(request.userId)
    }

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

        // Mesmo bloqueio do login: impede adivinhar a senha por aqui
        const email = normalizeEmail(user.email)
        const ip = clientIp(request)
        const blockedFor = await checkLoginBlock(email, ip)
        if (blockedFor) {
            return response.status(429).send({
                message: `Muitas tentativas com senha errada. Tente novamente em ${blockedFor} ${blockedFor === 1 ? 'minuto' : 'minutos'}.`,
            })
        }

        // 403 (e não 401) para o site não confundir com sessão expirada
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            await registerLoginFailure(email, ip)
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
                    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111827">
  <h2 style="color:#3D8121;margin-bottom:8px">Valtrea</h2>
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
    const email = normalizeEmail(request.body?.email)
    const ip = clientIp(request)

    // Proteção contra tentativas de senha. Se a verificação falhar por algum
    // motivo, o login continua funcionando (o erro só vai para o log).
    try {
        const minutes = await checkLoginBlock(email, ip)
        if (minutes) {
            return response.status(429).send({
                message: `Muitas tentativas com senha errada. Tente novamente em ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} ou use "Esqueci a senha".`,
            })
        }
    } catch (error) {
        console.error(error)
    }

    const loginUserController = makeLoginUserController()
    const { statusCode, body } = await loginUserController.execute(request)

    try {
        if (statusCode === 401 || statusCode === 404) {
            await registerLoginFailure(email, ip)
        } else if (statusCode === 200) {
            await clearLoginFailures(email)
        }
    } catch (error) {
        console.error(error)
    }

    // E-mail não cadastrado responde igual a senha errada (401), para não revelar
    // quais e-mails têm conta no Valtrea.
    if (statusCode === 404) {
        return response.status(401).send({ message: 'Unauthorized' })
    }

    response.status(statusCode).send(sanitize(body))
})

usersRouter.post('/refresh-token', async (request, response) => {
    // A sessão só é renovada se a conta ainda existe e a senha não foi trocada
    // depois que este token foi emitido.
    try {
        const decoded = jwt.verify(
            String(request.body?.refreshToken ?? ''),
            process.env.JWT_REFRESH_TOKEN_SECRET,
            { algorithms: ['HS256'] },
        )
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { sessions_valid_after: true },
        })
        const validAfter = user?.sessions_valid_after
        if (!user || (validAfter && decoded.iat < Math.floor(validAfter.getTime() / 1000))) {
            return response.status(401).send({ message: 'Unauthorized' })
        }
    } catch {
        // token inválido ou vencido: o controller abaixo responde 401
    }

    const refreshTokenController = makeRefreshTokenController()

    const { statusCode, body } = await refreshTokenController.execute(request)

    response.status(statusCode).send(sanitize(body))
})
