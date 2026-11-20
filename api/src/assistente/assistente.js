// Motor de diálogo da Valtrea Assistente. Fluxo de cada mensagem:
// mensagem → normalização → interpretação (intenção + confiança) → contexto → consulta/ação ou conhecimento
// → composição da resposta → atualização da memória (contexto de curto prazo e aprendizado confirmado).
// Tudo roda dentro do Finance, sem serviço de IA de fora. Veja LEIAME.md nesta pasta.
import { dividirLancamentos, interpretar, encontrarCategoria } from './entender.js'
import { extrairValor } from './valores.js'
import { extrairData, formatarData, hojeEm, somarDias } from './datas.js'
import { combinarEstilo, escolher, lerEstilo, semente } from './estilo.js'
import { NOME_DO_TIPO, PALAVRAS_VAZIAS, ROTULOS } from './dicionario.js'
import { capitalizar, formatarDinheiro, normalizar, palavras } from './texto.js'
import { resolverIntencao, dividirPedidos } from './intencoes.js'
import { atualizarContexto, contextoAtivo } from './contexto.js'
import { categoriaPeloNome } from './aprendizado.js'
import { criarAnalise } from './analise.js'
import { criarFala } from './respostas.js'
import { topicoPorId } from './conhecimento/motor.js'
import { LIMITE_ORCAMENTO } from './permissoes.js'
import { registrarErro, registrarInteracao } from './registro.js'

export const PENDENCIA_MINUTOS = 10

const rotulo = (tipo, categoria) => ROTULOS[tipo]?.[categoria] ?? 'Outros'
const porcento = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0)

const CONFIRMA = /^(sim|s|isso|pode|ok|beleza|blz|certo|confirmo|confirma|manda|bora|claro|exato|aham|uhum|fechou|show|ja aconteceu|positivo|perfeito)\b/
const NEGA = /^(nenhum|nenhuma|nao|n|cancela|cancelar|esquece|deixa|deixa pra la|negativo)\b/
const MAXIMO_PARA_APAGAR = 20
const MAXIMO_DESDE_O_INICIO = 200
const DIAS_DE_BUSCA = 90
const ETAPAS_DE_CONFIRMACAO = ['apagar', 'aprender', 'editar', 'orcamentoConfirmar', 'orcamentoRemover', 'esquecerTudo', 'confirmarVarios']

// O que uma pergunta ensinada mostra, em palavras
const EXPLICACAO_DO_ALVO = {
    saldo: 'o saldo (ganhos menos gastos e investimentos)',
    sobra: 'a sua receita menos as suas despesas',
    gastos: 'quanto você gastou',
    ganhos: 'quanto você recebeu',
    investimentos: 'quanto você investiu',
    maior: 'onde você mais gastou',
    ultimos: 'os seus últimos lançamentos',
    resumo: 'o resumo do período',
    orcamentos: 'como estão os seus orçamentos',
    analise: 'uma análise das suas finanças',
}

// Termo que a assistente vai lembrar quando a pessoa ensinar uma categoria ("ifood", "padaria do zé").
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

// Preferências guardadas ("me chama de Jão", "sempre me pergunte antes de lançar")
function lerPreferencias(termos) {
    return { apelido: termos?.get('PREF:apelido') ?? null, confirmar: termos?.get('PREF:confirmar') === 'sim' }
}

const periodoDoDia = (agora) => {
    const hora = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }).format(agora))
    return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
}

function assuntoDaConsulta(e) {
    const p = e.periodo?.nome ?? 'neste mês'
    if (e.tipoConsulta === 'saldo') return `seu saldo ${p}`
    if (e.tipoConsulta === 'maior') return `onde você mais gastou ${p}`
    if (e.tipoConsulta === 'ultimos') return 'seus últimos lançamentos'
    if (e.tipoConsulta === 'doAssistente') return `o que eu lancei ${p}`
    const tipo = e.tipo ?? 'EXPENSE'
    const nome = { EXPENSE: 'seus gastos', EARNING: 'seus ganhos', INVESTMENT: 'seus investimentos' }[tipo]
    return `${nome}${e.categoria ? ` com ${rotulo(tipo, e.categoria)}` : ''} ${p}`
}

/**
 * Cria a assistente. `repo` é o executor das ações financeiras e da memória (repositorio.js); nos testes, um falso em memória.
 * processar() recebe uma mensagem e devolve { respostas: string[], opcoes: string[], acao? }.
 * acao ('lancado' | 'corrigido') diz à tela que algo mudou no Finance, para dar o retorno visual.
 */
