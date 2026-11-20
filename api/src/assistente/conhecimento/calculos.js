// Contas simples, porcentagem e juros compostos, sem eval: um analisador pequeno de expressões.
import { formatarDinheiro } from '../texto.js'

const numeroBr = (t) => {
    const s = String(t).trim()
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return Number(s.replace(/\./g, '').replace(',', '.'))
    return Number(s.replace(',', '.'))
}
const formatarNumero = (n) =>
    Number.isInteger(n) ? n.toLocaleString('pt-BR') : n.toLocaleString('pt-BR', { maximumFractionDigits: 4 })

// Lê uma expressão com + - * / e parênteses, respeitando a precedência.
function avaliar(expressao) {
    const tokens = expressao.match(/\d+(?:[.,]\d+)*|[-+*/()]/g)
    if (!tokens) return null
    let i = 0
    const olhar = () => tokens[i]
    const pegar = () => tokens[i++]
    function fator() {
        const t = pegar()
        if (t === '-') return -fator()
        if (t === '(') {
            const v = soma()
            if (pegar() !== ')') throw new Error('parêntese')
            return v
        }
        if (t === undefined || /[-+*/()]/.test(t)) throw new Error('fator')
        return numeroBr(t)
    }
    function produto() {
        let v = fator()
        while (olhar() === '*' || olhar() === '/') {
            const op = pegar()
            const d = fator()
            if (op === '/' && d === 0) throw new Error('zero')
            v = op === '*' ? v * d : v / d
        }
        return v
    }
    function soma() {
        let v = produto()
        while (olhar() === '+' || olhar() === '-') v = pegar() === '+' ? v + produto() : v - produto()
        return v
    }
    try {
        const v = soma()
        return i === tokens.length && Number.isFinite(v) ? v : null
    } catch (erro) {
        return erro.message === 'zero' ? 'zero' : null
    }
}

/** Tenta responder uma conta. Recebe a frase já preparada (sem acento) e o texto original. */
export function responderCalculo(frase, original) {
    // juros de 1% ao mês por 12 meses em 1000
    const juros = frase.match(/juros (?:compostos )?de (\d+(?:[.,]\d+)?) ?% ao (mes|ano) (?:por|durante|em) (\d+) (mes|meses|ano|anos) (?:em|sobre|de|com) (?:r\$ )?(\d+(?:[.,]\d+)*)/)
    if (juros) {
        const taxa = numeroBr(juros[1]) / 100
        const n = Number(juros[3])
        const capital = numeroBr(juros[5])
        const montante = capital * (1 + taxa) ** n
        return `Com juros compostos de ${juros[1]}% ao ${juros[2] === 'mes' ? 'mês' : 'ano'} por ${n} ${juros[4].startsWith('mes') ? (n === 1 ? 'mês' : 'meses') : n === 1 ? 'ano' : 'anos'}, ${formatarDinheiro(capital)} viram ${formatarDinheiro(montante)} (rendimento de ${formatarDinheiro(montante - capital)}).`
    }

    // quanto rende 1000 a 1% ao mês (por 12 meses)
    const rende = frase.match(/quanto rende(?:m)? (?:r\$ )?(\d+(?:[.,]\d+)*) (?:reais )?(?:a|com|em|por|rendendo) (\d+(?:[.,]\d+)?) ?% ao (mes|ano)(?: (?:por|durante|em) (\d+) (mes|meses|ano|anos))?/)
    if (rende) {
        const capital = numeroBr(rende[1])
        const taxa = numeroBr(rende[2]) / 100
        const n = rende[4] ? Number(rende[4]) : 1
        const unidade = rende[3] === 'mes' ? (n === 1 ? 'mês' : 'meses') : n === 1 ? 'ano' : 'anos'
        const montante = capital * (1 + taxa) ** n
        return `${formatarDinheiro(capital)} a ${rende[2]}% ao ${rende[3] === 'mes' ? 'mês' : 'ano'} rendem ${formatarDinheiro(montante - capital)} em ${n} ${unidade} (juros compostos, sem descontar impostos e taxas), chegando a ${formatarDinheiro(montante)}.`
    }

    // 25% de desconto em 80
    const desc = frase.match(/(\d+(?:[.,]\d+)?) ?(?:%|por cento) de (desconto|aumento|acrescimo|juros) (?:em|sobre|de|no|na) (?:r\$ )?(\d+(?:[.,]\d+)*)/)
    if (desc) {
        const p = numeroBr(desc[1])
        const base = numeroBr(desc[3])
        const parte = (p / 100) * base
        const final = desc[2] === 'desconto' ? base - parte : base + parte
        return `${desc[1]}% de ${formatarNumero(base)} é ${formatarNumero(parte)}. ${desc[2] === 'desconto' ? 'Com o desconto' : 'Com o acréscimo'}, fica ${formatarNumero(final)}.`
    }

    // 15% de 200 / 25 por cento de 80
    const pct = frase.match(/(\d+(?:[.,]\d+)?) ?(?:%|por cento) (?:de|do|da|sobre) (?:r\$ )?(\d+(?:[.,]\d+)*)/)
    if (pct) {
        const p = numeroBr(pct[1])
        const base = numeroBr(pct[2])
        const valor = (p / 100) * base
        const desconto = /desconto|abatimento|off/.test(frase) ? ` Com ${pct[1]}% de desconto, fica ${formatarNumero(base - valor)}.` : ''
        return `${pct[1]}% de ${formatarNumero(base)} é ${formatarNumero(valor)}.${desconto}`
    }

    // quanto é 10 mais 5 vezes 2 / 120 / 3 / calcula 2+2
    const pedido = /\b(quanto e|quanto da|quanto fica|calcula|calcule|resultado de|qual o resultado|conta)\b/.test(frase)
    const soConta = /^[\d\s.,+\-*/x()=?]+$/.test(String(original).trim()) && /\d\s*[-+*/x]\s*\d/.test(original)
    if (!pedido && !soConta) return null
    const semAcento = String(original).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const expressao = ` ${semAcento} `
        .replace(/\bmais\b/g, ' + ')
        .replace(/\bmenos\b/g, ' - ')
        .replace(/\b(vezes|x)\b/g, ' * ')
        .replace(/(\d)\s*x\s*(\d)/g, '$1 * $2')
        .replace(/\b(dividido|divido) (por|em)\b/g, ' / ')
        .replace(/[^\d.,+\-*/() ]/g, ' ')
    if (!/\d[\s]*[-+*/][\s(-]*\d/.test(expressao)) return null
    const resultado = avaliar(expressao)
    if (resultado === 'zero') return 'Não dá para dividir por zero.'
    if (resultado === null) return null
    return `Dá ${formatarNumero(Math.round(resultado * 10000) / 10000)}.`
}
