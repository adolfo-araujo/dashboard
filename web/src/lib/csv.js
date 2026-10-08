import { TRANSACTION_TYPES, formatDate } from './format'
import { getCategory } from './categories'

// Formato que o Excel em português abre direto:
// separador ";", vírgula decimal e BOM para os acentos aparecerem certos.
const SEP = ';'

const escape = (value) => {
  const text = String(value ?? '')
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const decimal = (value) => Number(value).toFixed(2).replace('.', ',')

export function transactionsToCsv(transactions) {
  const header = ['Data', 'Nome', 'Tipo', 'Categoria', 'Valor', 'Efeito no saldo', 'Recorrente']
  const rows = transactions.map((t) => {
    const amount = Number(t.amount)
    const signed = t.type === 'EARNING' ? amount : -amount
    return [
      formatDate(t.date),
      t.name,
      TRANSACTION_TYPES[t.type]?.label ?? t.type,
      getCategory(t.type, t.category).label,
      decimal(amount),
      decimal(signed),
      t.recurring_id ? 'Sim' : 'Não',
    ]
  })
  return [header, ...rows].map((row) => row.map(escape).join(SEP)).join('\r\n')
}

export function downloadCsv(filename, csv) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
