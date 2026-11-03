import { PrismaClient } from '@prisma/client'

// Conexões abertas com o banco por cópia da API.
// Sem isso o Prisma escolhe um número pelo total de CPUs da máquina, o que no Render
// fica pequeno demais: com o banco longe (cerca de 120 ms por consulta), as
// requisições fazem fila esperando conexão e passam de 10 segundos com 100 pessoas.
// O teste de carga (loadtest/) usa o mesmo valor. Se a DATABASE_URL já trouxer
// connection_limit, ele é respeitado.
const POOL_SIZE = process.env.DB_POOL_SIZE || '20'
const POOL_TIMEOUT = process.env.DB_POOL_TIMEOUT || '20'

const withPool = (url) => {
    if (!url || url.includes('connection_limit=')) return url
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}connection_limit=${POOL_SIZE}&pool_timeout=${POOL_TIMEOUT}`
}

export const prisma = new PrismaClient({
    datasourceUrl: withPool(process.env.DATABASE_URL),
})
