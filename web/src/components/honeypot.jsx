import { forwardRef } from 'react'

// Campo invisível para pessoas (fora da tela, sem foco pelo teclado e escondido dos leitores
// de tela). Robôs que preenchem todos os campos caem nele, e a API recusa o envio.
export const Honeypot = forwardRef(function Honeypot(props, ref) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
      <label>
        Deixe este campo em branco
        <input ref={ref} type="text" tabIndex={-1} autoComplete="off" {...props} />
      </label>
    </div>
  )
})
