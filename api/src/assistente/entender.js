import { capitalizar, contemTermo, normalizar, palavras, parecidas, prepararFrase } from './texto.js'
import { ehNumeroPorExtenso, extrairQuantidade, extrairValor } from './valores.js'
import { extrairData, extrairPeriodo } from './datas.js'
import { PALAVRAS_VAZIAS, PLANO, QUANDO_FUTURO, ROTULOS, TERMOS_POR_TIPO, VERBOS, VERBO_FUTURO } from './dicionario.js'

const TIPOS = ['EXPENSE', 'EARNING', 'INVESTMENT']

const comeca = (frase, padrao) => new RegExp(`^(${padrao})\\b`).test(frase)
const tem = (frase, padrao) => new RegExp(`\\b(${padrao})\\b`).test(frase)
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
    const frase = normalizar(texto).replace(/[,.](?!\d)/g, ' ').replace(/\s+/g, ' ').trim()
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
    const frase = prepararFrase(texto)
    const lista = palavras(frase)
    if (!frase) return { intencao: 'vazio' }

    const valor = extrairValor(texto)
    const data = extrairData(texto, hoje)
    const curta = lista.length <= 4
    const pergunta = /\?\s*$/.test(String(texto).trim()) || comeca(frase, 'quanto|qual|quais|como|onde|cade|me (mostra|diz|fala)|mostra|resumo|saldo|extrato|balanco')

    // "você fez algum lançamento esse mês?": pergunta sobre o que o assistente lançou
    if (pergunta && tem(frase, 'voce (fez|lancou|registrou|anotou|colocou|botou|adicionou)|o que voce (lancou|registrou|anotou)')) {
        return { intencao: 'consulta', tipoConsulta: 'doAssistente', periodo: extrairPeriodo(texto, hoje), confianca: 0.93 }
    }
    if (curta && !valor && comeca(frase, 'sim|s|isso|isso mesmo|pode|pode ser|ok|okay|beleza|certo|confirmo|confirma|manda|vamos|claro|exato|aham|uhum|positivo|perfeito|fechou|show')) {
        return { intencao: 'confirmar', confianca: 0.55 }
    }
    if (curta && !valor && comeca(frase, 'nenhum|nenhuma|nao|n|nada|cancela|cancelar|deixa|deixa pra la|esquece|negativo|errado')) {
        return { intencao: 'negar', confianca: 0.55 }
    }
    // Orçamentos (metas de gasto por categoria): criar, tirar ou consultar
    if (tem(frase, 'orcamentos?|limites?( de gasto)?|metas?( de gasto)?|teto|gastar no maximo')) {
        const categoria = encontrarCategoria(texto, 'EXPENSE', memoria)
        const cat = categoria && categoria.origem !== 'aproximado' ? categoria.categoria : null
        if (tem(frase, 'tira|tirar|tire|remove|remova|remover|apaga|apague|apagar|exclui|excluir|cancela|cancelar') && !pergunta) {
            return { intencao: 'orcamentoRemover', categoria: cat, confianca: 0.94 }
        }
        const criar = tem(frase, 'cria|crie|criar|define|defina|definir|coloca|coloque|bota|bote|estabelece|faz|faca|poe|ponha|quero|muda|mude|altera|altere|aumenta|diminui|gastar no maximo') || (valor && !pergunta)
        if (criar && (valor || cat)) return { intencao: 'orcamentoCriar', valor: valor?.valor ?? null, categoria: cat, confianca: 0.92 }
        return { intencao: 'orcamento', periodo: extrairPeriodo(texto, hoje), confianca: 0.9 }
    }
    if (tem(frase, 'apaga|apagar|apague|desfaz|desfazer|desfaca|exclui|excluir|exclua|remove|remover|remova|tira|tirar|tire|retira|retire|deleta|deletar|delete') && !pergunta) {
        // quantos: "os 3 últimos" → 3; "todos" / "tudo" → os que eu lancei hoje; sem nada → só o último
        // "desde o início" = tudo o que eu já lancei, de qualquer dia
        const desdeOInicio = tem(frase, 'desde o (inicio|comeco|primeiro dia)|desde sempre|de sempre|de todos os tempos|desde que comecei')
        const quantidade = desdeOInicio ? 'sempre' : extrairQuantidade(texto) ?? (tem(frase, 'todos|todas|tudo') ? 'todos' : null)
        // "apaga aquele gasto de 60", "exclui o uber de ontem": procura pela descrição
        const descricao = quantidade ? null : descreverLancamento(texto, { hoje, memoria, valor, data })
        return { intencao: 'desfazer', quantidade, descricao, confianca: 0.92 }
    }
    if (!pergunta && tem(frase, 'voce (lancou|colocou|botou|registrou|anotou|adicionou|lancaste)|lancou (errado|a mais|de novo|duas vezes|mais um|outro)|nao (pedi|mandei) (isso|pra lancar|para lancar)|ta errado|esta errado|ficou errado|deu errado')) {
        return { intencao: 'reclamacao', confianca: 0.85 }
    }
    if (comeca(frase, 'era|na verdade|corrige|corrigir|corrija|muda|mudar|mude|troca|trocar|troque|altera|alterar|altere|edita|editar|edite|atualiza|atualizar|nao era|ops|opa era|errei')) {
        // "muda o gasto de 60 do mercado para 70": o que vem antes do "para" diz qual, o que vem depois diz o novo valor
        const partes = String(texto).split(/\s+(?:para|pra|por)\s+(?=\S)/i)
        if (partes.length >= 2 && comeca(frase, 'corrige|corrigir|corrija|muda|mudar|mude|troca|trocar|troque|altera|alterar|altere|edita|editar|edite|atualiza|atualizar')) {
            const antes = partes.slice(0, -1).join(' para ')
            const depois = partes.at(-1)
            const descricao = descreverLancamento(antes, { hoje, memoria, valor: extrairValor(antes), data: extrairData(antes, hoje) })
            if (descricao) {
                const novoValor = extrairValor(depois)
                const novaData = extrairData(depois, hoje)
                const categorias = Object.fromEntries(TIPOS.map((tipo) => [tipo, encontrarCategoria(depois, tipo, memoria)]))
                return { intencao: 'editar', descricao, valor: novoValor?.valor ?? null, data: novaData?.data ?? null, categorias, confianca: 0.9 }
            }
        }
        const categorias = Object.fromEntries(TIPOS.map((tipo) => [tipo, encontrarCategoria(texto, tipo, memoria)]))
        return { intencao: 'corrigir', valor: valor?.valor ?? null, data: data?.data ?? null, categorias, confianca: 0.85 }
    }

    if (pergunta && (!valor || /\?\s*$/.test(String(texto).trim()))) {
        const forte = tem(frase, 'gast\\w*|ganh\\w*|receb\\w*|saldo|sobr\\w*|invest\\w*|despesas?|receitas?|lanc\\w*|extrato|resumo|categorias?|saiu|entrou|dinheiro')
        const categoriaNaFrase = TIPOS.some((t) => {
            const c = encontrarCategoria(texto, t, memoria)
            return c?.origem === 'dicionario' && !(c.termo === 'oi' && comeca(frase, 'oi'))
        })
        const sobreDinheiro = forte || tem(frase, ASSUNTO_FINANCEIRO) || Boolean(valor) || categoriaNaFrase
        if (!sobreDinheiro) return { intencao: 'desconhecido', pergunta: true, confianca: 0 }
        let tipoConsulta = 'resumo'
        if (tem(frase, 'saldo|sobrou|sobra|tenho|quanto tenho|balanco')) tipoConsulta = 'saldo'
        if (tem(frase, 'onde|mais gastei|maior gasto|maiores gastos|mais pesou|categoria que mais|categoria (que )?(teve|tem|com) mais|com o que mais|qual categoria')) tipoConsulta = 'maior'
        if (tem(frase, 'ultimos|ultimas|recentes|o que (eu )?(lancei|registrei|anotei)')) tipoConsulta = 'ultimos'
        const tipo = tipoPeloVerbo(lista) ?? (tem(frase, 'ganhei|ganho|recebi|entrou') ? 'EARNING' : null)
        let categoria = tipoConsulta === 'resumo' ? encontrarCategoria(texto, tipo ?? 'EXPENSE', memoria) : null
        // "oi, tudo bem?": "oi" aqui é cumprimento, não a operadora
        if (categoria?.termo === 'oi' && comeca(frase, 'oi')) categoria = null
        const achouCategoria = categoria && categoria.origem !== 'aproximado'
        return {
            intencao: 'consulta',
            // Pergunta genérica ("quanto rende 1000?") sem tipo, categoria ou palavra de dinheiro forte não vira resumo do mês
            confianca: !forte && !achouCategoria && !tipo && tipoConsulta === 'resumo' ? 0.45 : Math.min(0.9, 0.6 + (forte ? 0.2 : 0) + (achouCategoria ? 0.1 : 0)),
            tipoConsulta,
            quantidade: extrairQuantidade(texto),
            tipo,
            categoria: categoria && categoria.origem !== 'aproximado' ? categoria.categoria : null,
            periodo: extrairPeriodo(texto, hoje),
        }
    }

    const tipoVerbo = tipoPeloVerbo(lista)
    // "gaste os últimos 3 que lancei": um número de lançamentos sem valor não é um lançamento novo
    if (!valor && extrairQuantidade(texto)) return { intencao: 'quantidade', quantidade: extrairQuantidade(texto), confianca: 0.6 }
    if (valor || tipoVerbo) {
        const tipo = tipoVerbo ?? (valor ? tipoPelaCategoria(texto, memoria) : null)
        const categoria = tipo ? encontrarCategoria(texto, tipo, memoria) : null
        const quando = data ? null : frase.match(QUANDO_FUTURO)?.[0] ?? null
        const plano = PLANO.test(frase)
        const futuro = Boolean(plano || quando || VERBO_FUTURO.test(frase))
        return {
            intencao: 'registrar',
            confianca: futuro ? 0.88 : valor && tipo ? 0.9 : valor ? 0.7 : 0.62,
            futuro,
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
    if (quantidade) return { intencao: 'quantidade', quantidade, confianca: 0.6 }

    return { intencao: 'desconhecido', pergunta, confianca: 0 }
}

// Palavras que não ajudam a achar um lançamento ("apaga aquele gasto de 60")
const SEM_PISTA = new Set(
    'apaga apagar apague exclui excluir exclua remove remover remova tira tirar tire retira retire deleta deletar delete desfaz desfazer corrige corrigir corrija muda mudar mude troca trocar troque altera alterar altere edita editar edite atualiza atualizar aquele aquela aqueles esse essa este esta lancamento lancamentos registro gasto gastos ganho ganhos investimento despesa receita ultimo ultima que eu lancei fiz paguei comprei de do da no na em o a os as um uma reais real r$ valor por favor pfv'.split(' '),
)

/** Pistas para achar um lançamento: valor, data, categoria, tipo e parte do nome. Null se não houver nenhuma. */
export function descreverLancamento(texto, { hoje, memoria, valor, data }) {
    const frase = normalizar(texto)
    const tipo = /\b(ganho|receita|recebi|entrada|salario)\b/.test(frase) ? 'EARNING' : /\binvest/.test(frase) ? 'INVESTMENT' : /\b(gasto|despesa|paguei|comprei)\b/.test(frase) ? 'EXPENSE' : null
    const achada = encontrarCategoria(texto, tipo ?? 'EXPENSE', memoria)
    const categoria = achada && achada.origem !== 'aproximado' ? achada.categoria : null
    let resto = frase
    for (const trecho of [valor?.trecho, data?.trecho].filter(Boolean)) resto = resto.replace(trecho, ' ')
    const termo = palavras(resto)
        .filter((p) => !SEM_PISTA.has(p) && !PALAVRAS_VAZIAS.has(p) && !/^\d/.test(p))
        .join(' ')
        .slice(0, 40)
    const pistas = { valor: valor?.valor ?? null, data: data?.data ?? null, tipo, categoria, termo: termo || null }
    return pistas.valor || pistas.data || pistas.categoria || pistas.termo ? pistas : null
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
