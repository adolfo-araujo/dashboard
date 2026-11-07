// Lê extratos de banco (OFX ou CSV) no próprio navegador: o arquivo não é enviado para lugar nenhum.
// Cada linha vira { data: 'AAAA-MM-DD', nome, valor } com valor negativo para saída de dinheiro.

const limpar = (texto) => String(texto ?? '').replace(/\s+/g, ' ').trim()

/** "1.234,56", "-45.90", "R$ -12,00", "(30,00)" → número */
export function lerValor(texto) {
  let t = String(texto ?? '').replace(/R\$|\s/g, '')
  let negativo = false
  if (/^\(.*\)$/.test(t)) { negativo = true; t = t.slice(1, -1) }
  if (t.endsWith('-')) { negativo = true; t = t.slice(0, -1) }
  if (t.includes(',') && t.lastIndexOf(',') > t.lastIndexOf('.')) t = t.replace(/\./g, '').replace(',', '.')
  else t = t.replace(/,/g, '')
  const n = Number(t)
  if (!Number.isFinite(n)) return null
  return negativo ? -Math.abs(n) : n
}

/** "03/11/2026", "2026-11-03", "20261103120000[-3:BRT]", "03/11/26" → "2026-11-03" */
export function lerData(texto) {
  const t = String(texto ?? '').trim().replace(/\[.*$/, '')
  let m = /^(\d{4})(\d{2})(\d{2})/.exec(t)
  if (m && !t.includes('/') && !t.includes('-')) return `${m[1]}-${m[2]}-${m[3]}`
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/.exec(t)
  if (m) {
    const ano = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${ano}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }
  return null
}

const campoOfx = (bloco, nome) => {
  const m = new RegExp(`<${nome}>([^<\\r\\n]*)`, 'i').exec(bloco)
  return m ? m[1].trim() : ''
}

export function lerOfx(texto) {
  const blocos = texto.split(/<STMTTRN>/i).slice(1)
  return blocos
    .map((b) => {
      const corpo = b.split(/<\/STMTTRN>/i)[0]
      const memo = campoOfx(corpo, 'MEMO')
      const nome = campoOfx(corpo, 'NAME')
      return {
        data: lerData(campoOfx(corpo, 'DTPOSTED')),
        nome: limpar(memo || nome || 'Lançamento'),
        valor: lerValor(campoOfx(corpo, 'TRNAMT')),
      }
    })
    .filter((l) => l.data && l.valor !== null)
}

// Divide uma linha de CSV respeitando aspas ("Padaria; Café" é um campo só)
function dividir(linha, sep) {
  const campos = []
  let atual = ''
  let aspas = false
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (c === '"') {
      if (aspas && linha[i + 1] === '"') { atual += '"'; i++ } else aspas = !aspas
    } else if (c === sep && !aspas) {
      campos.push(atual)
      atual = ''
    } else atual += c
  }
  campos.push(atual)
  return campos.map((c) => c.trim())
}

const sem = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function lerCsv(texto) {
  const linhas = texto.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim())
  if (linhas.length < 2) return []
  // Cabeçalho: a primeira linha (entre as 10 primeiras) que tem coluna de data e de valor
  for (let h = 0; h < Math.min(10, linhas.length); h++) {
    const sep = [';', '\t', ','].sort((a, b) => linhas[h].split(b).length - linhas[h].split(a).length)[0]
    const cab = dividir(linhas[h], sep).map(sem)
    const iData = cab.findIndex((c) => /^(data|date|dt)/.test(c))
    const iValor = cab.findIndex((c) => /(valor|amount|quantia|montante)/.test(c))
    const iNome = cab.findIndex((c) => /(descri|histor|lancamento|title|titulo|estabelecimento|memo|identifica)/.test(c) && !/identificador/.test(c))
    if (iData < 0 || iValor < 0) continue
    return linhas.slice(h + 1)
      .map((l) => dividir(l, sep))
      .map((c) => ({
        data: lerData(c[iData]),
        nome: limpar(iNome >= 0 ? c[iNome] : 'Lançamento') || 'Lançamento',
        valor: lerValor(c[iValor]),
      }))
      .filter((l) => l.data && l.valor !== null && l.valor !== 0)
  }
  return []
}

export function lerExtrato(nomeArquivo, texto) {
  if (/\.ofx$/i.test(nomeArquivo) || /<OFX>/i.test(texto)) return { formato: 'OFX', linhas: lerOfx(texto) }
  return { formato: 'CSV', linhas: lerCsv(texto) }
}
