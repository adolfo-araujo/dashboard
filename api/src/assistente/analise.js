// Análises com os dados reais da pessoa: nada de número inventado. Sem dados suficientes, diz a limitação.
import { ROTULOS } from './dicionario.js'
import { capitalizar, formatarDinheiro } from './texto.js'
import { mesAnterior, mesmoTrechoDoMesAnterior, ultimoDiaDoMes } from './datas.js'

const rotulo = (categoria, tipo = 'EXPENSE') => ROTULOS[tipo]?.[categoria] ?? 'Outros'
const pct = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0)
const variacao = (atual, antes) => (antes > 0 ? Math.round(((atual - antes) / antes) * 100) : null)
const inicioDoMes = (hoje) => `${hoje.slice(0, 8)}01`

// Dicas por categoria, para "como posso reduzir isso?"
const DICAS = {
    alimentacao: ['planejar as compras do mercado com lista', 'limitar os pedidos de delivery a alguns dias da semana', 'levar marmita alguns dias'],
    transporte: ['juntar trajetos no mesmo dia', 'comparar aplicativo com transporte público nos trajetos frequentes', 'manter a calibragem e a revisão do carro em dia, que reduz o consumo'],
    lazer: ['definir um valor fixo por mês para lazer', 'buscar programas gratuitos da cidade', 'combinar antes quanto vai gastar na saída'],
    compras: ['esperar 48 horas antes de comprar o que não é essencial', 'desativar compras com um clique', 'comparar preço em mais de uma loja'],
    assinaturas: ['listar todas as assinaturas e cancelar as que não usou no último mês', 'trocar planos individuais por planos família', 'alternar serviços de streaming em vez de assinar todos ao mesmo tempo'],
    contas: ['revisar o plano de celular e internet', 'desligar aparelhos da tomada e trocar lâmpadas por LED', 'pedir revisão de tarifas e buscar ofertas de outras operadoras'],
    moradia: ['negociar o reajuste do aluguel', 'rever o consumo de água e energia', 'pesquisar o seguro residencial em mais de uma seguradora'],
    saude: ['usar genéricos quando o médico permitir', 'comparar preço de remédios em mais de uma farmácia', 'ver o que o plano cobre antes de pagar à parte'],
    educacao: ['procurar cursos gratuitos ou com bolsa', 'comprar livros usados ou usar bibliotecas', 'negociar desconto pagando à vista'],
    impostos: ['conferir se há desconto pagando à vista (IPVA, IPTU)', 'organizar os vencimentos para evitar multa e juros'],
    outros: ['dar um nome claro a esses lançamentos para entender onde está o gasto', 'separar os gastos em categorias mais específicas'],
}

