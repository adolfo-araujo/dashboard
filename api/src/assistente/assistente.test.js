import { criarAssistente } from './assistente.js'

// Banco falso em memória, com as mesmas funções do repositorio.js
function repoFalso({ orcamentos = [] } = {}) {
    const estado = { lancamentos: [], termos: new Map(), pendencia: null, estilo: null, seq: 0 }
    return {
        estado,
        carregarMemoria: async () => ({ termos: estado.termos, historico: estado.lancamentos, estilo: estado.estilo }),
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
            Object.assign(l, campos)
            return l
        },
        totais: async () => {
            const t = { EARNING: 0, EXPENSE: 0, INVESTMENT: 0 }
            for (const l of estado.lancamentos) t[l.type] += l.amount
            return t
        },
        porCategoria: async (_, tipo) => {
            const mapa = {}
            for (const l of estado.lancamentos.filter((x) => x.type === tipo)) mapa[l.category] = (mapa[l.category] ?? 0) + l.amount
            return Object.entries(mapa)
                .map(([category, total]) => ({ category, total }))
                .sort((a, b) => b.total - a.total)
        },
        ultimos: async (_, n) => estado.lancamentos.slice(-n).reverse(),
        orcamentos: async () =>
            orcamentos.map((o) => ({
                ...o,
                spent: estado.lancamentos.filter((l) => l.type === 'EXPENSE' && l.category === o.category).reduce((s, l) => s + l.amount, 0),
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

    it('responde no tom de quem escreve', async () => {
        const falar = conversa(repoFalso())
        expect((await falar('gastei 50 conto no bar kkk 🍺')).texto).toMatch(/✅/)
        const formal = await conversa(repoFalso())('Gastei R$ 50,00 no restaurante.')
        expect(formal.texto).not.toMatch(/✅/)
    })
})
