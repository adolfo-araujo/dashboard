import jwt from 'jsonwebtoken'
import { prisma } from '../../prisma/prisma.js'

// Registra o último acesso de cada usuário, no máximo uma vez a cada 15 minutos,
// para não gravar no banco a cada requisição.
const LAST_SEEN_INTERVAL = 15 * 60 * 1000
const lastSeenCache = new Map()

const touchLastSeen = (userId) => {
    const now = Date.now()
    if (now - (lastSeenCache.get(userId) ?? 0) < LAST_SEEN_INTERVAL) return
    lastSeenCache.set(userId, now)
    if (lastSeenCache.size > 10000) lastSeenCache.clear()

    prisma.user
        .update({ where: { id: userId }, data: { last_seen_at: new Date(now) } })
        .catch(() => {})
}

export const auth = (request, response, next) => {
    try {
        // pegar o access token do header
        const accessToken = request.headers?.authorization?.split('Bearer ')[1]
        if (!accessToken) {
            return response.status(401).send({ message: 'Unauthorized' })
        }
        // verificar se o access token é válido
        const decodedToken = jwt.verify(
            accessToken,
            process.env.JWT_ACCESS_TOKEN_SECRET,
        )
        if (!decodedToken) {
            return response.status(401).send({ message: 'Unauthorized' })
        }
        request.userId = decodedToken.userId
        touchLastSeen(decodedToken.userId)
        // se for válido, eu deixo a requisição prosseguir
        next()
    } catch (error) {
        console.error(error)
        return response.status(401).send({ message: 'Unauthorized' })
    }
}
