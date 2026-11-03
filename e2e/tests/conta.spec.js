import { test, expect } from '@playwright/test'
import { confirmEmailInDatabase, expectNoHorizontalScroll, login, openMenu } from './helpers.js'

test.describe.configure({ mode: 'serial' })

test('ciclo completo da conta: cadastro, confirmação, edição e exclusão', async ({ page }, testInfo) => {
  const email = `qa-${testInfo.project.name}-${Date.now()}@test.dev`
  const password = 'senha-qa-123'

  // Cadastro
  await page.goto('/signup')
  await page.getByLabel('Nome', { exact: true }).fill('QA')
  await page.getByLabel('Sobrenome').fill('Teste')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirmar senha').fill(password)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByText('Confirme seu e-mail').first()).toBeVisible()
  await expectNoHorizontalScroll(page)

  // Confirmação do e-mail libera o painel
  confirmEmailInDatabase(email)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Olá, QA' })).toBeVisible()

  // Editar o nome
  await openMenu(page)
  await page.getByRole('menuitem', { name: 'Minha conta' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('#acc-first').fill('Testador')
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByText('Dados atualizados.')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Olá, Testador' })).toBeVisible()

  // Sair e entrar de novo
  await openMenu(page)
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await login(page, { email, password })
  await expect(page.getByRole('heading', { name: 'Olá, Testador' })).toBeVisible()

  // Excluir a conta (com senha errada primeiro)
  await openMenu(page)
  await page.getByRole('menuitem', { name: 'Minha conta' }).click()
  await page.getByRole('button', { name: 'Excluir minha conta' }).click()
  await page.locator('#delete-password').fill('senha-errada')
  await page.getByRole('button', { name: 'Excluir definitivamente' }).click()
  await expect(page.getByText('Senha incorreta.')).toBeVisible()
  await page.locator('#delete-password').fill(password)
  await page.getByRole('button', { name: 'Excluir definitivamente' }).click()
  await expect(page.getByText(/Conta excluída/)).toBeVisible()

  // A conta não existe mais
  await login(page, { email, password })
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
})
