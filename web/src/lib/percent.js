// Percentuais com 1 casa decimal que sempre somam exatamente 100%.
export function toPercentages(values) {
  const total = values.reduce((sum, v) => sum + v, 0)
  if (total === 0) return values.map(() => 0)

  const raw = values.map((v) => (v / total) * 1000)
  const tenths = raw.map(Math.floor)
  let remaining = 1000 - tenths.reduce((sum, t) => sum + t, 0)

  raw
    .map((r, i) => ({ i, rest: r - tenths[i] }))
    .sort((a, b) => b.rest - a.rest)
    .forEach(({ i }) => {
      if (remaining > 0) {
        tenths[i] += 1
        remaining -= 1
      }
    })

  return tenths.map((t) => t / 10)
}

const percentFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export function formatPercent(pct, value) {
  if (value > 0 && pct === 0) return '< 0,1%'
  return `${percentFormat.format(pct)}%`
}
