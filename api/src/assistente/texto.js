// Utilidades de texto do assistente: tudo roda aqui, sem serviço de IA de fora.

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

// Distância de edição (Levenshtein), para entender palavras com erro de digitação.
export function distancia(a, b) {
    if (a === b) return 0
    if (!a.length) return b.length
    if (!b.length) return a.length
    let anterior = Array.from({ length: b.length + 1 }, (_, i) => i)
    for (let i = 1; i <= a.length; i++) {
        const atual = [i]
        for (let j = 1; j <= b.length; j++) {
            const custo = a[i - 1] === b[j - 1] ? 0 : 1
            atual[j] = Math.min(atual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + custo)
        }
        anterior = atual
    }
    return anterior[b.length]
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
