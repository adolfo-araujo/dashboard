import { capitalizar, contemTermo, normalizar, palavras, parecidas } from './texto.js'
import { ehNumeroPorExtenso, extrairQuantidade, extrairValor } from './valores.js'
import { extrairData, extrairPeriodo } from './datas.js'
import { PALAVRAS_VAZIAS, PLANO, QUANDO_FUTURO, ROTULOS, TERMOS_POR_TIPO, VERBOS, VERBO_FUTURO } from './dicionario.js'

const TIPOS = ['EXPENSE', 'EARNING', 'INVESTMENT']

const comeca = (frase, padrao) => new RegExp(`^(${padrao})\\b`).test(frase)
const tem = (frase, padrao) => new RegExp(`\\b(${padrao})\\b`).test(frase)
// Jeitos curtos de escrever que viram a forma completa antes de entender a frase
const abreviacoes = (frase) =>
    frase
        .replace(/\boque\b/g, 'o que')
        .replace(/\b(vc|vce|ce)\b/g, 'voce')
        .replace(/\b(pq|pk)\b/g, 'por que')
        .replace(/\b(eh)\b/g, 'e')
// Palavras que fazem uma pergunta ser sobre dinheiro (senão é uma pergunta que eu não sei responder)
const ASSUNTO_FINANCEIRO =
    'gast\\w*|ganh\\w*|receb\\w*|saldo|sobr\\w*|entr(ou|aram|ada|adas)|sai(u|ram|da|das)|invest\\w*|apliq\\w*|aplica\\w*|resumo|extrato|balanco|quanto|categorias?|lanc\\w*|dinheiro|grana|reais|real|mes|semana|ano|hoje|ontem|ultim\\w*|orcamentos?|pagu\\w*|pag(o|ar|amento)|compr\\w*|despesas?|receitas?|economi\\w*|poupei|guardei'

function tipoPeloVerbo(lista) {
    for (const tipo of TIPOS) if (lista.some((p) => VERBOS[tipo].includes(p))) return tipo
    return null
}

/** Termos da frase que podem dizer a categoria: pares de palavras primeiro, depois palavras soltas. */
function termosDaFrase(lista) {
    const uteis = lista.filter((p) => !PALAVRAS_VAZIAS.has(p) && !/^\d/.test(p))
    const pares = uteis.slice(0, -1).map((p, i) => `${p} ${uteis[i + 1]}`)
    return [...pares, ...uteis]
}

/**
 * Categoria provável para a frase, nesta ordem:
 * 1) o que a pessoa já ensinou ao assistente; 2) o que ela já registrou com o mesmo nome;
 * 3) o dicionário; 4) o dicionário com tolerância a erro de digitação.
 */
export function encontrarCategoria(texto, tipo, memoria = {}) {
    const frase = normalizar(texto)
    const lista = palavras(frase)
    const termos = termosDaFrase(lista)
    const aprendidos = memoria.termos ?? new Map()

    for (const termo of termos) {
        const chave = aprendidos.get(`${tipo}:${termo}`)
        if (chave) return { categoria: chave, origem: 'memoria', termo }
    }

    const nome = termos.join(' ')
    if (nome && memoria.historico?.length) {
        const contagem = {}
        for (const t of memoria.historico) {
            if (t.type === tipo && t.category && normalizar(t.name) === nome) {
                contagem[t.category] = (contagem[t.category] ?? 0) + 1
            }
        }
        const maisUsada = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]
        if (maisUsada) return { categoria: maisUsada[0], origem: 'historico', termo: nome }
    }

    const entradas = TERMOS_POR_TIPO[tipo] ?? []
    for (const compostos of [true, false]) {
        for (const [chave, lista2] of entradas) {
            const achou = lista2.find((t) => t.includes(' ') === compostos && contemTermo(frase, t))
            if (achou) return { categoria: chave, origem: 'dicionario', termo: achou }
        }
    }
    for (const [chave, rotulo] of Object.entries(ROTULOS[tipo] ?? {})) {
        if (contemTermo(frase, normalizar(rotulo))) return { categoria: chave, origem: 'dicionario', termo: normalizar(rotulo) }
    }

    for (const p of lista.filter((x) => x.length >= 4 && !PALAVRAS_VAZIAS.has(x))) {
        for (const [chave, lista2] of entradas) {
            const achou = lista2.find((t) => !t.includes(' ') && parecidas(p, t))
            if (achou) return { categoria: chave, origem: 'aproximado', termo: p }
        }
    }
    return null
}

