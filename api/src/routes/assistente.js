import { Router } from 'express'
import { z } from 'zod'
import { auth } from '../middlewares/auth.js'
import { criarAssistente } from '../assistente/assistente.js'
import { repositorioDoAssistente } from '../assistente/repositorio.js'
import { prisma } from '../../prisma/prisma.js'

export const assistenteRouter = Router()
const assistente = criarAssistente(repositorioDoAssistente)

const mensagemSchema = z.object({
    texto: z.string().trim().min(1, 'Escreva uma mensagem.').max(300, 'Mensagem muito longa (máximo de 300 caracteres).'),
})

// POST /api/assistente/mensagens { texto } → { respostas: string[], opcoes: string[] }
// O texto não é guardado: só o lançamento que ele gerar e o que a pessoa ensinar ("zezinho" é Lazer).
assistenteRouter.post('/mensagens', auth, async (request, response) => {
    const parsed = mensagemSchema.safeParse(request.body)
    if (!parsed.success) {
        return response.status(400).send({ message: parsed.error.issues[0].message })
    }
    try {
        const resultado = await assistente.processar({ userId: request.userId, texto: parsed.data.texto })
        return response.status(200).send(resultado)
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

// GET /api/assistente/memoria: o que o assistente aprendeu com a pessoa (transparência)
assistenteRouter.get('/memoria', auth, async (request, response) => {
    try {
        const termos = await prisma.assistenteMemoria.findMany({
            where: { user_id: request.userId },
            orderBy: { updated_at: 'desc' },
            select: { tipo: true, termo: true, categoria: true, usos: true, updated_at: true },
        })
        return response.status(200).send(termos)
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

// DELETE /api/assistente/memoria: esquece tudo o que aprendeu (os lançamentos continuam)
assistenteRouter.delete('/memoria', auth, async (request, response) => {
    try {
        await repositorioDoAssistente.esquecerTudo(request.userId)
        return response.status(204).send()
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})
