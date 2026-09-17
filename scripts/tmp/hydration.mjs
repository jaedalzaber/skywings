import { chromium } from '@playwright/test'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { height: 1000, width: 1400 } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)))
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 300)}`))
await page.goto('http://localhost:3000/industries/construction-and-infrastructure', { timeout: 240000, waitUntil: 'load' })
await page.waitForTimeout(4000)
const heading = await page.locator('.industry-value-heading').innerText().catch(() => '(none)')
console.log(`value heading text: ${JSON.stringify(heading)}`)
console.log(errors.length ? `errors:\n${errors.join('\n')}` : 'no console errors')
await browser.close()
