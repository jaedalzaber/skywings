import { chromium } from '@playwright/test'
import { copyFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const BASE = 'http://localhost:3000'
const PAGE_ID = process.argv[2] ?? '4'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { height: 1000, width: 1400 } })
const log = (line) => console.log(line)

page.on('console', (m) => ['error', 'warning'].includes(m.type()) && log(`[console.${m.type()}] ${m.text().slice(0, 500)}`))
page.on('pageerror', (e) => log(`[pageerror] ${e.message.slice(0, 500)}`))
page.on('response', (r) => {
  if (r.status() >= 400) log(`[http ${r.status()}] ${r.request().method()} ${r.url().slice(0, 160)}`)
  if (r.request().method() === 'POST' && /\/admin|\/api\//.test(r.url())) log(`[post ${r.status()}] ${r.url().slice(0, 140)} (${r.request().postData()?.length ?? 0} bytes sent)`)
})
page.on('requestfailed', (r) => log(`[requestfailed] ${r.method()} ${r.url().slice(0, 160)} ${r.failure()?.errorText}`))

await page.goto(`${BASE}/admin/login`, { timeout: 180000, waitUntil: 'domcontentloaded' })
await page.fill('input[name="email"]', 'upload-probe@example.invalid')
await page.fill('input[name="password"]', 'Probe-Only-9d2f41')
await Promise.all([page.waitForURL((u) => !u.pathname.endsWith('/login'), { timeout: 180000 }), page.click('button[type="submit"]')])

await page.goto(`${BASE}/admin/collections/industry-pages/${PAGE_ID}`, { timeout: 240000, waitUntil: 'domcontentloaded' })
await page.waitForSelector('.blocks-field, .field-type.blocks', { timeout: 180000 })
await page.waitForTimeout(3000)

// Every upload field on the page, with its label, whether empty ("Create New" visible).
const uploads = page.locator('.field-type.upload')
const count = await uploads.count()
log(`upload fields on page: ${count}`)
let target = -1
for (let i = 0; i < count; i++) {
  const field = uploads.nth(i)
  const label = (await field.locator('label').first().innerText().catch(() => '')).trim()
  const hasCreate = await field.getByRole('button', { name: /create new/i }).count()
  const visible = await field.isVisible()
  log(`  #${i} ${label || '(no label)'} | empty=${hasCreate > 0} | visible=${visible}`)
  if (target === -1 && hasCreate > 0 && visible) target = i
}

if (target === -1) {
  log('no visible empty upload field; expanding all blocks')
  for (const toggle of await page.locator('button.collapsible__toggle, .collapsible__toggle').all()) {
    await toggle.click().catch(() => {})
  }
  await page.waitForTimeout(2000)
  for (let i = 0; i < count; i++) {
    const field = uploads.nth(i)
    if ((await field.getByRole('button', { name: /create new/i }).count()) > 0 && (await field.isVisible())) {
      target = i
      break
    }
  }
}
log(`using upload field #${target}`)

const file = path.join(os.tmpdir(), `admin-probe-${Date.now()}.png`)
copyFileSync('public/media/folding_stand_7-3.png', file)

const field = uploads.nth(target)
await field.scrollIntoViewIfNeeded()
await field.getByRole('button', { name: /create new/i }).click()
await page.waitForSelector('input.file-field__hidden-input', { state: 'attached', timeout: 60000 })
await page.setInputFiles('input.file-field__hidden-input', file)
await page.waitForTimeout(2500)
await page.locator('input[name="alt"]').last().fill('industry drawer probe')
await page.screenshot({ path: 'scripts/tmp/ind-1-drawer.png' })
log('clicking drawer save')
await page.getByRole('button', { name: /^save$/i }).last().click()
await page.waitForTimeout(15000)
await page.screenshot({ path: 'scripts/tmp/ind-2-after-drawer.png' })
log(`after drawer save url: ${page.url()}`)

// Deliberately no Save or Publish on the page itself: nothing on the live page changes.
await browser.close()
log('done (page not saved)')
