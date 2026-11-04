import { test, expect } from './fixtures.js'
import AxeBuilder from '@axe-core/playwright'
import { DEMO, login } from './helpers.js'

// Verificação automática de acessibilidade (axe-core, regras WCAG 2.1 níveis A e AA):
// contraste, textos alternativos, rótulos de campos, navegação por teclado, títulos etc.
const SITE = process.env.SITE_URL || 'http://localhost:5174'

async function checkA11y(page, nome) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const report = violations
    .map((v) => `- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}x)\n    ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n    ')}`)
    .join('\n')
  expect(violations, `Problemas de acessibilidade em ${nome}:\n${report}`).toEqual([])
}

for (const [nome, path] of [
  ['página inicial', '/'],
  ['login', '/login'],
  ['cadastro', '/signup'],
  ['esqueci a senha', '/forgot-password'],
  ['termos de uso', '/termos'],
  ['política de privacidade', '/privacidade'],
  ['declaração de acessibilidade', '/acessibilidade'],
]) {
  test(`acessibilidade: ${nome}`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await checkA11y(page, nome)
  })
}

test('acessibilidade: painel e formulário de transação', async ({ page }) => {
  await login(page, DEMO)
  await expect(page.getByRole('heading', { name: /Olá, Usuário/ })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await checkA11y(page, 'painel')
  await page.getByRole('button', { name: 'Adicionar', exact: true }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await checkA11y(page, 'formulário de transação')
})

test('acessibilidade: site da Valtrea', async ({ page }) => {
  await page.goto(SITE)
  await page.waitForLoadState('networkidle')
  await checkA11y(page, 'site da Valtrea')
})

test('teclado: dá para entrar só com o teclado', async ({ page }) => {
  await page.goto('/login')
  await page.keyboard.press('Tab')
  // percorre os elementos até chegar no campo de e-mail
  for (let i = 0; i < 10 && !(await page.getByLabel('E-mail').evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab')
  }
  await page.keyboard.type(DEMO.email)
  await page.keyboard.press('Tab')
  await page.keyboard.type(DEMO.password)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: /Olá, Usuário/ })).toBeVisible()
})