export function criarAssistente(repo) {
    const analise = criarAnalise(repo)

    async function processar({ userId, texto, agora = new Date() }) {
        const comeco = Date.now()
        const hoje = hojeEm(agora)
        const [memoria, pendencia, primeiroNome] = await Promise.all([
            repo.carregarMemoria(userId),
            repo.lerPendencia(userId, agora),
            repo.primeiroNome(userId),
        ])
        const prefs = lerPreferencias(memoria.termos)
        const contexto = contextoAtivo(memoria.contexto, agora)
        const estilo = combinarEstilo(lerEstilo(texto), memoria.estilo)
        const s = semente(`${texto}${agora.getTime()}`)
        const nome = prefs.apelido ?? primeiroNome
        const fala = criarFala(estilo, s, nome, contexto?.ultimaResposta)
        const ctx = { userId, texto, hoje, agora, memoria, estilo, fala, prefs, contexto, nome, s }

        let resultado = null
        let decisao = { intencao: 'pendencia', modulo: 'dialogo', confianca: 1 }
        try {
            if (pendencia) {
                resultado = await continuarPendencia(ctx, pendencia)
                if (!resultado) await repo.salvarPendencia(userId, null)
            }
            if (!resultado) {
                const pedidos = dividirPedidos(texto)
                if (pedidos.length > 1) {
                    decisao = { intencao: 'varios', modulo: 'dialogo', confianca: 1 }
                    resultado = await atenderVarios(ctx, pedidos)
                } else {
                    decisao = resolverIntencao(texto, { hoje, agora, memoria, contexto })
                    resultado = await executar(ctx, decisao)
                }
            }
        } catch (erro) {
            registrarErro(decisao.intencao, erro)
            resultado = fala.erroTecnico()
        }

        // Memória de curto prazo: assunto, período e categoria, para a próxima mensagem
        try {
            await repo.salvarContexto(userId, atualizarContexto(contexto, agora, { ...(resultado.contexto ?? {}), ultimaResposta: resultado.respostas[0] }))
        } catch (erro) {
            registrarErro('contexto', erro)
        }
        registrarInteracao({ intencao: decisao.intencao, modulo: decisao.modulo, confianca: decisao.confianca, ms: Date.now() - comeco })
        const { contexto: _, ...saida } = resultado
        return saida
    }

    // Mais de um pedido na mesma mensagem: atende um de cada vez, levando o contexto de um para o outro
    async function atenderVarios(ctx, pedidos) {
        const respostas = []
        let opcoes = []
        let acao
        let contexto = ctx.contexto
        let contextoFinal = {}
        for (const pedido of pedidos) {
            const decisao = resolverIntencao(pedido, { hoje: ctx.hoje, agora: ctx.agora, memoria: ctx.memoria, contexto })
            const r = await executar({ ...ctx, texto: pedido, contexto }, decisao)
            respostas.push(...r.respostas)
            opcoes = r.opcoes
            acao = acao ?? r.acao
            if (r.contexto) {
                contextoFinal = { ...contextoFinal, ...r.contexto }
                contexto = atualizarContexto(contexto, ctx.agora, r.contexto)
            }
        }
        return { respostas, opcoes, acao, contexto: contextoFinal }
    }

    async function executar(ctx, d) {
        const r = await executarIntencao(ctx, d)
        // "oi, quanto gastei hoje?": cumprimenta e responde
        if (d.saudacao && r.respostas.length) r.respostas[0] = `Oi${ctx.nome ? `, ${ctx.nome}` : ''}! ${r.respostas[0]}`
        return r
    }

    async function executarIntencao(ctx, d) {
        const { fala, texto } = ctx
        switch (d.intencao) {
            case 'registrar':
                if (!d.futuro) {
                    const partes = dividirLancamentos(texto)
                    if (partes.length > 1) return registrarVarios(ctx, partes, d)
                }
                return registrar(ctx, d)
            case 'consulta':
                return consultar(ctx, d)
            case 'fraseEnsinada':
                return executarAlvo(ctx, d.alvo, d.periodo)
            case 'desfazer':
                return d.descricao ? procurar(ctx, d.descricao, 'apagar') : desfazer(ctx, d)
            case 'editar':
                return procurar(ctx, d.descricao, 'editar', d)
            case 'corrigir':
                return corrigir(ctx, d)
            case 'reclamacao':
                return reclamacao(ctx)
            case 'quantidade':
                return fala.verOuApagar(Math.min(d.quantidade, MAXIMO_PARA_APAGAR))
            case 'orcamento':
                return orcamentos(ctx, d)
            case 'orcamentoCriar':
                return criarOrcamento(ctx, d)
            case 'orcamentoRemover':
                return removerOrcamento(ctx, d)
            case 'analise':
                return analisar(ctx, d)
            case 'conhecimento':
                return responderConhecimento(ctx, d)
            case 'ensino':
                return ensinar(ctx, d.ensino)
            case 'explicar':
                return explicar(ctx)
            case 'conversando':
                return conversando(ctx)
            case 'confirmar':
            case 'negar':
                return fala.semPendencia()
            default:
                return fallback(ctx, d)
        }
    }

    // ——— Conversa em andamento (a assistente fez uma pergunta e espera a resposta) ———

    async function continuarPendencia(ctx, p) {
        const { userId, texto, memoria, fala, hoje, agora, contexto } = ctx
        const f = normalizar(texto)
        const sim = CONFIRMA.test(f)
        const nao = NEGA.test(f)

        if (ETAPAS_DE_CONFIRMACAO.includes(p.etapa)) {
            const novo = resolverIntencao(texto, { hoje, agora, memoria, contexto })
            // "apaga" de novo, sem dizer qual, também confirma a lista que mostrei
            if (sim || (p.etapa === 'apagar' && novo.intencao === 'desfazer' && !novo.quantidade && !novo.descricao)) return confirmarEtapa(ctx, p)
            if (nao) {
                await repo.salvarPendencia(userId, null)
                return negarEtapa(ctx, p)
            }
            return null
        }

        if (p.etapa === 'escolher') {
            const ordinais = { primeiro: 1, segundo: 2, terceiro: 3, quarto: 4, quinto: 5, sexto: 6 }
            const m = f.match(/^(?:o |a )?(?:numero |n )?(\d{1,2})\b/) ?? f.match(/^(?:o |a )?(primeiro|segundo|terceiro|quarto|quinto|sexto)\b/)
            const indice = m ? (ordinais[m[1]] ?? Number(m[1])) - 1 : -1
            if (nao) {
                await repo.salvarPendencia(userId, null)
                return p.acao === 'apagar' ? fala.naoApaguei() : fala.naoEditei()
            }
            if (indice < 0 || indice >= p.ids.length) return null
            const alvo = (p.itens ?? [])[indice]
            if (!alvo) return fala.nadaEncontrado()
            return p.acao === 'apagar' ? pedirParaApagar(ctx, alvo) : pedirParaEditar(ctx, alvo, p.mudancas)
        }

        if (p.etapa === 'editarCampos') {
            const mudancas = mudancasDoTexto(texto, ctx)
            if (nao) {
                await repo.salvarPendencia(userId, null)
                return fala.naoEditei()
            }
            if (!mudancas.valor && !mudancas.data && !Object.values(mudancas.categorias).some(Boolean)) return null
            return pedirParaEditar(ctx, p.lancamento, mudancas)
        }

        if (p.etapa === 'orcamento') {
            if (nao) {
                await repo.salvarPendencia(userId, null)
                return negarEtapa(ctx, { etapa: 'orcamentoConfirmar' })
            }
            const valor = p.valor ?? extrairValor(texto)?.valor ?? null
            const categoria = p.categoria ?? categoriaPeloNome(texto, 'EXPENSE')?.categoria ?? encontrarCategoria(texto, 'EXPENSE', memoria)?.categoria ?? null
            if ((p.valor || !valor) && (p.categoria || !categoria)) return null
            return criarOrcamento(ctx, { valor, categoria })
        }

        // Respostas curtas vão direto para a pergunta feita ("ganho", "lazer", "1500", "sim")
        const curta = palavras(texto).length <= 3
        if (curta && !nao) {
            const direta = await responderPergunta(ctx, p, { sim })
            if (direta) return direta
        }

        // Se a mensagem já é um pedido novo e completo, a pergunta anterior fica para trás.
        const novo = resolverIntencao(texto, { hoje, agora, memoria, contexto })
        const outroAssunto =
            ['consulta', 'desfazer', 'corrigir', 'editar', 'orcamento', 'orcamentoCriar', 'orcamentoRemover', 'reclamacao', 'quantidade', 'analise', 'ensino', 'fraseEnsinada', 'conversando'].includes(novo.intencao) ||
            (novo.intencao === 'conhecimento' && novo.modulo !== 'social')
        const outroLancamento =
            novo.intencao === 'registrar' && (p.etapa === 'valor' ? Boolean(novo.categoria || novo.tipoExplicito) : Boolean(novo.valor))
        if (outroAssunto || outroLancamento) return null

        if (nao) {
            await repo.salvarPendencia(userId, null)
            return fala.cancelado()
        }
        return responderPergunta(ctx, p, { sim })
    }

    // Resposta à pergunta feita durante um lançamento (tipo, valor, categoria, confirmação)
    async function responderPergunta(ctx, p, { sim }) {
        const { texto, memoria, hoje } = ctx
        if (p.etapa === 'confirmar') return sim ? lancar(ctx, p.lancamento, p.aprender) : null
        if (p.etapa === 'futuro') {
            if (sim || /^(ja|lanca|lancar)\b/.test(normalizar(texto))) return seguir(ctx, { ...p.lancamento, date: hoje })
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

    async function confirmarEtapa(ctx, p) {
        const { userId, hoje, fala } = ctx
        await repo.salvarPendencia(userId, null)
        if (p.etapa === 'apagar') {
            for (const id of p.ids) await repo.apagarLancamento(userId, id)
            return { ...fala.apagadosVarios(p.ids.length), acao: 'corrigido' }
        }
        if (p.etapa === 'editar') {
            const atualizado = await repo.atualizarLancamento(userId, p.id, p.campos)
            if (!atualizado) return fala.nadaEncontrado()
            if (p.campos.category && p.termo) await repo.ensinar(userId, atualizado.type, p.termo, p.campos.category)
            return { ...fala.editado(descrever(atualizado, hoje)), contexto: { ultimo: { modulo: 'lancamento', descricao: descrever(atualizado, hoje) } } }
        }
        if (p.etapa === 'orcamentoConfirmar') {
            await repo.salvarOrcamento(userId, p.categoria, p.valor)
            const lista = await repo.orcamentos(userId, `${hoje.slice(0, 8)}01`, hoje)
            const gasto = lista.find((o) => o.category === p.categoria)?.spent ?? 0
            return fala.orcamentoSalvo(rotulo('EXPENSE', p.categoria), p.valor, gasto)
        }
        if (p.etapa === 'orcamentoRemover') {
            const removido = await repo.removerOrcamento(userId, p.categoria)
            return removido ? fala.orcamentoRemovido(rotulo('EXPENSE', p.categoria)) : fala.semOrcamento(rotulo('EXPENSE', p.categoria))
        }
        if (p.etapa === 'aprender') {
            const regra = p.regra
            if (regra.tipo === 'categoria') {
                await repo.ensinar(userId, regra.tipoLancamento, regra.termo, regra.categoria)
                return fala.aprendi(`Vou considerar "${regra.termo}" como ${rotulo(regra.tipoLancamento, regra.categoria)} nos próximos lançamentos.`)
            }
            await repo.ensinar(userId, 'FRASE', regra.termo, regra.alvo)
            return fala.aprendi(`Quando você perguntar "${regra.termo}", eu mostro ${EXPLICACAO_DO_ALVO[regra.alvo]}.`)
        }
        if (p.etapa === 'esquecerTudo') {
            await repo.esquecerAprendizado(userId)
            return fala.esquecidoTudo()
        }
        if (p.etapa === 'confirmarVarios') {
            const descricoes = []
            for (const l of p.lancamentos) descricoes.push((await gravar(ctx, l)).descricao)
            return { respostas: [fala.lancadosVarios(descricoes)], opcoes: [], acao: 'lancado' }
        }
        return null
    }

    function negarEtapa(ctx, p) {
        const { fala } = ctx
        if (p.etapa === 'apagar') return fala.naoApaguei()
        if (p.etapa === 'editar') return fala.naoEditei()
        if (p.etapa === 'aprender') return { respostas: ['Tudo bem, não guardei.'], opcoes: [] }
        if (p.etapa === 'esquecerTudo') return { respostas: ['Certo, mantive tudo o que aprendi.'], opcoes: [] }
        if (p.etapa === 'orcamentoConfirmar' || p.etapa === 'orcamentoRemover') return { respostas: ['Certo, não mexi nos orçamentos.'], opcoes: [] }
        return fala.cancelado()
    }

    // ——— Lançamentos ———

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
        if (confirmar || ctx.prefs.confirmar) {
            await repo.salvarPendencia(userId, { etapa: 'confirmar', lancamento: l })
            return fala.confirmar(descrever({ ...l, name: l.name }, ctx.hoje))
        }
        return lancar(ctx, l)
    }

    async function registrar(ctx, e) {
        const lancamento = { type: e.tipo, amount: e.valor, category: e.categoria, name: e.nome, date: e.data, textoOriginal: ctx.texto }
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
        return {
            respostas,
            opcoes: [],
            acao: 'lancado',
            contexto: { ultimo: { modulo: 'lancamento', descricao }, assunto: `o lançamento: ${descricao}`, foco: l.type === 'EXPENSE' ? l.category : undefined },
        }
    }

    // Vários lançamentos numa mensagem: lança os que entendeu por inteiro e pergunta pelo primeiro que faltar algo.
    async function registrarVarios(ctx, partes, inteiro) {
        const { hoje, memoria, fala, userId } = ctx
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
        const paraGravar = prontos.map(({ e, parte }) => ({ type: e.tipo, amount: e.valor, category: e.categoria, name: e.nome, date: e.data, textoOriginal: parte }))

        // Preferência "sempre me pergunte antes de lançar"
        if (ctx.prefs.confirmar && paraGravar.length && !faltando.length) {
            await repo.salvarPendencia(userId, { etapa: 'confirmarVarios', lancamentos: paraGravar })
            return {
                respostas: [[`Entendi ${paraGravar.length} lançamentos:`, ...paraGravar.map((l) => `• ${capitalizar(descrever(l, hoje))}`), 'Posso lançar?'].join('\n')],
                opcoes: ['Sim', 'Não'],
            }
        }

        const descricoes = []
        const alertas = []
        for (const l of paraGravar) {
            const g = await gravar(ctx, l)
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

    // Grava um lançamento e devolve a descrição e o aviso de orçamento, se houver.
    // Só diz que lançou depois que o banco confirmou a gravação.
    async function gravar(ctx, l, aprender) {
        const { userId, hoje } = ctx
        const nome = (l.name ?? rotulo(l.type, l.category)).slice(0, 50)
        const criado = await repo.criarLancamento(userId, { name: capitalizar(nome), amount: l.amount, type: l.type, category: l.category, date: l.date ?? hoje })
        await repo.salvarPendencia(userId, null)
        if (aprender?.termo) await repo.ensinar(userId, aprender.tipo, aprender.termo, aprender.categoria)
        await repo.salvarEstilo(userId, ctx.estilo)
        const descricao = descrever({ ...criado, date: l.date ?? hoje }, hoje)
        const alerta = l.type === 'EXPENSE' ? await alertaDeOrcamento(ctx, l.category, Number(criado.amount)) : null
        return { descricao, alerta }
    }

    async function alertaDeOrcamento(ctx, categoria, valor) {
        const inicio = `${ctx.hoje.slice(0, 8)}01`
        const lista = await repo.orcamentos(ctx.userId, inicio, ctx.hoje)
        const o = lista.find((b) => b.category === categoria)
        if (!o || !o.amount) return null
        const antes = porcento(o.spent - valor, o.amount)
        const agora = porcento(o.spent, o.amount)
        if (agora >= 100 && antes < 100) return ctx.fala.estourou(rotulo('EXPENSE', categoria), o.spent, o.amount, agora)
        if (agora >= 80 && antes < 80) return ctx.fala.quaseLimite(rotulo('EXPENSE', categoria), o.spent, o.amount, agora)
        return null
    }

    async function reclamacao(ctx) {
        const { userId, hoje, fala } = ctx
        const ultimo = await repo.ultimoLancamentoDoAssistente(userId)
        if (!ultimo) return fala.desculpaSemNada()
        await repo.salvarPendencia(userId, { etapa: 'apagar', ids: [ultimo.id] })
        return fala.desculpa(descrever(ultimo, hoje))
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
        if (e.quantidade === 'todos' || e.quantidade === 'sempre' || e.quantidade > 1) {
            const todos = e.quantidade === 'todos'
            const sempre = e.quantidade === 'sempre'
            // "todos" = o que eu lancei hoje (horário de Brasília); "desde o início" = tudo o que eu lancei;
            // com número, os N últimos que eu lancei. Sempre só o que tem a marca da assistente.
            const lista = await repo.lancamentosDoAssistente(userId, {
                desde: todos ? new Date(`${hoje}T03:00:00.000Z`) : undefined,
                sempre,
                limite: sempre ? MAXIMO_DESDE_O_INICIO : todos ? MAXIMO_PARA_APAGAR : Math.min(e.quantidade, MAXIMO_PARA_APAGAR),
            })
            if (!lista.length) return fala.nadaParaApagar()
            await repo.salvarPendencia(userId, { etapa: 'apagar', ids: lista.map((l) => l.id) })
            return fala.confirmarApagar(
                lista.map((l) => descrever(l, hoje)),
                e.quantidade,
            )
        }
        // "apaga o último": desfaz na hora o último que eu lancei (é o desfazer rápido)
        const ultimo = await repo.ultimoLancamentoDoAssistente(userId)
        if (!ultimo) return fala.nadaParaApagar()
        await repo.apagarLancamento(userId, ultimo.id)
        return { ...fala.apagado(descrever(ultimo, hoje)), acao: 'corrigido' }
    }

    // ——— Apagar ou editar pela descrição ("apaga aquele gasto de 60", "muda o uber de ontem para 25") ———

    function mudancasDoTexto(texto, { hoje, memoria }) {
        const valor = extrairValor(texto)
        const data = extrairData(texto, hoje)
        const categorias = Object.fromEntries(
            ['EXPENSE', 'EARNING', 'INVESTMENT'].map((t) => {
                const achada = categoriaPeloNome(texto, t)
                const c = achada?.tipo === t ? achada.categoria : encontrarCategoria(texto, t, memoria)
                return [t, typeof c === 'string' ? c : c && c.origem !== 'aproximado' ? c.categoria : null]
            }),
        )
        return { valor: valor?.valor ?? null, data: data?.data ?? null, categorias }
    }

    async function procurar(ctx, pistas, acao, pedido = null) {
        const { userId, hoje, fala } = ctx
        const base = { desde: pistas.data ?? somarDias(hoje, -DIAS_DE_BUSCA), ate: pistas.data ?? hoje, amount: pistas.valor ?? undefined, type: pistas.tipo ?? undefined, limite: 6 }
        let lista = await repo.buscarLancamentos(userId, { ...base, category: pistas.categoria ?? undefined, termo: pistas.termo ?? undefined })
        if (!lista.length && pistas.termo) lista = await repo.buscarLancamentos(userId, { ...base, category: pistas.categoria ?? undefined })
        if (!lista.length && pistas.categoria && pistas.termo) lista = await repo.buscarLancamentos(userId, { ...base, termo: pistas.termo })
        if (!lista.length) return fala.nadaEncontrado()

        const mudancas = pedido
            ? {
                  valor: pedido.valor,
                  data: pedido.data,
                  categorias: Object.fromEntries(
                      Object.entries(pedido.categorias ?? {}).map(([t, c]) => [t, c && c.origem !== 'aproximado' ? c.categoria : null]),
                  ),
              }
            : null
        if (lista.length === 1) return acao === 'apagar' ? pedirParaApagar(ctx, lista[0]) : pedirParaEditar(ctx, lista[0], mudancas)
        const itens = lista.slice(0, 5)
        await repo.salvarPendencia(userId, { etapa: 'escolher', acao, ids: itens.map((l) => l.id), itens, mudancas })
        return fala.escolherLancamento(
            itens.map((l) => descrever(l, hoje)),
            acao === 'apagar' ? 'apagar' : 'mudar',
        )
    }

    async function pedirParaApagar(ctx, lancamento) {
        await repo.salvarPendencia(ctx.userId, { etapa: 'apagar', ids: [lancamento.id] })
        return ctx.fala.confirmarApagarUm(descrever(lancamento, ctx.hoje), lancamento.doAssistente === false)
    }

    async function pedirParaEditar(ctx, lancamento, mudancas) {
        const { userId, hoje, fala } = ctx
        const campos = {}
        if (mudancas?.valor && mudancas.valor !== lancamento.amount) campos.amount = mudancas.valor
        if (mudancas?.data && mudancas.data !== lancamento.date) campos.date = mudancas.data
        const categoria = mudancas?.categorias?.[lancamento.type]
        if (categoria && categoria !== lancamento.category) campos.category = categoria
        if (!Object.keys(campos).length) {
            await repo.salvarPendencia(userId, { etapa: 'editarCampos', lancamento })
            return fala.oQueMudar(descrever(lancamento, hoje))
        }
        await repo.salvarPendencia(userId, { etapa: 'editar', id: lancamento.id, campos, termo: campos.category ? termoParaAprender(lancamento.name) : null })
        return fala.confirmarEdicao(descrever(lancamento, hoje), descrever({ ...lancamento, ...campos }, hoje))
    }

    // ——— Consultas ———

    async function consultar(ctx, e) {
        const { userId, fala, contexto } = ctx
        // "Qual categoria teve mais gastos?" sem dizer o período: usa o da conversa
        const herdar = !e.periodo?.explicito && !e.continuacao && contexto?.consulta?.periodo && e.tipoConsulta === 'maior'
        const periodo = herdar ? contexto.consulta.periodo : e.periodo
        const { inicio, fim, nome } = periodo
        const consulta = { tipoConsulta: e.tipoConsulta, tipo: e.tipo ?? null, categoria: e.categoria ?? null, periodo }
        const comContexto = (r) => ({
            ...r,
            contexto: { consulta, foco: e.categoria ?? undefined, ultimo: { modulo: 'consulta', consulta }, assunto: assuntoDaConsulta(consulta) },
        })

        if (e.tipoConsulta === 'doAssistente') {
            const [meus, origem] = await Promise.all([
                repo.lancamentosDoAssistente(userId, { sempre: true, limite: MAXIMO_DESDE_O_INICIO }),
                repo.contarPorOrigem(userId, inicio, fim),
            ])
            const noPeriodo = meus.filter((l) => l.date >= inicio && l.date <= fim)
            return comContexto(fala.doAssistente(noPeriodo.map((l) => descrever(l, ctx.hoje)), nome, origem.outros))
        }
        if (e.tipoConsulta === 'ultimos') {
            // "o que eu lancei hoje?": só os do período; sem período, os últimos
            const lista = periodo?.explicito
                ? await repo.buscarLancamentos(userId, { desde: inicio, ate: fim, limite: Math.min(e.quantidade ?? MAXIMO_PARA_APAGAR, MAXIMO_PARA_APAGAR) })
                : await repo.ultimos(userId, Math.min(e.quantidade ?? 5, MAXIMO_PARA_APAGAR))
            return comContexto(fala.ultimos(lista.map((l) => descrever(l, ctx.hoje)), periodo?.explicito ? nome : null))
        }
        if (e.tipoConsulta === 'maior') {
            const tipo = e.tipo ?? 'EXPENSE'
            const lista = await repo.porCategoria(userId, tipo, inicio, fim)
            const total = lista.reduce((s2, r) => s2 + r.total, 0)
            const top = lista.slice(0, 3).map((r) => `${rotulo(tipo, r.category)}: ${formatarDinheiro(r.total)} (${porcento(r.total, total)}%)`)
            const r = comContexto(fala.maiores(top, nome, tipo))
            if (lista[0]) r.contexto.foco = lista[0].category
            return r
        }
        if (e.categoria) {
            const tipo = e.tipo ?? 'EXPENSE'
            const lista = await repo.porCategoria(userId, tipo, inicio, fim)
            const achado = lista.find((r) => r.category === e.categoria)
            return comContexto(fala.totalCategoria(rotulo(tipo, e.categoria), achado?.total ?? 0, nome, tipo))
        }
        const t = await repo.totais(userId, inicio, fim)
        if (e.tipoConsulta === 'resumo' && e.tipo) return comContexto(fala.totalTipo(e.tipo, t[e.tipo], nome))
        return comContexto(fala.saldo(t, nome))
    }

    // Pergunta ensinada pela pessoa ("quanto sobrou" = receita menos despesas)
    async function executarAlvo(ctx, alvo, periodo) {
        const p = periodo
        if (alvo === 'sobra') {
            const t = await repo.totais(ctx.userId, p.inicio, p.fim)
            return { ...ctx.fala.sobra(t.EARNING, t.EXPENSE, p.nome), contexto: { consulta: { tipoConsulta: 'saldo', tipo: null, categoria: null, periodo: p }, assunto: `quanto sobrou ${p.nome}` } }
        }
        if (alvo === 'analise') return analisar(ctx, { tipo: 'opiniao' })
        if (alvo === 'orcamentos') return orcamentos(ctx, { periodo: p })
        const mapa = {
            saldo: { tipoConsulta: 'saldo' },
            resumo: { tipoConsulta: 'saldo' },
            gastos: { tipoConsulta: 'resumo', tipo: 'EXPENSE' },
            ganhos: { tipoConsulta: 'resumo', tipo: 'EARNING' },
            investimentos: { tipoConsulta: 'resumo', tipo: 'INVESTMENT' },
            maior: { tipoConsulta: 'maior', tipo: 'EXPENSE' },
            ultimos: { tipoConsulta: 'ultimos' },
        }
        return consultar(ctx, { ...mapa[alvo], periodo: p })
    }

    async function orcamentos(ctx, e) {
        const lista = await repo.orcamentos(ctx.userId, e.periodo.inicio, e.periodo.fim)
        const linhas = lista.map(
            (o) => `${rotulo('EXPENSE', o.category)}: ${formatarDinheiro(o.spent)} de ${formatarDinheiro(o.amount)} (${porcento(o.spent, o.amount)}%)`,
        )
        return { ...ctx.fala.orcamentos(linhas), contexto: { ultimo: { modulo: 'orcamentos' }, assunto: 'seus orçamentos' } }
    }

    async function criarOrcamento(ctx, e) {
        const { userId, fala, hoje } = ctx
        if (e.valor && (e.valor < LIMITE_ORCAMENTO.minimo || e.valor > LIMITE_ORCAMENTO.maximo)) return fala.orcamentoInvalido()
        if (!e.categoria || !e.valor) {
            await repo.salvarPendencia(userId, { etapa: 'orcamento', valor: e.valor ?? null, categoria: e.categoria ?? null })
            return e.categoria ? fala.perguntarValorOrcamento(rotulo('EXPENSE', e.categoria)) : fala.perguntarCategoriaOrcamento(e.valor)
        }
        const atual = (await repo.orcamentos(userId, `${hoje.slice(0, 8)}01`, hoje)).find((o) => o.category === e.categoria)
        await repo.salvarPendencia(userId, { etapa: 'orcamentoConfirmar', valor: e.valor, categoria: e.categoria })
        return fala.confirmarOrcamento(rotulo('EXPENSE', e.categoria), e.valor, atual?.amount ?? null)
    }

    async function removerOrcamento(ctx, e) {
        const { userId, fala, hoje } = ctx
        if (!e.categoria) {
            const lista = await repo.orcamentos(userId, `${hoje.slice(0, 8)}01`, hoje)
            if (!lista.length) return fala.orcamentos([])
            return { respostas: ['De qual categoria tiro o orçamento?'], opcoes: lista.map((o) => `Tira o orçamento de ${rotulo('EXPENSE', o.category).toLowerCase()}`) }
        }
        await repo.salvarPendencia(userId, { etapa: 'orcamentoRemover', categoria: e.categoria })
        return fala.confirmarRemoverOrcamento(rotulo('EXPENSE', e.categoria))
    }

    // ——— Análises com os dados reais ———

    async function analisar(ctx, d) {
        const { userId, hoje, contexto } = ctx
        // "Como reduzir isso?" logo depois de uma consulta usa o mesmo período; as outras análises usam o mês
        const periodoDaConversa = contexto?.ultimo?.modulo === 'consulta' ? contexto.consulta?.periodo ?? null : null
        const mes = { inicio: `${hoje.slice(0, 8)}01`, fim: hoje, nome: 'neste mês' }
        const base = { userId, hoje, periodo: d.periodo?.explicito ? d.periodo : d.tipo === 'reduzir' ? periodoDaConversa ?? mes : mes }
        let r
        let categoria = null
        if (d.tipo === 'reduzir') {
            categoria = d.categoria ?? contexto?.foco ?? contexto?.consulta?.categoria ?? null
            if (!categoria) {
                const top = await repo.porCategoria(userId, 'EXPENSE', `${hoje.slice(0, 8)}01`, hoje)
                return {
                    respostas: ['Em qual categoria você quer reduzir?'],
                    opcoes: top.length ? top.slice(0, 3).map((c) => `Como reduzir ${rotulo('EXPENSE', c.category).toLowerCase()}?`) : ['Como reduzir alimentação?', 'Como reduzir lazer?'],
                }
            }
            r = await analise.reduzir(base, categoria)
        } else if (d.tipo === 'gastandoMuito') r = await analise.gastandoMuito(base)
        else if (d.tipo === 'praOndeFoi') r = await analise.praOndeFoi(base)
        else if (d.tipo === 'comparar') r = await analise.comparar(base)
        else if (d.tipo === 'tendencia') r = await analise.tendencia(base)
        else if (d.tipo === 'porDia') r = await analise.porDia(base)
        else if (d.tipo === 'investimentos') r = await analise.investimentos(base)
        else r = await analise.visaoGeral(base, d.tipo === 'preocupado' ? 'preocupado' : d.tipo === 'sugestao' ? 'sugestao' : 'opiniao')
        const assuntos = {
            reduzir: `como reduzir os gastos com ${rotulo('EXPENSE', categoria)}`,
            gastandoMuito: 'se você está gastando muito',
            praOndeFoi: 'para onde foi o seu dinheiro',
            comparar: 'a comparação com o mês passado',
            tendencia: 'a tendência dos seus gastos',
            porDia: 'quanto dá para gastar por dia',
            investimentos: 'os seus investimentos',
        }
        return {
            respostas: [r.texto],
            opcoes: r.opcoes ?? [],
            contexto: { foco: r.foco ?? undefined, ultimo: { modulo: 'analise', tipo: d.tipo }, assunto: assuntos[d.tipo] ?? 'uma análise das suas finanças' },
        }
    }

    // ——— Base de conhecimento ———

    async function responderConhecimento(ctx, d) {
        if (d.texto) return { respostas: [d.texto], opcoes: [], contexto: { ultimo: { modulo: d.modulo }, assunto: d.modulo === 'calculo' ? 'uma conta' : 'datas' } }
        const t = d.topico
        const nome = ctx.nome ? `, ${ctx.nome}` : ''
        const variacoes = t.respostas.map((v) => (typeof v === 'function' ? v({ nome, periodoDoDia: periodoDoDia(ctx.agora) }) : v))
        const evitar = ctx.contexto?.ultimaResposta?.slice(0, 60)
        let texto = escolher(variacoes, ctx.s)
        if (evitar && variacoes.length > 1 && texto.slice(0, 60) === evitar) texto = variacoes[(variacoes.indexOf(texto) + 1) % variacoes.length]
        const extra = t.complemento ? await complemento(ctx, t.complemento) : null
        const respostas = [[texto, extra, t.aviso].filter(Boolean).join(' ')]
        return {
            respostas,
            opcoes: t.opcoes ?? [],
            contexto: t.modulo === 'social' ? { ultimo: { modulo: 'social' } } : { ultimo: { modulo: 'conhecimento', topico: t.id }, assunto: t.perguntas[0] },
        }
    }

    // Combina a base de conhecimento com os números da pessoa
    async function complemento(ctx, tipo) {
        const m = await analise.medias(ctx)
        if (tipo === 'reserva') {
            if (!m.gasto) return 'Quando houver alguns meses de gastos lançados aqui, eu calculo esse valor para você.'
            return `Pelos seus lançamentos, você gasta em média ${formatarDinheiro(m.gasto)} por mês; de 3 a 6 meses seriam entre ${formatarDinheiro(m.gasto * 3)} e ${formatarDinheiro(m.gasto * 6)}.`
        }
        if (tipo === 'divisao') {
            if (!m.ganho) return null
            return `Com a sua renda média de ${formatarDinheiro(m.ganho)} por mês, seria cerca de ${formatarDinheiro(m.ganho * 0.5)} para necessidades, ${formatarDinheiro(m.ganho * 0.3)} para desejos e ${formatarDinheiro(m.ganho * 0.2)} para guardar.`
        }
        return null
    }

    // ——— Aprendizado ———

    async function ensinar(ctx, ensino) {
        const { userId, fala, memoria } = ctx
        if (ensino.tipo === 'invalido') return fala.ensinoInvalido(ensino.motivo, ensino.termo)
        if (ensino.tipo === 'listar') return fala.memoria(descreverMemoria(await repo.listarMemoria(userId)))
        if (ensino.tipo === 'esquecerTudo') {
            await repo.salvarPendencia(userId, { etapa: 'esquecerTudo' })
            return fala.confirmarEsquecerTudo()
        }
        if (ensino.tipo === 'esquecer') {
            if (!ensino.termo) return fala.memoria(descreverMemoria(await repo.listarMemoria(userId)))
            const apagados = await repo.esquecerTermo(userId, ensino.termo)
            return apagados ? fala.esquecido(ensino.termo) : fala.nadaParaEsquecer(ensino.termo)
        }
        if (ensino.tipo === 'preferencia') {
            if (ensino.chave === 'apelido') {
                if (!ensino.valor) {
                    await repo.esquecerTermo(userId, 'apelido', 'PREF')
                    return { respostas: ['Combinado, não uso mais o apelido.'], opcoes: [] }
                }
                await repo.ensinar(userId, 'PREF', 'apelido', ensino.valor)
                return { respostas: [`Combinado! Vou te chamar de ${ensino.valor}.`], opcoes: [] }
            }
            if (ensino.valor) {
                await repo.ensinar(userId, 'PREF', 'confirmar', 'sim')
                return { respostas: ['Combinado! A partir de agora, eu mostro o lançamento e espero o seu "sim" antes de salvar.'], opcoes: [] }
            }
            await repo.esquecerTermo(userId, 'confirmar', 'PREF')
            return { respostas: ['Combinado, quando eu entender tudo, lanço direto. Se eu errar, é só dizer "apaga o último".'], opcoes: [] }
        }
        if (ensino.tipo === 'categoria') {
            const anterior = memoria.termos?.get(`${ensino.tipoLancamento}:${ensino.termo}`)
            if (anterior === ensino.categoria) return { respostas: [`Já considero "${ensino.termo}" como ${rotulo(ensino.tipoLancamento, ensino.categoria)}.`], opcoes: [] }
            await repo.salvarPendencia(userId, { etapa: 'aprender', regra: ensino })
            return fala.confirmarCategoriaEnsinada(ensino.termo, rotulo(ensino.tipoLancamento, ensino.categoria), anterior ? rotulo(ensino.tipoLancamento, anterior) : null)
        }
        // pergunta ensinada
        const anterior = memoria.termos?.get(`FRASE:${ensino.termo}`)
        if (anterior === ensino.alvo) return { respostas: [`Já faço isso: quando você pergunta "${ensino.termo}", eu mostro ${EXPLICACAO_DO_ALVO[ensino.alvo]}.`], opcoes: [] }
        await repo.salvarPendencia(userId, { etapa: 'aprender', regra: ensino })
        return fala.confirmarFraseEnsinada(ensino.termo, EXPLICACAO_DO_ALVO[ensino.alvo], Boolean(anterior))
    }

    function descreverMemoria(linhas) {
        return linhas.map((m) => {
            if (m.tipo === 'FRASE') return `quando você pergunta "${m.termo}", eu mostro ${EXPLICACAO_DO_ALVO[m.categoria] ?? m.categoria}`
            if (m.tipo === 'PREF' && m.termo === 'apelido') return `te chamar de ${m.categoria}`
            if (m.tipo === 'PREF' && m.termo === 'confirmar') return 'confirmar com você antes de lançar'
            return `"${m.termo}" é ${rotulo(m.tipo, m.categoria)} (${NOME_DO_TIPO[m.tipo] ?? m.tipo})`
        })
    }

    // ——— Contexto da conversa ———

    async function explicar(ctx) {
        const { fala, contexto, userId, hoje } = ctx
        const ultimo = contexto?.ultimo
        if (!ultimo) return fala.semAssuntoParaExplicar()
        if (ultimo.modulo === 'conhecimento') {
            const t = topicoPorId(ultimo.topico)
            if (t?.detalhe) return { respostas: [t.detalhe], opcoes: [] }
            if (t) {
                return {
                    respostas: ['Qual parte ficou confusa? Se for algum termo (como CDI, Selic ou FGC) ou um ponto específico, me pergunte direto que eu explico.'],
                    opcoes: (t.opcoes ?? []).slice(0, 2),
                }
            }
        }
        if (ultimo.modulo === 'consulta' && ultimo.consulta) {
            const c = ultimo.consulta
            const tipo = c.tipo ?? 'EXPENSE'
            const lista = await repo.porCategoria(userId, tipo, c.periodo.inicio, c.periodo.fim)
            const total = lista.reduce((s2, r) => s2 + r.total, 0)
            const linhas = lista.slice(0, 5).map((r) => `• ${rotulo(tipo, r.category)}: ${formatarDinheiro(r.total)} (${porcento(r.total, total)}%)`)
            const como =
                c.tipoConsulta === 'saldo'
                    ? 'O saldo é o que entrou menos o que saiu e o que foi investido, somando os lançamentos do período.'
                    : `Somei os lançamentos de ${NOME_DO_TIPO[tipo]} ${c.periodo.nome} (de ${formatarData(c.periodo.inicio, hoje)} a ${formatarData(c.periodo.fim, hoje)}).`
            return { respostas: [[como, linhas.length ? `Por categoria:` : 'Não há lançamentos nesse período.', ...linhas].join('\n')], opcoes: [] }
        }
        if (ultimo.modulo === 'analise') {
            return {
                respostas: [
                    'Para essa análise, usei só os lançamentos do Finance: comparo do dia 1 até hoje com o mesmo trecho do mês passado, vejo qual categoria pesa mais e se algum orçamento está perto do limite. Não invento números: se falta histórico, eu aviso.',
                ],
                opcoes: [],
            }
        }
        if (ultimo.modulo === 'lancamento') {
            return { respostas: [`Eu registrei ${ultimo.descricao}. Se não era isso, diga "apaga o último" ou corrija, por exemplo, "era 45" ou "era transporte".`], opcoes: ['Apaga o último'] }
        }
        return fala.semAssuntoParaExplicar()
    }

    function conversando(ctx) {
        const assuntos = ctx.contexto?.assuntos ?? []
        const aprendidos = [...(ctx.memoria.termos?.keys() ?? [])].length
        return ctx.fala.conversando(assuntos, aprendidos)
    }

    // ——— Fallback contextual: tenta entender o assunto e pergunta; nunca responde com o resumo do mês ———

    function fallback(ctx, d) {
        const { fala, contexto, texto } = ctx
        if (d.quase) return fala.voceQuisDizer(d.quase.pergunta)
        const f = normalizar(texto)
        const financeiro = /\b(gast\w*|ganh\w*|receb\w*|saldo|dinheiro|lanc\w*|invest\w*|pag\w*|compr\w*|reais|conta|categoria)\b/.test(f)
        if (financeiro) return fala.financeiroAmbiguo()
        if (d.pergunta) return fala.foraDoAssunto()
        if (contexto?.assuntos?.length) return fala.naoEntendiComContexto(contexto.assuntos.at(-1))
        return fala.naoEntendi()
    }

    return { processar }
}