export function criarAnalise(repo) {
    // Totais e categorias de um período
    async function retrato(userId, inicio, fim) {
        const [totais, categorias] = await Promise.all([repo.totais(userId, inicio, fim), repo.porCategoria(userId, 'EXPENSE', inicio, fim)])
        return { totais, categorias }
    }

    // Categoria que mais aumentou entre dois retratos
    function maiorAumento(atual, antes) {
        const anteriores = new Map(antes.categorias.map((c) => [c.category, c.total]))
        return atual.categorias
            .map((c) => ({ categoria: c.category, diferenca: c.total - (anteriores.get(c.category) ?? 0) }))
            .sort((a, b) => b.diferenca - a.diferenca)[0]
    }

    /** "Estou gastando muito?", "Gastei muito esse mês?" */
    async function gastandoMuito({ userId, hoje }) {
        const comparar = mesmoTrechoDoMesAnterior(hoje)
        const [atual, antes] = await Promise.all([retrato(userId, inicioDoMes(hoje), hoje), retrato(userId, comparar.inicio, comparar.fim)])
        const gastoAtual = atual.totais.EXPENSE
        const gastoAntes = antes.totais.EXPENSE
        if (!gastoAtual && !gastoAntes) {
            return { texto: 'Ainda não há gastos lançados neste mês nem no anterior, então não tenho como avaliar. Quando você lançar alguns, eu comparo.' }
        }
        const linhas = []
        let foco = null
        const v = variacao(gastoAtual, gastoAntes)
        if (v === null) {
            linhas.push(`Neste mês você gastou ${formatarDinheiro(gastoAtual)}. Não tenho gastos do mesmo período do mês passado para comparar.`)
        } else if (Math.abs(v) < 5) {
            linhas.push(`Seus gastos estão estáveis: ${formatarDinheiro(gastoAtual)} até hoje, contra ${formatarDinheiro(gastoAntes)} no mesmo período do mês passado.`)
        } else if (v > 0) {
            const aumento = maiorAumento(atual, antes)
            linhas.push(`Seus gastos aumentaram ${v}% em relação ao mesmo período do mês passado (${formatarDinheiro(gastoAtual)} contra ${formatarDinheiro(gastoAntes)}).`)
            if (aumento && aumento.diferenca > 0) {
                foco = aumento.categoria
                linhas.push(`A categoria que mais contribuiu foi ${rotulo(aumento.categoria)} (+${formatarDinheiro(aumento.diferenca)}). Talvez valha revisar os gastos dela.`)
            }
        } else {
            linhas.push(`Boa notícia: seus gastos caíram ${Math.abs(v)}% em relação ao mesmo período do mês passado (${formatarDinheiro(gastoAtual)} contra ${formatarDinheiro(gastoAntes)}).`)
        }
        const entrou = atual.totais.EARNING
        if (entrou > 0) {
            const parte = pct(gastoAtual, entrou)
            linhas.push(
                parte > 100
                    ? `Os gastos já passaram do que entrou no mês (${parte}% de ${formatarDinheiro(entrou)}).`
                    : `Até agora, os gastos usaram ${parte}% do que entrou no mês (${formatarDinheiro(entrou)}).`,
            )
        }
        if (!foco && atual.categorias[0]) foco = atual.categorias[0].category
        return { texto: linhas.join(' '), foco, opcoes: foco ? [`Como reduzir ${rotulo(foco).toLowerCase()}?`, 'Pra onde foi meu dinheiro?'] : [] }
    }

    /** "Pra onde foi meu dinheiro?" */
    async function praOndeFoi({ userId, periodo }) {
        const { categorias, totais } = await retrato(userId, periodo.inicio, periodo.fim)
        if (!categorias.length) return { texto: `Não há gastos lançados ${periodo.nome}.` }
        const total = totais.EXPENSE
        const linhas = categorias.slice(0, 5).map((c) => `• ${rotulo(c.category)}: ${formatarDinheiro(c.total)} (${pct(c.total, total)}%)`)
        const maiores = await repo.buscarLancamentos(userId, { desde: periodo.inicio, ate: periodo.fim, type: 'EXPENSE', ordem: 'valor', limite: 1 })
        const maior = maiores[0] ? `O maior gasto foi ${maiores[0].name} (${formatarDinheiro(maiores[0].amount)}).` : ''
        return {
            texto: [`${capitalizar(periodo.nome)} saíram ${formatarDinheiro(total)}. Foi para:`, ...linhas, maior].filter(Boolean).join('\n'),
            foco: categorias[0].category,
            opcoes: [`Como reduzir ${rotulo(categorias[0].category).toLowerCase()}?`],
        }
    }

    /** Visão geral com sugestões: "o que você acha das minhas finanças?", "me dá uma sugestão", "estou preocupado". */
    async function visaoGeral({ userId, hoje }, modo = 'opiniao') {
        const comparar = mesmoTrechoDoMesAnterior(hoje)
        const [atual, antes, orcamentos] = await Promise.all([
            retrato(userId, inicioDoMes(hoje), hoje),
            retrato(userId, comparar.inicio, comparar.fim),
            repo.orcamentos(userId, inicioDoMes(hoje), hoje),
        ])
        const { EARNING: entrou, EXPENSE: saiu, INVESTMENT: investiu } = atual.totais
        const abertura = {
            preocupado: 'Entendo a preocupação. Vamos olhar os seus números juntos.',
            sugestao: 'Olhei os seus lançamentos deste mês.',
            opiniao: 'Não sou consultora financeira, mas olhando os seus lançamentos deste mês:',
        }[modo]
        if (!entrou && !saiu && !investiu) {
            return {
                texto: `${abertura} Ainda não há lançamentos neste mês, então não consigo avaliar. Me conte seus gastos e ganhos e eu passo a acompanhar.${modo === 'preocupado' ? ' Um bom primeiro passo é anotar tudo por uma semana.' : ''}`,
                opcoes: ['Gastei 30 no almoço', 'Como controlar meus gastos?'],
            }
        }
        const fatos = []
        const sugestoes = []
        const sobra = entrou - saiu - investiu
        if (entrou > 0) {
            if (sobra >= 0) fatos.push(`Entrou ${formatarDinheiro(entrou)} e saiu ${formatarDinheiro(saiu)}; sobraram ${formatarDinheiro(sobra)} (${pct(sobra, entrou)}% do que entrou)${investiu ? `, além de ${formatarDinheiro(investiu)} investidos` : ''}.`)
            else fatos.push(`Os gastos${investiu ? ' e investimentos' : ''} passaram do que entrou em ${formatarDinheiro(-sobra)} (entrou ${formatarDinheiro(entrou)}, saiu ${formatarDinheiro(saiu + investiu)}).`)
        } else {
            fatos.push(`Saíram ${formatarDinheiro(saiu)} e ainda não há ganhos lançados neste mês, então não dá para saber quanto do que entrou foi gasto.`)
        }
        const top = atual.categorias[0]
        const topPct = top ? pct(top.total, saiu) : 0
        if (top) fatos.push(`${rotulo(top.category)} é onde mais pesa: ${formatarDinheiro(top.total)} (${topPct}% dos gastos).`)
        const v = variacao(saiu, antes.totais.EXPENSE)
        if (v !== null && Math.abs(v) >= 10) fatos.push(`Os gastos estão ${Math.abs(v)}% ${v > 0 ? 'acima' : 'abaixo'} do mesmo período do mês passado.`)
        const apertados = orcamentos.filter((o) => o.amount > 0 && o.spent / o.amount >= 0.8)
        if (apertados.length) fatos.push(`Orçamento perto ou acima do limite: ${apertados.map((o) => `${rotulo(o.category)} (${pct(o.spent, o.amount)}%)`).join(', ')}.`)

        if (entrou > 0 && sobra < 0 && top) sugestoes.push(`comece revendo ${rotulo(top.category)}, que é onde há mais espaço para cortar`)
        else if (entrou > 0 && pct(sobra, entrou) < 10) sugestoes.push('tente separar pelo menos 10% do que entra assim que o dinheiro cair')
        if (top && topPct >= 40) sugestoes.push(`${rotulo(top.category)} concentra ${topPct}% dos gastos; vale definir um orçamento para ela`)
        if (!orcamentos.length) sugestoes.push('defina orçamentos por categoria (posso criar aqui: "orçamento de 500 para alimentação"), que eu aviso quando chegar perto')
        if (v !== null && v >= 15) {
            const aumento = maiorAumento(atual, antes)
            if (aumento?.diferenca > 0) sugestoes.push(`veja o que mudou em ${rotulo(aumento.categoria)}, que mais subiu (+${formatarDinheiro(aumento.diferenca)})`)
        }
        if (entrou > 0 && sobra > 0 && !investiu) sugestoes.push('como sobrou dinheiro, guardar uma parte numa reserva de emergência é um bom próximo passo')
        if (!entrou) sugestoes.push('lance também os seus ganhos, para eu conseguir comparar com os gastos')

        const lista = sugestoes.slice(0, 3).map((s) => `• ${capitalizar(s)}.`)
        return {
            texto: [abertura, ...fatos, lista.length ? 'Minhas sugestões:' : '', ...lista].filter(Boolean).join('\n'),
            foco: top?.category ?? null,
            opcoes: top ? [`Como reduzir ${rotulo(top.category).toLowerCase()}?`, 'Estou gastando muito?'] : [],
        }
    }

    /** "Como posso reduzir isso?" — dados da categoria + dicas. */
    async function reduzir({ userId, hoje, periodo }, categoria) {
        const p = periodo ?? { inicio: inicioDoMes(hoje), fim: hoje, nome: 'neste mês' }
        const lista = await repo.buscarLancamentos(userId, { desde: p.inicio, ate: p.fim, type: 'EXPENSE', category: categoria, ordem: 'valor', limite: 200 })
        const dicas = (DICAS[categoria] ?? DICAS.outros).map((d) => `• ${capitalizar(d)}.`)
        if (!lista.length) {
            return { texto: [`Não há gastos em ${rotulo(categoria)} ${p.nome}. Algumas ideias gerais para essa categoria:`, ...dicas].join('\n') }
        }
        const total = lista.reduce((s, l) => s + l.amount, 0)
        const media = total / lista.length
        const maiores = lista.slice(0, 3).map((l) => `${l.name} (${formatarDinheiro(l.amount)})`).join(', ')
        const orcamento = (await repo.orcamentos(userId, inicioDoMes(hoje), hoje)).find((o) => o.category === categoria)
        const linhaOrcamento = orcamento
            ? `O orçamento de ${rotulo(categoria)} é ${formatarDinheiro(orcamento.amount)} e você já usou ${pct(orcamento.spent, orcamento.amount)}%.`
            : `Você ainda não tem orçamento para ${rotulo(categoria)}; definir um limite ajuda a acompanhar.`
        return {
            texto: [
                `${capitalizar(p.nome)}, ${rotulo(categoria)} somou ${formatarDinheiro(total)} em ${lista.length} ${lista.length === 1 ? 'lançamento' : 'lançamentos'} (média de ${formatarDinheiro(media)}). Os maiores: ${maiores}.`,
                linhaOrcamento,
                'Algumas ideias para reduzir:',
                ...dicas,
            ].join('\n'),
            foco: categoria,
            opcoes: orcamento ? [] : [`Orçamento de ${Math.max(50, Math.round((total * 0.9) / 10) * 10)} para ${rotulo(categoria).toLowerCase()}`],
        }
    }

    /** "Compara esse mês com o mês passado" */
    async function comparar({ userId, hoje }) {
        const anterior = mesmoTrechoDoMesAnterior(hoje)
        const [atual, antes] = await Promise.all([retrato(userId, inicioDoMes(hoje), hoje), retrato(userId, anterior.inicio, anterior.fim)])
        if (!antes.totais.EXPENSE && !antes.totais.EARNING) {
            return { texto: 'Não há lançamentos no mesmo período do mês passado, então não tenho com o que comparar ainda.' }
        }
        const linha = (nome, a, b) => {
            const v = variacao(a, b)
            return `• ${nome}: ${formatarDinheiro(a)} agora, ${formatarDinheiro(b)} antes${v === null ? '' : ` (${v > 0 ? '+' : ''}${v}%)`}`
        }
        const aumento = maiorAumento(atual, antes)
        return {
            texto: [
                `Do dia 1 até hoje, comparado ao mesmo período do mês passado:`,
                linha('Gastos', atual.totais.EXPENSE, antes.totais.EXPENSE),
                linha('Ganhos', atual.totais.EARNING, antes.totais.EARNING),
                linha('Investimentos', atual.totais.INVESTMENT, antes.totais.INVESTMENT),
                aumento?.diferenca > 0 ? `A categoria que mais subiu foi ${rotulo(aumento.categoria)} (+${formatarDinheiro(aumento.diferenca)}).` : '',
            ]
                .filter(Boolean)
                .join('\n'),
            foco: aumento?.diferenca > 0 ? aumento.categoria : null,
        }
    }

    /** "Meus gastos estão aumentando?" — três meses fechados e o atual até hoje. */
    async function tendencia({ userId, hoje }) {
        const meses = [3, 2, 1].map((n) => mesAnterior(hoje, n))
        const totais = await Promise.all(meses.map((m) => repo.totais(userId, m.inicio, m.fim)))
        const atual = await repo.totais(userId, inicioDoMes(hoje), hoje)
        const fechados = meses.map((m, i) => ({ nome: m.nome, valor: totais[i].EXPENSE })).filter((m) => m.valor > 0)
        if (fechados.length < 2) return { texto: 'Ainda não tenho pelo menos dois meses fechados com gastos lançados para ver uma tendência.' }
        const linhas = fechados.map((m) => `• ${capitalizar(m.nome)}: ${formatarDinheiro(m.valor)}`)
        linhas.push(`• Este mês, até hoje: ${formatarDinheiro(atual.EXPENSE)}`)
        const primeiro = fechados[0]
        const ultimo = fechados.at(-1)
        const v = variacao(ultimo.valor, primeiro.valor)
        const conclusao =
            Math.abs(v) < 5
                ? 'Entre os meses fechados, os gastos estão praticamente estáveis.'
                : `De ${primeiro.nome} para ${ultimo.nome}, os gastos ${v > 0 ? 'subiram' : 'caíram'} ${Math.abs(v)}%.`
        return { texto: ['Seus gastos nos últimos meses:', ...linhas, conclusao].join('\n') }
    }

    /** "Quanto posso gastar por dia?" — para fechar o mês sem ficar no negativo. */
    async function porDia({ userId, hoje }) {
        const t = await repo.totais(userId, inicioDoMes(hoje), hoje)
        const [ano, mes, dia] = hoje.split('-').map(Number)
        const dias = ultimoDiaDoMes(ano, mes) - dia + 1
        const saldo = t.EARNING - t.EXPENSE - t.INVESTMENT
        if (!t.EARNING) return { texto: 'Não há ganhos lançados neste mês, então não consigo calcular quanto dá para gastar por dia.' }
        if (saldo <= 0) return { texto: `O saldo do mês já está em ${formatarDinheiro(saldo)}. Para não aumentar o negativo, o ideal seria segurar os gastos até o próximo dinheiro entrar.` }
        return {
            texto: `Com ${formatarDinheiro(saldo)} de saldo e ${dias} ${dias === 1 ? 'dia' : 'dias'} até o fim do mês (contando hoje), dá cerca de ${formatarDinheiro(saldo / dias)} por dia para fechar no zero. Considera só o que já está lançado.`,
        }
    }

    /** "Como estão meus investimentos?" */
    async function investimentos({ userId, hoje }) {
        const inicioAno = `${hoje.slice(0, 4)}-01-01`
        const [ano, mes] = await Promise.all([
            repo.porCategoria(userId, 'INVESTMENT', inicioAno, hoje),
            repo.totais(userId, inicioDoMes(hoje), hoje),
        ])
        if (!ano.length) return { texto: 'Não há investimentos lançados neste ano. Quando investir, me conte: "investi 300 no tesouro".' }
        const total = ano.reduce((s, c) => s + c.total, 0)
        const linhas = ano.map((c) => `• ${rotulo(c.category, 'INVESTMENT')}: ${formatarDinheiro(c.total)}`)
        return {
            texto: [`Neste ano você aplicou ${formatarDinheiro(total)} (neste mês, ${formatarDinheiro(mes.INVESTMENT)}). Por tipo:`, ...linhas, 'Esses são os valores lançados no Finance, sem o rendimento das aplicações.'].join('\n'),
        }
    }

    /** Média de gastos dos últimos meses fechados, para combinar com a base de conhecimento (reserva, 50-30-20). */
    async function medias({ userId, hoje }) {
        const meses = [3, 2, 1].map((n) => mesAnterior(hoje, n))
        const totais = await Promise.all(meses.map((m) => repo.totais(userId, m.inicio, m.fim)))
        const comGasto = totais.filter((t) => t.EXPENSE > 0)
        const comGanho = totais.filter((t) => t.EARNING > 0)
        return {
            gasto: comGasto.length ? comGasto.reduce((s, t) => s + t.EXPENSE, 0) / comGasto.length : null,
            ganho: comGanho.length ? comGanho.reduce((s, t) => s + t.EARNING, 0) / comGanho.length : null,
            meses: Math.max(comGasto.length, comGanho.length),
        }
    }

    return { gastandoMuito, praOndeFoi, visaoGeral, reduzir, comparar, tendencia, porDia, investimentos, medias }
}
