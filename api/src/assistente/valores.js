import { normalizar } from './texto.js'

const UNIDADES = {
    zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9,
    dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17,
    dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70,
    oitenta: 80, noventa: 90, cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300,
    quatrocentos: 400, quinhentos: 500, seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900,
}

const MOEDA = /^(reais|real|conto|contos|pila|pilas|paus|pau|mangos|dinheiros)$/

// "1.200,50" → 1200.5 · "40,5" → 40.5 · "40.50" → 40.5 · "1.200" → 1200
function lerNumero(texto) {
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(texto)) return Number(texto.replace(/\./g, '').replace(',', '.'))
    if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(texto)) return Number(texto.replace(/,/g, ''))
    return Number(texto.replace(',', '.'))
}

const arredondar = (valor) => Math.round(valor * 100) / 100

// Número escrito em algarismos, com R$, "mil", "k" ou "reais" em volta.
function porAlgarismos(frase) {
    const padrao = /(r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(\s*(?:mil\b|k\b))?(\s*(?:reais|real|conto|contos|pila|pilas|paus|pau)\b)?/g
    const achados = []
    for (const m of frase.matchAll(padrao)) {
        const antes = frase.slice(Math.max(0, m.index - 4), m.index)
        const depois = frase.slice(m.index + m[0].length, m.index + m[0].length + 1)
        if (/dia\s$/.test(antes) || depois === '/' || /\/$/.test(antes) || /^\d+h/.test(frase.slice(m.index))) continue
        if (/^\d+\s*(x|vezes|parcelas?)\b/.test(frase.slice(m.index))) continue
        let valor = lerNumero(m[2])
        if (m[3]) valor *= 1000
        const certeza = m[1] || m[3] || m[4] ? 2 : 1
        if (valor > 0) achados.push({ valor: arredondar(valor), trecho: m[0].trim(), certeza })
    }
    achados.sort((a, b) => b.certeza - a.certeza)
    return achados[0] ?? null
}

// Número por extenso: "quarenta e cinco reais", "mil e duzentos", "cento e vinte".
function porExtenso(frase) {
    const tokens = frase.split(' ')
    for (let i = 0; i < tokens.length; i++) {
        if (!(tokens[i] in UNIDADES) && tokens[i] !== 'mil') continue
        if ((tokens[i] === 'um' || tokens[i] === 'uma') && !/^(mil|real|reais|conto)$/.test(tokens[i + 1] ?? '')) continue
        let total = 0
        let grupo = 0
        let j = i
        const usados = []
        while (j < tokens.length) {
            const t = tokens[j]
            if (t in UNIDADES) {
                grupo += UNIDADES[t]
            } else if (t === 'mil') {
                total += (grupo || 1) * 1000
                grupo = 0
            } else if (t === 'e' && j + 1 < tokens.length && (tokens[j + 1] in UNIDADES)) {
                // segue
            } else {
                break
            }
            usados.push(t)
            j++
        }
        const valor = total + grupo
        const moeda = MOEDA.test(tokens[j] ?? '')
        if (valor > 0 && (moeda || valor >= 10 || usados.includes('mil'))) {
            const trecho = [...usados, ...(moeda ? [tokens[j]] : [])].join(' ')
            return { valor, trecho, certeza: moeda ? 2 : 1 }
        }
    }
    return null
}

/** Valor em reais citado na mensagem, ou null. Retorna { valor, trecho }. */
export function extrairValor(texto) {
    const frase = normalizar(texto)
    const achado = porAlgarismos(frase) ?? porExtenso(frase)
    return achado ? { valor: achado.valor, trecho: achado.trecho } : null
}
