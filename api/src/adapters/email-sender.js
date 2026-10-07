// Envio de e-mail pela API do Resend (https://resend.com).
// Sem RESEND_API_KEY configurada (ex.: rodando no seu computador),
// o e-mail não é enviado: o conteúdo aparece no log da API.
export async function sendEmail({ to, subject, html, text }) {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
        console.log(
            `\n[e-mail não enviado: RESEND_API_KEY ausente]\nPara: ${to}\nAssunto: ${subject}\n\n${text}\n`,
        )
        return
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Valtrea <nao-responda@valtrea.com.br>',
            to: [to],
            subject,
            html,
            text,
        }),
    })

    if (!response.ok) {
        const detail = await response.text()
        throw new Error(`Falha ao enviar e-mail (${response.status}): ${detail}`)
    }
}
