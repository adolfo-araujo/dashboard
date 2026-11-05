import { test, expect } from './fixtures.js'
import AxeBuilder from '@axe-core/playwright'

// Projetos em desenvolvimento e "Quero ser avisado" no site da Valtrea.
// O site chama /api/lista-de-espera no próprio endereço (no CI, o servidor de teste encaminha para a API local).
const SITE = process.env.SITE_URL || 'http://localhost:5174'

test('site mostra os projetos em desenvolvimento com a fase de cada um', async ({ page }, testInfo) => {
  await page.goto(SITE)
  const secao = page.locator('#em-desenvolvimento')
  await expect(secao.getByRole('heading', { name: 'Projetos em desenvolvimento' })).toBeVisible()
  for (const nome of ['Valtrea Pay', 'Valtrea Volta', 'Valtrea Pulso', 'Valtrea Agora']) {
    await expect(secao.getByRole('heading', { name: nome })).toBeVisible()
  }
  await expect(secao.getByText('Em desenvolvimento', { exact: true })).toHaveCount(1)
  await expect(secao.getByText('Em planejamento', { exact: true })).toHaveCount(0)
  await expect(secao.getByText('Aberto para testes', { exact: true })).toHaveCount(3)
  // O Volta já está no ar: no lugar da lista de espera, o link para o site dele
  const volta = secao.locator('li').filter({ hasText: 'Valtrea Volta' })
  await expect(volta.getByRole('link', { name: /Usar o Volta/ })).toHaveAttribute('href', 'https://volta.valtrea.com.br')
  await expect(volta.getByRole('button', { name: 'Quero ser avisado' })).toHaveCount(0)
  const pulso = secao.locator('li').filter({ hasText: 'Valtrea Pulso' })
  await expect(pulso.getByRole('link', { name: /Usar o Pulso/ })).toHaveAttribute('href', 'https://pulso.valtrea.com.br')
  const agora = secao.locator('li').filter({ hasText: 'Valtrea Agora' })
  await expect(agora.getByRole('link', { name: /Usar o Agora/ })).toHaveAttribute('href', 'https://agora.valtrea.com.br')
  await expect(secao.getByText(/saldo é fictício/)).toBeVisible()
  // Imagem da seção para conferir o visual (fica nos Artifacts da execução: "previas-do-site")
  await secao.screenshot({ path: `previas/projetos-${testInfo.project.name}.png` })
})

test('quero ser avisado: pede aceite, envia e mostra o próximo passo', async ({ page }, testInfo) => {
  await page.goto(SITE)
  const card = page.locator('#em-desenvolvimento li').filter({ hasText: 'Valtrea Pay' })
  await card.getByRole('button', { name: 'Quero ser avisado' }).click()

  const form = card.getByRole('form', { name: 'Aviso de lançamento do Valtrea Pay' })
  await form.getByLabel('Seu e-mail').fill(`site-${testInfo.project.name}-${Date.now()}@test.dev`)

  const { violations } = await new AxeBuilder({ page })
    .include('#em-desenvolvimento')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])

  // Sem marcar o aceite, o navegador não deixa enviar
  await form.getByRole('button', { name: 'Avisar quando lançar' }).click()
  await expect(form).toBeVisible()

  await form.getByRole('checkbox').check()
  await form.getByRole('button', { name: 'Avisar quando lançar' }).click()
  await expect(card.getByRole('status').filter({ hasText: 'link para confirmar' })).toBeVisible()
})

test('link do e-mail: mostra o botão de confirmar e tira o código do endereço', async ({ page }) => {
  await page.goto(`${SITE}/?lista=confirmar&token=${'a'.repeat(64)}`)
  const aviso = page.getByRole('region', { name: 'Confirmar aviso de lançamento' })
  await expect(aviso).toBeVisible()
  await expect(page).not.toHaveURL(/token=/)

  await aviso.getByRole('button', { name: 'Confirmar inscrição' }).click()
  await expect(aviso.getByText('Link inválido ou vencido.')).toBeVisible()
})
