import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function Dialog({ open, onClose, title, description, wide = false, children }) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    const onKey = (e) => {
      if (e.key === 'Escape') return onCloseRef.current()
      // mantém o foco dentro da janela enquanto ela está aberta (WCAG 2.4.3)
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = [
        ...panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && (document.activeElement === first || !panelRef.current.contains(document.activeElement))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (document.activeElement === last || !panelRef.current.contains(document.activeElement))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    // foca o primeiro campo do formulário
    requestAnimationFrame(() => {
      panelRef.current?.querySelector('input, select, button:not([data-close])')?.focus()
    })
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* fundo escuro: clicar fora fecha (no teclado, Esc ou o botão Fechar fazem o mesmo) */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-surface p-6 shadow-2xl sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
      >
        <button
          data-close
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 id="dialog-title" className="pr-8 text-lg font-bold">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
