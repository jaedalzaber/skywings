import { chromium } from '@playwright/test'

const BASE = 'http://localhost:3000'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { height: 900, width: 1400 } })
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && console.log(`[console.${m.type()}] ${m.text().slice(0, 300)}`))
page.on('pageerror', (e) => console.log(`[pageerror] ${e.message.slice(0, 300)}`))

await page.goto(`${BASE}/admin/login`, { timeout: 180000, waitUntil: 'domcontentloaded' })
await page.fill('input[name="email"]', 'upload-probe@example.invalid')
await page.fill('input[name="password"]', 'Probe-Only-9d2f41')
await Promise.all([page.waitForURL((u) => !u.pathname.endsWith('/login'), { timeout: 180000 }), page.click('button[type="submit"]')])

await page.goto(`${BASE}/admin/collections/newsletter-campaigns/create`, { timeout: 180000, waitUntil: 'domcontentloaded' })
await page.waitForSelector('input[name="subject"]', { timeout: 120000 })
await page.locator('.field-type.upload').first().getByRole('button', { name: /create new/i }).click()
await page.waitForTimeout(3000)
await page.screenshot({ path: 'scripts/tmp/peek.png' })
const inputs = await page.locator('input[type="file"]').evaluateAll((els) => els.map((el) => `${el.className}|${el.closest('[class]')?.className}`))
console.log('file inputs:', JSON.stringify(inputs))
await browser.close()
