// Proteção contra robôs nos formulários públicos (cadastro e "esqueci a senha").
// O app tem um campo "website" invisível para pessoas (fora da tela e sem foco pelo teclado).
// Robôs que preenchem todos os campos caem nele. Junto com os limites por IP e a
// confirmação de e-mail, isso barra a maior parte dos cadastros automáticos sem captcha
// e sem enviar dados para terceiros.
export const HONEYPOT_FIELD = 'website'

export function isBot(request) {
    const value = request.body?.[HONEYPOT_FIELD]
    if (typeof value === 'string' && value.trim() !== '') {
        console.warn(`[robô] campo invisível preenchido em ${request.method} ${request.originalUrl}`)
        return true
    }
    return false
}
