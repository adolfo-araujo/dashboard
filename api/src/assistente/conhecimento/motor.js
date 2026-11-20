// Motor da base de conhecimento: acha o tópico mais parecido com a pergunta e monta a resposta.
// Para adicionar conhecimento, crie um tópico num dos arquivos desta pasta (veja LEIAME.md).
import { palavras, parecidas, prepararFrase } from '../texto.js'
import { TOPICOS } from './topicos.js'

// Palavras que não ajudam a diferenciar uma pergunta da outra
const VAZIAS = new Set(
    ('o a os as um uma uns umas de do da dos das no na nos nas em e ou pra para por pelo pela com sem eu me mim meu minha ' +
        'meus minhas te ti seu sua seus suas isso isto esse essa este esta aquilo ai la entao ne so tipo assim ja ate ' +
        'se mais bem ser sao foi sobre vou vai aqui agora favor por favor pode poderia consegue sabe').split(' '),
)

// Palavras que querem dizer a mesma coisa viram uma só
const GRUPOS = [
    ['gasto', 'gastos', 'despesa', 'despesas', 'saida', 'saidas', 'gastei', 'gastar', 'gastando'],
    ['ganho', 'ganhos', 'receita', 'receitas', 'entrada', 'entradas', 'renda', 'salario'],
    ['investimento', 'investimentos', 'investir', 'aplicacao', 'aplicacoes', 'aplicar', 'investi'],
    ['criou', 'criador', 'criadora', 'fez', 'desenvolveu', 'desenvolvedor', 'dono', 'criaram', 'fundou', 'programou', 'criada', 'criado', 'feita', 'feito'],
    ['nome', 'chama', 'chamar', 'chamo'],
    ['ajudar', 'ajuda', 'auxiliar', 'ajudo'],
    ['funciona', 'funcionamento', 'trabalha', 'opera', 'pensa', 'entende'],
    ['fazer', 'faz', 'faco', 'consigo', 'consegue', 'capaz', 'servir', 'serve'],
    ['reserva', 'colchao', 'fundo'],
    ['emergencia', 'emergencias', 'imprevisto', 'imprevistos'],
    ['divida', 'dividas', 'endividado', 'endividada', 'devendo', 'debito', 'debitos'],
    ['cartao', 'fatura', 'rotativo'],
    ['guardar', 'poupar', 'economizar', 'juntar', 'sobrar'],
    ['ia', 'inteligencia', 'robo', 'bot', 'chatgpt', 'gpt', 'maquina'],
    ['dados', 'informacoes', 'mensagens', 'conversas', 'privacidade'],
    ['oi', 'ola', 'opa', 'salve', 'eai', 'hey', 'hello'],
    ['obrigado', 'obrigada', 'valeu', 'agradeco', 'brigado'],
    ['tchau', 'adeus', 'falou', 'flw', 'xau', 'ate logo', 'ate mais'],
    ['orcamento', 'orcamentos', 'limite', 'limites', 'teto', 'meta', 'metas'],
    ['importar', 'importo', 'importacao', 'extrato', 'ofx', 'csv'],
    ['exportar', 'exporto', 'planilha', 'excel', 'baixar'],
    ['senha', 'senhas'],
    ['golpe', 'golpes', 'fraude', 'fraudes'],
]
const CANONICA = new Map(GRUPOS.flatMap((g) => g.map((p) => [p, g[0]])))
const canonica = (p) => CANONICA.get(p) ?? p

export const tokens = (texto) => [...new Set(palavras(prepararFrase(texto)).filter((p) => !VAZIAS.has(p)).map(canonica))]

// Semelhança entre dois conjuntos de palavras (Dice), tolerando erro de digitação
function semelhanca(a, b) {
    if (!a.length || !b.length) return { valor: 0, iguais: 0 }
    let iguais = 0
    for (const p of a) if (b.some((q) => q === p || parecidas(p, q))) iguais++
    return { valor: (2 * iguais) / (a.length + b.length), iguais }
}

// Perguntas já transformadas em palavras, calculadas uma vez
const INDICE = TOPICOS.map((t) => ({ topico: t, perguntas: t.perguntas.map(tokens), chaves: (t.chaves ?? []).map(canonica) }))

/** Tópico mais parecido com a frase: { topico, pontuacao } ou null. */
export function buscarConhecimento(texto) {
    const msg = tokens(texto)
    if (!msg.length) return null
    let melhor = null
    for (const { topico, perguntas, chaves } of INDICE) {
        const notas = perguntas.map((q) => semelhanca(msg, q))
        const melhorNota = notas.reduce((a, b) => (b.valor > a.valor ? b : a))
        let pontuacao = melhorNota.valor
        if (chaves.length) {
            const presentes = chaves.filter((c) => msg.some((p) => p === c || parecidas(p, c))).length
            if (presentes === chaves.length) pontuacao = Math.min(1, pontuacao + 0.15)
            else if (!presentes) pontuacao *= 0.6
        }
        if (!melhor || pontuacao > melhor.pontuacao) melhor = { topico, pontuacao, palavrasEmComum: melhorNota.iguais }
    }
    return melhor
}

export const topicoPorId = (id) => TOPICOS.find((t) => t.id === id) ?? null
