import { extrairValor } from './valores.js'
import { extrairData, extrairPeriodo } from './datas.js'
import { interpretar } from './entender.js'
import { lerEstilo } from './estilo.js'

const hoje = '2026-11-19' // quinta-feira

describe('extrairValor', () => {
    it.each([
        ['gastei 40 no mercado', 40],
        ['paguei R$ 1.200,50 de aluguel', 1200.5],
        ['uber 23,90', 23.9],
        ['recebi 2.5 mil de freela', 2500],
        ['gastei 50 conto no bar', 50],
        ['quarenta e cinco reais de farmácia', 45],
        ['investi mil e duzentos no tesouro', 1200],
        ['cento e vinte no mercado', 120],
        ['2k de salário', 2000],
    ])('%s → %s', (texto, esperado) => {
        expect(extrairValor(texto).valor).toBe(esperado)
    })

    it('não confunde data com valor', () => {
        expect(extrairValor('gastei 30 dia 5 no cinema').valor).toBe(30)
        expect(extrairValor('mercado 5/11')).toBeNull()
        expect(extrairValor('almoço com um amigo')).toBeNull()
    })
})

describe('extrairData', () => {
    it('entende ontem, dia e dia da semana, sem ir para o futuro', () => {
        expect(extrairData('ontem', hoje).data).toBe('2026-11-18')
        expect(extrairData('dia 5', hoje).data).toBe('2026-11-05')
        expect(extrairData('dia 25', hoje).data).toBe('2026-10-25')
        expect(extrairData('5/11', hoje).data).toBe('2026-11-05')
        expect(extrairData('na segunda', hoje).data).toBe('2026-11-16')
        expect(extrairData('sexta passada', hoje).data).toBe('2026-11-13')
        expect(extrairData('mercado', hoje)).toBeNull()
    })

    it('entende o período de uma pergunta', () => {
        expect(extrairPeriodo('quanto gastei esse mês?', hoje)).toMatchObject({ inicio: '2026-11-01', fim: hoje })
        expect(extrairPeriodo('e no mês passado?', hoje)).toMatchObject({ inicio: '2026-10-01', fim: '2026-10-31' })
        expect(extrairPeriodo('em outubro', hoje)).toMatchObject({ inicio: '2026-10-01' })
    })
})

describe('interpretar', () => {
    const memoria = { termos: new Map(), historico: [] }

    it('lança um gasto com categoria pelo dicionário', () => {
        expect(interpretar('gastei 40 no mercado', { hoje, memoria })).toMatchObject({
            intencao: 'registrar',
            tipo: 'EXPENSE',
            valor: 40,
            categoria: 'alimentacao',
            nome: 'Mercado',
            data: hoje,
        })
    })

    it('entende ganho e investimento pelo verbo', () => {
        expect(interpretar('recebi 2500 de salário', { hoje, memoria })).toMatchObject({ tipo: 'EARNING', categoria: 'salario' })
        expect(interpretar('investi 300 no tesouro ontem', { hoje, memoria })).toMatchObject({
            tipo: 'INVESTMENT',
            categoria: 'renda_fixa',
            data: '2026-11-18',
        })
    })

    it('aceita o atalho "uber 23" sem verbo', () => {
        expect(interpretar('uber 23', { hoje, memoria })).toMatchObject({ tipo: 'EXPENSE', categoria: 'transporte', valor: 23 })
    })

    it('tolera erro de digitação', () => {
        expect(interpretar('gastei 30 na farmacya', { hoje, memoria })).toMatchObject({ categoria: 'saude', origemCategoria: 'aproximado' })
    })

    it('usa o que a pessoa ensinou antes do dicionário', () => {
        const ensinada = { termos: new Map([['EXPENSE:padaria ze', 'lazer']]), historico: [] }
        expect(interpretar('gastei 12 na padaria do Zé', { hoje, memoria: ensinada })).toMatchObject({
            categoria: 'lazer',
            origemCategoria: 'memoria',
            nome: 'Padaria do Zé',
        })
        expect(interpretar('paguei 90 da conta de luz', { hoje, memoria }).nome).toBe('Conta de luz')
    })

    it('deixa a categoria em aberto quando não sabe', () => {
        expect(interpretar('gastei 80 no zezinho', { hoje, memoria })).toMatchObject({ intencao: 'registrar', categoria: null, nome: 'Zezinho' })
    })

    it('reconhece perguntas, correções e comandos', () => {
        expect(interpretar('quanto gastei esse mês?', { hoje, memoria })).toMatchObject({ intencao: 'consulta', tipo: 'EXPENSE' })
        expect(interpretar('qual meu saldo?', { hoje, memoria })).toMatchObject({ intencao: 'consulta', tipoConsulta: 'saldo' })
        expect(interpretar('onde eu mais gastei?', { hoje, memoria })).toMatchObject({ tipoConsulta: 'maior' })
        expect(interpretar('quanto gastei com transporte?', { hoje, memoria })).toMatchObject({ categoria: 'transporte' })
        expect(interpretar('era 45', { hoje, memoria })).toMatchObject({ intencao: 'corrigir', valor: 45 })
        expect(interpretar('na verdade foi transporte', { hoje, memoria }).categorias.EXPENSE.categoria).toBe('transporte')
        expect(interpretar('apaga o último', { hoje, memoria }).intencao).toBe('desfazer')
        expect(interpretar('como está meu orçamento?', { hoje, memoria }).intencao).toBe('orcamento')
        expect(interpretar('sim', { hoje, memoria }).intencao).toBe('confirmar')
        expect(interpretar('oi', { hoje, memoria }).intencao).toBe('saudacao')
        expect(interpretar('valeu!', { hoje, memoria }).intencao).toBe('agradecimento')
    })
})

describe('lerEstilo', () => {
    it('percebe o jeito de escrever', () => {
        expect(lerEstilo('gastei 50 conto no bar kkk').informal).toBe(true)
        expect(lerEstilo('Gastei R$ 50,00 no restaurante.').informal).toBe(false)
        expect(lerEstilo('paguei a luz 🙃').emoji).toBe(true)
    })
})
