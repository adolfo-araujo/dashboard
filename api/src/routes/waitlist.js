// Lista de espera dos produtos em desenvolvimento, usada pelo site www.valtrea.com.br
// ("Quero ser avisado"). O site chama /api/lista-de-espera no próprio endereço e a Vercel
// encaminha para cá (site/vercel.json), por isso não precisa de CORS.
//
// LGPD: só guardamos o e-mail e o produto, com consentimento. A inscrição só vale depois de a
// pessoa confirmar pelo link enviado por e-mail (confirmação dupla), o que também impede que
// alguém inscreva o e-mail de outra pessoa. Quem não confirma em 7 dias é apagado, e o mesmo
// link do e-mail serve para sair da lista a qualquer momento (retention.js apaga o resto).
import { Router } from 'express'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../../prisma/prisma.js'
import { sendEmail } from '../adapters/email-sender.js'
import { isBot } from '../security/bot-protection.js'

export const waitlistRouter = Router()

export const WAITLIST_PRODUCTS = {
    pay: 'Valtrea Pay',
    volta: 'Valtrea Volta',
    pulso: 'Valtrea Pulso',
    agora: 'Valtrea Agora',
}

export const WAITLIST_CONFIRM_DAYS = 7
const DAY = 24 * 60 * 60 * 1000
// Um e-mail de confirmação por endereço e produto a cada 2 minutos, para ninguém usar a lista para
// encher a caixa de outra pessoa.
const RESEND_COOLDOWN_MS = 2 * 60 * 1000

const GENERIC =
    'Pronto! Se o e-mail estiver certo, você vai receber um link para confirmar. Confira também a caixa de spam.'

export const hashWaitlistToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

const siteUrl = () => (process.env.SITE_URL || 'https://www.valtrea.com.br').replace(/\/$/, '')

const joinSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .max(100, { message: 'E-mail muito longo.' })
        .email({ message: 'Digite um e-mail válido.' }),
    produto: z.enum(Object.keys(WAITLIST_PRODUCTS), { message: 'Produto inválido.' }),
    aceite: z.literal(true, { message: 'Marque que concorda em receber o aviso.' }),
})

const tokenSchema = z.object({
    token: z.string().regex(/^[a-f0-9]{64}$/, { message: 'Link inválido ou vencido.' }),
})

async function sendConfirmation(email, product, token) {
    const name = WAITLIST_PRODUCTS[product]
    const confirm = `${siteUrl()}/?lista=confirmar&token=${token}`
    const leave = `${siteUrl()}/?lista=sair&token=${token}`
    await sendEmail({
        to: email,
        subject: `Confirme: aviso de lançamento do ${name}`,
        text: `Olá!\n\nRecebemos um pedido para avisar este e-mail quando o ${name} estiver disponível. Para confirmar, abra o link abaixo (vale por ${WAITLIST_CONFIRM_DAYS} dias):\n\n${confirm}\n\nUsaremos seu e-mail só para esse aviso. Para sair da lista a qualquer momento:\n${leave}\n\nSe não foi você, ignore este e-mail: sem a confirmação, o endereço é apagado em ${WAITLIST_CONFIRM_DAYS} dias.\n\nValtrea · www.valtrea.com.br`,
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111827">
  <h2 style="color:#3B7F1F;margin-bottom:8px">Valtrea</h2>
  <p>Olá!</p>
  <p>Recebemos um pedido para avisar este e-mail quando o <strong>${name}</strong> estiver disponível.</p>
  <p style="margin:28px 0">
    <a href="${confirm}" style="background:#22C55E;color:#111827;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Confirmar inscrição</a>
  </p>
  <p style="font-size:13px;color:#5f6670">O link vale por ${WAITLIST_CONFIRM_DAYS} dias. Usaremos seu e-mail só para esse aviso. Se não foi você, ignore: sem a confirmação, o endereço é apagado em ${WAITLIST_CONFIRM_DAYS} dias.</p>
  <p style="font-size:13px;color:#5f6670"><a href="${leave}" style="color:#5f6670">Sair da lista</a></p>
</div>`,
    })
}

// POST /api/lista-de-espera  { email, produto, aceite: true }
// Resposta sempre igual (exista ou não a inscrição), para não revelar quem está na lista.
waitlistRouter.post('/', async (request, response) => {
    if (isBot(request)) return response.status(202).send({ message: GENERIC })

    const parsed = joinSchema.safeParse(request.body)
    if (!parsed.success) {
        return response.status(400).send({ message: parsed.error.issues[0].message })
    }
    const { email, produto } = parsed.data

    try {
        const existing = await prisma.waitlistEntry.findUnique({
            where: { email_product: { email, product: produto } },
        })
        if (existing?.confirmed_at) return response.status(202).send({ message: GENERIC })
        if (existing && Date.now() - existing.sent_at.getTime() < RESEND_COOLDOWN_MS) {
            return response.status(202).send({ message: GENERIC })
        }

        const token = crypto.randomBytes(32).toString('hex')
        const data = { token_hash: hashWaitlistToken(token), sent_at: new Date() }
        await prisma.waitlistEntry.upsert({
            where: { email_product: { email, product: produto } },
            create: { email, product: produto, ...data },
            update: data,
        })
        await sendConfirmation(email, produto, token)
        return response.status(202).send({ message: GENERIC })
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Não foi possível concluir agora. Tente de novo em instantes.' })
    }
})

// POST /api/lista-de-espera/confirmar  { token }
// Confirmação por POST (o site mostra um botão), e não ao abrir o link: alguns e-mails corporativos
// abrem os links sozinhos para checar vírus, e isso não pode inscrever ninguém.
waitlistRouter.post('/confirmar', async (request, response) => {
    const parsed = tokenSchema.safeParse(request.body)
    if (!parsed.success) return response.status(400).send({ message: parsed.error.issues[0].message })

    try {
        const entry = await prisma.waitlistEntry.findUnique({
            where: { token_hash: hashWaitlistToken(parsed.data.token) },
        })
        if (!entry) return response.status(400).send({ message: 'Link inválido ou vencido.' })
        const product = WAITLIST_PRODUCTS[entry.product] ?? entry.product
        if (entry.confirmed_at) return response.status(200).send({ product, message: 'Inscrição já confirmada.' })
        if (Date.now() - entry.sent_at.getTime() > WAITLIST_CONFIRM_DAYS * DAY) {
            return response.status(400).send({ message: 'Este link venceu. Peça o aviso de novo no site.' })
        }
        await prisma.waitlistEntry.update({ where: { id: entry.id }, data: { confirmed_at: new Date() } })
        return response.status(200).send({ product, message: 'Inscrição confirmada.' })
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Não foi possível concluir agora. Tente de novo em instantes.' })
    }
})

// POST /api/lista-de-espera/sair  { token }  — apaga a inscrição na hora
waitlistRouter.post('/sair', async (request, response) => {
    const parsed = tokenSchema.safeParse(request.body)
    if (!parsed.success) return response.status(400).send({ message: parsed.error.issues[0].message })

    try {
        await prisma.waitlistEntry.deleteMany({ where: { token_hash: hashWaitlistToken(parsed.data.token) } })
        return response.status(200).send({ message: 'Pronto: seu e-mail saiu da lista e foi apagado.' })
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Não foi possível concluir agora. Tente de novo em instantes.' })
    }
})
