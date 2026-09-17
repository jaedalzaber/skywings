import { chromium } from '@playwright/test'
import { copyFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const BASE = 'http://localhost:3000'
const mode = process.argv[2] ?? 'create'
const logs = []
const log = (line) => {
  logs.push(line)
  console.log(line)
}

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage()

page.on('console', (message) => {
  if (['error', 'warning'].includes(message.type())) log(`[console.${message.type()}] ${message.text().slice(0, 400)}`)
})
page.on('pageerror', (error) => log(`[pageerror] ${error.message.slice(0, 400)}`))
page.on('response', (response) => {
  const url = response.url()
  if (response.status() >= 400 && !url.includes('favicon')) log(`[http ${response.status()}] ${response.request().method()} ${url.slice(0, 160)}`)
  if (/\/api\/media(\?|$)/.test(url) && response.request().method() === 'POST') log(`[upload response] ${response.status()} ${url.slice(0, 120)}`)
})
page.on('requestfailed', (request) => log(`[requestfailed] ${request.method()} ${request.url().slice(0, 160)} ${request.failure()?.errorText}`))

await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 180000 })
await page.fill('input[name="email"]', 'upload-probe@example.invalid')
await page.fill('input[name="password"]', 'Probe-Only-9d2f41')
await Promise.all([page.waitForURL((u) => !u.pathname.endsWith('/login'), { timeout: 180000 }), page.click('button[type="submit"]')])
log(`logged in -> ${page.url()}`)

const file = path.join(os.tmpdir(), `admin-probe-${Date.now()}.png`)
copyFileSync('public/media/folding_stand_7-3.png', file)

if (mode === 'create') {
  await page.goto(`${BASE}/admin/collections/media/create`, { waitUntil: 'domcontentloaded', timeout: 180000 })
  await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 120000 })
  await page.setInputFiles('input[type="file"]', file)
  await page.fill('input[name="alt"]', 'admin probe')
  await page.waitForTimeout(1500)
  await page.click('#action-save')
  await page.waitForTimeout(8000)
  log(`after save -> ${page.url()}`)
  const toast = await page.locator('.toast-error, .payload-toast-container [data-type="error"]').allInnerTexts().catch(() => [])
  if (toast.length) log(`[toast] ${toast.join(' | ')}`)
}

if (mode === 'drawer') {
  // A throwaway newsletter email (status Draft, so nothing is ever sent).
  await page.goto(`${BASE}/admin/collections/newsletter-campaigns/create`, { waitUntil: 'domcontentloaded', timeout: 180000 })
  await page.waitForSelector('input[name="subject"]', { timeout: 120000 })
  await page.fill('input[name="subject"]', 'Upload drawer probe')
  await page.fill('textarea[name="body"]', 'Probe body')
  await page.screenshot({ path: 'scripts/tmp/drawer-0-form.png' })

  // The image field's "Create New" button opens the upload drawer.
  const imageField = page.locator('.field-type.upload').first()
  const createNew = imageField.getByRole('button', { name: /create new/i })
  log(`create-new buttons in image field: ${await createNew.count()}`)
  await createNew.first().click()
  await page.waitForSelector('input[name="alt"]', { timeout: 60000 })
  await page.setInputFiles('input.file-field__hidden-input', file)
  await page.waitForTimeout(2500)
  await page.fill('input[name="alt"]', 'drawer probe')
  await page.screenshot({ path: 'scripts/tmp/drawer-1-filled.png' })
  const saveButtons = page.getByRole('button', { name: /^save$/i })
  log(`save buttons: ${await saveButtons.count()}`)
  await saveButtons.last().click()
  await page.waitForTimeout(10000)
  await page.screenshot({ path: 'scripts/tmp/drawer-2-after-drawer-save.png' })

  // Then save the parent document, the step that reportedly fails.
  await page.locator('#action-save').click()
  await page.waitForTimeout(10000)
  log(`after parent save -> ${page.url()}`)
  await page.screenshot({ path: 'scripts/tmp/drawer-3-after-parent-save.png' })
}

await page.screenshot({ path: `scripts/tmp/admin-${mode}.png`, fullPage: false })
await browser.close()
log('done')
