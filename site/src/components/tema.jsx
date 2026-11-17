import { useEffect, useState } from 'react'

const temaAtual = () => (document.documentElement.getAttribute('data-tema') === 'escuro' ? 'escuro' : 'claro')

/** Tema claro ou escuro, escolhido pela pessoa. O padrão é o claro. A escolha fica só neste aparelho. */
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
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', novo === 'escuro' ? '#0D0F12' : '#F3F4F6')
  try {
    if (novo === 'escuro') localStorage.setItem('valtrea:tema', 'escuro')
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
