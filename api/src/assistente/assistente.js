import { interpretar, encontrarCategoria } from './entender.js'
import { extrairValor } from './valores.js'
import { formatarData, hojeEm } from './datas.js'
import { combinarEstilo, escolher, lerEstilo, semente } from './estilo.js'
import { NOME_DO_TIPO, PALAVRAS_VAZIAS, ROTULOS } from './dicionario.js'
import { capitalizar, formatarDinheiro, normalizar, palavras } from './texto.js'

export const PENDENCIA_MINUTOS = 10

const rotulo = (tipo, categoria) => ROTULOS[tipo]?.[categoria] ?? 'Outros'
const opcoesDeCategoria = (tipo) => Object.values(ROTULOS[tipo])
const porcento = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0)

// Termo que o assistente vai lembrar quando a pessoa ensinar uma categoria ("ifood", "padaria do zé").
function termoParaAprender(nome) {
    const uteis = palavras(nome ?? '').filter((p) => !PALAVRAS_VAZIAS.has(p) && !/^\d/.test(p))
    return uteis.slice(0, 3).join(' ').slice(0, 60) || null
}

function descrever(l, hoje) {
    const cat = rotulo(l.type, l.category)
    const nome = l.name && normalizar(l.name) !== normalizar(cat) ? ` (${l.name})` : ''
    return `${NOME_DO_TIPO[l.type]} de ${formatarDinheiro(l.amount)} em ${cat}${nome}, ${formatarData(l.date, hoje)}`
}

function tipoDaResposta(texto) {
    const f = normalizar(texto)
    if (/\b(gasto|gastei|despesa|saida|paguei|conta)\b/.test(f)) return 'EXPENSE'
    if (/\b(ganho|ganhei|entrada|receita|recebi|salario)\b/.test(f)) return 'EARNING'
    if (/\b(invest\w*|aplica\w*|guardei|aporte)\b/.test(f)) return 'INVESTMENT'
    return null
}

function categoriaDaResposta(texto, tipo, memoria) {
    const numero = normalizar(texto).match(/^(\d{1,2})$/)
    const chaves = Object.keys(ROTULOS[tipo])
    if (numero && chaves[Number(numero[1]) - 1]) return chaves[Number(numero[1]) - 1]
    const exato = chaves.find((k) => normalizar(ROTULOS[tipo][k]) === normalizar(texto))
    if (exato) return exato
    return encontrarCategoria(texto, tipo, memoria)?.categoria ?? null
}

/**
 * Cria o assistente. `repo` é quem fala com o banco (veja repositorio.js); nos testes, um falso em memória.
 * processar() recebe uma mensagem e devolve { respostas: string[], opcoes: string[], acao? }.
 * acao ('lancado' | 'corrigido') diz à tela que algo mudou no Finance, para dar o retorno visual.
 */
