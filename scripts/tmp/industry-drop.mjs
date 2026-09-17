import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const PAGE_ID = process.argv[2] ?? '4'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { height: 1000, width: 1400 } })
const log = (line) => console.log(line)

page.on('console', (m) => ['error', 'warning'].includes(m.type()) && log(`[console.${m.type()}] ${m.text().slice(0, 700)}`))
page.on('pageerror', (e) => log(`[pageerror] ${e.message.slice(0, 700)}`))
page.on('response', async (r) => {
  const method = r.request().method()
  if (r.status() >= 400) log(`[http ${r.status()}] ${method} ${r.url().slice(0, 160)} ${(await r.text().catch(() => '')).slice(0, 300)}`)
  else if (method === 'POST' && /\/api\/media|\/admin\/collections/.test(r.url())) log(`[post ${r.status()}] ${r.url().slice(0, 120)}`)
})
page.on('requestfailed', (r) => log(`[requestfailed] ${r.method()} ${r.url().slice(0, 160)} ${r.failure()?.errorText}`))

await page.goto(`${BASE}/admin/login`, { timeout: 180000, waitUntil: 'domcontentloaded' })
await page.fill('input[name="email"]', 'upload-probe@example.invalid')
await page.fill('input[name="password"]', 'Probe-Only-9d2f41')
await Promise.all([page.waitForURL((u) => !u.pathname.endsWith('/login'), { timeout: 180000 }), page.click('button[type="submit"]')])

await page.goto(`${BASE}/admin/collections/industry-pages/${PAGE_ID}`, { timeout: 240000, waitUntil: 'domcontentloaded' })
await page.waitForSelector('.field-type.upload', { timeout: 180000 })
await page.waitForTimeout(4000)

// An empty image field: the brochure cover.
const field = page.locator('.field-type.upload').filter({ has: page.getByRole('button', { name: /create new/i }) }).first()
await field.scrollIntoViewIfNeeded()
const dropzone = field.locator('.dropzone').first()
log(`dropzones in field: ${await field.locator('.dropzone').count()}`)

// Drop a clipboard-style file named image.png, as a paste or screenshot drag would.
const bytes = [...readFileSync('public/media/s4.png')]
await dropzone.evaluate((el, data) => {
  const file = new File([new Uint8Array(data)], 'image.png', { type: 'image/png' })
  const transfer = new DataTransfer()
  transfer.items.add(file)
  for (const type of ['dragenter', 'dragover', 'drop']) {
    el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer }))
  }
}, bytes)
await page.waitForTimeout(5000)
await page.screenshot({ path: 'scripts/tmp/drop-1-drawer.png' })

const alt = page.locator('input[name="alt"]')
log(`alt inputs: ${await alt.count()}`)
if (await alt.count()) await alt.last().fill('drop probe')
const buttons = await page.getByRole('button').allInnerTexts()
log(`buttons now: ${buttons.filter((b) => /save|upload/i.test(b)).join(' | ')}`)
const save = page.getByRole('button', { name: /^save( all)?$/i })
if (await save.count()) {
  await save.last().click()
  await page.waitForTimeout(15000)
}
await page.screenshot({ path: 'scripts/tmp/drop-2-after-save.png' })
log(`url after: ${page.url()}`)
await browser.close()
log('done (page itself not saved)')
