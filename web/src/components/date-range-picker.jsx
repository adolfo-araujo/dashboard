import { DATE_PRESETS } from '../lib/format'
import { Input, Select } from './ui/input'

export function DateRangePicker({ from, to, onChange }) {
  const activePreset = DATE_PRESETS.findIndex((p) => {
    const [f, t] = p.range()
    return f === from && t === to
  })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={activePreset === -1 ? 'custom' : String(activePreset)}
        onChange={(e) => {
          if (e.target.value === 'custom') return
          const [f, t] = DATE_PRESETS[Number(e.target.value)].range()
          onChange(f, t)
        }}
        className="w-auto"
        aria-label="Período"
      >
        {DATE_PRESETS.map((p, i) => (
          <option key={p.label} value={i}>
            {p.label}
          </option>
        ))}
        <option value="custom">Personalizado</option>
      </Select>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={from}
          max={to}
          onChange={(e) => e.target.value && onChange(e.target.value, to)}
          className="w-auto"
          aria-label="Data inicial"
        />
        <span className="text-sm text-muted">até</span>
        <Input
          type="date"
          value={to}
          min={from}
          onChange={(e) => e.target.value && onChange(from, e.target.value)}
          className="w-auto"
          aria-label="Data final"
        />
      </div>
    </div>
  )
}
