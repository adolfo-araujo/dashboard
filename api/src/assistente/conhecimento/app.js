// Funcionalidades do Valtrea Finance e perguntas frequentes. Mantenha igual à Central de ajuda (web/src/pages/help.jsx).
export const TOPICOS_DO_APP = [
    {
        id: 'app-registrar',
        pergunta: 'Como registro um gasto?',
        modulo: 'finance',
        perguntas: ['como registro um gasto', 'como lanco um ganho', 'como adiciono um lancamento', 'como cadastrar uma despesa', 'como registrar investimento'],
        respostas: [
            'É só me contar aqui, do seu jeito: "gastei 40 no mercado", "recebi 2500 de salário" ou "investi 300 no tesouro". Pelo painel, toque em Adicionar, escolha o tipo, o valor, a data e a categoria.',
        ],
        opcoes: ['Gastei 30 no almoço'],
    },
    {
        id: 'app-recorrentes',
        pergunta: 'Como cadastro contas que se repetem?',
        modulo: 'finance',
        perguntas: ['tenho contas que se repetem todo mes', 'como cadastro uma conta fixa', 'lancamento recorrente', 'como fazer o aluguel entrar todo mes', 'contas mensais automaticas'],
        respostas: [
            'Use Recorrentes no painel: cadastre uma vez (aluguel, salário, assinaturas) e o lançamento é criado sozinho todo mês. Dá para pausar ou excluir quando quiser; os lançamentos já criados continuam.',
        ],
    },
    {
        id: 'app-importar',
        pergunta: 'Como importo o extrato do banco?',
        modulo: 'finance',
        perguntas: ['como importo o extrato do banco', 'importar extrato', 'importar ofx', 'importar csv', 'trazer gastos do banco'],
        chaves: ['importar'],
        respostas: [
            'Na lista de Transações, toque em Importar e escolha o arquivo OFX ou CSV do seu banco. Você revisa cada lançamento antes de salvar, e os que já existem vêm desmarcados para não duplicar. Se for fatura de cartão, marque "É fatura de cartão de crédito".',
        ],
    },
    {
        id: 'app-exportar',
        pergunta: 'Como exporto para planilha?',
        modulo: 'finance',
        perguntas: ['como exporto para planilha', 'baixar minhas transacoes', 'exportar para excel', 'levar dados para planilha'],
        chaves: ['exportar'],
        respostas: [
            'Na lista de Transações, toque em Exportar: baixa as transações exibidas em CSV, que abre no Excel ou no Google Planilhas. Em Minha conta há também "Baixar todas as transações".',
        ],
    },
    {
        id: 'app-orcamento',
        pergunta: 'Como defino um orçamento?',
        modulo: 'finance',
        perguntas: ['como defino um orcamento', 'como crio um limite de gastos', 'como funciona o orcamento', 'como criar uma meta de gastos'],
        chaves: ['orcamento'],
        respostas: [
            'Pode me pedir aqui mesmo: "define um orçamento de 600 para alimentação". Pelo painel, no cartão de orçamento do mês, toque em Definir orçamentos. A barra fica amarela perto do limite e vermelha quando passa, e eu aviso aqui quando chegar a 80% e a 100%.',
        ],
        opcoes: ['Meus orçamentos'],
    },
    {
        id: 'app-previsao',
        pergunta: 'O que é a Previsão do mês?',
        modulo: 'finance',
        perguntas: ['o que e a previsao do mes', 'como funciona a previsao', 'quanto vai sobrar no fim do mes'],
        respostas: [
            'A Previsão do mês mostra quanto deve sobrar no último dia: o saldo de hoje, mais os lançamentos com data futura e as recorrentes que ainda vão cair no mês. Ela não tenta adivinhar os gastos do dia a dia.',
        ],
    },
    {
        id: 'app-relatorio',
        pergunta: 'Como tiro o relatório do ano?',
        modulo: 'finance',
        perguntas: ['relatorio do ano', 'relatorio para imposto de renda', 'como tiro o relatorio anual', 'informe para declarar imposto'],
        respostas: [
            'No cartão Previsão, toque em Relatório do ano (ou abra finance.valtrea.com.br/relatorio-anual). Escolha o ano e salve em PDF. Ele traz os totais por mês e por categoria; serve de apoio e não substitui os informes oficiais.',
        ],
    },
    {
        id: 'app-pay',
        pergunta: 'Como conecto o Valtrea Pay?',
        modulo: 'finance',
        perguntas: ['como conecto o valtrea pay', 'ligar a carteira valtrea pay', 'valtrea pay'],
        respostas: [
            'No cartão Carteira Valtrea Pay, toque em Conectar e copie o código. No app Valtrea Pay, abra Perfil → Valtrea Finance e cole o código. Os pagamentos da carteira passam a entrar aqui sozinhos.',
        ],
    },
    {
        id: 'app-conta',
        pergunta: 'Como baixo meus dados ou excluo a conta?',
        modulo: 'finance',
        perguntas: ['como excluo minha conta', 'como baixo meus dados', 'apagar minha conta', 'excluir cadastro'],
        respostas: [
            'Em Minha conta: "Baixar meus dados" gera uma cópia de tudo o que guardamos sobre você e "Excluir minha conta" apaga o cadastro e todas as transações de forma permanente.',
        ],
    },
    {
        id: 'app-senha',
        pergunta: 'Esqueci a senha. E agora?',
        modulo: 'finance',
        perguntas: ['esqueci a senha', 'como troco minha senha', 'recuperar senha'],
        chaves: ['senha'],
        respostas: ['Na tela de entrar, toque em "Esqueci a senha" e informe o seu e-mail. Você recebe um link para criar uma senha nova. Eu nunca peço a sua senha por aqui.'],
    },
    {
        id: 'app-celular',
        pergunta: 'Dá para usar no celular?',
        modulo: 'finance',
        perguntas: ['tem app para celular', 'como instalo no celular', 'usar como aplicativo', 'tem aplicativo'],
        respostas: [
            'Tem! No Android, abra no Chrome e toque em "Instalar app". No iPhone, abra no Safari, toque em Compartilhar e depois em "Adicionar à Tela de Início".',
        ],
    },
    {
        id: 'app-preco',
        pergunta: 'Conversar com você é pago?',
        modulo: 'finance',
        perguntas: ['a assistente e paga', 'quanto custa usar voce', 'usar o chat gasta credito', 'voce cobra'],
        respostas: ['Não. Eu funciono dentro do Valtrea Finance, sem serviços de IA de fora, então conversar comigo não gasta crédito nenhum.'],
    },
    {
        id: 'app-whatsapp',
        pergunta: 'Você funciona no WhatsApp?',
        modulo: 'finance',
        perguntas: ['voce funciona no whatsapp', 'posso falar com voce pelo whatsapp', 'tem no whatsapp'],
        respostas: ['Por enquanto eu funciono só aqui, dentro do Valtrea Finance.'],
    },
    {
        id: 'app-atalho',
        pergunta: 'Tem atalho de teclado?',
        modulo: 'finance',
        perguntas: ['tem atalho', 'atalho de teclado', 'busca rapida'],
        respostas: ['No computador, aperte Ctrl+K (ou Cmd+K no Mac) ou a tecla / em qualquer tela, digite o que procura e aperte Enter.'],
    },
]
