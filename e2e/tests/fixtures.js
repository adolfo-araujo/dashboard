import { test as base, expect } from '@playwright/test'

// Todos os testes falham se o navegador bloquear algo pela CSP (Content-Security-Policy)
// ou se a página tiver um erro de JavaScript.
export const test = base.extend({
  page: async ({ page }, use) => {
    const problems = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /Content Security Policy|Refused to/i.test(msg.text())) {
        problems.push(`CSP: ${msg.text()}`)
      }
    })
    page.on('pageerror', (error) => problems.push(`Erro na página: ${error.message}`))
    await use(page)
    expect(problems, problems.join('\n')).toEqual([])
  },
})

export { expect }
