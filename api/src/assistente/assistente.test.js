import { criarAssistente } from './assistente.js'

// Banco falso em memória, com as mesmas funções do repositorio.js
function repoFalso({ orcamentos = [], lancamentos = [] } = {}) {
    const estado = { lancamentos: [...lancamentos], termos: new Map(), pendencia: null, estilo: null, contexto: null, orcamentos: [...orcamentos], seq: 100 }
    const naFaixa = (l, inicio, fim) => (!inicio || l.date >= inicio) && (!fim || l.date <= fim)
    return {
        estado,
        carregarMemoria: async () => ({ termos: estado.termos, historico: estado.lancamentos, estilo: estado.estilo, contexto: estado.contexto }),
        salvarContexto: async (_, c) => {
            estado.contexto = c
        },
        buscarLancamentos: async (_, { desde, ate, amount, type, category, termo, ordem, limite = 5 } = {}) =>
            estado.lancamentos
                .filter((l) => naFaixa(l, desde, ate))
                .filter((l) => (!amount || l.amount === amount) && (!type || l.type === type) && (!category || l.category === category))
                .filter((l) => !termo || l.name.toLowerCase().includes(termo.toLowerCase()))
                .sort((a, b) => (ordem === 'valor' ? b.amount - a.amount : b.date.localeCompare(a.date) || Number(b.id) - Number(a.id)))
                .slice(0, limite)
                .map((l) => ({ ...l, doAssistente: Boolean(l.assistente) })),
        contarPorOrigem: async (_, inicio, fim) => {
            const lista = estado.lancamentos.filter((l) => naFaixa(l, inicio, fim))
            return { doAssistente: lista.filter((l) => l.assistente).length, outros: lista.filter((l) => !l.assistente).length }
        },
        salvarOrcamento: async (_, category, amount) => {
            estado.orcamentos = [...estado.orcamentos.filter((o) => o.category !== category), { category, amount }]
        },
        removerOrcamento: async (_, category) => {
            const antes = estado.orcamentos.length
            estado.orcamentos = estado.orcamentos.filter((o) => o.category !== category)
            return estado.orcamentos.length < antes
        },
        listarMemoria: async () => [...estado.termos].map(([chave, categoria]) => {
            const [tipo, ...resto] = chave.split(':')
            return { tipo, termo: resto.join(':'), categoria, usos: 1 }
        }),
        esquecerTermo: async (_, termo, tipo) => {
            let n = 0
            for (const chave of [...estado.termos.keys()]) {
                const [t, ...resto] = chave.split(':')
                if (resto.join(':') === termo && (!tipo || t === tipo)) {
                    estado.termos.delete(chave)
                    n++
                }
            }
            return n
        },
        esquecerAprendizado: async () => {
            estado.termos.clear()
        },
        lerPendencia: async () => estado.pendencia,
        salvarPendencia: async (_, dados) => {
            estado.pendencia = dados
        },
        salvarEstilo: async (_, estilo) => {
            estado.estilo = estilo
        },
        primeiroNome: async () => 'Ana',
        ensinar: async (_, tipo, termo, categoria) => {
            estado.termos.set(`${tipo}:${termo}`, categoria)
        },
        criarLancamento: async (_, l) => {
            const criado = { id: String(++estado.seq), ...l, assistente: true }
            estado.lancamentos.push(criado)
            return criado
        },
        lancamentosDoAssistente: async (_, { limite = 20 } = {}) => estado.lancamentos.filter((l) => l.assistente).slice(-limite).reverse(),
        ultimoLancamentoDoAssistente: async () => estado.lancamentos.filter((l) => l.assistente).at(-1) ?? null,
        apagarLancamento: async (_, id) => {
            estado.lancamentos = estado.lancamentos.filter((l) => l.id !== id)
        },
        atualizarLancamento: async (_, id, campos) => {
            const l = estado.lancamentos.find((x) => x.id === id)
            if (!l) return null
            Object.assign(l, campos)
            return l
        },
        totais: async (_, inicio, fim) => {
            const t = { EARNING: 0, EXPENSE: 0, INVESTMENT: 0 }
            for (const l of estado.lancamentos.filter((x) => naFaixa(x, inicio, fim))) t[l.type] += l.amount
            return t
        },
        porCategoria: async (_, tipo, inicio, fim) => {
            const mapa = {}
            for (const l of estado.lancamentos.filter((x) => x.type === tipo && naFaixa(x, inicio, fim))) mapa[l.category] = (mapa[l.category] ?? 0) + l.amount
            return Object.entries(mapa)
                .map(([category, total]) => ({ category, total }))
                .sort((a, b) => b.total - a.total)
        },
        ultimos: async (_, n) => estado.lancamentos.slice(-n).reverse(),
        orcamentos: async (_, inicio, fim) =>
            estado.orcamentos.map((o) => ({
                ...o,
                spent: estado.lancamentos.filter((l) => l.type === 'EXPENSE' && l.category === o.category && naFaixa(l, inicio, fim)).reduce((s, l) => s + l.amount, 0),
            })),
    }
}

