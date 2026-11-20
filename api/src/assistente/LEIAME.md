# Valtrea Assistente

Assistente conversacional do Valtrea Finance. Funciona **sem API de IA externa**: interpretação por regras,
pontuação de confiança, base de conhecimento, contexto de conversa e aprendizado confirmado pela pessoa.

## Fluxo de uma mensagem

```
mensagem → normalização → interpretação (intenção + confiança) → contexto
        → consulta/ação financeira ou base de conhecimento → resposta → atualização da memória
```

1. `texto.js` (**normalizador**): tira acentos, expande gírias e abreviações (`vc`, `hj`, `qto`) e corrige
   erros de digitação contra o vocabulário (`qaunto` → `quanto`). Nomes e valores são lidos do texto original.
2. `intencoes.js` (**detector de intenções**): cada módulo propõe uma interpretação com nota de 0 a 1 e fica a
   maior. Abaixo de 0,5, vai para o fallback. Também separa mensagens com mais de um pedido.
3. `entender.js`, `valores.js` e `datas.js` (**extração de entidades** e regras financeiras): valor, data,
   período, categoria, quantidade, tipo, se é algo futuro e as pistas para achar um lançamento.
4. `contexto.js` (**gerenciador de contexto**): guarda por 30 minutos a última consulta (tipo, categoria,
   período), a categoria em foco e os últimos assuntos. Com isso entende "e ontem?", "e com lazer?",
   "qual categoria teve mais gastos?" e "como posso reduzir isso?".
5. `assistente.js` (**motor de diálogo**): conduz a conversa, as perguntas em aberto (pendências) e chama as ações.
6. `repositorio.js` (**executor das ações e memória**): fala com o banco, sempre filtrando pelo usuário logado.
7. `analise.js`: análises com os dados reais (gastando muito, para onde foi o dinheiro, sugestões, comparação,
   tendência, quanto dá para gastar por dia, investimentos). Sem dados suficientes, diz a limitação.
8. `conhecimento/` (**base de conhecimento**): identidade, conversa social, funcionalidades do Finance,
   educação financeira, organização, produtividade e tecnologia; `calculos.js` e `tempo.js` respondem contas e datas.
9. `aprendizado.js` (**sistema de aprendizado**) e `permissoes.js` (**permissões**).
10. `respostas.js` (**gerador de respostas**): frases no tom da pessoa, com variações e sem repetir a anterior.
11. `registro.js`: registra a intenção, o módulo, a confiança e o tempo de cada mensagem, e os erros. Nunca grava o texto.

## Memória

| Tipo | Onde fica | Quanto tempo |
| --- | --- | --- |
| Curto prazo (assunto, período, categoria, últimos assuntos) | `AssistentePendencia.contexto` | 30 minutos |
| Pergunta em aberto (ex.: "em qual categoria?") | `AssistentePendencia.dados` | 10 minutos |
| Estilo de escrita (formal/informal, emoji) | `AssistentePendencia.estilo` | até a pessoa apagar |
| Aprendizado: termo → categoria | `AssistenteMemoria` com `tipo` = EXPENSE, EARNING ou INVESTMENT | até a pessoa apagar |
| Aprendizado: pergunta → o que mostrar | `AssistenteMemoria` com `tipo` = FRASE | até a pessoa apagar |
| Preferências (apelido, confirmar antes de lançar) | `AssistenteMemoria` com `tipo` = PREF | até a pessoa apagar |
| Memória financeira | as próprias tabelas `Transaction` e `Budget` | |

O texto das mensagens não é guardado. A pessoa vê o que foi aprendido com "o que você aprendeu?",
apaga um item com "esquece xis" ou tudo com "esquece tudo que você aprendeu", ou pela lixeira da tela.
Tudo entra em "Baixar meus dados".

## Aprendizado

- "Quando eu falar lanche, normalmente é alimentação." → pede confirmação → guarda `EXPENSE:lanche = alimentacao`.
- "Quando eu perguntar quanto sobrou, quero saber minha receita menos minhas despesas." → confirma →
  guarda `FRASE:quanto sobrou = sobra`.
- Corrigir uma categoria ("era transporte") ou responder "em qual categoria?" também ensina.
- Uma regra aprendida só pode levar a **consultas** (`ALVOS_DE_FRASE` em `permissoes.js`); nunca a lançar,
  apagar ou mudar algo. Apagar, editar, criar orçamento e aprender sempre pedem confirmação.

## Como adicionar conhecimento

Crie um tópico num arquivo de `conhecimento/` (ou um arquivo novo, registrado em `conhecimento/topicos.js`):

```js
{
    id: 'cheque-especial',            // único
    modulo: 'educacao',               // identidade | social | finance | educacao | organizacao | produtividade | tecnologia
    pergunta: 'O que é cheque especial?', // como aparece no "Você quis dizer...?"
    perguntas: ['o que e cheque especial', 'como funciona o cheque especial', 'cheque especial vale a pena'],
    chaves: ['cheque'],               // opcional: se nenhuma aparece na mensagem, a nota cai
    respostas: ['Texto da resposta.', 'Outra forma de dizer a mesma coisa.'],
    detalhe: 'Explicação mais longa, usada em "me explica melhor".', // opcional
    complemento: 'reserva',           // opcional: junta os números da pessoa (veja complemento() em assistente.js)
    aviso: 'Isso é informação geral...', // opcional
    opcoes: ['Sugestão de próxima pergunta'], // opcional
}
```

As perguntas são escritas sem acento. Quanto mais formas de perguntar, melhor o tópico é encontrado.
Não cadastre fatos que mudam com frequência (cotações, taxas do dia): a assistente não deve inventar.

## Testes

`assistente.test.js` cobre os cenários pedidos (identidade, funcionamento, lançamentos da assistente vs. do
painel, despesa, consulta por categoria, "e ontem?", agradecimento, mensagem desconhecida, aprendizado,
exclusão e edição com confirmação) e também contexto, análises, orçamentos, contas, datas e erros de digitação.
`entender.test.js` cobre a extração de valores, datas e intenções. Rode com `npm test`.
