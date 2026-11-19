import { randomUUID } from 'node:crypto'
import { prisma } from '../../prisma/prisma.js'
import { PENDENCIA_MINUTOS } from './assistente.js'

// Lançamentos feitos pelo assistente levam esta marca no external_id: só eles podem ser desfeitos pelo chat.
export const MARCA = 'assistente:'
const DIAS_PARA_DESFAZER = 7
const HISTORICO = 300

const paraDia = (iso) => new Date(`${iso}T00:00:00.000Z`)
const paraIso = (data) => new Date(data).toISOString().slice(0, 10)
const simples = (t) =>
    t && { id: t.id, name: t.name, amount: Number(t.amount), type: t.type, category: t.category, date: paraIso(t.date) }
const vazio = (dados) => !dados || !Object.keys(dados).length

export const repositorioDoAssistente = {
    async carregarMemoria(userId) {
        const [termos, historico, pendencia] = await Promise.all([
            prisma.assistenteMemoria.findMany({ where: { user_id: userId }, select: { tipo: true, termo: true, categoria: true } }),
            prisma.transaction.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' },
                take: HISTORICO,
                select: { name: true, category: true, type: true },
            }),
            prisma.assistentePendencia.findUnique({ where: { user_id: userId }, select: { estilo: true } }),
        ])
        return {
            termos: new Map(termos.map((m) => [`${m.tipo}:${m.termo}`, m.categoria])),
            historico,
            estilo: pendencia?.estilo ?? null,
        }
    },

    async lerPendencia(userId, agora = new Date()) {
        const p = await prisma.assistentePendencia.findUnique({ where: { user_id: userId } })
        if (!p || p.expira_em < agora || vazio(p.dados)) return null
        return p.dados
    },

    async salvarPendencia(userId, dados) {
        const expira = new Date(Date.now() + (dados ? PENDENCIA_MINUTOS * 60 * 1000 : 0))
        await prisma.assistentePendencia.upsert({
            where: { user_id: userId },
            create: { user_id: userId, dados: dados ?? {}, expira_em: expira },
            update: { dados: dados ?? {}, expira_em: expira },
        })
    },

    async salvarEstilo(userId, estilo) {
        const guardado = { informal: Boolean(estilo.informal), emoji: Boolean(estilo.emoji) }
        await prisma.assistentePendencia.upsert({
            where: { user_id: userId },
            create: { user_id: userId, dados: {}, estilo: guardado, expira_em: new Date() },
            update: { estilo: guardado },
        })
    },

    async primeiroNome(userId) {
        const u = await prisma.user.findUnique({ where: { id: userId }, select: { first_name: true } })
        return u?.first_name ?? null
    },

    async ensinar(userId, tipo, termo, categoria) {
        await prisma.assistenteMemoria.upsert({
            where: { user_id_tipo_termo: { user_id: userId, tipo, termo } },
            create: { user_id: userId, tipo, termo, categoria },
            update: { categoria, usos: { increment: 1 } },
        })
    },

    async criarLancamento(userId, l) {
        const criado = await prisma.transaction.create({
            data: {
                user_id: userId,
                name: l.name,
                amount: l.amount,
                type: l.type,
                category: l.category,
                date: paraDia(l.date),
                external_id: `${MARCA}${randomUUID()}`,
            },
        })
        return simples(criado)
    },

    async ultimoLancamentoDoAssistente(userId) {
        const t = await prisma.transaction.findFirst({
            where: {
                user_id: userId,
                external_id: { startsWith: MARCA },
                created_at: { gte: new Date(Date.now() - DIAS_PARA_DESFAZER * 24 * 60 * 60 * 1000) },
            },
            orderBy: { created_at: 'desc' },
        })
        return simples(t)
    },

    async lancamentosDoAssistente(userId, { desde, limite = 20 } = {}) {
        const limiteDeDias = new Date(Date.now() - DIAS_PARA_DESFAZER * 24 * 60 * 60 * 1000)
        const lista = await prisma.transaction.findMany({
            where: {
                user_id: userId,
                external_id: { startsWith: MARCA },
                created_at: { gte: desde && desde > limiteDeDias ? desde : limiteDeDias },
            },
            orderBy: { created_at: 'desc' },
            take: limite,
        })
        return lista.map(simples)
    },

    async apagarLancamento(userId, id) {
        await prisma.transaction.deleteMany({ where: { id, user_id: userId } })
    },

    async atualizarLancamento(userId, id, campos) {
        const dados = { ...campos }
        if (dados.date) dados.date = paraDia(dados.date)
        const { count } = await prisma.transaction.updateMany({ where: { id, user_id: userId }, data: dados })
        if (!count) return null
        return simples(await prisma.transaction.findUnique({ where: { id } }))
    },

    async totais(userId, inicio, fim) {
        const linhas = await prisma.transaction.groupBy({
            by: ['type'],
            where: { user_id: userId, date: { gte: paraDia(inicio), lte: paraDia(fim) } },
            _sum: { amount: true },
        })
        const t = { EARNING: 0, EXPENSE: 0, INVESTMENT: 0 }
        for (const l of linhas) t[l.type] = Number(l._sum.amount ?? 0)
        return t
    },

    async porCategoria(userId, tipo, inicio, fim) {
        const linhas = await prisma.transaction.groupBy({
            by: ['category'],
            where: { user_id: userId, type: tipo, date: { gte: paraDia(inicio), lte: paraDia(fim) } },
            _sum: { amount: true },
        })
        return linhas
            .map((l) => ({ category: l.category ?? 'outros', total: Number(l._sum.amount ?? 0) }))
            .sort((a, b) => b.total - a.total)
    },

    async ultimos(userId, n) {
        const lista = await prisma.transaction.findMany({
            where: { user_id: userId },
            orderBy: [{ date: 'desc' }, { created_at: 'desc' }],
            take: n,
        })
        return lista.map(simples)
    },

    async orcamentos(userId, inicio, fim) {
        const [budgets, gastos] = await Promise.all([
            prisma.budget.findMany({ where: { user_id: userId } }),
            prisma.transaction.groupBy({
                by: ['category'],
                where: { user_id: userId, type: 'EXPENSE', date: { gte: paraDia(inicio), lte: paraDia(fim) } },
                _sum: { amount: true },
            }),
        ])
        const gasto = new Map(gastos.map((g) => [g.category, Number(g._sum.amount ?? 0)]))
        return budgets.map((b) => ({ category: b.category, amount: Number(b.amount), spent: gasto.get(b.category) ?? 0 }))
    },

    async esquecerTudo(userId) {
        await prisma.$transaction([
            prisma.assistenteMemoria.deleteMany({ where: { user_id: userId } }),
            prisma.assistentePendencia.deleteMany({ where: { user_id: userId } }),
        ])
    },
}