const agora = new Date('2026-11-19T15:00:00Z')
const conversa = (repo) => {
    const assistente = criarAssistente(repo)
    return async (texto) => {
        const r = await assistente.processar({ userId: 'u1', texto, agora })
        return { texto: r.respostas.join('\n'), opcoes: r.opcoes, acao: r.acao }
    }
}

describe('assistente', () => {
    it('lança direto quando entende tudo', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        const r = await falar('gastei 40 no mercado')
        expect(r.acao).toBe('lancado')
        expect(r.texto).toMatch(/R\$\s?40,00 em Alimentação \(Mercado\), hoje/)
        expect(repo.estado.lancamentos).toHaveLength(1)
        expect(repo.estado.lancamentos[0]).toMatchObject({ amount: 40, type: 'EXPENSE', category: 'alimentacao', date: '2026-11-19' })
    })

    it('pergunta a categoria que não conhece e aprende para a próxima', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        const pergunta = await falar('gastei 80 no zezinho')
        expect(pergunta.texto).toMatch(/Em qual categoria/)
        expect(pergunta.opcoes).toContain('Lazer')
        expect(repo.estado.lancamentos).toHaveLength(0)

        const r = await falar('lazer')
        expect(r.texto).toMatch(/Lazer \(Zezinho\)/)
        expect(r.texto).toMatch(/Guardei essa categoria/)

        await falar('gastei 35 no zezinho')
        expect(repo.estado.lancamentos[1]).toMatchObject({ category: 'lazer', amount: 35 })
    })

    it('pergunta o valor quando falta', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        expect((await falar('paguei o aluguel')).texto).toMatch(/valor|Quanto/)
        await falar('1500')
        expect(repo.estado.lancamentos[0]).toMatchObject({ amount: 1500, category: 'moradia' })
    })

    it('pergunta o tipo quando não dá para saber', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        const r = await falar('300 do zezinho')
        expect(r.opcoes).toEqual(['Gasto', 'Ganho', 'Investimento'])
        await falar('ganho')
        const c = await falar('freelance')
        expect(c.texto).toMatch(/ganho de/)
        expect(repo.estado.lancamentos[0]).toMatchObject({ type: 'EARNING', category: 'freelance' })
    })

    it('confirma antes de lançar quando entendeu por aproximação', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        expect((await falar('gastei 30 na farmacya')).texto).toMatch(/Posso lançar/)
        expect(repo.estado.lancamentos).toHaveLength(0)
        await falar('sim')
        expect(repo.estado.lancamentos[0]).toMatchObject({ category: 'saude' })
    })

    it('cancela quando a pessoa diz não', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        await falar('gastei 30 na farmacya')
        expect((await falar('não')).texto).toMatch(/Nada foi lançado|não anotei|deixei/)
        expect(repo.estado.lancamentos).toHaveLength(0)
    })

    it('corrige o último lançamento e aprende a categoria corrigida', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        await falar('gastei 40 no mercado')
        expect((await falar('era 45')).texto).toMatch(/Corrigido/)
        expect(repo.estado.lancamentos[0].amount).toBe(45)
        await falar('na verdade foi lazer')
        expect(repo.estado.lancamentos[0].category).toBe('lazer')
        expect(repo.estado.termos.get('EXPENSE:mercado')).toBe('lazer')
    })

    it('desfaz o último lançamento', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        await falar('uber 23')
        expect((await falar('apaga o último')).texto).toMatch(/apaguei/i)
        expect(repo.estado.lancamentos).toHaveLength(0)
        expect((await falar('apaga')).texto).toMatch(/Não achei/)
    })

    it('responde saldo, total por categoria e onde mais pesou', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        await falar('recebi 3000 de salário')
        await falar('gastei 400 no mercado')
        await falar('uber 100')
        expect((await falar('qual meu saldo?')).texto).toMatch(/Saldo: R\$\s?2\.500,00/)
        expect((await falar('quanto gastei com transporte?')).texto).toMatch(/R\$\s?100,00 em Transporte/)
        expect((await falar('onde eu mais gastei?')).texto).toMatch(/Alimentação: R\$\s?400,00 \(80%\)/)
    })

    it('avisa ao chegar perto e ao passar do orçamento, uma vez só', async () => {
        const repo = repoFalso({ orcamentos: [{ category: 'alimentacao', amount: 500 }] })
        const falar = conversa(repo)
        expect((await falar('mercado 300')).texto).not.toMatch(/orçamento/)
        expect((await falar('mercado 120')).texto).toMatch(/84% do orçamento de Alimentação/)
        expect((await falar('mercado 10')).texto).not.toMatch(/orçamento/)
        expect((await falar('mercado 100')).texto).toMatch(/passou do orçamento de Alimentação/)
    })

    it('deixa a pergunta anterior de lado quando chega um pedido novo completo', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        await falar('gastei 80 no zezinho')
        await falar('paguei 120 de luz')
        expect(repo.estado.lancamentos).toHaveLength(1)
        expect(repo.estado.lancamentos[0]).toMatchObject({ amount: 120, category: 'contas', name: 'Luz' })
    })

    it('entende jeitos do dia a dia de contar um gasto', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        await falar('almocei hoje, deu 32 reais')
        await falar('dei 20 pro flanelinha')
        await falar('gastei 15 no ifood kkk')
        expect(repo.estado.lancamentos.map((l) => [l.category, l.amount, l.name])).toEqual([
            ['alimentacao', 32, 'Alimentação'],
            ['transporte', 20, 'Flanelinha'],
            ['alimentacao', 15, 'Ifood'],
        ])
    })

    it('não lança o que ainda vai acontecer, mas lança se a pessoa disser que já foi', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        const plano = await falar('quero gastar 60 em comida')
        expect(plano.texto).toMatch(/não lancei/)
        expect(plano.texto).toMatch(/orçamento de Alimentação/)
        expect(plano.opcoes).toEqual(['Já aconteceu, pode lançar', 'Não lançar'])
        expect(repo.estado.lancamentos).toHaveLength(0)
        expect((await falar('Não lançar')).texto).toMatch(/Nada foi lançado|não anotei|deixei/)

        const amanha = await falar('gastarei amanha 80 no plano de celular')
        expect(amanha.texto).toMatch(/amanhã/)
        expect(repo.estado.lancamentos).toHaveLength(0)
        await falar('Já aconteceu, pode lançar')
        expect(repo.estado.lancamentos[0]).toMatchObject({ amount: 80, category: 'contas', name: 'Plano de celular', date: '2026-11-19' })
    })

    it('apaga vários de uma vez, mas confirma antes', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        await falar('recebi 3000 de salário')
        await falar('gastei 40 no mercado')
        await falar('uber 20')

        const doisUltimos = await falar('apaga os 2 últimos')
        expect(doisUltimos.texto).toMatch(/Os 2 últimos que eu lancei/)
        expect(doisUltimos.opcoes).toEqual(['Sim, apagar', 'Não'])
        expect(repo.estado.lancamentos).toHaveLength(3)
        await falar('apaga')
        expect(repo.estado.lancamentos.map((l) => l.amount)).toEqual([3000])

        await falar('gastei 50 no bar')
        expect((await falar('apague todos esses que mandei')).texto).toMatch(/Estes são os 2 que eu lancei hoje/)
        expect((await falar('Sim, apagar')).texto).toMatch(/apaguei os 2/)
        expect(repo.estado.lancamentos).toHaveLength(0)
    })

    it('larga a pergunta quando a pessoa pede para tirar do saldo o que mandou', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        await falar('gastei 40 no mercado')
        await falar('uber 20')
        await falar('gastei 15 no ifood')
        expect((await falar('gaste os ultimos 3 que lancei')).texto).not.toMatch(/R\$\s?3,00/)
        const r = await falar('nenhum dos 3, eu quero que voce tire do saldo as 3 coisas que te mandei anteriormente')
        expect(r.texto).toMatch(/Os 3 últimos que eu lancei/)
        await falar('sim')
        expect(repo.estado.lancamentos).toHaveLength(0)
    })

    it('lança vários gastos mandados na mesma mensagem', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        const r = await falar('gasto de R$ 60,00 em Alimentação, gasto de R$ 80,00 em Contas e serviços')
        expect(r.texto).toMatch(/Lancei 2/)
        expect(repo.estado.lancamentos.map((l) => [l.category, l.amount])).toEqual([
            ['alimentacao', 60],
            ['contas', 80],
        ])
        await falar('gastei 40 no mercado e 20 no zezinho')
        expect(repo.estado.lancamentos).toHaveLength(3)
        expect(repo.estado.pendencia).toMatchObject({ etapa: 'categoria' })
        await falar('lazer')
        expect(repo.estado.lancamentos.at(-1)).toMatchObject({ amount: 20, category: 'lazer', type: 'EXPENSE' })
        await falar('paguei mil e duzentos de aluguel')
        expect(repo.estado.lancamentos.at(-1)).toMatchObject({ amount: 1200, category: 'moradia' })
    })

    it('pede desculpa e oferece apagar quando a pessoa reclama', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        await falar('gastei 60 no mercado')
        const r = await falar('nao nao, voce me pediu para falar o valor e onde foi, eu mandei os dois e voce lançou mais um')
        expect(r.texto).toMatch(/Quer que eu apague/)
        expect((await falar('não')).texto).toMatch(/não apaguei/)
        await falar('voce lançou errado')
        await falar('sim')
        expect(repo.estado.lancamentos).toHaveLength(0)
    })

    it('pergunta se é para ver ou apagar quando só vem a quantidade', async () => {
        const falar = conversa(repoFalso())
        const r = await falar('os ultimos 3 que te disse')
        expect(r.opcoes).toEqual(['Mostra os 3 últimos', 'Apaga os 3 últimos'])
    })

    it('apaga tudo o que lançou desde o início, com confirmação', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        await falar('gastei 40 no mercado')
        await falar('uber 20')
        const r = await falar('tire todos os gastos que lancei contigo desde o inicio')
        expect(r.texto).toMatch(/Desde o início, eu lancei 2/)
        expect(r.texto).toMatch(/o que você lançou pelo painel continua/)
        await falar('Sim, apagar')
        expect(repo.estado.lancamentos).toHaveLength(0)
    })

    it('responde no tom de quem escreve', async () => {
        const falar = conversa(repoFalso())
        expect((await falar('gastei 50 conto no bar kkk 🍺')).texto).toMatch(/✅/)
        const formal = await conversa(repoFalso())('Gastei R$ 50,00 no restaurante.')
        expect(formal.texto).not.toMatch(/✅/)
    })
})

