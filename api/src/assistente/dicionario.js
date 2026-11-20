// Vocabulário do assistente. As chaves de categoria são as de constants/categories.js.

export const ROTULOS = {
    EXPENSE: {
        moradia: 'Moradia', alimentacao: 'Alimentação', transporte: 'Transporte', saude: 'Saúde', educacao: 'Educação',
        lazer: 'Lazer', compras: 'Compras', contas: 'Contas e serviços', assinaturas: 'Assinaturas',
        impostos: 'Impostos e taxas', outros: 'Outros',
    },
    EARNING: {
        salario: 'Salário', freelance: 'Freelance', vendas: 'Vendas', rendimentos: 'Rendimentos', presentes: 'Presentes',
        reembolso: 'Reembolso', outros: 'Outros',
    },
    INVESTMENT: {
        renda_fixa: 'Renda fixa', acoes: 'Ações', fundos: 'Fundos', previdencia: 'Previdência', cripto: 'Cripto',
        reserva: 'Reserva', outros: 'Outros',
    },
}

export const NOME_DO_TIPO = { EXPENSE: 'gasto', EARNING: 'ganho', INVESTMENT: 'investimento' }

// Palavras que costumam aparecer em cada categoria (o nome da própria categoria também conta).
const TERMOS = {
    EXPENSE: {
        alimentacao: 'alimentacao, comida, almocei, jantei, comi, lanchei, mercado, supermercado, ifood, rappi, padaria, restaurante, lanche, lanchonete, pizza, acougue, hortifruti, feira, cafe, almoco, jantar, delivery, mc donalds, mcdonalds, burger, sorvete, acai, marmita, quentinha, pao',
        transporte: 'transporte, abasteci, flanelinha, lavagem, lava jato, uber, 99, taxi, onibus, metro, gasolina, combustivel, posto, estacionamento, pedagio, bilhete, passagem, trem, brt, etanol, oficina, mecanico, carro, moto',
        moradia: 'moradia, aluguel, condominio, iptu, reforma, moveis, casa',
        contas: 'contas, conta de luz, luz, energia, agua, gas, internet, celular, telefone, vivo, claro, tim, oi, light, enel, sabesp, cedae, net, boleto',
        assinaturas: 'assinaturas, assinatura, netflix, spotify, amazon prime, prime video, disney, max, globoplay, youtube, icloud, google one, deezer, chatgpt',
        saude: 'saude, farmacia, drogaria, remedio, medico, consulta, exame, dentista, plano de saude, academia, hospital, psicologo, terapia',
        educacao: 'educacao, escola, faculdade, curso, livro, livros, mensalidade, material escolar, udemy, alura, apostila',
        lazer: 'lazer, cinema, show, bar, viagem, hotel, jogo, jogos, steam, ingresso, passeio, festa, balada, cerveja',
        compras: 'compras, compra, roupa, roupas, loja, shopping, mercado livre, shopee, magalu, americanas, presente, sapato, tenis, eletronico',
        impostos: 'impostos, imposto, taxa, ipva, darf, multa, tarifa, anuidade, das, mei',
    },
    EARNING: {
        salario: 'salario, pagamento, holerite, 13, decimo terceiro, ferias, adiantamento',
        freelance: 'freelance, freela, projeto, cliente, job, bico, servico',
        vendas: 'vendas, venda, vendi',
        rendimentos: 'rendimentos, rendimento, juros, dividendos',
        reembolso: 'reembolso, estorno, devolucao',
        presentes: 'presentes, presente, mesada',
    },
    INVESTMENT: {
        renda_fixa: 'renda fixa, cdb, tesouro, selic, lci, lca, poupanca',
        acoes: 'acoes, acao, bolsa, b3',
        fundos: 'fundos, fundo, fii',
        previdencia: 'previdencia, pgbl, vgbl',
        cripto: 'cripto, bitcoin, btc, ethereum, usdt',
        reserva: 'reserva, emergencia, reserva de emergencia, caixinha',
    },
}

export const TERMOS_POR_TIPO = Object.fromEntries(
    Object.entries(TERMOS).map(([tipo, categorias]) => [
        tipo,
        Object.entries(categorias).map(([chave, lista]) => [chave, lista.split(', ')]),
    ]),
)

// Verbos que dizem o tipo do lançamento.
export const VERBOS = {
    EXPENSE: ['gastei', 'gasto', 'gastos', 'paguei', 'pago', 'comprei', 'torrei', 'saiu', 'sairam', 'debitou', 'despesa', 'perdi', 'almocei', 'jantei', 'comi', 'lanchei', 'abasteci', 'dei', 'doei',
        'gastar', 'gastarei', 'pagar', 'pagarei', 'comprar', 'comprarei', 'torrar'],
    EARNING: ['recebi', 'ganhei', 'entrou', 'entraram', 'caiu', 'cairam', 'recebimento', 'ganho', 'vendi', 'pingou', 'receber', 'receberei', 'ganhar', 'ganharei'],
    INVESTMENT: ['investi', 'apliquei', 'guardei', 'aportei', 'aporte', 'poupei', 'investimento', 'investir', 'investirei', 'aplicar', 'aplicarei', 'guardar', 'guardarei'],
}

