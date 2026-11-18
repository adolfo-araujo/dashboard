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

/** Interruptor de tema: a bolinha desliza para a direita no tema escuro. */
export function BotaoTema({ className = '', rotulos = ['Tema escuro', 'Tema claro'] }) {
  const tema = useTema()
  const escuro = tema === 'escuro'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={escuro}
      onClick={trocarTema}
      title={escuro ? rotulos[1] : rotulos[0]}
      className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.25)] ring-1 ring-black/10 transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
    >
      <span className="sr-only">{rotulos[0]}</span>
      <span
        aria-hidden="true"
        className={`absolute left-[3px] top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full transition-all duration-300 ease-in-out ${
          escuro ? 'translate-x-[28px] bg-[#18191a]' : 'translate-x-0 bg-[#ffebcd] ring-1 ring-black/10'
        }`}
      />
    </button>
  )
}

/** Em telas largas o interruptor fica no canto superior direito, fora do conteúdo; em telas menores ele fica no rodapé. */
export function TemaNoCanto() {
  return (
    <div className="fixed right-3 top-4 z-[60] hidden xl:block">
      <BotaoTema />
    </div>
  )
}
