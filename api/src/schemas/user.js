import { z } from 'zod'

// Regra de senha para cadastro, troca e redefinição: 8 a 72 caracteres, com letras e números.
// (72 é o limite do bcrypt: o que passar disso seria ignorado sem aviso.)
// O login continua aceitando senhas antigas de 6 caracteres.
export const passwordSchema = z
    .string({ error: (issue) => (issue.input === undefined ? 'Informe uma senha.' : undefined) })
    .min(8, { message: 'A senha precisa ter pelo menos 8 caracteres.' })
    .max(72, { message: 'A senha pode ter no máximo 72 caracteres.' })
    .refine((value) => /[a-zA-ZÀ-ÿ]/.test(value) && /[0-9]/.test(value), {
        message: 'A senha precisa ter letras e números.',
    })

export const createUserSchema = z.object({
    first_name: z
        .string({ error: (issue) => (issue.input === undefined ? 'First name is required.' : undefined) })
        .trim()
        .min(1, {
            message: 'First name is required.',
        }),
    last_name: z
        .string({ error: (issue) => (issue.input === undefined ? 'Last name is required.' : undefined) })
        .trim()
        .min(1, {
            message: 'Last name is required',
        }),
    email: z
        .string({ error: (issue) => (issue.input === undefined ? 'E-mail is required.' : undefined) })
        .email({
            message: 'Please provide a valid e-mail.',
        })
        .trim()
        .min(1, {
            message: 'E-mail is required.',
        }),
    password: passwordSchema,
})

export const updateUserSchema = createUserSchema.partial().strict()

export const loginSchema = z.object({
    email: z
        .string()
        .email({
            message: 'Please provide a valid e-mail.',
        })
        .trim()
        .min(1, {
            message: 'E-mail is required.',
        }),
    password: z.string().trim().min(6, {
        message: 'Password must have at least 6 characters.',
    }),
})

export const refreshTokenSchema = z.object({
    refreshToken: z.string().trim().min(1, {
        message: 'Refresh token is required.',
    }),
})

export const getUserBalanceSchema = z.object({
    user_id: z.string().uuid(),
    from: z.string().date(),
    to: z.string().date(),
    // "hoje" de quem pede (fuso do navegador), para o saldo atual
    today: z.string().date().optional(),
})
