import { test, expect } from './fixtures.js'
import { DEMO, expectNoHorizontalScroll, login, openMenu } from './helpers.js'

test.beforeEach(async ({ page }) => {
  await login(page, DEMO)
  await expect(page.getByRole('heading', { name: /Olá, Usuário/ })).toBeVisible()
})

test('painel carrega o resumo e cabe na tela', async ({ page }) => {
  await expect(page.getByText('Este é o resumo das suas finanças no período.')).toBeVisible()
  await expect(page.getByText('Saldo atual')).toBeVisible()
  await expect(page.getByText('Saldo no início')).toBeVisible()
  await expect(page.getByText('Saldo no fim')).toBeVisible()
  await expect(page.getByText('Transações').first()).toBeVisible()
  // espera os gráficos e tabelas carregarem antes de medir a largura
  await page.waitForLoadState('networkidle')
  await expectNoHorizontalScroll(page)
})

test('aviso de termos atualizados registra o aceite e some', async ({ page }) => {
  // O usuário demo do teste não tem aceite da versão atual. O primeiro aparelho testado aceita;
  // nos seguintes o aviso já não aparece.
  const notice = page.getByRole('region', { name: 'Atualizamos os Termos de uso e a Política de privacidade' })
  if (await notice.count()) {
    await expect(notice.getByRole('link', { name: 'Termos de uso' })).toBeVisible()
    await notice.getByRole('button', { name: 'Li e concordo' }).click()
    await expect(notice).toBeHidden()
    await page.reload()
    await expect(page.getByRole('heading', { name: /Olá, Usuário/ })).toBeVisible()
  }
  await expect(notice).toHaveCount(0)
})

test('criar, buscar, editar e excluir uma transação', async ({ page }, testInfo) => {
  const name = `Café QA ${testInfo.project.name} ${Date.now() % 100000}`

  await page.getByRole('button', { name: 'Adicionar', exact: true }).first().click()
  let dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Adicionar transação' })).toBeVisible()
  await dialog.getByLabel('Nome').fill(name)
  await dialog.getByLabel('Valor (R$)').fill('12.50')
  await dialog.getByRole('radio', { name: 'Gasto' }).click()
  await dialog.locator('#category').selectOption('alimentacao')
  await dialog.getByRole('button', { name: 'Adicionar', exact: true }).click()
  await expect(page.getByText('Transação adicionada.')).toBeVisible()
  await expectNoHorizontalScroll(page)

  await page.getByLabel('Buscar transação').fill(name)
  const edit = page.getByRole('button', { name: `Editar ${name}` }).filter({ visible: true })
  await expect(edit).toHaveCount(1)

  await edit.click()
  dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Editar transação' })).toBeVisible()
  await dialog.getByLabel('Valor (R$)').fill('15')
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByText('Transação atualizada.')).toBeVisible()

  await page.getByRole('button', { name: `Excluir ${name}` }).filter({ visible: true }).click()
  dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Excluir', exact: true }).click()
  await expect(page.getByText('Transação excluída.')).toBeVisible()
  await expect(page.getByRole('button', { name: `Editar ${name}` }).filter({ visible: true })).toHaveCount(0)
})

test('trocar o período atualiza o endereço', async ({ page }) => {
  const year = new Date().getFullYear()
  await page.getByLabel('Período').selectOption({ label: 'Este ano' })
  await expect(page).toHaveURL(new RegExp(`from=${year}-01-01`))
  await expect(page.getByText('Este é o resumo das suas finanças no período.')).toBeVisible()
})

test('exportar as transações em CSV', async ({ page }) => {
  await page.getByLabel('Período').selectOption({ label: 'Este ano' })
  const download = page.waitForEvent('download')
  await page.getByTitle('Baixar as transações exibidas em planilha (CSV)').click()
  expect((await download).suggestedFilename()).toMatch(/\.csv$/)
})

test('recorrentes abre e fecha', async ({ page }) => {
  await page.getByRole('button', { name: 'Recorrentes' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('administração é bloqueada para quem não é admin', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.getByText('Acesso restrito')).toBeVisible()
})

test('sair volta para fora do painel', async ({ page }) => {
  await openMenu(page)
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByRole('heading', { name: /Olá, Usuário/ })).toHaveCount(0)
})
