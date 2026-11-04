// Primeiro item focável da página: quem navega pelo teclado pula o cabeçalho e vai direto ao conteúdo
// (WCAG 2.4.1). Cada página marca o conteúdo principal com <main id="conteudo" tabIndex={-1}>.
export function SkipLink() {
  const skip = (event) => {
    const main = document.getElementById('conteudo')
    if (!main) return
    event.preventDefault()
    main.focus()
    main.scrollIntoView()
  }

  return (
    <a
      href="#conteudo"
      onClick={skip}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-background"
    >
      Pular para o conteúdo
    </a>
  )
}
