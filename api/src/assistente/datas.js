import { normalizar } from './texto.js'

const FUSO = 'America/Sao_Paulo'
const DIAS_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
const MESES = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

/** Data de hoje (AAAA-MM-DD) no fuso de Brasília. */
export const hojeEm = (agora = new Date()) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora)

const paraData = (iso) => new Date(`${iso}T12:00:00Z`)
const paraIso = (data) => data.toISOString().slice(0, 10)
export const somarDias = (iso, dias) => {
    const d = paraData(iso)
    d.setUTCDate(d.getUTCDate() + dias)
    return paraIso(d)
}
export const ultimoDiaDoMes = (ano, mes) => new Date(Date.UTC(ano, mes, 0)).getUTCDate()
const doisDigitos = (n) => String(n).padStart(2, '0')

function montar(ano, mes, dia) {
    if (mes < 1 || mes > 12 || dia < 1 || dia > ultimoDiaDoMes(ano, mes)) return null
    return `${ano}-${doisDigitos(mes)}-${doisDigitos(dia)}`
}

/** Data citada na mensagem ("ontem", "dia 5", "5/11", "sexta"), ou null. Nunca no futuro. */
export function extrairData(texto, hoje) {
    const frase = normalizar(texto).replace(/\bhj\b/g, 'hoje').replace(/\bontm\b/g, 'ontem')
    const [ano, mes] = hoje.split('-').map(Number)

    if (/\banteontem\b/.test(frase)) return { data: somarDias(hoje, -2), trecho: 'anteontem' }
    if (/\bontem\b/.test(frase)) return { data: somarDias(hoje, -1), trecho: 'ontem' }
    if (/\bhoje\b/.test(frase)) return { data: hoje, trecho: 'hoje' }

    const barra = frase.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
    if (barra) {
        let a = barra[3] ? Number(barra[3]) : ano
        if (a < 100) a += 2000
        let data = montar(a, Number(barra[2]), Number(barra[1]))
        if (data && !barra[3] && data > hoje) data = montar(a - 1, Number(barra[2]), Number(barra[1]))
        if (data && data <= hoje) return { data, trecho: barra[0] }
    }

    const diaN = frase.match(/\bdia (\d{1,2})\b/)
    if (diaN) {
        const n = Number(diaN[1])
        let data = montar(ano, mes, n)
        if (!data || data > hoje) data = mes === 1 ? montar(ano - 1, 12, n) : montar(ano, mes - 1, n)
        if (data) return { data, trecho: diaN[0] }
    }

    for (let i = 0; i < DIAS_SEMANA.length; i++) {
        const padrao = new RegExp(`\\b(n[oa] |na ultima |no ultimo )?${DIAS_SEMANA[i]}(-feira)?( passad[oa])?\\b`)
        const m = frase.match(padrao)
        if (!m) continue
        const hojeSemana = paraData(hoje).getUTCDay()
        let recuo = (hojeSemana - i + 7) % 7
        if (m[3] && recuo === 0) recuo = 7
        return { data: somarDias(hoje, -recuo), trecho: m[0] }
    }

    return null
}

