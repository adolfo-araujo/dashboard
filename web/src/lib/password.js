import { z } from 'zod'

// Mesma regra da API: 8 a 72 caracteres, com letras e números.
// Espaços no começo e no fim são removidos, igual ao login.
export const PASSWORD_HINT = 'Use pelo menos 8 caracteres, com letras e números.'

export const passwordSchema = z
  .string()
  .trim()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(72, 'A senha pode ter no máximo 72 caracteres.')
  .refine((v) => /[a-zA-ZÀ-ÿ]/.test(v) && /[0-9]/.test(v), 'A senha precisa ter letras e números.')
