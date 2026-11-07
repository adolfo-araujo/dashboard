import { useEffect, useState } from 'react'

/**
 * Aviso de "servidor acordando". No plano grátis do Render, a API dorme depois de 15 minutos sem uso e
 * leva cerca de 1 minuto para voltar. Sem este aviso, parece que o site travou.
 */
export function AvisoServidorLento() {
  const [lento, setLento] = useState(false)
  useEffect(() => {
    const ouvir = (e) => setLento(e.detail > 0)
    window.addEventListener('valtrea:lento', ouvir)
    return () => window.removeEventListener('valtrea:lento', ouvir)
  }, [])
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      {lento && (
        <p className="max-w-md rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground shadow-xl">
          <strong>Acordando o servidor…</strong> Quando o site fica um tempo sem uso, a primeira ação pode levar até
          1 minuto. Depois fica rápido.
        </p>
      )}
    </div>
  )
}