/** Período citado numa pergunta ("esse mês", "mês passado", "semana", "outubro"). Padrão: mês atual. */
export function extrairPeriodo(texto, hoje) {
    const frase = normalizar(texto).replace(/\bhj\b/g, 'hoje').replace(/\bontm\b/g, 'ontem')
    const [ano, mes] = hoje.split('-').map(Number)
    const mesInteiro = (a, m, nome) => ({ inicio: montar(a, m, 1), fim: montar(a, m, ultimoDiaDoMes(a, m)), nome, explicito: true })
    const ultimosDias = frase.match(/\bultim[oa]s (\d{1,3}) dias\b/)
    if (ultimosDias) {
        const n = Math.min(Number(ultimosDias[1]), 366)
        return { inicio: somarDias(hoje, -(n - 1)), fim: hoje, nome: `nos últimos ${n} dias`, explicito: true }
    }
    if (/\banteontem\b/.test(frase)) return { inicio: somarDias(hoje, -2), fim: somarDias(hoje, -2), nome: 'anteontem', explicito: true }
    if (/\bano passado\b/.test(frase)) return { inicio: montar(ano - 1, 1, 1), fim: montar(ano - 1, 12, 31), nome: 'no ano passado', explicito: true }

    if (/\bhoje\b/.test(frase)) return { inicio: hoje, fim: hoje, nome: 'hoje', explicito: true }
    if (/\bontem\b/.test(frase)) return { inicio: somarDias(hoje, -1), fim: somarDias(hoje, -1), nome: 'ontem', explicito: true }
    if (/\bsemana passada\b/.test(frase)) {
        const recuo = (paraData(hoje).getUTCDay() + 6) % 7
        const segunda = somarDias(hoje, -recuo - 7)
        return { inicio: segunda, fim: somarDias(segunda, 6), nome: 'na semana passada', explicito: true }
    }
    if (/\bsemana\b/.test(frase)) {
        const recuo = (paraData(hoje).getUTCDay() + 6) % 7
        return { inicio: somarDias(hoje, -recuo), fim: hoje, nome: 'nesta semana', explicito: true }
    }
    if (/\bmes passado\b|\bultimo mes\b/.test(frase)) {
        return mes === 1 ? mesInteiro(ano - 1, 12, 'no mês passado') : mesInteiro(ano, mes - 1, 'no mês passado')
    }
    if (/\b(esse|este|neste|nesse) ano\b|\bno ano\b/.test(frase)) {
        return { inicio: montar(ano, 1, 1), fim: hoje, nome: 'neste ano', explicito: true }
    }
    for (let i = 0; i < MESES.length; i++) {
        if (!new RegExp(`\\b${MESES[i]}\\b`).test(frase)) continue
        const a = i + 1 > mes ? ano - 1 : ano
        return mesInteiro(a, i + 1, `em ${MESES[i] === 'marco' ? 'março' : MESES[i]}`)
    }
    const explicito = /\b(esse|este|neste|nesse|do|no) mes\b|\bmes atual\b/.test(frase)
    return { inicio: montar(ano, mes, 1), fim: hoje, nome: 'neste mês', explicito }
}

export const formatarData = (iso, hoje) => {
    if (iso === hoje) return 'hoje'
    if (iso === somarDias(hoje, -1)) return 'ontem'
    const [, m, d] = iso.split('-')
    return `${d}/${m}`
}

/** Mesmo trecho do mês anterior (do dia 1 até o mesmo dia), para comparar de forma justa. */
export function mesmoTrechoDoMesAnterior(hoje) {
    const [ano, mes, dia] = hoje.split('-').map(Number)
    const a = mes === 1 ? ano - 1 : ano
    const m = mes === 1 ? 12 : mes - 1
    const d = Math.min(dia, ultimoDiaDoMes(a, m))
    return { inicio: montar(a, m, 1), fim: montar(a, m, d), nome: 'no mesmo período do mês passado' }
}

/** Mês inteiro, N meses antes do atual (1 = mês passado). */
export function mesAnterior(hoje, n = 1) {
    const [ano, mes] = hoje.split('-').map(Number)
    let a = ano
    let m = mes - n
    while (m < 1) {
        m += 12
        a -= 1
    }
    return { inicio: montar(a, m, 1), fim: montar(a, m, ultimoDiaDoMes(a, m)), nome: `${NOMES_DOS_MESES[m - 1]}`, ano: a, mes: m }
}

export const NOMES_DOS_MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const NOMES_DOS_DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
export const diaDaSemana = (iso) => paraData(iso).getUTCDay()
export const diasEntre = (de, ate) => Math.round((paraData(ate) - paraData(de)) / 86400000)
