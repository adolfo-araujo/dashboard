// Sugestões feitas no próprio navegador, sem serviço de IA: nenhum dado financeiro sai do Valtrea.

const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// Palavras conhecidas → categoria (as chaves são as de lib/categories.js), separadas por vírgula
const DICIONARIO = {
  EXPENSE: [
    ['alimentacao', 'mercado, supermercado, ifood, rappi, padaria, restaurante, lanche, lanchonete, pizza, acougue, hortifruti, feira, cafe, almoco, jantar, delivery, mc donalds, mcdonalds, burger'],
    ['transporte', 'uber, 99, taxi, onibus, metro, gasolina, combustivel, posto, estacionamento, pedagio, bilhete, passagem, trem, brt'],
    ['moradia', 'aluguel, condominio, iptu, reforma, moveis'],
    ['contas', 'luz, energia, agua, gas, internet, celular, telefone, vivo, claro, tim, oi, light, enel, sabesp, cedae, net'],
    ['assinaturas', 'netflix, spotify, amazon prime, disney, max, globoplay, youtube, icloud, google one, deezer, assinatura'],
    ['saude', 'farmacia, drogaria, remedio, medico, consulta, exame, dentista, plano de saude, academia, hospital'],
    ['educacao', 'escola, faculdade, curso, livro, livros, mensalidade, material escolar, udemy, alura'],
    ['lazer', 'cinema, show, bar, viagem, hotel, jogo, jogos, steam, ingresso, passeio'],
    ['compras', 'roupa, roupas, loja, shopping, mercado livre, shopee, magalu, americanas, presente, sapato'],
    ['impostos', 'imposto, taxa, ipva, darf, multa, tarifa, anuidade'],
  ],
  EARNING: [
    ['salario', 'salario, pagamento, holerite, 13, ferias'],
    ['freelance', 'freela, freelance, projeto, cliente, job'],
    ['vendas', 'venda, vendas'],
    ['rendimentos', 'rendimento, rendimentos, juros, dividendos'],
    ['reembolso', 'reembolso, estorno, devolucao'],
    ['presentes', 'presente'],
  ],
  INVESTMENT: [
    ['renda_fixa', 'cdb, tesouro, selic, lci, lca, poupanca, renda fixa'],
    ['acoes', 'acoes, acao, bolsa, b3'],
    ['fundos', 'fundo, fundos, fii'],
    ['previdencia', 'previdencia, pgbl, vgbl'],
    ['cripto', 'bitcoin, btc, cripto, ethereum, usdt'],
    ['reserva', 'reserva, emergencia'],
  ],
}

const contem = (nome, termo) => ` ${nome} `.includes(` ${termo} `)

/**
 * Categoria provável para o nome digitado:
 * 1) a que a própria pessoa mais usou para esse mesmo nome; 2) uma palavra conhecida do dicionário.
 * Retorna { chave, motivo } ou null.
 */
export function sugerirCategoria(nome, tipo, historico = []) {
  const n = normalizar(nome)
  if (n.length < 3) return null

  const contagem = {}
  for (const t of historico) {
    if (t.type !== tipo || !t.category) continue
    if (normalizar(t.name) === n) contagem[t.category] = (contagem[t.category] ?? 0) + 1
  }
  const maisUsada = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]
  if (maisUsada) return { chave: maisUsada[0], motivo: 'pelo que você já registrou' }

  // Primeiro os termos de mais de uma palavra ("mercado livre" antes de "mercado")
  const entradas = (DICIONARIO[tipo] ?? []).map(([chave, termos]) => [chave, termos.split(', ')])
  for (const compostos of [true, false]) {
    for (const [chave, lista] of entradas) {
      if (lista.some((t) => t.includes(' ') === compostos && contem(n, t))) return { chave, motivo: 'pelo nome' }
    }
  }
  return null
}

const doMes = (lista, ano, mes, ateDia) =>
  lista.filter((t) => {
    const [a, m, d] = String(t.date).slice(0, 10).split('-').map(Number)
    return a === ano && m === mes && d <= ateDia
  })

const somar = (lista) => lista.reduce((s, t) => s + Number(t.amount || 0), 0)

/**
 * Compara os gastos deste mês (até hoje) com o mesmo período do mês passado.
 * Retorna frases prontas, só com números calculados: nada é estimado.
 */
export function resumoDoMes(transacoes, hojeIso) {
  const [ano, mes, dia] = hojeIso.split('-').map(Number)
  const anoAnt = mes === 1 ? ano - 1 : ano
  const mesAnt = mes === 1 ? 12 : mes - 1
  const gastos = transacoes.filter((t) => t.type === 'EXPENSE')
  const agora = doMes(gastos, ano, mes, dia)
  const antes = doMes(gastos, anoAnt, mesAnt, dia)
  const totalAgora = somar(agora)
  const totalAntes = somar(antes)

  const porCategoria = (lista) =>
    lista.reduce((acc, t) => ({ ...acc, [t.category ?? '']: (acc[t.category ?? ''] ?? 0) + Number(t.amount || 0) }), {})
  const catAgora = porCategoria(agora)
  const catAntes = porCategoria(antes)
  const variacoes = Object.keys({ ...catAgora, ...catAntes })
    .filter((c) => c)
    .map((c) => ({ categoria: c, agora: catAgora[c] ?? 0, antes: catAntes[c] ?? 0 }))
    .map((v) => ({ ...v, diferenca: v.agora - v.antes }))
    .filter((v) => Math.abs(v.diferenca) >= 50 && v.antes > 0 && Math.abs(v.diferenca) / v.antes >= 0.2)
    .sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca))
    .slice(0, 3)

  return { dia, totalAgora, totalAntes, variacoes, temDados: agora.length + antes.length > 0 }
}
