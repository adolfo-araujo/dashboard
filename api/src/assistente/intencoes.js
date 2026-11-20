// Detector de intenções: cada módulo propõe uma interpretação com uma nota de confiança (0 a 1)
// e fica a de nota mais alta. Abaixo do mínimo, a mensagem vai para o fallback (que nunca é o resumo do mês).
import { interpretar, encontrarCategoria } from './entender.js'
import { detectarEnsino, fraseEnsinada } from './aprendizado.js'
import { continuacao } from './contexto.js'
import { buscarConhecimento } from './conhecimento/motor.js'
import { responderCalculo } from './conhecimento/calculos.js'
import { responderTempo } from './conhecimento/tempo.js'
import { extrairPeriodo } from './datas.js'
import { prepararFrase } from './texto.js'

export const CONFIANCA_MINIMA = 0.5
const CONHECIMENTO_MINIMO = 0.6

// Análises e pedidos sobre a própria conversa
const ANALISES = [
    ['gastandoMuito', 0.9, /\b(estou|esta|tou|ando|tenho) gastando (muito|demais|pouco|bem|mal)\b|\bgastei (muito|demais|pouco)\b|\bgastando (muito|demais)\b|\bmeus gastos (estao|tao) (altos|normais|ok|bem|exagerados)\b|\b(gasto|gastos) (alto|altos|demais)\b/],
    ['praOndeFoi', 0.9, /\b(para|pra) onde (foi|vai|foram|anda indo|esta indo|ta indo) (o |todo o |todo )?(meu )?dinheiro\b|\bonde (foi|esta indo|ta indo|anda) (o |todo o )?(meu )?dinheiro\b|\bcom o que (eu )?(mais )?gast(ei|o)\b|\bonde (eu )?(torrei|gastei) (meu dinheiro|tudo)\b/],
    ['preocupado', 0.9, /\b(estou|to|tou|ando|fico|me sinto|estamos) (muito |bem |meio )?(preocupad[oa]s?|ansios[oa]s?|apertad[oa]s?|endividad[oa]s?|sem dinheiro|no vermelho|quebrad[oa]s?|dur[oa]|lis[oa])\b|\bpreocupad[oa] com\b|\bdinheiro (nao|n) (da|esta dando|ta dando)\b|\bnao (sobra|sobrou) (nada|dinheiro)\b/],
    ['opiniao', 0.88, /\bo que (voce )?acha (das|da|do|dos) (minhas?|meus?) (financas|vida financeira|situacao|gastos|dinheiro|mes)\b|\bcomo (estao|esta|anda|andam|vai|vao) (as |a |o |os )?(minhas?|meus?) (financas|vida financeira|mes|contas|dinheiro|gastos)\b|\bcomo estou (financeiramente|esse mes|este mes|de dinheiro|nesse mes|neste mes)\b|\bminhas financas estao (bem|mal|ok)\b|\b(faz|faca|fazer) uma analise\b|\banalis[ae] (minhas|meus|o meu|a minha)\b/],
    ['sugestao', 0.87, /\b(me )?(da|de|manda|passa) (uma |alguma |umas )?(sugestao|sugestoes|dica|dicas)\b|\b(alguma|tem alguma|quero uma) (sugestao|dica)\b|\bo que (eu )?(devo|posso) fazer (com|para|pra) (o )?(meu )?(dinheiro|economizar|guardar|sobrar)\b|\bcomo (eu )?(posso |consigo )?(guardar dinheiro|poupar|sobrar dinheiro)\b|\bme ajuda a economizar\b/],
    ['comparar', 0.88, /\b(compara|comparar|compare|comparacao|comparando)\b|\bgastei mais (que|do que) (no )?mes passado\b|\bem relacao ao mes passado\b|\bcontra o mes passado\b/],
    ['tendencia', 0.88, /\b(meus )?gastos (estao|tao|vem|vao) (aumentando|subindo|diminuindo|caindo|crescendo)\b|\btendencia\b|\bevolucao (dos|de) (meus )?gastos\b|\bestou gastando mais (que|do que) antes\b/],
    ['porDia', 0.9, /\bquanto (eu )?(posso|consigo|da pra|da para|devo) gastar (por|ao|cada|todo) dia\b|\bquanto (eu )?posso gastar ate o fim do mes\b/],
    ['investimentos', 0.86, /\b(como estao|como vao|resumo dos|ver os|mostra os) (meus )?investimentos\b|\bmeus investimentos\b|\bquanto (eu )?(tenho|ja) (investido|aplicado)\b/],
]
const REDUZIR = /\b(como|onde|o que) (eu )?(posso |consigo |da pra |da para |devo |faco pra |faco para )?(reduzir|diminuir|economizar|cortar|gastar menos|baixar)\b|\breduzir (isso|esses gastos|esse gasto|essa categoria)\b|\beconomizar (nisso|com isso|nessa categoria)\b|\bcomo reduzir\b/
const EXPLICAR = /^(me )?(explica|explique|explicar)( melhor| isso| de novo| direito| mais)?$|^nao entendi( nada| direito| bem| isso)?$|^como assim$|^pode explicar( melhor)?$|^(mais )?detalhes?$|^detalha$|^nao ficou claro$|^explica melhor isso$/
const CONVERSANDO = /\b(o que|sobre o que|do que) (a gente |nos )?(estava|estavamos|tava|tavamos|estamos) (conversando|falando)\b|\bvoce lembra (do que|o que|oque) (eu )?(falei|disse|te disse|conversamos|te falei)\b|\blembra do que (eu )?(falei|disse|te falei)\b|\bqual (era|e) o assunto\b/

