/** Olhos do campo de senha: fechado (riscado) quando a senha está escondida, aberto quando aparece. */
export function OlhoFechado(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c5.5 0 9 5.5 9.5 7a13.6 13.6 0 0 1-2.4 3.4M6.6 6.6C4.4 8 3 10.2 2.5 12c.5 1.5 4 7 9.5 7a9.6 9.6 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3 3l18 18" />
    </svg>
  )
}

export function OlhoAberto(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M2.5 12C3.2 10.3 6.7 5 12 5s8.8 5.3 9.5 7c-.7 1.7-4.2 7-9.5 7s-8.8-5.3-9.5-7Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  )
}
