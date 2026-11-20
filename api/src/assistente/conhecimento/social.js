// Conversa social: cumprimentos, agradecimentos e afins. Respostas curtas e sem números.
export const TOPICOS_SOCIAIS = [
    {
        id: 'oi',
        modulo: 'social',
        perguntas: ['oi', 'ola', 'oi tudo bem', 'ola tudo bem', 'bom dia', 'boa tarde', 'boa noite', 'e ai', 'opa', 'oi como vai', 'oii', 'hey'],
        respostas: [
            ({ nome, periodoDoDia }) => `${periodoDoDia}${nome}! Tudo bem por aqui. Em que posso ajudar?`,
            ({ nome }) => `Oi${nome}! Tudo certo, e com você? Quer lançar algo ou ver como está o mês?`,
            ({ nome }) => `Olá${nome}! Estou pronta para ajudar com as suas finanças.`,
        ],
        opcoes: ['Gastei 30 no almoço', 'Como está meu mês?'],
    },
    {
        id: 'tudo-bem',
        modulo: 'social',
        perguntas: ['tudo bem', 'tudo bem com voce', 'como voce esta', 'como vai', 'tudo certo', 'como voce ta'],
        respostas: ['Tudo bem, obrigada por perguntar! E com você?', 'Tudo ótimo por aqui. E você, como está?'],
    },
    {
        id: 'estou-bem',
        modulo: 'social',
        perguntas: ['estou bem', 'to bem', 'tudo otimo', 'bem e voce', 'tudo tranquilo', 'de boa'],
        respostas: ['Que bom! Se quiser, me conta um gasto ou pergunta como está o mês.', 'Fico feliz! Em que posso ajudar?'],
    },
    {
        id: 'obrigado',
        modulo: 'social',
        perguntas: ['obrigado', 'obrigada', 'muito obrigado', 'valeu', 'obrigado pela ajuda', 'agradeco', 'brigado'],
        respostas: ['Por nada! Precisando, é só chamar.', 'De nada! Fico à disposição.', 'Imagina! Qualquer coisa, estou por aqui.'],
    },
    {
        id: 'tchau',
        modulo: 'social',
        perguntas: ['tchau', 'ate mais', 'ate logo', 'falou', 'boa noite tchau', 'ate amanha', 'fui'],
        respostas: ['Até mais! Quando precisar, é só voltar.', 'Tchau! Bom resto de dia.'],
    },
    {
        id: 'elogio',
        modulo: 'social',
        perguntas: ['voce e demais', 'voce e otima', 'gostei de voce', 'muito bom', 'show', 'perfeito', 'boa', 'mandou bem', 'voce e inteligente'],
        respostas: ['Obrigada! Fico feliz em ajudar.', 'Que bom que gostou! Conte comigo.'],
    },
    {
        id: 'risada',
        modulo: 'social',
        perguntas: ['kkk', 'kkkk', 'haha', 'hahaha', 'rs', 'rsrs'],
        respostas: ['😄 Em que mais posso ajudar?'],
    },
    {
        id: 'irritado',
        modulo: 'social',
        perguntas: ['voce e burra', 'voce nao entende nada', 'que assistente ruim', 'voce e inutil', 'nao serve pra nada', 'que droga'],
        respostas: [
            'Desculpe pela confusão. Ainda estou aprendendo. Pode me dizer de outro jeito o que você precisa? Se eu errei um lançamento, é só dizer "apaga o último".',
        ],
        opcoes: ['Apaga o último', 'O que você consegue fazer?'],
    },
]
