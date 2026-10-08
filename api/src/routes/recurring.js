import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../prisma/prisma.js'
import { auth } from '../middlewares/auth.js'
import { ALL_CATEGORIES, CATEGORIES } from '../constants/categories.js'

export const recurringRouter = Router()

const DATE = /^\d{4}-\d{2}-\d{2}$/

// ---------- datas (sempre em UTC, sem horário) ----------
const toDate = (str) => new Date(`${str}T00:00:00Z`)
const toStr = (date) => date.toISOString().slice(0, 10)
const daysInMonth = (year, month) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
const occurrence = (year, month, day) =>
    new Date(Date.UTC(year, month, Math.min(day, daysInMonth(year, month))))

// Próximas ocorrências de uma recorrente a partir de onde parou
function* pendingOccurrences(rule) {
    const start = rule.start_date
    let year = start.getUTCFullYear()
    let month = start.getUTCMonth()

    if (rule.generated_until) {
        year = rule.generated_until.getUTCFullYear()
        month = rule.generated_until.getUTCMonth() + 1
    }

    for (let i = 0; i < 240; i++) {
        const date = occurrence(year, month, rule.day_of_month)
        month += 1
        if (date < start) continue
        if (rule.end_date && date > rule.end_date) return
        yield date
    }
}

const nextDate = (rule) => {
    if (!rule.active) return null
    const { value } = pendingOccurrences(rule).next()
    return value ? toStr(value) : null
}

const serialize = (rule) => ({
    ...rule,
    start_date: toStr(rule.start_date),
    end_date: rule.end_date ? toStr(rule.end_date) : null,
    generated_until: rule.generated_until ? toStr(rule.generated_until) : null,
    next_date: nextDate(rule),
})

// ---------- validação ----------
const baseSchema = z.object({
    name: z.string().trim().min(1, 'Informe um nome.').max(50),
    amount: z.number().min(1, 'O valor mínimo é R$ 1,00.').max(99999999.99),
    type: z.enum(['EARNING', 'EXPENSE', 'INVESTMENT']),
    category: z.enum(ALL_CATEGORIES, {
        errorMap: () => ({ message: 'Categoria inválida.' }),
    }),
    day_of_month: z.number().int().min(1).max(31),
    start_date: z.string().regex(DATE, 'Data de início inválida.'),
    end_date: z.string().regex(DATE, 'Data de término inválida.').nullable().optional(),
    active: z.boolean().optional(),
})

const validCombination = (data) =>
    !data.type || !data.category || CATEGORIES[data.type].includes(data.category)
const validRange = (data) =>
    !data.start_date || !data.end_date || data.end_date >= data.start_date

const createSchema = baseSchema
    .refine(validCombination, { message: 'Categoria não corresponde ao tipo.', path: ['category'] })
    .refine(validRange, { message: 'A data de término deve ser depois do início.', path: ['end_date'] })

const updateSchema = baseSchema
    .partial()
    .refine(validCombination, { message: 'Categoria não corresponde ao tipo.', path: ['category'] })
    .refine(validRange, { message: 'A data de término deve ser depois do início.', path: ['end_date'] })

const badRequest = (response, error) =>
    response.status(400).send({ message: error.errors[0].message })

const findOwn = (id, userId) =>
    prisma.recurringTransaction.findFirst({ where: { id, user_id: userId } })

// ---------- rotas ----------
recurringRouter.get('/', auth, async (request, response) => {
    try {
        const rules = await prisma.recurringTransaction.findMany({
            where: { user_id: request.userId },
            orderBy: [{ active: 'desc' }, { day_of_month: 'asc' }, { name: 'asc' }],
        })
        return response.status(200).send(rules.map(serialize))
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

recurringRouter.post('/', auth, async (request, response) => {
    const parsed = createSchema.safeParse(request.body)
    if (!parsed.success) return badRequest(response, parsed.error)

    try {
        const { start_date, end_date, ...data } = parsed.data
        const rule = await prisma.recurringTransaction.create({
            data: {
                ...data,
                user_id: request.userId,
                start_date: toDate(start_date),
                end_date: end_date ? toDate(end_date) : null,
            },
        })
        return response.status(201).send(serialize(rule))
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

recurringRouter.patch('/:id', auth, async (request, response) => {
    const parsed = updateSchema.safeParse(request.body)
    if (!parsed.success) return badRequest(response, parsed.error)

    try {
        const current = await findOwn(request.params.id, request.userId)
        if (!current) {
            return response.status(404).send({ message: 'Recorrente não encontrada.' })
        }

        const { start_date, end_date, ...data } = parsed.data
        const merged = {
            type: data.type ?? current.type,
            category: data.category ?? current.category,
        }
        if (!validCombination(merged)) {
            return response.status(400).send({ message: 'Categoria não corresponde ao tipo.' })
        }

        // Ao retomar uma recorrente pausada, não lança os meses em que ela ficou pausada
        let resumeFrom = {}
        if (data.active === true && !current.active) {
            const todayUtc = toDate(new Date().toISOString().slice(0, 10))
            let lastPast = null
            for (const date of pendingOccurrences(current)) {
                if (date >= todayUtc) break
                lastPast = date
            }
            if (lastPast) resumeFrom = { generated_until: lastPast }
        }

        const rule = await prisma.recurringTransaction.update({
            where: { id: current.id },
            data: {
                ...resumeFrom,
                ...data,
                ...(start_date !== undefined && { start_date: toDate(start_date) }),
                ...(end_date !== undefined && { end_date: end_date ? toDate(end_date) : null }),
            },
        })
        return response.status(200).send(serialize(rule))
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

recurringRouter.delete('/:id', auth, async (request, response) => {
    try {
        const current = await findOwn(request.params.id, request.userId)
        if (!current) {
            return response.status(404).send({ message: 'Recorrente não encontrada.' })
        }
        // Os lançamentos já criados continuam (recurring_id vira nulo)
        await prisma.recurringTransaction.delete({ where: { id: current.id } })
        return response.status(200).send(serialize(current))
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

// POST /api/recurring/sync { today: 'YYYY-MM-DD' }
// Cria os lançamentos que já venceram e ainda não foram criados.
recurringRouter.post('/sync', auth, async (request, response) => {
    const today = request.body?.today
    if (typeof today !== 'string' || !DATE.test(today)) {
        return response.status(400).send({ message: 'Data inválida.' })
    }

    try {
        const limit = toDate(today)
        const rules = await prisma.recurringTransaction.findMany({
            where: { user_id: request.userId, active: true, start_date: { lte: limit } },
        })

        let created = 0
        for (const rule of rules) {
            const dates = []
            for (const date of pendingOccurrences(rule)) {
                if (date > limit) break
                dates.push(date)
            }
            if (dates.length === 0) continue

            await prisma.$transaction([
                prisma.transaction.createMany({
                    data: dates.map((date) => ({
                        user_id: rule.user_id,
                        name: rule.name,
                        amount: rule.amount,
                        type: rule.type,
                        category: rule.category,
                        date,
                        recurring_id: rule.id,
                    })),
                    skipDuplicates: true,
                }),
                prisma.recurringTransaction.update({
                    where: { id: rule.id },
                    data: { generated_until: dates[dates.length - 1] },
                }),
            ])
            created += dates.length
        }

        return response.status(200).send({ created })
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})
