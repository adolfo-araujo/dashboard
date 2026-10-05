import { useSearchParams } from 'react-router-dom'
import { DATE_PRESETS } from '../lib/format'

const isValid = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '')

// O período fica na URL (?from=&to=), então sobrevive a um F5 e pode ser compartilhado
export function useDateRange() {
  const [params, setParams] = useSearchParams()
  const [defaultFrom, defaultTo] = DATE_PRESETS[0].range()

  const from = isValid(params.get('from')) ? params.get('from') : defaultFrom
  const to = isValid(params.get('to')) ? params.get('to') : defaultTo

  const setRange = (nextFrom, nextTo) => {
    setParams({ from: nextFrom, to: nextTo }, { replace: true })
  }

  return { from, to, setRange }
}