/** Em qual tipo a frase tem cara de lançamento, pelo dicionário (sem verbo explícito). */
function tipoPelaCategoria(texto, memoria) {
    for (const tipo of TIPOS) {
        const achado = encontrarCategoria(texto, tipo, memoria)
        if (achado && achado.origem !== 'aproximado') return tipo
    }
    return null
}

/** Nome curto do lançamento: o que sobra da frase sem valor, data e verbos ("conta de luz", "Padaria do Zé"). */
export function nomeDoLancamento(texto, retirar = []) {
    let frase = normalizar(texto)
    for (const trecho of retirar.filter(Boolean)) frase = frase.replace(trecho, ' ')
    const verbos = new Set(Object.values(VERBOS).flat())
    let sobra = palavras(frase).filter((p) => !verbos.has(p) && !/^r?\$?\d/.test(p) && p !== 'r$')
    while (sobra.length && PALAVRAS_VAZIAS.has(sobra[0])) sobra.shift()
    while (sobra.length && PALAVRAS_VAZIAS.has(sobra[sobra.length - 1])) sobra.pop()
    const originais = String(texto).match(/[\p{L}\d]+/gu) ?? []
    // Mantém a grafia original da pessoa (acentos e maiúsculas) quando der para achar.
    const nome = sobra
        .map((p) => originais.find((o) => normalizar(o) === p) ?? p)
        .join(' ')
        .slice(0, 50)
        .trim()
    return nome ? capitalizar(nome) : null
}

/**
 * Entende uma mensagem. Retorna { intencao, ...detalhes }.
 * Intenções: vazio, saudacao, agradecimento, ajuda, confirmar, negar, desfazer, corrigir,
 * orcamento, consulta, registrar, desconhecido.
 * Em registrar, `futuro` diz que a pessoa contou algo que ainda vai acontecer (não é para lançar já).
 */
