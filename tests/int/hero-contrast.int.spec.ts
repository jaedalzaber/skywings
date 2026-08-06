import { describe, expect, test } from 'vitest'

import {
  averageColors,
  relativeLuminance,
  textToneForBackground,
} from '@/components/home/HeroContrastController'

describe('hero contrast', () => {
  test('uses light text over dark media', () => {
    expect(textToneForBackground({ red: 16, green: 24, blue: 32 })).toBe('light')
  })

  test('uses dark text over light media', () => {
    expect(textToneForBackground({ red: 238, green: 240, blue: 242 })).toBe('dark')
  })

  test('combines the title and description backgrounds into one shared sample', () => {
    expect(
      averageColors([
        { red: 20, green: 40, blue: 60 },
        { red: 220, green: 200, blue: 180 },
      ]),
    ).toEqual({ red: 120, green: 120, blue: 120 })
  })

  test('calculates WCAG relative luminance endpoints', () => {
    expect(relativeLuminance({ red: 0, green: 0, blue: 0 })).toBe(0)
    expect(relativeLuminance({ red: 255, green: 255, blue: 255 })).toBe(1)
  })
})
