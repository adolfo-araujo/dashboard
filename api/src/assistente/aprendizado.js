// Sistema de aprendizado: detecta quando a pessoa ensina algo, valida e prepara a regra para confirmação.
// Nada é guardado sem o "sim" da pessoa, e uma regra nunca libera ação de escrita (veja permissoes.js).
import { ROTULOS } from './dicionario.js'
import { normalizar, palavras, prepararFrase } from './texto.js'
import { extrairValor } from './valores.js'
import { podeAprenderFrase } from './permissoes.js'

const TIPOS = ['EXPENSE', 'EARNING', 'INVESTMENT']
const VAZIAS_DO_TERMO = new Set('o a os as um uma de do da dos das no na nos nas em eu "'.split(' '))

// Palavras de uma expressão ensinada, sem aspas e artigos ("o lanche" → "lanche")
export const limparTermo = (texto) =>
    palavras(String(texto).replace(/["“”']/g, ' '))
        .filter((p) => !VAZIAS_DO_TERMO.has(p))
        .join(' ')
        .slice(0, 60)

/** Categoria a partir do nome dito pela pessoa ("alimentação", "contas", "comida" → alimentacao). */
export function categoriaPeloNome(texto, tipoPreferido = null) {
    const alvo = normalizar(texto)
        .replace(/\b(a|o|na|no|em|categoria|de|da|do)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    if (!alvo) return null
    const tipos = tipoPreferido ? [tipoPreferido, ...TIPOS.filter((t) => t !== tipoPreferido)] : TIPOS
    for (const tipo of tipos) {
        for (const [chave, nome] of Object.entries(ROTULOS[tipo])) {
            if (alvo === chave || alvo === normalizar(nome) || normalizar(nome).startsWith(`${alvo} `)) return { tipo, categoria: chave }
        }
    }
    const sinonimos = { comida: 'alimentacao', mercado: 'alimentacao', carro: 'transporte', casa: 'moradia', aluguel: 'moradia', remedio: 'saude', streaming: 'assinaturas', imposto: 'impostos' }
    if (sinonimos[alvo]) return { tipo: 'EXPENSE', categoria: sinonimos[alvo] }
    return null
}

/** O que a pessoa quer ver quando fizer a pergunta ensinada ("receita menos despesas" → 'sobra'). */
export function alvoDaFrase(texto) {
    const f = prepararFrase(texto)
    if (/\b(apag|exclu|delet|remov|lanc|registr|transfer|pag|envi|mand)\w*/.test(f) && !/\b(quanto|ver|saber|mostr)\w*/.test(f)) return 'proibido'
    const fala = (padrao) => new RegExp(`\\b(${padrao})`).test(f)
    const receita = fala('receita|ganho|entrada|recebi|entrou|renda|salario')
    const despesa = fala('despesa|gasto|saida|saiu|gastei')
    const menos = fala('menos|tirando|subtrai|descontando|sem')
    if (receita && despesa && menos) return fala('invest|aplica') ? 'saldo' : 'sobra'
    if (fala('saldo')) return 'saldo'
    if (fala('onde|maior|mais pesou|categoria que mais')) return 'maior'
    if (fala('ultimos|ultimas|recentes')) return 'ultimos'
    if (fala('orcamento|limite')) return 'orcamentos'
    if (fala('analise|como estou|situacao|opiniao')) return 'analise'
    if (fala('invest|aplica')) return 'investimentos'
    if (receita) return 'ganhos'
    if (despesa) return 'gastos'
    if (fala('resumo|extrato|balanco')) return 'resumo'
    return null
}

/**
 * Detecta um pedido ligado ao aprendizado. Retorna um destes, ou null:
 * { tipo: 'categoria', termo, categoria, tipoLancamento } — "quando eu falar lanche, é alimentação"
 * { tipo: 'frase', termo, alvo } — "quando eu perguntar quanto sobrou, quero saber receita menos despesas"
 * { tipo: 'preferencia', chave, valor } — "me chama de Jão", "sempre me pergunte antes de lançar"
 * { tipo: 'listar' } | { tipo: 'esquecer', termo } | { tipo: 'esquecerTudo' } | { tipo: 'invalido', motivo }
 */
export function detectarEnsino(texto) {
    const f = prepararFrase(texto)
    const original = String(texto)
    // Versão sem troca de gírias, para guardar a palavra exatamente como a pessoa usa ("rango")
    const leve = normalizar(texto).replace(/[,.](?!\d)/g, ' ').replace(/\s+/g, ' ').trim()
    const casar = (padrao) => leve.match(padrao) ?? f.match(padrao)

    if (/\b(o que|oque|quais coisas) (voce )?(aprendeu|sabe sobre mim|guardou|lembra de mim)\b|\b(mostra|mostre|ver|lista) (o que voce aprendeu|sua memoria|a memoria|minhas regras|minhas preferencias)\b/.test(f)) {
        return { tipo: 'listar' }
    }
    if (/\b(esquece|esqueca|apaga|apague|limpa|limpe) (tudo (o )?que (voce )?aprendeu|sua memoria|a memoria|tudo que eu te ensinei|o que voce aprendeu)\b/.test(f)) {
        return { tipo: 'esquecerTudo' }
    }
    const esquecer = f.match(/^(?:esquece|esqueca|desaprende|nao lembra mais)(?: (?:que|o que|do|da|de|sobre|a regra|a palavra|a expressao))* (.+)$/)
    if (esquecer && !/\b(apelido|nome)\b/.test(esquecer[1])) return { tipo: 'esquecer', termo: limparTermo(esquecer[1].replace(/\b(e|eh) .*$/, '')) }

    // Preferências
    const apelido = original.match(/\b(?:me chama|me chame|pode me chamar|meu apelido [eé]|quero ser chamad[oa])\s+(?:de\s+)?([\p{L}]+(?: [\p{L}]+)?)/iu)
    if (apelido) return { tipo: 'preferencia', chave: 'apelido', valor: apelido[1].slice(0, 30) }
    if (/\b(esquece|esqueca|nao use|tira) (meu|o) (apelido|nome)\b/.test(f)) return { tipo: 'preferencia', chave: 'apelido', valor: null }
    if (/\b(sempre )?(me )?(pergunte|pergunta|confirme|confirma|confere|confira) antes de (lancar|registrar|anotar|salvar)\b/.test(f)) {
        return { tipo: 'preferencia', chave: 'confirmar', valor: 'sim' }
    }
    if (/\b(pode )?(lancar|registrar|anotar) direto\b|\bnao precisa (me )?(perguntar|confirmar)( antes)?\b/.test(f)) {
        return { tipo: 'preferencia', chave: 'confirmar', valor: null }
    }

    // "quando eu perguntar X, quero saber Y"
    const frase = casar(/^(?:quando|sempre que|se) eu (?:perguntar|pergunto|disser|digo|falar|escrever|mandar) (.+?),? (?:eu )?(?:quero|queria|gostaria de|preciso) (?:que voce )?(?:saber|ver|que mostre|que me mostre|que diga|que responda|que calcule|o|a)? ?(.+)$/)
        ?? casar(/^(?:quando|sempre que|se) eu (?:perguntar|pergunto) (.+?),? (?:voce |vc )?(?:me )?(?:mostra|mostre|responde|responda|diz|diga|calcula|calcule|considera|considere|entende|entenda)(?: como)? (.+)$/)
    if (frase) {
        const termo = limparTermo(frase[1])
        const alvo = alvoDaFrase(frase[2])
        if (!termo) return null
        if (alvo === 'proibido') return { tipo: 'invalido', motivo: 'acao' }
        if (!alvo || !podeAprenderFrase(alvo)) return { tipo: 'invalido', motivo: 'alvo', termo }
        return { tipo: 'frase', termo, alvo }
    }

    // "quando eu falar lanche, normalmente é alimentação" / "considera lanche como alimentação" / "lanche não é lazer, é alimentação"
    const categoria =
        casar(/^(?:quando|sempre que|se) eu (?:falar|disser|digo|escrever|mandar|colocar|botar|digitar) (.+?),? (?:normalmente |geralmente |sempre |quase sempre |isso )?(?:e|significa|quer dizer|conta como|coloca em|bota em|lanca em|vai para|vai pra|vai em|e de|e da categoria|e categoria|e na categoria|e em) (.+)$/)
        ?? casar(/^(?:considera|considere|entenda|entende|trate|trata|registre|registra|lance|lanca|coloca|coloque|bota|bote) (?:sempre )?(.+?) (?:sempre )?(?:como|na categoria|em) (.+)$/)
        ?? casar(/^(.{2,40}?) nao e (?:\S+(?: \S+)?),? (?:e|eh) (?:de |da |categoria )?(.+)$/)
    if (categoria) {
        if (extrairValor(categoria[1])) return null
        const termo = limparTermo(categoria[1])
        const achada = categoriaPeloNome(categoria[2])
        if (!termo) return null
        if (!achada) {
            const alvo = alvoDaFrase(categoria[2])
            if (alvo && alvo !== 'proibido' && podeAprenderFrase(alvo) && /\b(quanto|qual|como)\b/.test(termo)) return { tipo: 'frase', termo, alvo }
            return { tipo: 'invalido', motivo: 'categoria', termo }
        }
        return { tipo: 'categoria', termo, categoria: achada.categoria, tipoLancamento: achada.tipo }
    }
    return null
}

/** A frase bate com alguma pergunta ensinada? Devolve o alvo. */
export function fraseEnsinada(texto, termos) {
    const f = limparTermo(texto)
    if (!f) return null
    for (const [chave, alvo] of termos ?? []) {
        if (!chave.startsWith('FRASE:')) continue
        const termo = chave.slice(6)
        if (f === termo || f.startsWith(`${termo} `) || f.endsWith(` ${termo}`)) return { termo, alvo }
    }
    return null
}
