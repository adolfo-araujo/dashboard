import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

const simples = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Busca rápida: Ctrl+K (ou Cmd+K, ou "/") abre uma lista das telas; digite e aperte Enter.
 * itens: [rótulo, caminho, palavras extras para achar]
 */
export function BuscaRapida({ itens }) {
  const [aberta, setAberta] = useState(false)
  const [texto, setTexto] = useState('')
  const [ativo, setAtivo] = useState(0)
  const navegar = useNavigate()
  const campo = useRef(null)
  const antes = useRef(null)

  useEffect(() => {
    const tecla = (e) => {
      const digitando = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setAberta((v) => !v)
      } else if (e.key === '/' && !digitando && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setAberta(true)
      }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [])

  useEffect(() => {
    if (aberta) {
      antes.current = document.activeElement
      setTexto('')
      setAtivo(0)
      setTimeout(() => campo.current?.focus(), 0)
    } else {
      antes.current?.focus?.()
    }
  }, [aberta])

  const achados = useMemo(() => {
    const q = simples(texto.trim())
    return q ? itens.filter(([r, , extra = '']) => simples(`${r} ${extra}`).includes(q)) : itens
  }, [texto, itens])

  if (!aberta) return null

  const ir = (i) => {
    const item = achados[i]
    if (!item) return
    setAberta(false)
    navegar(item[1])
  }
  const teclaNoCampo = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAtivo((a) => Math.min(a + 1, achados.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAtivo((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); ir(ativo) }
    else if (e.key === 'Escape') { e.preventDefault(); setAberta(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 px-4 pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && setAberta(false)}>
      <div role="dialog" aria-modal="true" aria-label="Busca rápida" className="w-full max-w-lg overflow-hidden vidro rounded-xl shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={campo}
            value={texto}
            onChange={(e) => { setTexto(e.target.value); setAtivo(0) }}
            onKeyDown={teclaNoCampo}
            placeholder="Para onde você quer ir?"
            className="h-12 w-full bg-transparent text-foreground outline-none placeholder:text-muted"
            role="combobox"
            aria-expanded="true"
            aria-controls="busca-rapida-lista"
            aria-activedescendant={achados[ativo] ? `busca-rapida-${ativo}` : undefined}
            aria-label="Buscar uma tela"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-xs text-muted sm:block">Esc</kbd>
        </div>
        <ul id="busca-rapida-lista" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {achados.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Nada encontrado.</li>}
          {achados.map(([rotulo, caminho], i) => (
            <li
              key={caminho}
              id={`busca-rapida-${i}`}
              role="option"
              aria-selected={i === ativo}
              onMouseEnter={() => setAtivo(i)}
              onClick={() => ir(i)}
              className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm ${i === ativo ? 'bg-primary/15 text-foreground' : 'text-muted'}`}
            >
              {rotulo}
            </li>
          ))}
        </ul>
        <p className="border-t border-border px-4 py-2 text-xs text-muted">↑ ↓ para escolher · Enter para abrir · Ctrl+K ou / para abrir de qualquer tela</p>
      </div>
    </div>
  )
}