export function criarAssistente(repo) {
    async function processar({ userId, texto, agora = new Date() }) {
        const hoje = hojeEm(agora)
        const [memoria, pendencia, primeiroNome] = await Promise.all([
            repo.carregarMemoria(userId),
            repo.lerPendencia(userId, agora),
            repo.primeiroNome(userId),
        ])
        const estilo = combinarEstilo(lerEstilo(texto), memoria.estilo)
        const s = semente(`${texto}${agora.getTime()}`)
        const fala = criarFala(estilo, s, primeiroNome)
        const ctx = { userId, texto, hoje, memoria, estilo, fala, agora }

        if (pendencia) {
            const resposta = await continuarPendencia(ctx, pendencia)
            if (resposta) return resposta
            await repo.salvarPendencia(userId, null)
        }

        const entendido = interpretar(texto, { hoje, memoria })
        switch (entendido.intencao) {
            case 'registrar':
                return registrar(ctx, entendido)
            case 'corrigir':
                return corrigir(ctx, entendido)
            case 'desfazer':
                return desfazer(ctx)
            case 'consulta':
                return consultar(ctx, entendido)
            case 'orcamento':
                return orcamentos(ctx, entendido)
            case 'saudacao':
                return fala.saudacao()
            case 'agradecimento':
                return fala.agradecimento()
            case 'ajuda':
                return fala.ajuda()
            case 'confirmar':
            case 'negar':
                return fala.semPendencia()
            default:
                return fala.naoEntendi()
        }
    }

    async function continuarPendencia(ctx, p) {
        const { userId, texto, memoria, fala, hoje } = ctx
        const f = normalizar(texto)

        // Se a mensagem já é um pedido novo e completo, a pergunta anterior fica para trás.
        const novo = interpretar(texto, { hoje, memoria })
        const outroAssunto = ['consulta', 'desfazer', 'corrigir', 'ajuda', 'orcamento', 'saudacao'].includes(novo.intencao)
        const outroLancamento =
            novo.intencao === 'registrar' &&
            (p.etapa === 'valor' ? Boolean(novo.categoria || novo.tipoExplicito) : Boolean(novo.valor))
        if (outroAssunto || outroLancamento) return null

        const negou = /^(nao|n|cancela|cancelar|esquece|deixa|deixa pra la)\b/.test(f)
        if (negou) {
            await repo.salvarPendencia(userId, null)
            return fala.cancelado()
        }

        if (p.etapa === 'confirmar') {
            if (/^(sim|s|isso|pode|ok|beleza|blz|certo|confirmo|confirma|manda|bora|claro|exato|aham|uhum|fechou|show)\b/.test(f)) {
                return lancar(ctx, p.lancamento, p.aprender)
            }
            return null
        }

        if (p.etapa === 'tipo') {
            const tipo = tipoDaResposta(texto)
            if (!tipo) return null
            const achado = encontrarCategoria(p.lancamento.textoOriginal ?? '', tipo, memoria)
            return seguir(ctx, { ...p.lancamento, type: tipo, category: achado?.categoria ?? null })
        }

        if (p.etapa === 'valor') {
            const valor = extrairValor(texto)
            if (!valor) return null
            return seguir(ctx, { ...p.lancamento, amount: valor.valor })
        }

        if (p.etapa === 'categoria') {
            const categoria = categoriaDaResposta(texto, p.lancamento.type, memoria)
            if (!categoria) return null
            const aprender = p.termo ? { tipo: p.lancamento.type, termo: p.termo, categoria } : null
            return lancar(ctx, { ...p.lancamento, category: categoria }, aprender)
        }
        return null
    }

    // Decide o próximo passo de um lançamento: perguntar o que falta ou lançar.
    async function seguir(ctx, l, { confirmar = false } = {}) {
        const { userId, fala } = ctx
        if (!l.type) {
            await repo.salvarPendencia(userId, { etapa: 'tipo', lancamento: l })
            return fala.perguntarTipo(l.amount)
        }
        if (!l.amount) {
            await repo.salvarPendencia(userId, { etapa: 'valor', lancamento: l })
            return fala.perguntarValor(l)
        }
        if (!l.category) {
            const termo = termoParaAprender(l.name)
            await repo.salvarPendencia(userId, { etapa: 'categoria', lancamento: l, termo })
            return fala.perguntarCategoria(l)
        }
        if (confirmar) {
            await repo.salvarPendencia(userId, { etapa: 'confirmar', lancamento: l })
            return fala.confirmar(descrever({ ...l, name: l.name }, ctx.hoje))
        }
        return lancar(ctx, l)
    }

    async function registrar(ctx, e) {
        const lancamento = {
            type: e.tipo,
            amount: e.valor,
            category: e.categoria,
            name: e.nome,
            date: e.data,
            textoOriginal: ctx.texto,
        }
        return seguir(ctx, lancamento, { confirmar: e.origemCategoria === 'aproximado' })
    }

    async function lancar(ctx, l, aprender) {
        const { userId, hoje, fala } = ctx
        const nome = (l.name ?? rotulo(l.type, l.category)).slice(0, 50)
        const criado = await repo.criarLancamento(userId, {
            name: capitalizar(nome),
            amount: l.amount,
            type: l.type,
            category: l.category,
            date: l.date ?? hoje,
        })
        await repo.salvarPendencia(userId, null)
        if (aprender?.termo) await repo.ensinar(userId, aprender.tipo, aprender.termo, aprender.categoria)
        await repo.salvarEstilo(userId, ctx.estilo)

        const respostas = [fala.lancado(descrever({ ...criado, date: l.date ?? hoje }, hoje), Boolean(aprender?.termo))]
        if (l.type === 'EXPENSE') {
            const alerta = await alertaDeOrcamento(ctx, l.category, Number(criado.amount))
            if (alerta) respostas.push(alerta)
        }
        return { respostas, opcoes: [], acao: 'lancado' }
    }

    async function alertaDeOrcamento(ctx, categoria, valor) {
        const [ano, mes] = ctx.hoje.split('-')
        const inicio = `${ano}-${mes}-01`
        const lista = await repo.orcamentos(ctx.userId, inicio, ctx.hoje)
        const o = lista.find((b) => b.category === categoria)
        if (!o || !o.amount) return null
        const antes = porcento(o.spent - valor, o.amount)
        const agora = porcento(o.spent, o.amount)
        if (agora >= 100 && antes < 100) return ctx.fala.estourou(rotulo('EXPENSE', categoria), o.spent, o.amount, agora)
        if (agora >= 80 && antes < 80) return ctx.fala.quaseLimite(rotulo('EXPENSE', categoria), o.spent, o.amount, agora)
        return null
    }

    async function corrigir(ctx, e) {
        const { userId, hoje, fala } = ctx
        const ultimo = await repo.ultimoLancamentoDoAssistente(userId)
        if (!ultimo) return fala.nadaParaCorrigir()
        const campos = {}
        if (e.valor) campos.amount = e.valor
        if (e.data && e.data !== hoje) campos.date = e.data
        const novaCategoria = e.categorias?.[ultimo.type]
        if (novaCategoria && novaCategoria.categoria !== ultimo.category) campos.category = novaCategoria.categoria
        if (!Object.keys(campos).length) return fala.oQueCorrigir(descrever(ultimo, hoje))

        const atualizado = await repo.atualizarLancamento(userId, ultimo.id, campos)
        if (!atualizado) return fala.nadaParaCorrigir()
        const termo = campos.category ? termoParaAprender(ultimo.name) : null
        if (termo) await repo.ensinar(userId, ultimo.type, termo, campos.category)
        return fala.corrigido(descrever(atualizado, hoje), Boolean(termo))
    }

    async function desfazer(ctx) {
        const { userId, hoje, fala } = ctx
        const ultimo = await repo.ultimoLancamentoDoAssistente(userId)
        if (!ultimo) return fala.nadaParaApagar()
        await repo.apagarLancamento(userId, ultimo.id)
        return fala.apagado(descrever(ultimo, hoje))
    }

    async function consultar(ctx, e) {
        const { userId, fala } = ctx
        const { inicio, fim, nome } = e.periodo
        if (e.tipoConsulta === 'ultimos') {
            const lista = await repo.ultimos(userId, 5)
            return fala.ultimos(lista.map((l) => descrever(l, ctx.hoje)))
        }
        if (e.tipoConsulta === 'maior') {
            const lista = await repo.porCategoria(userId, e.tipo ?? 'EXPENSE', inicio, fim)
            const total = lista.reduce((s2, r) => s2 + r.total, 0)
            const top = lista.slice(0, 3).map((r) => `${rotulo(e.tipo ?? 'EXPENSE', r.category)}: ${formatarDinheiro(r.total)} (${porcento(r.total, total)}%)`)
            return fala.maiores(top, nome, e.tipo ?? 'EXPENSE')
        }
        if (e.categoria) {
            const tipo = e.tipo ?? 'EXPENSE'
            const lista = await repo.porCategoria(userId, tipo, inicio, fim)
            const achado = lista.find((r) => r.category === e.categoria)
            return fala.totalCategoria(rotulo(tipo, e.categoria), achado?.total ?? 0, nome, tipo)
        }
        const t = await repo.totais(userId, inicio, fim)
        if (e.tipoConsulta === 'resumo' && e.tipo) return fala.totalTipo(e.tipo, t[e.tipo], nome)
        return fala.saldo(t, nome)
    }

    async function orcamentos(ctx, e) {
        const lista = await repo.orcamentos(ctx.userId, e.periodo.inicio, e.periodo.fim)
        const linhas = lista.map(
            (o) => `${rotulo('EXPENSE', o.category)}: ${formatarDinheiro(o.spent)} de ${formatarDinheiro(o.amount)} (${porcento(o.spent, o.amount)}%)`,
        )
        return ctx.fala.orcamentos(linhas)
    }

    return { processar }
}