export function interpretar(texto, { hoje, memoria = {} }) {
    const frase = abreviacoes(normalizar(texto))
    const lista = palavras(frase)
    if (!frase) return { intencao: 'vazio' }

    const valor = extrairValor(texto)
    const data = extrairData(texto, hoje)
    const curta = lista.length <= 4
    const pergunta = /\?\s*$/.test(String(texto).trim()) || comeca(frase, 'quanto|qual|quais|como|onde|cade|me (mostra|diz|fala)|mostra|resumo|saldo|extrato|balanco')

    if (!valor && comeca(frase, 'oi|ola|opa|salve|e ai|eai|eae|bom dia|boa tarde|boa noite|hey|hello') && lista.length <= 5) {
        return { intencao: 'saudacao' }
    }
    if (!valor && tem(frase, 'obrigad[oa]|valeu|vlw|brigad[oa]|obg|tmj|agradeco') && lista.length <= 6) {
        return { intencao: 'agradecimento' }
    }
    if (tem(frase, 'o que (e )?voce e|quem e voce|quem voce e|voce e (uma |um |o |a )?(ia|inteligencia artificial|robo|bot|humano|pessoa|gente|chatgpt|gpt|de verdade)|o que e (isso|esse assistente|esse chat|voce)|qual (e )?(o )?seu nome|como voce se chama')) {
        return { intencao: 'sobre' }
    }
    if (tem(frase, 'ajuda|help|o que voce (faz|sabe fazer|consegue fazer|sabe)|como (voce |isso |o assistente )?(funciona|usa|usar|te uso|eu uso)|comandos|o que da (pra|para) fazer|o que (eu )?(devo|posso|consigo) fazer( com voce| com isso| aqui)?|(pra|para) que (voce )?serve')) {
        return { intencao: 'ajuda' }
    }
    // "você fez algum lançamento esse mês?": pergunta sobre o que o assistente lançou
    if (pergunta && tem(frase, 'voce (fez|lancou|registrou|anotou|colocou|botou|adicionou)|o que voce (lancou|registrou|anotou)')) {
        return { intencao: 'consulta', tipoConsulta: 'doAssistente', periodo: extrairPeriodo(texto, hoje) }
    }
    if (curta && !valor && comeca(frase, 'sim|s|isso|isso mesmo|pode|pode ser|ok|okay|beleza|blz|certo|confirmo|confirma|manda|bora|claro|exato|aham|uhum|positivo|perfeito|fechou|show')) {
        return { intencao: 'confirmar' }
    }
    if (curta && !valor && comeca(frase, 'nenhum|nenhuma|nao|n|nada|cancela|cancelar|deixa|deixa pra la|esquece|negativo|errado')) {
        return { intencao: 'negar' }
    }
    if (tem(frase, 'apaga|apagar|apague|desfaz|desfazer|desfaca|exclui|excluir|exclua|remove|remover|remova|tira|tirar|tire|retira|retire|deleta|deletar|delete') && !pergunta) {
        // quantos: "os 3 últimos" → 3; "todos" / "tudo" → os que eu lancei hoje; sem nada → só o último
        // "desde o início" = tudo o que eu já lancei, de qualquer dia
        const desdeOInicio = tem(frase, 'desde o (inicio|comeco|primeiro dia)|desde sempre|de sempre|de todos os tempos|desde que comecei')
        const quantidade = desdeOInicio ? 'sempre' : extrairQuantidade(texto) ?? (tem(frase, 'todos|todas|tudo') ? 'todos' : null)
        return { intencao: 'desfazer', quantidade }
    }
    if (!pergunta && tem(frase, '(voce|vc) (lancou|colocou|botou|registrou|anotou|adicionou|lancaste)|lancou (errado|a mais|de novo|duas vezes|mais um|outro)|nao (pedi|mandei) (isso|pra lancar|para lancar)|ta errado|esta errado|ficou errado|deu errado')) {
        return { intencao: 'reclamacao' }
    }
    if (comeca(frase, 'era|na verdade|corrige|corrigir|corrija|muda|mudar|troca|trocar|altera|alterar|nao era|ops|opa era|errei')) {
        const categorias = Object.fromEntries(TIPOS.map((tipo) => [tipo, encontrarCategoria(texto, tipo, memoria)]))
        return { intencao: 'corrigir', valor: valor?.valor ?? null, data: data?.data ?? null, categorias }
    }
    if (tem(frase, 'orcamento|orcamentos|limite|limites|meta de gasto|teto')) {
        return { intencao: 'orcamento', periodo: extrairPeriodo(texto, hoje) }
    }

    if (pergunta && (!valor || /\?\s*$/.test(String(texto).trim()))) {
        const sobreDinheiro = tem(frase, ASSUNTO_FINANCEIRO) || Boolean(valor) || TIPOS.some((t) => encontrarCategoria(texto, t, memoria)?.origem === 'dicionario')
        if (!sobreDinheiro) return { intencao: 'foraDoAssunto' }
        let tipoConsulta = 'resumo'
        if (tem(frase, 'saldo|sobrou|sobra|tenho|quanto tenho|balanco')) tipoConsulta = 'saldo'
        if (tem(frase, 'onde|mais gastei|maior gasto|mais pesou|categoria que mais|com o que mais')) tipoConsulta = 'maior'
        if (tem(frase, 'ultimos|ultimas|recentes|o que (eu )?(lancei|registrei|anotei)')) tipoConsulta = 'ultimos'
        const tipo = tipoPeloVerbo(lista) ?? (tem(frase, 'ganhei|ganho|recebi|entrou') ? 'EARNING' : null)
        const categoria = tipoConsulta === 'resumo' ? encontrarCategoria(texto, tipo ?? 'EXPENSE', memoria) : null
        return {
            intencao: 'consulta',
            tipoConsulta,
            quantidade: extrairQuantidade(texto),
            tipo,
            categoria: categoria && categoria.origem !== 'aproximado' ? categoria.categoria : null,
            periodo: extrairPeriodo(texto, hoje),
        }
    }

    const tipoVerbo = tipoPeloVerbo(lista)
    if (valor || tipoVerbo) {
        const tipo = tipoVerbo ?? (valor ? tipoPelaCategoria(texto, memoria) : null)
        const categoria = tipo ? encontrarCategoria(texto, tipo, memoria) : null
        const quando = data ? null : frase.match(QUANDO_FUTURO)?.[0] ?? null
        const plano = PLANO.test(frase)
        return {
            intencao: 'registrar',
            futuro: Boolean(plano || quando || VERBO_FUTURO.test(frase)),
            plano,
            quando,
            tipo,
            tipoExplicito: Boolean(tipoVerbo),
            valor: valor?.valor ?? null,
            data: data?.data ?? hoje,
            categoria: categoria?.categoria ?? null,
            origemCategoria: categoria?.origem ?? null,
            termoCategoria: categoria?.termo ?? null,
            nome: nomeDoLancamento(texto, [valor?.trecho, data?.trecho, quando]),
        }
    }

    // Só um número de lançamentos ("os últimos 3 que te disse"): pergunta se é para ver ou apagar.
    const quantidade = extrairQuantidade(texto)
    if (quantidade) return { intencao: 'quantidade', quantidade }

    return { intencao: 'desconhecido' }
}

