// Registro de interações e erros. Não grava o texto da mensagem nem dados financeiros: só a intenção,
// o módulo, a confiança e o tempo, para medir o que o assistente entende e o que falha.
const ativo = () => process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID

export function registrarInteracao({ intencao, modulo, confianca, ms }) {
    if (!ativo()) return
    console.info(`[assistente] intencao=${intencao} modulo=${modulo} confianca=${Number(confianca ?? 0).toFixed(2)} ms=${ms}`)
}

export function registrarErro(onde, erro) {
    if (!ativo()) return
    console.error(`[assistente] erro em ${onde}:`, erro?.message ?? erro)
}
