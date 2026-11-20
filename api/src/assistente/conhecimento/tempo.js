// Datas e horários (fuso de Brasília).
import { NOMES_DOS_DIAS, NOMES_DOS_MESES, diaDaSemana, diasEntre, ultimoDiaDoMes } from '../datas.js'

const dataPorExtenso = (iso) => {
    const [a, m, d] = iso.split('-').map(Number)
    return `${NOMES_DOS_DIAS[diaDaSemana(iso)]}, ${d} de ${NOMES_DOS_MESES[m - 1]} de ${a}`
}

/** Responde perguntas de data e hora; null se não for o caso. */
export function responderTempo(frase, { hoje, agora }) {
    const [ano, mes, dia] = hoje.split('-').map(Number)
    if (/\b(que|qual) (dia|data) (e|eh) hoje\b|\bdata de hoje\b|\bhoje e (que )?dia\b|\bque dia (e|eh) hoje\b|\bqual a data\b/.test(frase)) {
        return `Hoje é ${dataPorExtenso(hoje)}.`
    }
    if (/\bque (horas|hora) (sao|e)\b|\bhoras agora\b/.test(frase)) {
        const hora = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(agora)
        return `Agora são ${hora} (horário de Brasília).`
    }
    if (/\bque dia da semana\b/.test(frase)) return `Hoje é ${NOMES_DOS_DIAS[diaDaSemana(hoje)]}.`
    if (/\b(em )?que mes (estamos|e esse|e este)\b|\bqual (e )?o mes\b/.test(frase)) return `Estamos em ${NOMES_DOS_MESES[mes - 1]} de ${ano}.`
    if (/\bquantos dias (tem|possui) (esse|este|o) mes\b/.test(frase)) {
        return `${NOMES_DOS_MESES[mes - 1][0].toUpperCase()}${NOMES_DOS_MESES[mes - 1].slice(1)} de ${ano} tem ${ultimoDiaDoMes(ano, mes)} dias.`
    }
    if (/\bquantos dias faltam (para|pro|pra) (o )?(fim|final) do mes\b/.test(frase)) {
        const faltam = ultimoDiaDoMes(ano, mes) - dia
        return faltam === 0 ? 'Hoje é o último dia do mês.' : `Faltam ${faltam} ${faltam === 1 ? 'dia' : 'dias'} para o fim do mês (contando a partir de amanhã).`
    }
    const festa = frase.match(/\bquantos dias faltam (para|pro|pra) (o )?(natal|ano novo|fim do ano|reveillon)\b/)
    if (festa) {
        const natal = festa[3] === 'natal'
        let alvo = natal ? `${ano}-12-25` : `${ano + 1}-01-01`
        if (natal && hoje > alvo) alvo = `${ano + 1}-12-25`
        const faltam = diasEntre(hoje, alvo)
        return faltam === 0 ? 'É hoje!' : `Faltam ${faltam} dias para o ${natal ? 'Natal' : 'Ano-Novo'}.`
    }
    return null
}
