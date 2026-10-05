import dayjs from 'dayjs'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const formatCurrency = (value) => currency.format(Number(value) || 0)

// A API guarda a data como DATE e devolve "YYYY-MM-DDT00:00:00.000Z".
// Usamos só a parte da data para não deslocar um dia por causa do fuso.
export const toDateOnly = (value) => String(value).slice(0, 10)

export const formatDate = (value) => {
  const [y, m, d] = toDateOnly(value).split('-')
  return `${d}/${m}/${y}`
}

export const toApiDate = (yyyyMmDd) => `${yyyyMmDd}T00:00:00.000Z`

export const today = () => dayjs().format('YYYY-MM-DD')

export const TRANSACTION_TYPES = {
  EARNING: { label: 'Ganho', plural: 'Ganhos', color: '#55B02E', text: 'text-earning', bg: 'bg-earning/10' },
  EXPENSE: { label: 'Gasto', plural: 'Gastos', color: '#E93030', text: 'text-expense', bg: 'bg-expense/10' },
  INVESTMENT: { label: 'Investimento', plural: 'Investimentos', color: '#3B82F6', text: 'text-investment', bg: 'bg-investment/10' },
}

const presets = [
  { label: 'Este mês', range: () => [dayjs().startOf('month'), dayjs().endOf('month')] },
  {
    label: 'Mês passado',
    range: () => [
      dayjs().subtract(1, 'month').startOf('month'),
      dayjs().subtract(1, 'month').endOf('month'),
    ],
  },
  {
    label: 'Últimos 3 meses',
    range: () => [dayjs().subtract(2, 'month').startOf('month'), dayjs().endOf('month')],
  },
  { label: 'Este ano', range: () => [dayjs().startOf('year'), dayjs().endOf('year')] },
]

export const DATE_PRESETS = presets.map((p) => ({
  label: p.label,
  range: () => p.range().map((d) => d.format('YYYY-MM-DD')),
}))
