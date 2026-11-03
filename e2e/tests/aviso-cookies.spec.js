import { test, expect } from './fixtures.js'
import AxeBuilder from '@axe-core/playwright'

const SITE = process.env.SITE_URL || 'http://localhost:5174'

// Visitante novo: sem nada guardado no navegador
test.use({ storageState: { cookies: [], origins: [] } })

test('aviso de cookies no app: aparece, é acessível, leva à política e some depois de "Entendi"', async ({ page }) => {
  await page.goto('/')
  const aviso = page.getByRole('region', { name: 'Aviso de cookies' })
  await expect(aviso).toBeVisible()

  const { violations } = await new AxeBuilder({ page }).include('section[aria-label="Aviso de cookies"]').analyze()
  expect(violations.map((v) => v.id)).toEqual([])

  await aviso.getByRole('link', { name: 'Saiba mais' }).click()
  await expect(page).toHaveURL(/\/privacidade#cookies$/)
  await expect(page.locator('#cookies')).toBeInViewport()

  await page.getByRole('button', { name: 'Entendi' }).click()
  await expect(aviso).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('region', { name: 'Aviso de cookies' })).toHaveCount(0)
})

test('aviso de cookies no site da Valtrea', async ({ page }) => {
  await page.goto(SITE)
  const aviso = page.getByRole('region', { name: 'Aviso de cookies' })
  await expect(aviso).toBeVisible()
  await page.getByRole('button', { name: 'Entendi' }).click()
  await expect(aviso).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('region', { name: 'Aviso de cookies' })).toHaveCount(0)
})