// Lançamentos feitos pelo painel (sem a marca da assistente), para as conversas abaixo
const historico = () => [
    { id: '1', name: 'Padaria', amount: 25, type: 'EXPENSE', category: 'alimentacao', date: '2026-11-18' },
    { id: '2', name: 'Mercado', amount: 100, type: 'EXPENSE', category: 'alimentacao', date: '2026-10-05' },
    { id: '3', name: 'Salário', amount: 3000, type: 'EARNING', category: 'salario', date: '2026-10-05' },
    { id: '4', name: 'Aluguel', amount: 900, type: 'EXPENSE', category: 'moradia', date: '2026-09-10' },
    { id: '5', name: 'Cinema', amount: 40, type: 'EXPENSE', category: 'lazer', date: '2026-11-11' },
]
const semNumeros = (texto) => !/R\$|Resumo|Saldo/.test(texto)

describe('Valtrea Assistente: os 10 cenários obrigatórios', () => {
    it('1. "O que você é?" apresenta a assistente, sem resumo financeiro', async () => {
        const r = await conversa(repoFalso({ lancamentos: historico() }))('O que você é?')
        expect(r.texto).toMatch(/Valtrea Assistente/)
        expect(semNumeros(r.texto)).toBe(true)
    })

    it('2. "Como você funciona?" explica automação, interpretação e aprendizado', async () => {
        const r = await conversa(repoFalso())('Como você funciona?')
        expect(r.texto).toMatch(/descubro o que você quer/)
        expect(r.texto).toMatch(/me ensina/)
        expect(r.texto).toMatch(/Não uso IA de fora/)
        expect(semNumeros(r.texto)).toBe(true)
    })

    it('3. "Você fez algum lançamento esse mês?" usa os dados reais e separa o que veio do painel', async () => {
        const repo = repoFalso({ lancamentos: historico() })
        const falar = conversa(repo)
        expect((await falar('Você fez algum lançamento esse mês?')).texto).toMatch(/Neste mês eu não lancei nada por aqui\. Pelo painel .* mais 2 lançamentos/)
        await falar('gastei 12 no café')
        const r = await falar('Você fez algum lançamento esse mês?')
        expect(r.texto).toMatch(/Neste mês eu lancei só este:\n• Gasto de R\$\s?12,00 em Alimentação \(Café\), hoje/)
        expect(r.texto).toMatch(/mais 2 lançamentos/)
    })

    it('4. "Gastei 60 reais com comida." vira despesa de R$ 60 em Alimentação', async () => {
        const repo = repoFalso()
        const r = await conversa(repo)('Gastei 60 reais com comida.')
        expect(r.texto).toMatch(/R\$\s?60,00 em Alimentação/)
        expect(repo.estado.lancamentos[0]).toMatchObject({ type: 'EXPENSE', amount: 60, category: 'alimentacao' })
    })

    it('4b. com a preferência de confirmar, só lança depois do "sim"', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        expect((await falar('sempre me pergunte antes de lançar')).texto).toMatch(/espero o seu "sim"/)
        expect((await falar('Gastei 60 reais com comida.')).texto).toMatch(/Posso lançar\?/)
        expect(repo.estado.lancamentos).toHaveLength(0)
        await falar('sim')
        expect(repo.estado.lancamentos[0]).toMatchObject({ amount: 60, category: 'alimentacao' })
    })

    it('5 e 6. "Quanto gastei em comida?" e depois "E ontem?" seguem o mesmo assunto', async () => {
        const falar = conversa(repoFalso({ lancamentos: historico() }))
        expect((await falar('Quanto gastei em comida?')).texto).toMatch(/Você gastou R\$\s?25,00 em Alimentação neste mês/)
        expect((await falar('E ontem?')).texto).toMatch(/Você gastou R\$\s?25,00 em Alimentação ontem/)
        expect((await falar('e anteontem?')).texto).toMatch(/Não há gastos em Alimentação anteontem/)
        expect((await falar('e com lazer?')).texto).toMatch(/Não há gastos em Lazer anteontem/)
    })

    it('7. "Obrigado!" recebe resposta social, sem números', async () => {
        const r = await conversa(repoFalso({ lancamentos: historico() }))('Obrigado!')
        expect(r.texto).toMatch(/nada|Imagina/)
        expect(semNumeros(r.texto)).toBe(true)
    })

    it('8. mensagem desconhecida tenta entender ou pede esclarecimento, nunca o resumo', async () => {
        const falar = conversa(repoFalso({ lancamentos: historico() }))
        for (const texto of ['blorp zing', 'qual a capital da frança?', 'o que acha do tempo lá fora?', 'xpto dinheiro aquilo']) {
            const r = await falar(texto)
            expect(r.texto).not.toMatch(/Resumo|Saldo:/)
        }
        expect((await falar('qual a capital da frança?')).texto).toMatch(/não sei responder|resposta confiável/)
        expect((await falar('xpto dinheiro aquilo')).texto).toMatch(/Não entendi bem|Fiquei na dúvida/)
    })

    it('9. aprende uma expressão nova depois de confirmar e usa nas próximas vezes', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        const pergunta = await falar('Quando eu falar xis, normalmente é alimentação.')
        expect(pergunta.texto).toMatch(/Posso considerar "xis" como Alimentação/)
        expect(repo.estado.termos.size).toBe(0)
        expect((await falar('sim')).texto).toMatch(/Vou considerar "xis" como Alimentação/)
        expect(repo.estado.termos.get('EXPENSE:xis')).toBe('alimentacao')
        await falar('paguei 18 no xis')
        expect(repo.estado.lancamentos[0]).toMatchObject({ amount: 18, category: 'alimentacao' })

        await falar('recebi 1000 de salário')
        await falar('quando eu perguntar quanto sobrou, quero saber minha receita menos minhas despesas')
        await falar('sim')
        expect((await falar('quanto sobrou?')).texto).toMatch(/entrou R\$\s?1\.000,00 e saiu R\$\s?18,00: sobraram R\$\s?982,00/)

        const lista = await falar('o que você aprendeu?')
        expect(lista.texto).toMatch(/"xis" é Alimentação/)
        expect(lista.texto).toMatch(/quando você pergunta "quanto sobrou"/)
        expect((await falar('esquece xis')).texto).toMatch(/esqueci "xis"/)
        expect(repo.estado.termos.has('EXPENSE:xis')).toBe(false)
    })

    it('9b. não aprende regra que apaga ou lança, nem guarda sem confirmação', async () => {
        const repo = repoFalso()
        const falar = conversa(repo)
        expect((await falar('quando eu perguntar limpa, quero que apague tudo')).texto).toMatch(/não posso aprender/)
        await falar('quando eu falar xis, é alimentação')
        await falar('não')
        expect(repo.estado.termos.size).toBe(0)
    })

    it('10. apaga e altera um lançamento pela descrição, sempre confirmando', async () => {
        const repo = repoFalso({ lancamentos: historico() })
        const falar = conversa(repo)
        await falar('Gastei 60 reais com comida.')
        const apagar = await falar('Apaga aquele gasto de 60 reais')
        expect(apagar.texto).toMatch(/Apago gasto de R\$\s?60,00 em Alimentação/)
        expect(repo.estado.lancamentos.some((l) => l.amount === 60)).toBe(true)
        await falar('sim')
        expect(repo.estado.lancamentos.some((l) => l.amount === 60)).toBe(false)

        const mudar = await falar('muda o gasto da padaria de ontem para 30')
        expect(mudar.texto).toMatch(/Mudo gasto de R\$\s?25,00 em Alimentação \(Padaria\), ontem para gasto de R\$\s?30,00/)
        expect((await falar('sim')).texto).toMatch(/Pronto, ficou assim/)
        expect(repo.estado.lancamentos.find((l) => l.id === '1').amount).toBe(30)

        expect((await falar('apaga o gasto de 9999')).texto).toMatch(/Não achei nenhum lançamento/)
    })
})

