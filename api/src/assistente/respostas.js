// Gerador de respostas: todas as frases da assistente, no tom de quem escreve (mais solto se a pessoa é
// informal, com emoji se ela usa), com variações para não repetir sempre a mesma frase.
import { ROTULOS } from './dicionario.js'
import { escolher } from './estilo.js'
import { capitalizar, formatarDinheiro } from './texto.js'

const rotulo = (tipo, categoria) => ROTULOS[tipo]?.[categoria] ?? 'Outros'
const opcoesDeCategoria = (tipo) => Object.values(ROTULOS[tipo])
const LINHAS_NA_LISTA = 10

// Frases do assistente, no tom de quem escreve: mais solto se a pessoa é informal, com emoji se ela usa.
export function criarFala(estilo, s, primeiroNome, evitar = null) {
    const solto = estilo.informal
    const e = (emoji) => (estilo.emoji ? ` ${emoji}` : '')
    // Escolhe uma variação, pulando a que foi usada na resposta anterior
    const v = (...opcoes) => {
        const lista = opcoes.filter(Boolean)
        const escolhida = escolher(lista, s)
        if (evitar && lista.length > 1 && escolhida.slice(0, 60) === evitar.slice(0, 60)) return lista[(lista.indexOf(escolhida) + 1) % lista.length]
        return escolhida
    }
    const r = (respostas, opcoes = []) => ({ respostas: [].concat(respostas), opcoes })
    const nome = primeiroNome ? `, ${primeiroNome}` : ''

    return {
        // ——— Fallback: nunca o resumo do mês ———
        foraDoAssunto: () =>
            r(
                v(
                    'Essa eu não sei responder com segurança, então prefiro não arriscar. Eu cuido das suas finanças no Valtrea e também tiro dúvidas de educação financeira, contas e datas.',
                    'Não tenho uma resposta confiável para isso. Posso ajudar com os seus gastos e ganhos, dúvidas sobre dinheiro, contas e datas.',
                ),
                ['O que você consegue fazer?', 'Como está meu mês?'],
            ),
        voceQuisDizer: (pergunta) => r(`Não tenho certeza se entendi. Você quis perguntar "${pergunta}"?`, [pergunta, 'O que você consegue fazer?']),
        financeiroAmbiguo: () =>
            r(
                v(
                    'Não entendi bem o que você quer fazer. Quer lançar um gasto, ver quanto gastou ou outra coisa?',
                    'Fiquei na dúvida. Você quer registrar algo, consultar seus gastos ou apagar um lançamento?',
                ),
                ['Quanto gastei esse mês?', 'Gastei 30 no almoço', 'O que você consegue fazer?'],
            ),
        naoEntendiComContexto: (assunto) =>
            r(`Não entendi essa. Estávamos falando de ${assunto}; pode me perguntar de outro jeito?`, ['O que você consegue fazer?']),
        naoEntendi: () =>
            r(
                solto
                    ? v('Não peguei essa. Pode mandar de outro jeito?', 'Hmm, não entendi. Me explica com outras palavras?')
                    : v('Não entendi essa mensagem. Pode escrever de outro jeito?', 'Desculpe, não entendi. Pode reformular?'),
                ['O que você consegue fazer?'],
            ),
        erroTecnico: () => r('Tive um problema para fazer isso agora e nada foi alterado. Pode tentar de novo em instantes?'),

        // ——— Contexto ———
        semAssuntoParaExplicar: () =>
            r('Claro! Sobre o que você quer que eu explique melhor? Pode ser sobre os seus gastos, como eu funciono ou algum conceito de finanças.', [
                'Como você funciona?',
                'Quanto gastei esse mês?',
            ]),
        conversando: (assuntos, aprendidos) =>
            r(
                [
                    assuntos.length
                        ? `Nos últimos minutos falamos sobre: ${assuntos.join('; ')}.`
                        : 'Não estamos com nenhum assunto em andamento agora.',
                    aprendidos ? `Também lembro de ${aprendidos} ${aprendidos === 1 ? 'coisa que você me ensinou' : 'coisas que você me ensinou'}.` : '',
                    'Eu guardo só um resumo do assunto por 30 minutos, não o texto das mensagens.',
                ]
                    .filter(Boolean)
                    .join(' '),
                aprendidos ? ['O que você aprendeu comigo?'] : [],
            ),

        // ——— Aprendizado ———
        confirmarCategoriaEnsinada: (termo, categoria, anterior) =>
            r(
                anterior
                    ? `Hoje eu coloco "${termo}" em ${anterior}. Quer que eu passe a considerar "${termo}" como ${categoria}?`
                    : `Entendi! Posso considerar "${termo}" como ${categoria} nos próximos lançamentos?`,
                ['Sim', 'Não'],
            ),
        confirmarFraseEnsinada: (termo, explicacao, anterior) =>
            r(
                `${anterior ? `Hoje "${termo}" já tem uma regra. ` : ''}Entendi. Quer que, quando você perguntar "${termo}", eu mostre ${explicacao}?`,
                ['Sim', 'Não'],
            ),
        aprendi: (texto) => r(v(`Combinado! ${texto}`, `Anotado. ${texto}`)),
        ensinoInvalido: (motivo, termo) =>
            r(
                motivo === 'acao'
                    ? 'Isso eu não posso aprender: regras ensinadas servem só para consultas. Para apagar ou lançar, eu sempre peço a confirmação na hora.'
                    : motivo === 'alvo'
                      ? `Não entendi o que você quer ver quando perguntar "${termo}". Pode dizer, por exemplo, "quero saber meus gastos" ou "receita menos despesas"?`
                      : `Não achei essa categoria. As de gasto são: ${Object.values(ROTULOS.EXPENSE).join(', ')}.`,
            ),
        memoria: (linhas) =>
            r(
                linhas.length
                    ? ['O que eu aprendi com você:', ...linhas.map((l) => `• ${l}`), 'Para eu esquecer algo, diga "esquece" e o termo, ou toque na lixeira.'].join('\n')
                    : 'Ainda não aprendi nada específico com você. Quando eu perguntar uma categoria ou você me ensinar ("quando eu falar lanche, é alimentação"), eu guardo aqui.',
            ),
        esquecido: (termo) => r(`Pronto, esqueci "${termo}".`),
        nadaParaEsquecer: (termo) => r(`Não tenho nada guardado sobre "${termo}". Diga "o que você aprendeu?" para ver a lista.`),
        confirmarEsquecerTudo: () => r('Quer que eu esqueça tudo o que aprendi com você (categorias, frases e preferências)? Seus lançamentos continuam.', ['Sim, esquecer', 'Não']),
        esquecidoTudo: () => r('Pronto, esqueci tudo o que tinha aprendido. Seus lançamentos não mudaram.'),

        // ——— Orçamentos (metas de gasto) ———
        perguntarCategoriaOrcamento: (valor) =>
            r(`Para qual categoria é o orçamento de ${formatarDinheiro(valor)}?`, opcoesDeCategoria('EXPENSE').filter((c) => c !== 'Outros')),
        perguntarValorOrcamento: (cat) => r(`Qual o limite por mês para ${cat}?`),
        confirmarOrcamento: (cat, valor, atual) =>
            r(
                atual
                    ? `O orçamento de ${cat} hoje é ${formatarDinheiro(atual)}. Troco para ${formatarDinheiro(valor)} por mês?`
                    : `Crio um orçamento de ${formatarDinheiro(valor)} por mês para ${cat}?`,
                ['Sim', 'Não'],
            ),
        orcamentoSalvo: (cat, valor, gasto) =>
            r(`Pronto, orçamento de ${cat}: ${formatarDinheiro(valor)} por mês. Neste mês você já usou ${formatarDinheiro(gasto)}. Eu aviso quando chegar a 80% e a 100%.`),
        confirmarRemoverOrcamento: (cat) => r(`Tiro o orçamento de ${cat}?`, ['Sim', 'Não']),
        orcamentoRemovido: (cat) => r(`Pronto, ${cat} ficou sem orçamento.`),
        semOrcamento: (cat) => r(`${cat} não tem orçamento definido.`),
        orcamentoInvalido: () => r('O limite precisa ser de pelo menos R$ 1,00.'),

        // ——— Buscar, apagar e editar por descrição ———
        nadaEncontrado: () =>
            r('Não achei nenhum lançamento com essa descrição nos últimos 90 dias. Pode dar mais detalhes, como o valor, o dia ou o nome?'),
        escolherLancamento: (linhas, acao) =>
            r(
                [`Achei ${linhas.length}. Qual você quer ${acao}?`, ...linhas.map((l, i) => `${i + 1}. ${capitalizar(l)}`)].join('\n'),
                [...linhas.map((_, i) => String(i + 1)), 'Nenhum'],
            ),
        confirmarApagarUm: (descricao, peloPainel) =>
            r(`Apago ${descricao}?${peloPainel ? ' (Esse foi lançado pelo painel.)' : ''}`, ['Sim, apagar', 'Não']),
        confirmarEdicao: (antes, depois) => r(`Mudo ${antes} para ${depois}?`, ['Sim', 'Não']),
        oQueMudar: (descricao) => r(`Achei ${descricao}. O que eu mudo? Ex.: "para 70", "para transporte" ou "para ontem".`),
        editado: (descricao) => ({ ...r(`Pronto, ficou assim: ${descricao}.`), acao: 'corrigido' }),
        naoEditei: () => r(solto ? 'Beleza, deixei como estava.' : 'Certo, não mudei nada.'),

        // ——— Consultas extras ———
        sobra: (entrou, saiu, periodo) =>
            r(`${capitalizar(periodo)}, entrou ${formatarDinheiro(entrou)} e saiu ${formatarDinheiro(saiu)}: sobraram ${formatarDinheiro(entrou - saiu)} (receita menos despesas, como você me ensinou).`),
        doAssistente: (linhas, periodo, outros = 0) => {
            const quando = capitalizar(periodo)
            const painel = outros ? ` Pelo painel (ou importação e recorrentes) entraram mais ${outros} ${outros === 1 ? 'lançamento' : 'lançamentos'}.` : ''
            if (!linhas.length) return r(`${quando} eu não lancei nada por aqui.${painel}`)
            const lista = linhas.slice(0, LINHAS_NA_LISTA).map((l) => `• ${capitalizar(l)}`)
            if (linhas.length > LINHAS_NA_LISTA) lista.push(`… e mais ${linhas.length - LINHAS_NA_LISTA}`)
            return r([`${quando} eu lancei ${linhas.length === 1 ? 'só este' : linhas.length}:`, ...lista].join('\n') + (painel ? `\n${painel.trim()}` : ''))
        },
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
                pedido === 'sempre'
                    ? n === 1
                        ? 'Desde o início, só achei este lançado por mim:'
                        : `Desde o início, eu lancei ${n}:`
                    : pedido === 'todos'
                    ? n === 1
                        ? 'Hoje eu só lancei este:'
                        : `Estes são os ${n} que eu lancei hoje:`
                    : n < pedido
                      ? `Só achei ${n} ${n === 1 ? 'lançamento feito' : 'lançamentos feitos'} por mim nos últimos 7 dias:`
                      : `Os ${n} últimos que eu lancei:`
            const pergunta = n === 1 ? 'Apago?' : `Apago ${n === 2 ? 'os dois' : `os ${n}`}?`
            const lista = linhas.slice(0, LINHAS_NA_LISTA).map((l) => `• ${capitalizar(l)}`)
            if (n > LINHAS_NA_LISTA) lista.push(`… e mais ${n - LINHAS_NA_LISTA}`)
            const aviso = pedido === 'sempre' ? ' (Só o que eu lancei; o que você lançou pelo painel continua.)' : ''
            return r([titulo, ...lista, `${pergunta}${aviso}`].join('\n'), ['Sim, apagar', 'Não'])
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
        ultimos: (linhas, periodo) =>
            r(
                linhas.length
                    ? [periodo ? `Seus lançamentos ${periodo}:` : 'Seus últimos lançamentos:', ...linhas.map((l) => `• ${capitalizar(l)}`)].join('\n')
                    : periodo
                      ? `Não há lançamentos ${periodo}.`
                      : 'Você ainda não tem lançamentos.',
            ),
        maiores: (linhas, periodo, tipo) =>
            r(
                linhas.length
                    ? [`Onde ${tipo === 'EXPENSE' ? 'mais pesou' : 'mais entrou'} ${periodo}:`, ...linhas.map((l) => `• ${l}`)]
                    : `Nada lançado ${periodo} ainda.`,
            ),
        totalCategoria: (cat, total, periodo, tipo) =>
            r(
                total
                    ? `${tipo === 'EXPENSE' ? 'Você gastou' : tipo === 'EARNING' ? 'Entrou' : 'Você investiu'} ${formatarDinheiro(total)} em ${cat} ${periodo}.`
                    : `Não há ${tipo === 'EXPENSE' ? 'gastos' : tipo === 'EARNING' ? 'ganhos' : 'investimentos'} em ${cat} ${periodo}.`,
            ),
        totalTipo: (tipo, total, periodo) =>
            r(
                total
                    ? `${tipo === 'EXPENSE' ? 'Você gastou' : tipo === 'EARNING' ? 'Você recebeu' : 'Você investiu'} ${formatarDinheiro(total)} ${periodo}.`
                    : `Não há ${tipo === 'EXPENSE' ? 'gastos' : tipo === 'EARNING' ? 'ganhos' : 'investimentos'} lançados ${periodo}.`,
            ),
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
