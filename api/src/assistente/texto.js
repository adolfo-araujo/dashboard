// Normalizador de texto do assistente: tudo roda aqui, sem serviço de IA de fora.
import { GIRIAS, VOCABULARIO } from './dicionario.js'

export const normalizar = (texto) =>
    String(texto ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/r\$\s*/g, ' r$ ')
        .replace(/[^a-z0-9$,.%/\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

export const palavras = (texto) =>
    normalizar(texto)
        .replace(/[,.](?!\d)/g, ' ')
        .split(' ')
        .filter(Boolean)

export const contemTermo = (frase, termo) => ` ${frase} `.includes(` ${termo} `)

// Distância de edição (Damerau-Levenshtein simples): troca de letras vizinhas conta como um erro só ("qaunto").
export function distancia(a, b) {
    if (a === b) return 0
    if (!a.length) return b.length
    if (!b.length) return a.length
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
    for (let j = 1; j <= b.length; j++) d[0][j] = j
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const custo = a[i - 1] === b[j - 1] ? 0 : 1
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + custo)
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
        }
    }
    return d[a.length][b.length]
}

// Duas palavras são "parecidas" se a diferença cabe no tamanho delas (mercdo ≈ mercado).
export const parecidas = (a, b) => {
    if (a.length < 4 || b.length < 4) return a === b
    const limite = a.length >= 8 ? 2 : 1
    return Math.abs(a.length - b.length) <= limite && distancia(a, b) <= limite
}

export const capitalizar = (texto) => (texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto)

export const formatarDinheiro = (valor) =>
    Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const VOCABULARIO_SET = new Set(VOCABULARIO)

// Corrige uma palavra digitada errado para a palavra do vocabulário mais parecida ("qaunto" → "quanto").
function corrigirPalavra(palavra) {
    if (palavra.length < 5 || VOCABULARIO_SET.has(palavra) || /\d/.test(palavra)) return palavra
    let melhor = null
    let menor = Infinity
    for (const v of VOCABULARIO) {
        if (!parecidas(palavra, v)) continue
        // só o fim muda ("pergunte"/"perguntar", "quando"/"quanto"): é outra palavra, não erro de digitação
        let prefixo = 0
        while (prefixo < Math.min(palavra.length, v.length) && palavra[prefixo] === v[prefixo]) prefixo++
        if (prefixo >= Math.min(palavra.length, v.length) - 2) continue
        const d = distancia(palavra, v)
        if (d < menor) {
            melhor = v
            menor = d
        }
    }
    return melhor ?? palavra
}

/**
 * Prepara a frase para descobrir a intenção: sem acento, minúscula, gírias e abreviações expandidas
 * e erros de digitação corrigidos. Os nomes e valores são lidos do texto original, não daqui.
 */
export function prepararFrase(texto) {
    return normalizar(texto)
        .replace(/[,.](?!\d)/g, ' ')
        .replace(/\s+/g, ' ')
        .split(' ')
        .map((p) => GIRIAS[p] ?? p)
        .join(' ')
        .split(' ')
        .map(corrigirPalavra)
        .join(' ')
        .trim()
}
