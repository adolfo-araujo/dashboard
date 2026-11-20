// Sessão do site em cookie protegido: o token de renovação (válido por 30 dias) fica num cookie HttpOnly,
// que o JavaScript da página não consegue ler. Assim, uma falha de script não leva a sessão embora.
// O token de acesso (15 minutos) continua no cabeçalho Authorization.
// Por compatibilidade, a API ainda aceita e devolve o refreshToken no corpo (app, testes e versões antigas do site).

export const COOKIE_SESSAO = 'valtrea_refresh'
const TRINTA_DIAS = 30 * 24 * 60 * 60 * 1000

const opcoes = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // finance.valtrea.com.br e api.valtrea.com.br são o mesmo site
    path: '/api/users',
})

/** Lê um cookie do pedido sem precisar de biblioteca. */
export function lerCookie(request, nome = COOKIE_SESSAO) {
    const cabecalho = request.headers?.cookie
    if (!cabecalho) return null
    for (const parte of cabecalho.split(';')) {
        const [chave, ...resto] = parte.trim().split('=')
        if (chave === nome) {
            try {
                return decodeURIComponent(resto.join('='))
            } catch {
                return null
            }
        }
    }
    return null
}

export function guardarSessao(response, refreshToken) {
    if (typeof refreshToken === 'string' && refreshToken) response.cookie(COOKIE_SESSAO, refreshToken, { ...opcoes(), maxAge: TRINTA_DIAS })
}

export function apagarSessao(response) {
    response.clearCookie(COOKIE_SESSAO, opcoes())
}
