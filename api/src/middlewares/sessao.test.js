import { COOKIE_SESSAO, apagarSessao, guardarSessao, lerCookie } from './sessao.js'

const respostaFalsa = () => {
    const chamadas = []
    return {
        chamadas,
        cookie: (...args) => chamadas.push(['cookie', ...args]),
        clearCookie: (...args) => chamadas.push(['clearCookie', ...args]),
    }
}

describe('sessão em cookie', () => {
    it('lê o cookie da sessão entre outros cookies', () => {
        const request = { headers: { cookie: `tema=escuro; ${COOKIE_SESSAO}=abc.def%3D; outro=1` } }
        expect(lerCookie(request)).toBe('abc.def=')
        expect(lerCookie({ headers: {} })).toBeNull()
        expect(lerCookie({ headers: { cookie: 'tema=escuro' } })).toBeNull()
    })

    it('grava o cookie HttpOnly só para as rotas de usuário, por 30 dias', () => {
        const response = respostaFalsa()
        guardarSessao(response, 'token')
        const [, nome, valor, opcoes] = response.chamadas[0]
        expect(nome).toBe(COOKIE_SESSAO)
        expect(valor).toBe('token')
        expect(opcoes).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/api/users', maxAge: 30 * 24 * 60 * 60 * 1000 })
    })

    it('não grava nada sem token e apaga com as mesmas opções', () => {
        const response = respostaFalsa()
        guardarSessao(response, undefined)
        expect(response.chamadas).toHaveLength(0)
        apagarSessao(response)
        const [acao, nome, opcoes] = response.chamadas[0]
        expect([acao, nome]).toEqual(['clearCookie', COOKIE_SESSAO])
        expect(opcoes).toMatchObject({ path: '/api/users', httpOnly: true })
    })
})