// Algo que ainda vai acontecer: plano ("quero gastar", "vou pagar"), verbo no futuro ou data adiante.
export const PLANO = /\b(quero|queria|vou|vamos|pretendo|planejo|preciso|tenho que|devo|gostaria de|penso em|to pensando em|estou pensando em)( (ter que|que))? (gastar|pagar|comprar|torrar|investir|aplicar|guardar|receber|ganhar)\b/
export const VERBO_FUTURO = /\b(gastarei|pagarei|comprarei|investirei|aplicarei|guardarei|receberei|ganharei|vai cair|vai entrar|vai pingar)\b/
export const QUANDO_FUTURO = /\b(depois de amanha|amanha|semana que vem|proxima semana|mes que vem|proximo mes|ano que vem)\b/

// Palavras que não entram no nome do lançamento.
export const PALAVRAS_VAZIAS = new Set(
    ('a o as os um uma uns umas de do da dos das no na nos nas em com pra pro para por pelo pela e eu me meu minha ' +
        'foi fui hoje ontem anteontem agora real reais r$ conto contos pila pilas pau paus mil k valor de ja so la ai ' +
        'tipo mano cara ne ta tá blz beleza oi ola reais. dia que nesse neste esse este essa esta uns umas cerca deu kkk kkkk kkkkk haha hahaha rs rsrs coloquei botei ' +
        'hj ontm lanca lancar lance lancei registra registrar registre anota anotar anote adiciona adicione acho achando talvez quero queria vou vai vamos pretendo planejo preciso tenho devo gostaria penso pensando amanha depois vem proximo proxima semana ' +
        Object.values(VERBOS).flat().join(' ')).split(' '),
)

// Gírias, abreviações e jeitos curtos de escrever → forma completa (só para entender a intenção).
export const GIRIAS = {
    vc: 'voce', vcs: 'voces', vce: 'voce', ce: 'voce', tb: 'tambem', tbm: 'tambem', pq: 'por que', pk: 'por que',
    q: 'que', oq: 'o que', oque: 'o que', qto: 'quanto', qnt: 'quanto', qnto: 'quanto', qtos: 'quantos', qts: 'quantos',
    msm: 'mesmo', hj: 'hoje', ontm: 'ontem', td: 'tudo', tds: 'todos', blz: 'beleza', vlw: 'valeu', vlws: 'valeu',
    obg: 'obrigado', obgd: 'obrigado', obgda: 'obrigada', brigado: 'obrigado', brigada: 'obrigada', mt: 'muito', mto: 'muito',
    mts: 'muitos', naum: 'nao', nn: 'nao', eh: 'e', dps: 'depois', cmg: 'comigo', ctg: 'contigo', fds: 'fim de semana',
    grana: 'dinheiro', bufunfa: 'dinheiro', dindin: 'dinheiro', rango: 'comida', busao: 'onibus', vdd: 'verdade',
    tmj: 'valeu', pfv: 'por favor', pfvr: 'por favor', plmds: 'pelo amor de deus', sdds: 'saudades', agr: 'agora',
    cd: 'cade', kd: 'cade', vamo: 'vamos', bora: 'vamos', tava: 'estava', to: 'estou', tô: 'estou', ta: 'esta',
}

// Palavras importantes para entender a intenção; com erro de digitação ("qaunto", "saldu") são corrigidas para estas.
export const VOCABULARIO = [
    'gastei', 'gastos', 'gastar', 'quanto', 'quantos', 'saldo', 'sobrou', 'recebi', 'ganhei', 'investi', 'investimentos',
    'paguei', 'comprei', 'apaga', 'apague', 'apagar', 'exclui', 'excluir', 'lancamento', 'lancamentos', 'lancei', 'categoria',
    'categorias', 'orcamento', 'orcamentos', 'obrigado', 'obrigada', 'dinheiro', 'despesas', 'receitas', 'semana', 'passada',
    'passado', 'ontem', 'hoje', 'ultimos', 'ultimas', 'resumo', 'extrato', 'sugestao', 'sugestoes', 'financas', 'economizar',
    'reduzir', 'preocupado', 'preocupada', 'funciona', 'assistente', 'aprendeu', 'lembra', 'conversando', 'explica', 'entendi',
    'quanto', 'comparar', 'compara', 'aumentaram', 'aumentando', 'diminuindo', 'tendencia', 'reserva', 'emergencia', 'juros',
    'compostos', 'inflacao', 'poupanca', 'tesouro', 'cartao', 'credito', 'dividas', 'divida', 'organizar', 'produtividade',
    'esquece', 'esqueca', 'ensinar', 'considera', 'considere', 'normalmente', 'geralmente', 'perguntar', 'falar', 'escrever',
    'ultimo', 'ultima', 'gasto', 'ganho', 'ganhos', 'investimento', 'despesa', 'receita', 'mercado', 'salario', 'comida',
    'transporte', 'alimentacao', 'conta', 'contas', 'pagar', 'comprar', 'receber', 'ganhar', 'investir', 'quanta', 'quais',
    'muito', 'muita', 'gastando', 'ganhando', 'sobra', 'falta', 'faltam', 'tudo', 'todos', 'todas', 'nada', 'nenhum',
]
