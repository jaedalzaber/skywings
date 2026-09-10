import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

const cssDir = resolve(process.cwd(), 'src/app/(frontend)')
const sheets = readdirSync(cssDir)
  .filter((file) => file.endsWith('.css'))
  .map((file) => ({ file, css: readFileSync(join(cssDir, file), 'utf8') }))
const styles = readFileSync(join(cssDir, 'styles.css'), 'utf8')

/* Everything outside the Firefox-only @supports block. CRLF on a Windows checkout. */
const withoutFirefoxFallback = (css: string) =>
  css.replace(/@supports not selector\(::-webkit-scrollbar\) \{[\s\S]*?\r?\n\}\r?\n/, '')

describe('scrollbars', () => {
  test('draws one slim, arrowless scrollbar for every scroll area', () => {
    expect(styles).toMatch(/\n::-webkit-scrollbar \{\s*width: 0\.625rem;/)
    expect(styles).toMatch(/\n::-webkit-scrollbar-thumb \{[^}]*border-radius: 999px;[^}]*background-clip: padding-box;/s)
    expect(styles).toMatch(/--scrollbar-thumb: rgba\(/)
  })

  /*
   * Chrome 121+ lets the standard properties override ::-webkit-scrollbar, so
   * a single `scrollbar-width: thin` or `scrollbar-color` anywhere brings back
   * the stock bar with its arrow buttons -- which is how the catalogue sidebar
   * and the mega menu ended up with it. `scrollbar-width: none` still hides a
   * bar outright, so that one is allowed.
   */
  test('keeps the standard scrollbar properties to browsers without the pseudo-elements', () => {
    for (const { file, css } of sheets) {
      const rest = file === 'styles.css' ? withoutFirefoxFallback(css) : css
      expect(rest, file).not.toMatch(/scrollbar-color:/)
      expect(rest, file).not.toMatch(/scrollbar-width:\s*(thin|auto)/)
    }
    expect(styles).toMatch(/@supports not selector\(::-webkit-scrollbar\) \{[^@]*scrollbar-width: thin;/s)
  })

  /*
   * The native page bar stands in a gutter of one color -- a light strip beside
   * every dark section. It is hidden, from body as well as html (body's
   * overflow is what reaches the viewport), and PageScrollbar floats a thumb
   * on no track over the page instead.
   */
  test('hides the native page bar for the floating one', () => {
    expect(styles).toMatch(/html,\s*body \{\s*scrollbar-width: none;/)
    expect(styles).toMatch(/html::-webkit-scrollbar,\s*body::-webkit-scrollbar \{\s*width: 0;/)
    expect(styles).not.toMatch(/--page-scrollbar-track/)
    expect(styles).toMatch(/\.page-scrollbar \{[^}]*position: fixed;/s)
    // No track: nothing behind the thumb but the page.
    expect(styles).not.toMatch(/\.page-scrollbar \{[^}]*background/s)
    expect(styles).toMatch(/\.page-scrollbar\[data-surface='dark'\] \{\s*--page-thumb: rgba\(255, 255, 255/)
  })
})
