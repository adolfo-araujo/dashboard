// Respostas enxutas: a API devolve só o que o app usa. Campos internos (hash da senha,
// controle de sessões, id do dono, identificadores de integração) nunca saem do servidor.
const pick = (object, keys) =>
    Object.fromEntries(keys.filter((key) => key in object).map((key) => [key, object[key]]))

const USER_FIELDS = [
    'id',
    'first_name',
    'last_name',
    'email',
    'email_verified_at',
    'created_at',
    'terms_accepted_at',
    'terms_version',
]

const TRANSACTION_FIELDS = ['id', 'name', 'date', 'amount', 'type', 'category', 'recurring_id', 'created_at']

// O Valtrea Pay já conhece o external_id (foi ele que mandou)
const PAY_TRANSACTION_FIELDS = ['id', 'external_id', 'name', 'date', 'amount', 'type', 'category']

const isRecord = (value) => value && typeof value === 'object' && !Array.isArray(value)

export const publicUser = (user) => {
    if (!isRecord(user)) return user
    const result = pick(user, USER_FIELDS)
    if (user.tokens) result.tokens = user.tokens
    return result
}

const mapRecords = (fields) => (body) => {
    if (Array.isArray(body)) return body.map((item) => (isRecord(item) ? pick(item, fields) : item))
    // respostas de erro ({ message }) passam como estão
    if (isRecord(body) && 'id' in body) return pick(body, fields)
    return body
}

export const publicTransactions = mapRecords(TRANSACTION_FIELDS)
export const publicPayTransaction = mapRecords(PAY_TRANSACTION_FIELDS)

// Remove o dono do registro (o app já sabe quem está logado)
export const withoutOwner = (record) => {
    if (!isRecord(record)) return record
    // eslint-disable-next-line no-unused-vars
    const { user_id, ...rest } = record
    return rest
}
