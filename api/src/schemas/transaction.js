import { z } from 'zod'
import validator from 'validator'
import { ALL_CATEGORIES, CATEGORIES } from '../constants/categories.js'

const baseTransactionSchema = z.object({
    user_id: z
        .string({ error: (issue) => (issue.input === undefined ? 'User ID is required.' : undefined) })
        .uuid({
            message: 'User ID must be a valid UUID.',
        }),
    name: z
        .string({ error: (issue) => (issue.input === undefined ? 'Name is required.' : undefined) })
        .trim()
        .min(1, {
            message: 'Name is required.',
        }),
    date: z
        .string({ error: (issue) => (issue.input === undefined ? 'Date is required.' : undefined) })
        .datetime({
            message: 'Date must be a valid date.',
        }),
    type: z.enum(['EXPENSE', 'EARNING', 'INVESTMENT'], {
        error: 'Type must be EXPENSE, EARNING or INVESTMENT.',
    }),
    amount: z
        .number({ error: (issue) => (issue.input === undefined ? 'Amount is required.' : 'Amount must be a number.') })
        .min(1, {
            message: 'Amount must be greater than 0.',
        })
        .refine((value) =>
            validator.isCurrency(value.toFixed(2), {
                digits_after_decimal: [2],
                allow_negatives: false,
                decimal_separator: '.',
            }),
        ),
    category: z
        .enum(ALL_CATEGORIES, {
            error: 'Categoria inválida.',
        })
        .nullable()
        .optional(),
})

// Quando tipo e categoria vêm juntos, a categoria precisa pertencer ao tipo
const categoryMatchesType = (data) =>
    !data.type || !data.category || CATEGORIES[data.type].includes(data.category)

const categoryError = {
    message: 'Categoria não corresponde ao tipo da transação.',
    path: ['category'],
}

export const createTransactionSchema = baseTransactionSchema.refine(
    categoryMatchesType,
    categoryError,
)

export const updateTransactionSchema = baseTransactionSchema
    .omit({
        user_id: true,
    })
    .partial()
    .refine(categoryMatchesType, categoryError)

export const getTransactionsByUserIdSchema = z.object({
    user_id: z.string().uuid(),
    from: z.string().date(),
    to: z.string().date(),
})