// Frases do assistente, no tom de quem escreve: mais solto se a pessoa é informal, com emoji se ela usa.
function criarFala(estilo, s, primeiroNome) {
    const solto = estilo.informal
    const e = (emoji) => (estilo.emoji ? ` ${emoji}` : '')
    const v = (...opcoes) => escolher(opcoes, s)
    const r = (respostas, opcoes = []) => ({ respostas: [].concat(respostas), opcoes })
    const nome = primeiroNome ? `, ${primeiroNome}` : ''
    const exemplos = 'Por exemplo: "gastei 40 no mercado", "recebi 2500 de salário", "quanto gastei esse mês?" ou "apaga o último".'

    return {
        saudacao: () =>
            r(
                solto
                    ? v(`E aí${nome}!${e('👋')} Manda um gasto ou uma pergunta.`, `Opa${nome}!${e('👋')} O que vamos anotar?`)
                    : v(`Olá${nome}!${e('👋')} Posso anotar um gasto ou um ganho, ou responder sobre o seu mês.`, `Oi${nome}! Em que posso ajudar com as suas finanças?`),
                ['Gastei 30 no almoço', 'Quanto gastei esse mês?'],
            ),
        agradecimento: () => r(solto ? v(`Tmj!${e('🤝')}`, `De nada!${e('😉')}`, 'Precisando, é só mandar.') : v('Por nada!', 'Disponha. Precisando, é só escrever.')),
        ajuda: () =>
            r([
                'Eu anoto seus gastos, ganhos e investimentos, respondo quanto você gastou e aviso quando chegar perto do orçamento.',
                exemplos,
                'Quanto mais você usa, mais eu aprendo o seu jeito de escrever e as suas categorias.',
            ]),
        naoEntendi: () =>
            r(
                solto
                    ? v('Não peguei essa. Tenta me falar o valor e onde foi, tipo "40 no mercado".', 'Hmm, não entendi. Pode mandar de outro jeito?')
                    : v('Não entendi essa mensagem. Pode escrever o valor e onde foi? Ex.: "40 no mercado".', 'Desculpe, não entendi. Pode reformular?'),
                ['Ajuda'],
            ),
        semPendencia: () => r(solto ? 'Beleza! Manda o próximo quando quiser.' : 'Certo. Quando quiser, é só mandar o próximo lançamento.'),
        cancelado: () => r(solto ? v(`Beleza, não anotei nada.${e('👍')}`, 'Ok, deixei pra lá.') : 'Certo, cancelei. Nada foi lançado.'),
        perguntarTipo: (valor) =>
            r(
                valor
                    ? `${formatarDinheiro(valor)} foi um gasto, um ganho ou um investimento?`
                    : 'Isso foi um gasto, um ganho ou um investimento?',
                ['Gasto', 'Ganho', 'Investimento'],
            ),
        perguntarValor: (l) => r(solto ? `Quanto deu${l.name ? ` "${l.name}"` : ''}?` : `Qual foi o valor${l.name ? ` de "${l.name}"` : ''}?`),
        perguntarCategoria: (l) =>
            r(
                solto
                    ? `Em qual categoria eu boto ${formatarDinheiro(l.amount)}${l.name ? ` de ${l.name}` : ''}? Da próxima eu já lembro.`
                    : `Em qual categoria lanço ${formatarDinheiro(l.amount)}${l.name ? ` de ${l.name}` : ''}? Vou lembrar para as próximas vezes.`,
                opcoesDeCategoria(l.type),
            ),
        confirmar: (descricao) => r(`Entendi ${descricao}. Posso lançar?`, ['Sim', 'Não']),
        lancado: (descricao, aprendeu) =>
            (solto
                ? v(`Anotado!${e('✅')} ${capitalizar(descricao)}.`, `Feito${e('✅')}: ${descricao}.`, `Pronto, ${descricao}.`)
                : v(`Lançado: ${descricao}.${e('✅')}`, `Registrei ${descricao}.${e('✅')}`)) + (aprendeu ? ' Guardei essa categoria para a próxima.' : ''),
        estourou: (cat, gasto, limite, pct) =>
            `${estilo.emoji ? '🚨 ' : ''}Você passou do orçamento de ${cat}: ${formatarDinheiro(gasto)} de ${formatarDinheiro(limite)} (${pct}%).`,
        quaseLimite: (cat, gasto, limite, pct) =>
            `${estilo.emoji ? '⚠️ ' : ''}Atenção: já usou ${pct}% do orçamento de ${cat} (${formatarDinheiro(gasto)} de ${formatarDinheiro(limite)}).`,
        nadaParaCorrigir: () => r('Não achei nada lançado por mim para corrigir. Você pode editar pelo painel.'),
        oQueCorrigir: (descricao) => r(`O último foi ${descricao}. O que mudo? Ex.: "era 45", "era transporte" ou "foi ontem".`),
        corrigido: (descricao, aprendeu) => ({
            ...r(`Corrigido: ${descricao}.${aprendeu ? ' Também guardei essa categoria para a próxima.' : ''}`),
            acao: 'corrigido',
        }),
        nadaParaApagar: () => r('Não achei nada lançado por mim para apagar. Você pode excluir pelo painel.'),
        apagado: (descricao) => r(solto ? `Apaguei: ${descricao}.` : `Pronto, apaguei ${descricao}.`),
        ultimos: (linhas) => r(linhas.length ? ['Seus últimos lançamentos:', ...linhas.map((l) => `• ${capitalizar(l)}`)] : 'Você ainda não tem lançamentos.'),
        maiores: (linhas, periodo, tipo) =>
            r(
                linhas.length
                    ? [`Onde ${tipo === 'EXPENSE' ? 'mais pesou' : 'mais entrou'} ${periodo}:`, ...linhas.map((l) => `• ${l}`)]
                    : `Nada lançado ${periodo} ainda.`,
            ),
        totalCategoria: (cat, total, periodo, tipo) =>
            r(`${tipo === 'EXPENSE' ? 'Você gastou' : tipo === 'EARNING' ? 'Entrou' : 'Você investiu'} ${formatarDinheiro(total)} em ${cat} ${periodo}.`),
        totalTipo: (tipo, total, periodo) =>
            r(`${tipo === 'EXPENSE' ? 'Você gastou' : tipo === 'EARNING' ? 'Você recebeu' : 'Você investiu'} ${formatarDinheiro(total ?? 0)} ${periodo}.`),
        saldo: (t, periodo) => {
            const saldo = (t.EARNING ?? 0) - (t.EXPENSE ?? 0) - (t.INVESTMENT ?? 0)
            return r([
                `Resumo ${periodo}: entrou ${formatarDinheiro(t.EARNING ?? 0)}, saiu ${formatarDinheiro(t.EXPENSE ?? 0)} e foi investido ${formatarDinheiro(t.INVESTMENT ?? 0)}.`,
                `Saldo: ${formatarDinheiro(saldo)}.${saldo < 0 && estilo.emoji ? ' 😬' : ''}`,
            ])
        },
        orcamentos: (linhas) =>
            r(linhas.length ? ['Seus orçamentos neste mês:', ...linhas.map((l) => `• ${l}`)] : 'Você ainda não definiu orçamentos. Dá para criar pelo painel, no card de orçamento.'),
    }
}
