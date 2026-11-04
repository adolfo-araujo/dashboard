import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { publicPayTransaction } from '../security/serializers.js'
import { Router } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../../prisma/prisma.js'
import { auth } from '../middlewares/auth.js'

// Integração com a carteira Valtrea Pay.
//
// 1. No painel, a pessoa gera um código de conexão (POST /api/integrations/pay/token).
// 2. Ela cola o código no app Pay. A partir daí, a API do Pay usa esse código para
//    lançar cada pagamento como transação e manter o saldo da carteira atualizado aqui.
//
// O código só serve para essas duas rotas: não lê nada do Finance. Guardamos só o hash.

const PREFIXO = 'vfp_'

const hashToken = (token) => createHash('sha256').update(token).digest('hex')

// ---------------------------------------------------------------------------
// Rotas usadas pelo painel (login normal do Finance)

export const payIntegrationRouter = Router()

const status = (integration) => ({
    connected: !!integration,
    connected_at: integration?.created_at ?? null,
    last_used_at: integration?.last_used_at ?? null,
    balance: integration?.balance != null ? Number(integration.balance) : null,
    balance_at: integration?.balance_at ?? null,
})

// GET /api/integrations/pay — se está conectado e o último saldo recebido
payIntegrationRouter.get('/', auth, async (request, response) => {
    try {
        const integration = await prisma.payIntegration.findUnique({
            where: { user_id: request.userId },
        })
        return response.status(200).send(status(integration))
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

// POST /api/integrations/pay/token — gera um código novo. O anterior para de funcionar.
// O código aparece só nesta resposta; depois não há como vê-lo de novo.
payIntegrationRouter.post('/token', auth, async (request, response) => {
    try {
        const token = PREFIXO + randomBytes(24).toString('base64url')
        await prisma.payIntegration.upsert({
            where: { user_id: request.userId },
            update: {
                token_hash: hashToken(token),
                created_at: new Date(),
                last_used_at: null,
                balance: null,
                balance_at: null,
            },
            create: { user_id: request.userId, token_hash: hashToken(token) },
        })
        return response.status(201).send({ token })
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

// DELETE /api/integrations/pay — desconecta. As transações já lançadas continuam.
payIntegrationRouter.delete('/', auth, async (request, response) => {
    try {
        await prisma.payIntegration.deleteMany({ where: { user_id: request.userId } })
        return response.status(200).send(status(null))
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

// ---------------------------------------------------------------------------
// Rotas usadas pela API do Valtrea Pay (com o código de conexão no lugar do login)

export const payEventsRouter = Router()

const payAuth = async (request, response, next) => {
    try {
        const token = request.headers?.authorization?.split('Bearer ')[1] ?? ''
        if (!token.startsWith(PREFIXO)) {
            return response.status(401).send({ message: 'Unauthorized' })
        }
        const hash = hashToken(token)
        const integration = await prisma.payIntegration.findUnique({ where: { token_hash: hash } })
        // A busca já é pelo hash; a comparação extra em tempo constante é só defesa adicional.
        if (!integration || !timingSafeEqual(Buffer.from(integration.token_hash), Buffer.from(hash))) {
            return response.status(401).send({ message: 'Unauthorized' })
        }
        request.integration = integration
        request.userId = integration.user_id
        next()
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
}

const touch = (integrationId, data = {}) =>
    prisma.payIntegration.update({
        where: { id: integrationId },
        data: { last_used_at: new Date(), ...data },
    })

const DATE = /^\d{4}-\d{2}-\d{2}$/

const transactionSchema = z.object({
    external_id: z.string().min(1).max(80),
    name: z.string().trim().min(1).transform((v) => v.slice(0, 50)),
    amount: z.number().positive().max(99999999.99),
    type: z.enum(['EARNING', 'EXPENSE']),
    date: z.string().regex(DATE, 'Data inválida.'),
})

// POST /api/integrations/pay/transactions — lança um pagamento enviado ou recebido no Pay.
// Repetir o mesmo external_id devolve a transação já lançada (o Pay pode reenviar se a rede cair).
payEventsRouter.post('/transactions', payAuth, async (request, response) => {
    const parsed = transactionSchema.safeParse(request.body)
    if (!parsed.success) {
        return response.status(400).send({ message: parsed.error.issues[0].message })
    }
    const data = parsed.data
    try {
        const transaction = await prisma.transaction.create({
            data: {
                user_id: request.userId,
                external_id: data.external_id,
                name: data.name,
                amount: data.amount,
                type: data.type,
                date: new Date(`${data.date}T00:00:00.000Z`),
                category: 'outros',
            },
        })
        await touch(request.integration.id)
        return response.status(201).send(publicPayTransaction(transaction))
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const existing = await prisma.transaction.findUnique({
                where: { user_id_external_id: { user_id: request.userId, external_id: data.external_id } },
            })
            return response.status(200).send(publicPayTransaction(existing))
        }
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

const balanceSchema = z.object({
    balance: z.number().min(0),
    at: z.string().datetime({ offset: true }),
})

// PUT /api/integrations/pay/balance — saldo atual da carteira Pay.
// Um saldo mais antigo que o já guardado é ignorado (os envios podem chegar fora de ordem).
payEventsRouter.put('/balance', payAuth, async (request, response) => {
    const parsed = balanceSchema.safeParse(request.body)
    if (!parsed.success) {
        return response.status(400).send({ message: parsed.error.issues[0].message })
    }
    try {
        const at = new Date(parsed.data.at)
        const current = request.integration.balance_at
        if (current && current >= at) {
            await touch(request.integration.id)
            return response.status(200).send({ updated: false })
        }
        await touch(request.integration.id, { balance: parsed.data.balance, balance_at: at })
        return response.status(200).send({ updated: true })
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})