const mensagemLimpa = (frase) => frase.replace(/[?!.]+/g, ' ').replace(/\s+/g, ' ').trim()

/**
 * Resolve a intenção da mensagem.
 * Retorna { intencao, confianca, modulo, ... } e, quando nada passa do mínimo, { intencao: 'fallback', quase }.
 */
export function resolverIntencao(texto, { hoje, agora, memoria = {}, contexto = null }) {
    const frase = mensagemLimpa(prepararFrase(texto))
    const candidatos = []
    const propor = (c) => c && candidatos.push(c)

    // 1. Aprendizado e preferências ("quando eu falar lanche, é alimentação")
    const ensino = detectarEnsino(texto)
    if (ensino) propor({ intencao: 'ensino', modulo: 'aprendizado', confianca: 0.96, ensino })

    // 2. Perguntas que a pessoa ensinou ("quanto sobrou" = receita menos despesas)
    const ensinada = fraseEnsinada(texto, memoria.termos)
    if (ensinada) propor({ intencao: 'fraseEnsinada', modulo: 'aprendizado', confianca: 0.97, alvo: ensinada.alvo, periodo: extrairPeriodo(texto, hoje) })

    // 3. Conhecimento com cálculo próprio: contas e datas
    const conta = responderCalculo(frase, texto)
    if (conta) propor({ intencao: 'conhecimento', modulo: 'calculo', confianca: 0.95, texto: conta })
    const tempo = responderTempo(frase, { hoje, agora })
    if (tempo) propor({ intencao: 'conhecimento', modulo: 'datas', confianca: 0.95, texto: tempo })

    // 4. Regras financeiras (lançar, consultar, apagar, corrigir, orçamento...)
    const regra = interpretar(texto, { hoje, memoria })
    if (regra.confianca > 0) propor({ ...regra, modulo: 'financeiro' })

    // 5. Análises dos dados reais
    for (const [tipo, confianca, padrao] of ANALISES) {
        if (padrao.test(frase)) {
            propor({ intencao: 'analise', tipo, modulo: 'analise', confianca, periodo: extrairPeriodo(texto, hoje) })
            break
        }
    }
    if (REDUZIR.test(frase)) {
        const achada = encontrarCategoria(texto, 'EXPENSE', memoria)
        const categoria = achada && achada.origem !== 'aproximado' ? achada.categoria : null
        propor({ intencao: 'analise', tipo: 'reduzir', modulo: 'analise', confianca: 0.89, categoria })
    }

    // 6. Contexto da conversa ("e ontem?", "me explica melhor", "o que estávamos conversando?")
    const segue = continuacao(frase, texto, { hoje, memoria, contexto })
    if (segue) propor({ ...segue, modulo: 'contexto' })
    if (EXPLICAR.test(frase)) propor({ intencao: 'explicar', modulo: 'contexto', confianca: 0.9 })
    if (CONVERSANDO.test(frase)) propor({ intencao: 'conversando', modulo: 'contexto', confianca: 0.93 })

    // 7. Base de conhecimento (identidade, funcionalidades, educação financeira, conversa social...)
    const achado = buscarConhecimento(texto)
    if (achado && achado.pontuacao >= CONHECIMENTO_MINIMO) {
        // Social curto ("oi", "obrigado") só ganha de uma ordem se a mensagem for só isso
        const confianca = achado.topico.modulo === 'social' && regra.confianca >= 0.7 ? achado.pontuacao * 0.6 : achado.pontuacao * 0.92
        propor({ intencao: 'conhecimento', modulo: achado.topico.modulo, confianca, topico: achado.topico })
    }

    candidatos.sort((a, b) => b.confianca - a.confianca)
    const melhor = candidatos[0]
    if (!melhor || melhor.confianca < CONFIANCA_MINIMA) {
        return {
            intencao: 'fallback',
            modulo: 'fallback',
            confianca: melhor?.confianca ?? 0,
            pergunta: regra.pergunta || /\?\s*$/.test(String(texto).trim()),
            // "Você quis dizer...?" só quando a pergunta parecida divide pelo menos duas palavras com a mensagem
            quase: achado && achado.pontuacao >= 0.5 && achado.palavrasEmComum >= 2 && achado.topico.pergunta ? achado.topico : null,
            regra,
        }
    }
    return { ...melhor, regra, saudacao: /^(oi|ola|opa|bom dia|boa tarde|boa noite|e ai|eai|hey)\b/.test(frase) && melhor.modulo !== 'social' }
}

/** Separa uma mensagem com mais de um pedido ("lança 40 no mercado e me diz meu saldo", "quanto gastei hoje? e ontem?"). */
export function dividirPedidos(texto) {
    const partes = String(texto)
        .split(/(?<=\?)\s+(?=\S)|\s+(?:e|depois|tamb[eé]m)\s+(?=(?:me\s+)?(?:diz|diga|fala|fale|mostra|mostre|informa|qual|quanto|quantos|quais|como)\b)/i)
        .map((p) => p.trim())
        .filter(Boolean)
    return partes.length > 1 ? partes.slice(0, 3) : [String(texto)]
}
