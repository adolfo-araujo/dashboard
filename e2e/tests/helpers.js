import { execSync } from 'node:child_process'
import { expect } from '@playwright/test'

export const DEMO = { email: 'demo@finance.app', password: '123456' }

export async function login(page, { email, password }) {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

export async function openMenu(page) {
  await page.locator('button[aria-haspopup="menu"]').click()
}

// Nada pode ficar mais largo que a tela (barra de rolagem lateral no celular)
export async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow, 'a página está mais larga que a tela').toBeLessThanOrEqual(1)
}

// Só no ambiente de teste: confirma o e-mail direto no banco (não há caixa de e-mail aqui)
export function confirmEmailInDatabase(email) {
  execSync(
    `psql "${process.env.DATABASE_URL}" -v ON_ERROR_STOP=1 -c "UPDATE \\"User\\" SET email_verified_at = now() WHERE email = '${email}'"`,
    { stdio: 'inherit' },
  )
}