/**
 * Separa uma mensagem com vários lançamentos ("40 no mercado e 20 de uber", "gasto de R$ 60,00 em X, gasto de R$ 80,00 em Y").
 * Cada parte precisa ter um valor; o que não tem valor volta a se juntar ao vizinho ("Contas e serviços").
 * Retorna [texto] quando não há o que separar.
 */
export function dividirLancamentos(texto) {
    const original = String(texto)
    const separador = /[;\n]+|,(?!\d)|\s+(?:e|mais|tamb[eé]m)\s+/gi
    const pedacos = []
    let inicio = 0
    for (const m of original.matchAll(separador)) {
        const antes = palavras(normalizar(original.slice(inicio, m.index))).at(-1) ?? ''
        const depois = palavras(normalizar(original.slice(m.index + m[0].length)))[0] ?? ''
        // "mil e duzentos", "cento e vinte": é um número só
        if (ehNumeroPorExtenso(antes) && ehNumeroPorExtenso(depois)) continue
        pedacos.push({ texto: original.slice(inicio, m.index), sep: m[0] })
        inicio = m.index + m[0].length
    }
    pedacos.push({ texto: original.slice(inicio), sep: '' })

    const partes = []
    let pendente = ''
    for (const p of pedacos) {
        const atual = pendente + p.texto
        if (extrairValor(atual)) {
            partes.push({ texto: atual, sep: p.sep })
            pendente = ''
        } else if (partes.length && !pendente) {
            const ultima = partes[partes.length - 1]
            ultima.texto += ultima.sep + p.texto
            ultima.sep = p.sep
        } else {
            pendente = atual + p.sep
        }
    }
    if (pendente && partes.length) partes[partes.length - 1].texto += partes[partes.length - 1].sep + pendente
    const limpas = partes.map((p) => p.texto.trim()).filter(Boolean)
    return limpas.length > 1 ? limpas : [original]
}
