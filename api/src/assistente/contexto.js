// Gerenciador de contexto: lembra do assunto da conversa por 30 minutos para entender "e ontem?" e "como reduzir isso?".
// Guarda só um resumo estruturado (intenção, período, categoria), nunca o texto das mensagens.
import { encontrarCategoria } from './entender.js'
import { extrairPeriodo } from './datas.js'
import { palavras } from './texto.js'

export const CONTEXTO_MINUTOS = 30
const ASSUNTOS = 5

export const contextoAtivo = (contexto, agora) => (contexto && contexto.ate > agora.getTime() ? contexto : null)

/** Junta o que aconteceu nesta mensagem ao contexto e renova o prazo. */
export function atualizarContexto(anterior, agora, { consulta, foco, ultimo, assunto, ultimaResposta } = {}) {
    const base = contextoAtivo(anterior, agora) ?? {}
    const assuntos = [...(base.assuntos ?? [])]
    if (assunto && assuntos.at(-1) !== assunto) assuntos.push(assunto)
    return {
        consulta: consulta === undefined ? base.consulta ?? null : consulta,
        foco: foco === undefined ? base.foco ?? null : foco,
        ultimo: ultimo ?? base.ultimo ?? null,
        assuntos: assuntos.slice(-ASSUNTOS),
        ultimaResposta: ultimaResposta ?? base.ultimaResposta ?? null,
        ate: agora.getTime() + CONTEXTO_MINUTOS * 60 * 1000,
    }
}

const TIPO_NA_FRASE = [
    ['EXPENSE', /\b(gastos?|despesas?|saiu|sairam|gastei|saidas?)\b/],
    ['EARNING', /\b(ganhos?|receitas?|recebi|entrou|entraram|ganhei|entradas?)\b/],
    ['INVESTMENT', /\b(invest\w*|apliquei|aplicacoes)\b/],
]

/**
 * Pergunta que continua a anterior: "e ontem?", "e na semana passada?", "e com transporte?", "e os ganhos?".
 * Devolve a nova consulta (com o que mudou) ou null.
 */
export function continuacao(frase, texto, { hoje, memoria, contexto }) {
    const anterior = contexto?.consulta
    if (!anterior) return null
    const lista = palavras(frase)
    const comecaComE = /^(e|e o|e a|e os|e as|e no|e na|e em|e com|e de|e do|e da|e pra|e para|e quanto|e qual|e se|agora|e no caso|e quanto a|e sobre|e em relacao)\b/.test(frase)
    // Sem o "e" na frente, só vale para pergunta curta ("ontem?"); "paguei o aluguel" é um lançamento novo
    const curta = lista.length <= 4 && /\?\s*$/.test(String(texto).trim())
    if (!comecaComE && !curta) return null
    if (lista.length > 9) return null

    const periodo = extrairPeriodo(texto, hoje)
    const tipo = TIPO_NA_FRASE.find(([, padrao]) => padrao.test(frase))?.[0] ?? null
    const achada = encontrarCategoria(texto, tipo ?? anterior.tipo ?? 'EXPENSE', memoria)
    const categoria = achada && achada.origem !== 'aproximado' ? achada.categoria : null
    if (!periodo.explicito && !categoria && !tipo) return null

    let tipoConsulta = anterior.tipoConsulta
    if (categoria && tipoConsulta === 'maior') tipoConsulta = 'resumo'
    if (tipoConsulta === 'saldo' && (tipo || categoria)) tipoConsulta = 'resumo'
    return {
        intencao: 'consulta',
        tipoConsulta,
        tipo: tipo ?? anterior.tipo ?? (categoria ? 'EXPENSE' : null),
        categoria: categoria ?? (tipo && tipo !== anterior.tipo ? null : anterior.categoria),
        periodo: periodo.explicito ? periodo : anterior.periodo,
        confianca: comecaComE ? 0.93 : 0.78,
        continuacao: true,
    }
}
