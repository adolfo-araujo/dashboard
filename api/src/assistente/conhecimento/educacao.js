// Educação financeira: conceitos gerais, sem recomendar produto. `complemento` junta os números da pessoa à resposta.
const AVISO = 'Isso é informação geral, não uma recomendação de investimento.'

export const TOPICOS_DE_EDUCACAO = [
    {
        id: 'reserva-emergencia',
        pergunta: 'O que é reserva de emergência?',
        modulo: 'educacao',
        perguntas: ['o que e reserva de emergencia', 'quanto devo ter de reserva', 'como montar uma reserva de emergencia', 'reserva de emergencia', 'quanto guardar para imprevistos'],
        chaves: ['reserva'],
        respostas: [
            'Reserva de emergência é um dinheiro guardado só para imprevistos, como perda de renda, saúde ou um conserto urgente. Uma referência comum é ter de 3 a 6 meses do seu custo de vida (quem tem renda variável costuma mirar mais). Ela fica em aplicações de baixo risco e resgate rápido, como Tesouro Selic ou CDB com liquidez diária.',
        ],
        complemento: 'reserva',
        aviso: AVISO,
    },
    {
        id: 'regra-50-30-20',
        pergunta: 'O que é a regra 50-30-20?',
        modulo: 'educacao',
        perguntas: ['o que e a regra 50 30 20', 'como dividir meu salario', 'como organizar meu dinheiro', 'quanto devo gastar do salario', 'como dividir a renda'],
        respostas: [
            'Uma regra simples para dividir a renda é a 50-30-20: cerca de 50% para necessidades (moradia, contas, mercado, transporte), 30% para desejos (lazer, compras) e 20% para guardar ou quitar dívidas. É um ponto de partida; ajuste para a sua realidade.',
        ],
        complemento: 'divisao',
    },
    {
        id: 'juros-compostos',
        pergunta: 'O que são juros compostos?',
        modulo: 'educacao',
        perguntas: ['o que sao juros compostos', 'como funcionam os juros compostos', 'juros sobre juros', 'diferenca entre juros simples e compostos'],
        chaves: ['juros'],
        respostas: [
            'Juros compostos são "juros sobre juros": a cada período, o rendimento é calculado sobre o valor já corrigido. A fórmula é M = C × (1 + i)ⁿ. Exemplo: R$ 1.000 a 1% ao mês por 12 meses viram cerca de R$ 1.126,83. Nos juros simples, o rendimento é sempre sobre o valor inicial. Se quiser, eu calculo: "juros de 1% ao mês por 12 meses em 1000".',
        ],
    },
    {
        id: 'inflacao',
        pergunta: 'O que é inflação?',
        modulo: 'educacao',
        perguntas: ['o que e inflacao', 'o que e ipca', 'como a inflacao afeta meu dinheiro'],
        respostas: [
            'Inflação é o aumento geral dos preços ao longo do tempo: com ela, o mesmo dinheiro compra menos. No Brasil, o índice oficial é o IPCA, medido pelo IBGE. Por isso vale buscar aplicações que rendam acima da inflação, para o dinheiro não perder poder de compra.',
        ],
    },
    {
        id: 'poupanca',
        pergunta: 'Quanto rende a poupança?',
        modulo: 'educacao',
        perguntas: ['poupanca vale a pena', 'quanto rende a poupanca', 'poupanca ou cdb', 'como funciona a poupanca'],
        chaves: ['poupanca'],
        respostas: [
            'A poupança rende 0,5% ao mês mais a TR quando a Selic está acima de 8,5% ao ano; abaixo disso, rende 70% da Selic mais a TR. Não tem imposto de renda e é coberta pelo FGC. Em geral, rende menos que opções de renda fixa como Tesouro Selic ou CDB de 100% do CDI, mesmo depois do imposto delas.',
        ],
        aviso: AVISO,
    },
    {
        id: 'tesouro-selic',
        pergunta: 'O que é o Tesouro Direto?',
        modulo: 'educacao',
        perguntas: ['o que e tesouro selic', 'o que e tesouro direto', 'como funciona o tesouro direto', 'tesouro ipca'],
        chaves: ['tesouro'],
        respostas: [
            'O Tesouro Direto é o programa para comprar títulos públicos federais pela internet. O Tesouro Selic acompanha a taxa básica de juros, tem baixo risco e resgate rápido, por isso é comum na reserva de emergência. O Tesouro IPCA+ paga a inflação mais uma taxa e é mais usado para objetivos longos; se vender antes do vencimento, o valor pode variar.',
        ],
        aviso: AVISO,
    },
    {
        id: 'cdb',
        pergunta: 'O que é CDB, LCI e LCA?',
        modulo: 'educacao',
        perguntas: ['o que e cdb', 'como funciona o cdb', 'o que e cdi', 'o que e lci', 'o que e lca', 'lci e lca'],
        respostas: [
            'CDB é um empréstimo que você faz ao banco em troca de juros, geralmente atrelados ao CDI (taxa que anda perto da Selic). LCI e LCA são parecidas, mas financiam o setor imobiliário e o agronegócio e são isentas de imposto de renda para pessoa física. CDB, LCI e LCA têm a garantia do FGC, até R$ 250 mil por CPF em cada instituição.',
        ],
        aviso: AVISO,
    },
    {
        id: 'fgc',
        pergunta: 'O que é o FGC?',
        modulo: 'educacao',
        perguntas: ['o que e fgc', 'o que o fgc garante', 'meu dinheiro esta garantido', 'fundo garantidor de creditos'],
        respostas: [
            'O FGC (Fundo Garantidor de Créditos) devolve até R$ 250 mil por CPF em cada instituição financeira se ela quebrar, com limite total de R$ 1 milhão a cada 4 anos. Cobre poupança, CDB, LCI, LCA e conta corrente, entre outros. O Tesouro Direto não entra no FGC porque o garantidor é o próprio governo federal.',
        ],
    },
    {
        id: 'cartao-credito',
        pergunta: 'Como usar bem o cartão de crédito?',
        modulo: 'educacao',
        perguntas: ['como usar o cartao de credito', 'o que e rotativo do cartao', 'pagar o minimo da fatura', 'fatura do cartao atrasada', 'dicas de cartao de credito'],
        chaves: ['cartao'],
        respostas: [
            'O ideal é pagar a fatura inteira todo mês. Pagar só o mínimo joga o restante no rotativo, que tem juros entre os mais altos do mercado. Dicas: concentre em um cartão, acompanhe os gastos pela fatura parcial, cuidado com muitas parcelas ao mesmo tempo e, se não der para pagar tudo, negocie um parcelamento da fatura, que costuma sair mais barato que o rotativo.',
        ],
    },
    {
        id: 'dividas',
        pergunta: 'Como sair das dívidas?',
        modulo: 'educacao',
        perguntas: ['como sair das dividas', 'estou endividado', 'como pagar minhas dividas', 'qual divida pagar primeiro', 'como renegociar divida'],
        chaves: ['divida'],
        respostas: [
            'Um caminho comum: 1) liste todas as dívidas com valor, juros e parcela; 2) priorize as de juros mais altos (cartão rotativo e cheque especial); 3) negocie descontos e prazos, inclusive em mutirões e no Desenrola, quando houver; 4) evite novas dívidas enquanto isso; 5) anote todos os gastos para achar onde cortar. Aqui no Finance, eu ajudo a ver para onde o dinheiro está indo.',
        ],
        opcoes: ['Pra onde foi meu dinheiro?'],
    },
    {
        id: 'orcamento-pessoal',
        pergunta: 'Como controlar meus gastos?',
        modulo: 'educacao',
        perguntas: ['como fazer um orcamento pessoal', 'como controlar meus gastos', 'como organizar minhas financas', 'como comecar a controlar dinheiro', 'como economizar dinheiro', 'dicas para economizar'],
        respostas: [
            'Para controlar o dinheiro: 1) anote tudo o que entra e sai (pode ser comigo, aqui); 2) separe por categoria para ver onde mais pesa; 3) defina limites por categoria (orçamentos); 4) guarde uma parte assim que o dinheiro entrar, antes de gastar; 5) revise uma vez por semana. Se quiser, eu olho os seus números e sugiro onde começar.',
        ],
        opcoes: ['Me dá uma sugestão', 'Estou gastando muito?'],
    },
    {
        id: 'diversificacao',
        pergunta: 'O que é diversificar investimentos?',
        modulo: 'educacao',
        perguntas: ['o que e diversificar investimentos', 'como diversificar', 'perfil de investidor', 'onde investir', 'em que investir', 'qual o melhor investimento'],
        chaves: ['investimento'],
        respostas: [
            'Não indico investimentos específicos, mas posso explicar o básico: diversificar é dividir o dinheiro entre tipos diferentes (renda fixa, ações, fundos), para um problema não afetar tudo. A escolha depende do objetivo, do prazo e do seu perfil de risco, que as corretoras avaliam num questionário (suitability). Antes de investir, costuma-se montar a reserva de emergência.',
        ],
        aviso: AVISO,
    },
    {
        id: 'previdencia',
        pergunta: 'PGBL ou VGBL?',
        modulo: 'educacao',
        perguntas: ['o que e previdencia privada', 'pgbl ou vgbl', 'diferenca entre pgbl e vgbl'],
        respostas: [
            'Previdência privada é um investimento de longo prazo. No PGBL, dá para deduzir até 12% da renda bruta tributável no imposto de renda (para quem faz a declaração completa), e o imposto no resgate é sobre o valor total. No VGBL não há dedução, e o imposto é só sobre os rendimentos. Vale comparar as taxas de administração.',
        ],
        aviso: AVISO,
    },
    {
        id: 'acoes',
        pergunta: 'O que são ações?',
        modulo: 'educacao',
        perguntas: ['o que sao acoes', 'como funciona a bolsa de valores', 'o que e renda variavel', 'o que sao dividendos'],
        respostas: [
            'Ações são pedaços de uma empresa negociados na bolsa (B3). São renda variável: o preço sobe e desce, e não há garantia do FGC. Dividendos são a parte do lucro que a empresa distribui aos acionistas. É um investimento mais indicado para prazos longos e para quem aceita oscilações.',
        ],
        aviso: AVISO,
    },
]
