import { normalizar, palavras } from './texto.js'

const INFORMAIS = new Set(
    'vc vcs tb tbm pq blz mano mana cara kkk kkkk kkkkk haha hahaha rs rsrs conto contos pila pilas ta to ne vlw oq msm tmj slk pô po bora eae eai aff tipo'.split(' '),
)
const EMOJI = /\p{Extended_Pictographic}/u

/** Jeito de escrever da pessoa, para responder no mesmo tom. */
export function lerEstilo(texto) {
    const original = String(texto ?? '')
    const lista = palavras(original)
    const marcas = lista.filter((p) => INFORMAIS.has(p)).length
    const semAcento = original === normalizar(original) && /[a-z]/.test(original) && lista.length >= 3
    const risada = /\b(k{3,}|(ha){2,}|rs(rs)*)\b/i.test(original)
    return {
        informal: marcas > 0 || risada || (semAcento && !/[.!?]$/.test(original.trim())),
        emoji: EMOJI.test(original),
        animado: /!{1,}/.test(original) || risada,
        curta: lista.length <= 4,
    }
}

/** Junta o estilo da mensagem com o que já se sabe da pessoa (média das últimas conversas). */
export function combinarEstilo(atual, anterior) {
    if (!anterior) return atual
    return {
        informal: atual.informal || (anterior.informal && atual.curta),
        emoji: atual.emoji || anterior.emoji,
        animado: atual.animado,
        curta: atual.curta,
    }
}

// Escolhe uma variação sem repetir sempre a mesma frase, mas de forma previsível nos testes.
export function escolher(variantes, semente = 0) {
    const lista = variantes.filter(Boolean)
    return lista[Math.abs(semente) % lista.length]
}

export const semente = (texto) => [...String(texto)].reduce((s, c) => (s * 31 + c.charCodeAt(0)) | 0, 7)
