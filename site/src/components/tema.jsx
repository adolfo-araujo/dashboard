import { useEffect, useState } from 'react'

const temaAtual = () => (document.documentElement.getAttribute('data-tema') === 'claro' ? 'claro' : 'escuro')

/** Tema claro ou escuro, escolhido pela pessoa. O padrão é o escuro. A escolha fica só neste aparelho. */
export function useTema() {
  const [tema, setTema] = useState(temaAtual)
  useEffect(() => {
    const mudou = () => setTema(temaAtual())
    window.addEventListener('valtrea:tema', mudou)
    return () => window.removeEventListener('valtrea:tema', mudou)
  }, [])
  return tema
}

export function trocarTema() {
  const novo = temaAtual() === 'claro' ? 'escuro' : 'claro'
  document.documentElement.setAttribute('data-tema', novo)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', novo === 'claro' ? '#FFFFFF' : '#0D0F12')
  try {
    if (novo === 'claro') localStorage.setItem('valtrea:tema', 'claro')
    else localStorage.removeItem('valtrea:tema')
  } catch {
    // navegação privada: vale até fechar a aba
  }
  window.dispatchEvent(new Event('valtrea:tema'))
}

export function BotaoTema({ className = 'hover:text-foreground hover:underline', rotulos = ['Tema escuro', 'Tema claro'] }) {
  const tema = useTema()
  return (
    <button type="button" onClick={trocarTema} className={className} aria-pressed={tema === 'claro'}>
      {tema === 'claro' ? rotulos[0] : rotulos[1]}
    </button>
  )
}
