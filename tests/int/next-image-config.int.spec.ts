import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

describe('Next image configuration', () => {
  test('allows optimized Payload media and bundled public images', () => {
    const config = readFileSync(resolve(process.cwd(), 'next.config.ts'), 'utf8')

    expect(config).toMatch(/pathname:\s*['"]\/api\/media\/file\/\*\*['"]/)
    expect(config).toMatch(/pathname:\s*['"]\/images\/\*\*['"]/)
  })
})
