import { dividirLancamentos, interpretar, encontrarCategoria } from './entender.js'
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
const CONFIRMA = /^(sim|s|isso|pode|ok|beleza|blz|certo|confirmo|confirma|manda|bora|claro|exato|aham|uhum|fechou|show)\b/
const MAXIMO_PARA_APAGAR = 20

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
        if (entendido.intencao === 'registrar' && !entendido.futuro) {
            const partes = dividirLancamentos(texto)
            if (partes.length > 1) return registrarVarios(ctx, partes, entendido)
        }
        switch (entendido.intencao) {
            case 'registrar':
                return registrar(ctx, entendido)
            case 'reclamacao':
                return reclamacao(ctx)
            case 'quantidade':
                return fala.verOuApagar(Math.min(entendido.quantidade, MAXIMO_PARA_APAGAR))
            case 'corrigir':
                return corrigir(ctx, entendido)
            case 'desfazer':
                return desfazer(ctx, entendido)
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

        const novo = interpretar(texto, { hoje, memoria })

        // Confirmação de apagar vários: "sim" ou um novo "apaga" sem número confirmam.
        if (p.etapa === 'apagar') {
            if (CONFIRMA.test(f) || (novo.intencao === 'desfazer' && !novo.quantidade)) {
                for (const id of p.ids) await repo.apagarLancamento(userId, id)
                await repo.salvarPendencia(userId, null)
                return fala.apagadosVarios(p.ids.length)
            }
        }

        // Se a mensagem já é um pedido novo e completo, a pergunta anterior fica para trás.
        const outroAssunto = ['consulta', 'desfazer', 'corrigir', 'ajuda', 'orcamento', 'saudacao', 'reclamacao', 'quantidade'].includes(novo.intencao)
        const outroLancamento =
            novo.intencao === 'registrar' &&
            (p.etapa === 'valor' ? Boolean(novo.categoria || novo.tipoExplicito) : Boolean(novo.valor))
        if (outroAssunto || outroLancamento) return null

        const negou = /^(nenhum|nenhuma|nao|n|cancela|cancelar|esquece|deixa|deixa pra la)\b/.test(f)
        if (negou) {
            await repo.salvarPendencia(userId, null)
            return p.etapa === 'apagar' ? fala.naoApaguei() : fala.cancelado()
        }

        if (p.etapa === 'confirmar') {
            if (CONFIRMA.test(f)) {
                return lancar(ctx, p.lancamento, p.aprender)
            }
            return null
        }

        if (p.etapa === 'futuro') {
            if (/^(sim|s|isso|pode|ok|beleza|blz|certo|confirmo|confirma|manda|bora|claro|exato|aham|uhum|fechou|show|ja|lanca|lancar)\b/.test(f)) {
                return seguir(ctx, { ...p.lancamento, date: hoje })
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
        // Ainda não aconteceu: não lança sozinho; explica e oferece lançar se a pessoa disser que já foi.
        if (e.futuro) {
            await repo.salvarPendencia(ctx.userId, { etapa: 'futuro', lancamento })
            return ctx.fala.futuro(lancamento, e)
        }
        return seguir(ctx, lancamento, { confirmar: e.origemCategoria === 'aproximado' })
    }

    async function lancar(ctx, l, aprender) {
        const { descricao, alerta } = await gravar(ctx, l, aprender)
        const respostas = [ctx.fala.lancado(descricao, Boolean(aprender?.termo))]
        if (alerta) respostas.push(alerta)
        return { respostas, opcoes: [], acao: 'lancado' }
    }

    // Vários lançamentos numa mensagem: lança os que entendeu por inteiro e pergunta pelo primeiro que faltar algo.
    async function registrarVarios(ctx, partes, inteiro) {
        const { hoje, memoria, fala } = ctx
        let tipoAnterior = null
        const itens = []
        for (const parte of partes) {
            const e = interpretar(parte, { hoje, memoria })
            if (e.intencao !== 'registrar') return registrar(ctx, inteiro)
            // "gastei 40 no mercado e 20 no zezinho": o verbo do começo vale para o resto
            if (!e.tipo && tipoAnterior) {
                const achado = encontrarCategoria(parte, tipoAnterior, memoria)
                Object.assign(e, { tipo: tipoAnterior, categoria: achado?.categoria ?? null, origemCategoria: achado?.origem ?? null })
            }
            if (e.tipo) tipoAnterior = e.tipo
            itens.push({ e, parte })
        }
        const completo = ({ e }) => e.tipo && e.valor && e.categoria && e.origemCategoria !== 'aproximado' && !e.futuro
        const prontos = itens.filter(completo)
        const faltando = itens.filter((i) => !completo(i))

        const descricoes = []
        const alertas = []
        for (const { e, parte } of prontos) {
            const g = await gravar(ctx, { type: e.tipo, amount: e.valor, category: e.categoria, name: e.nome, date: e.data, textoOriginal: parte })
            descricoes.push(g.descricao)
            if (g.alerta) alertas.push(g.alerta)
        }
        const pergunta = faltando.length ? await registrar({ ...ctx, texto: faltando[0].parte }, faltando[0].e) : null

        const respostas = []
        if (descricoes.length === 1) respostas.push(fala.lancado(descricoes[0], false))
        if (descricoes.length > 1) respostas.push(fala.lancadosVarios(descricoes))
        respostas.push(...alertas)
        if (faltando.length > 1) respostas.push(fala.depoisOsOutros(faltando.slice(1).map((i) => i.parte.trim())))
        if (pergunta) respostas.push(...pergunta.respostas)
        return { respostas, opcoes: pergunta?.opcoes ?? [], acao: descricoes.length ? 'lancado' : pergunta?.acao }
    }

    async function reclamacao(ctx) {
        const { userId, hoje, fala } = ctx
        const ultimo = await repo.ultimoLancamentoDoAssistente(userId)
        if (!ultimo) return fala.desculpaSemNada()
        await repo.salvarPendencia(userId, { etapa: 'apagar', ids: [ultimo.id] })
        return fala.desculpa(descrever(ultimo, hoje))
    }

    // Grava um lançamento e devolve a descrição e o aviso de orçamento, se houver.
    async function gravar(ctx, l, aprender) {
        const { userId, hoje } = ctx
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

        const descricao = descrever({ ...criado, date: l.date ?? hoje }, hoje)
        const alerta = l.type === 'EXPENSE' ? await alertaDeOrcamento(ctx, l.category, Number(criado.amount)) : null
        return { descricao, alerta }
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

    async function desfazer(ctx, e = {}) {
        const { userId, hoje, fala } = ctx
        if (e.quantidade === 'todos' || e.quantidade > 1) {
            const todos = e.quantidade === 'todos'
            // "todos" = o que eu lancei hoje (horário de Brasília); com número, os N últimos que eu lancei
            const lista = await repo.lancamentosDoAssistente(userId, {
                desde: todos ? new Date(`${hoje}T03:00:00.000Z`) : undefined,
                limite: todos ? MAXIMO_PARA_APAGAR : Math.min(e.quantidade, MAXIMO_PARA_APAGAR),
            })
            if (!lista.length) return fala.nadaParaApagar()
            await repo.salvarPendencia(userId, { etapa: 'apagar', ids: lista.map((l) => l.id) })
            return fala.confirmarApagar(
                lista.map((l) => descrever(l, hoje)),
                todos ? 'todos' : e.quantidade,
            )
        }
        const ultimo = await repo.ultimoLancamentoDoAssistente(userId)
        if (!ultimo) return fala.nadaParaApagar()
        await repo.apagarLancamento(userId, ultimo.id)
        return fala.apagado(descrever(ultimo, hoje))
    }

    async function consultar(ctx, e) {
        const { userId, fala } = ctx
        const { inicio, fim, nome } = e.periodo
        if (e.tipoConsulta === 'ultimos') {
            const lista = await repo.ultimos(userId, Math.min(e.quantidade ?? 5, MAXIMO_PARA_APAGAR))
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
        futuro: (l, { plano, quando }) => {
            const oQue = [l.amount ? formatarDinheiro(l.amount) : null, l.name ? `(${l.name})` : null].filter(Boolean).join(' ')
            const quandoTexto = quando ? ` ${quando === 'amanha' ? 'amanhã' : quando.replace('proxim', 'próxim').replace('mes', 'mês')}` : ''
            const abertura = solto
                ? `Isso ainda vai rolar${quandoTexto}, né? Então não lancei${oQue ? ` ${oQue}` : ''}.`
                : `Entendi que isso ainda vai acontecer${quandoTexto}, então não lancei${oQue ? ` ${oQue}` : ''}.`
            const regra = solto
                ? 'Eu anoto só o que já saiu ou entrou. Quando acontecer, me conta que eu lanço na hora.'
                : 'Eu registro só o que já foi gasto ou recebido. Quando acontecer, é só me contar.'
            const dica =
                plano && l.type === 'EXPENSE' && l.category
                    ? ` Se a ideia é um limite para o mês, dá para criar um orçamento de ${rotulo('EXPENSE', l.category)} no painel, que eu aviso quando estiver chegando perto.`
                    : ''
            return r(`${abertura} ${regra}${dica}`, ['Já aconteceu, pode lançar', 'Não lançar'])
        },
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
        confirmarApagar: (linhas, pedido) => {
            const n = linhas.length
            const titulo =
                pedido === 'todos'
                    ? n === 1
                        ? 'Hoje eu só lancei este:'
                        : `Estes são os ${n} que eu lancei hoje:`
                    : n < pedido
                      ? `Só achei ${n} ${n === 1 ? 'lançamento feito' : 'lançamentos feitos'} por mim nos últimos 7 dias:`
                      : `Os ${n} últimos que eu lancei:`
            const pergunta = n === 1 ? 'Apago?' : `Apago ${n === 2 ? 'os dois' : `os ${n}`}?`
            return r([titulo, ...linhas.map((l) => `• ${capitalizar(l)}`), pergunta].join('\n'), ['Sim, apagar', 'Não'])
        },
        lancadosVarios: (descricoes) =>
            [`${solto ? `Anotei os ${descricoes.length}${e('✅')}:` : `Lancei ${descricoes.length}:`}`, ...descricoes.map((d) => `• ${capitalizar(d)}`)].join('\n'),
        depoisOsOutros: (partes) =>
            `Também tinha ${partes.map((p) => `"${p}"`).join(', ')}: me manda ${partes.length === 1 ? 'esse' : 'esses'} de novo depois desta pergunta.`,
        desculpa: (descricao) =>
            r(
                `${solto ? 'Foi mal!' : 'Desculpe!'} O último que eu lancei foi ${descricao}. Quer que eu apague?`,
                ['Sim, apagar', 'Não'],
            ),
        desculpaSemNada: () =>
            r('Desculpe pela confusão. Agora não tenho nenhum lançamento meu para desfazer. Se algo ficou errado, dá para ajustar pelo painel.'),
        naoApaguei: () => r(solto ? 'Beleza, não apaguei nada.' : 'Certo, não apaguei nada.'),
        verOuApagar: (n) => r(`Quer ver ou apagar os ${n} últimos lançamentos?`, [`Mostra os ${n} últimos`, `Apaga os ${n} últimos`]),
        apagadosVarios: (n) =>
            r(n === 1 ? 'Pronto, apaguei. Seu saldo já foi atualizado.' : `Pronto, apaguei os ${n} lançamentos. Seu saldo já foi atualizado.`),
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
