import { test, expect } from './fixtures.js'
import { expectNoHorizontalScroll, login } from './helpers.js'

test('página inicial abre e cabe na tela', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Saiba para onde vai o seu dinheiro.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Criar conta grátis' }).first()).toBeVisible()
  await expectNoHorizontalScroll(page)
})

test('termos de uso e política de privacidade abrem', async ({ page }) => {
  await page.goto('/termos')
  await expect(page.getByRole('heading', { name: /termos/i }).first()).toBeVisible()
  await expectNoHorizontalScroll(page)
  await page.goto('/privacidade')
  await expect(page.getByRole('heading', { name: /privacidade/i }).first()).toBeVisible()
  await expectNoHorizontalScroll(page)
})

test('endereço inexistente volta para o início', async ({ page }) => {
  await page.goto('/pagina-que-nao-existe')
  await expect(page).toHaveURL(/\/$/)
})

test('login com senha errada mostra aviso', async ({ page }) => {
  await login(page, { email: 'ninguem@test.dev', password: 'senha-errada' })
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
})

test('esqueci a senha confirma o envio sem revelar se a conta existe', async ({ page }) => {
  await page.goto('/forgot-password')
  await page.getByLabel('E-mail').fill('ninguem@test.dev')
  await page.getByRole('button', { name: 'Enviar link' }).click()
  await expect(page.getByText('Se existir uma conta com')).toBeVisible()
})

test('cadastro exige aceitar os termos', async ({ page }) => {
  await page.goto('/signup')
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByText('Aceite os termos para continuar.')).toBeVisible()
})