describe('Valtrea Assistente: contexto, análises e conhecimento', () => {
    it('segue a conversa: período, categoria que mais pesou e como reduzir', async () => {
        const repo = repoFalso({ lancamentos: [...historico(), { id: '6', name: 'Restaurante', amount: 80, type: 'EXPENSE', category: 'alimentacao', date: '2026-11-12' }] })
        const falar = conversa(repo)
        expect((await falar('Quanto gastei esse mês?')).texto).toMatch(/Você gastou R\$\s?145,00 neste mês/)
        expect((await falar('E na semana passada?')).texto).toMatch(/Você gastou R\$\s?120,00 na semana passada/)
        const maior = await falar('Qual categoria teve mais gastos?')
        expect(maior.texto).toMatch(/Onde mais pesou na semana passada:/)
        expect(maior.texto).toMatch(/Alimentação: R\$\s?80,00/)
        const reduzir = await falar('E como posso reduzir isso?')
        expect(reduzir.texto).toMatch(/Alimentação somou R\$\s?80,00/)
        expect(reduzir.texto).toMatch(/ideias para reduzir/)
        const lembra = await falar('O que estávamos conversando?')
        expect(lembra.texto).toMatch(/seus gastos neste mês; seus gastos na semana passada/)
        expect((await falar('me explica melhor')).texto).toMatch(/comparo do dia 1 até hoje|usei só os lançamentos/)
    })

    it('"Estou gastando muito?" compara com o mês passado usando os dados reais', async () => {
        const repo = repoFalso({ lancamentos: [...historico(), { id: '7', name: 'Mercado', amount: 300, type: 'EXPENSE', category: 'alimentacao', date: '2026-11-10' }] })
        const r = await conversa(repo)('Estou gastando muito?')
        expect(r.texto).toMatch(/aumentaram 265% em relação ao mesmo período do mês passado \(R\$\s?365,00 contra R\$\s?100,00\)/)
        expect(r.texto).toMatch(/A categoria que mais contribuiu foi Alimentação \(\+R\$\s?225,00\)/)
    })

    it('diz quando não há histórico para comparar', async () => {
        const r = await conversa(repoFalso())('Gastei muito esse mês?')
        expect(r.texto).toMatch(/não tenho como avaliar/)
    })

    it('"Pra onde foi meu dinheiro?", sugestão, preocupação e opinião usam os números do mês', async () => {
        const falar = conversa(repoFalso({ lancamentos: historico() }))
        const onde = await falar('Pra onde foi meu dinheiro?')
        expect(onde.texto).toMatch(/Neste mês saíram R\$\s?65,00/)
        expect(onde.texto).toMatch(/Lazer: R\$\s?40,00 \(62%\)/)
        expect((await falar('Me dá uma sugestão.')).texto).toMatch(/Minhas sugestões:/)
        expect((await falar('Estou preocupado com minhas despesas.')).texto).toMatch(/Entendo a preocupação/)
        expect((await falar('O que você acha das minhas finanças?')).texto).toMatch(/Não sou consultora financeira/)
    })

    it('cria um orçamento (meta de gasto) depois de confirmar', async () => {
        const repo = repoFalso({ lancamentos: historico() })
        const falar = conversa(repo)
        expect((await falar('define um orçamento de 300 para lazer')).texto).toMatch(/Crio um orçamento de R\$\s?300,00 por mês para Lazer\?/)
        expect(repo.estado.orcamentos).toHaveLength(0)
        expect((await falar('sim')).texto).toMatch(/já usou R\$\s?40,00/)
        expect(repo.estado.orcamentos).toEqual([{ category: 'lazer', amount: 300 }])
        expect((await falar('como está meu orçamento?')).texto).toMatch(/Lazer: R\$\s?40,00 de R\$\s?300,00 \(13%\)/)
    })

    it('responde identidade, conversa social, contas, datas e educação financeira', async () => {
        const falar = conversa(repoFalso({ lancamentos: historico() }))
        expect((await falar('Qual é seu nome?')).texto).toMatch(/Valtrea Assistente/)
        expect((await falar('Quem criou você?')).texto).toMatch(/Valtrea/)
        expect(semNumeros((await falar('Oi, tudo bem?')).texto)).toBe(true)
        expect((await falar('quanto é 15% de 200')).texto).toBe('15% de 200 é 30.')
        expect((await falar('que dia é hoje?')).texto).toBe('Hoje é quinta-feira, 19 de novembro de 2026.')
        const reserva = await falar('o que é reserva de emergência?')
        expect(reserva.texto).toMatch(/3 a 6 meses/)
        expect(reserva.texto).toMatch(/em média R\$\s?500,00 por mês/)
        expect((await falar('Você consegue me ajudar?')).texto).toMatch(/Claro!/)
    })

    it('entende erro de digitação, abreviação e mais de um pedido na mesma mensagem', async () => {
        const repo = repoFalso({ lancamentos: historico() })
        const falar = conversa(repo)
        expect((await falar('qaunto eu gastei hj?')).texto).toMatch(/Não há gastos lançados hoje/)
        const dois = await falar('gastei 40 no mercado e me diz meu saldo')
        expect(dois.texto).toMatch(/R\$\s?40,00 em Alimentação \(Mercado\)/)
        expect(dois.texto).toMatch(/Saldo: -R\$\s?105,00/)
    })

    it('não confunde um lançamento novo com continuação, nem pergunta genérica com resumo', async () => {
        const repo = repoFalso({ lancamentos: historico() })
        const falar = conversa(repo)
        await falar('quanto gastei hoje?')
        expect((await falar('paguei o aluguel')).texto).toMatch(/Quanto deu|Qual foi o valor/)
        await falar('1500')
        expect(repo.estado.lancamentos.at(-1)).toMatchObject({ amount: 1500, category: 'moradia' })
        expect((await falar('ontem?')).texto).toMatch(/Você gastou R\$\s?25,00 ontem/)
        await falar('o que eu lancei hoje?')
        expect((await falar('e ontem?')).texto).toMatch(/Seus lançamentos ontem:\n• Gasto de R\$\s?25,00 em Alimentação \(Padaria\)/)
        expect((await falar('quanto rende 1000 a 1% ao mês?')).texto).toMatch(/rendem R\$\s?10,00 em 1 mês/)
        expect((await falar('lança 30 de lanche e me diz quanto gastei hoje')).texto).toMatch(/Alimentação \(Lanche\)[\s\S]*Você gastou R\$\s?1\.530,00 hoje/)
    })

    it('"não entendi" sem assunto pergunta o que explicar', async () => {
        expect((await conversa(repoFalso())('Não entendi.')).texto).toMatch(/Sobre o que você quer que eu explique/)
    })
})

