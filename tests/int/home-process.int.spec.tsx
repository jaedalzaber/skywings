import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { defaultHomeLayout } from '@/data/home'

vi.mock('@/components/home/HomeProcessModel', () => ({
  HomeProcessModel: () => <div data-testid="process-model-canvas" />,
}))

vi.mock('@/components/home/HomeGlobeScene', () => ({
  HomeGlobeScene: () => <div data-testid="globe-scene-fallback" />,
}))

describe('HomeProcessSection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  test('renders once directly after industries with six process cells and a model stage', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)
    const industries = container.querySelector('#industries')
    const process = container.querySelector('#manufacturing-process') as HTMLElement
    const processQueries = within(process)

    expect(industries?.nextElementSibling).toBe(process)
    expect(container.querySelectorAll('#manufacturing-process')).toHaveLength(1)
    expect(processQueries.getByRole('heading', { level: 2, name: 'Our Manufacturing Process' })).toBeTruthy()
    expect(processQueries.getAllByRole('button')).toHaveLength(6)
    expect(processQueries.getByTestId('process-model-stage')).toBeTruthy()
    expect(processQueries.getByTestId('process-model-canvas')).toBeTruthy()
  })

  test('uses viewport width and equally fills a column when its three steps are collapsed', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)
    const rightColumn = container.querySelector('.process-column-right')
    const styles = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')

    expect(styles).toMatch(/\.manufacturing-process\s*\{[^}]*width:\s*100vw;/s)
    expect(rightColumn?.getAttribute('data-has-active-step')).toBe('false')
    expect(rightColumn?.querySelectorAll('[data-fill-column="true"]')).toHaveLength(3)
  })

  test('fades titles between modes and aligns the header grid with the process columns', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)
    const processSection = container.querySelector('#manufacturing-process')
    const styles = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')

    expect(processSection?.querySelectorAll('[data-title-transition="fade"]')).toHaveLength(6)
    expect(processSection?.querySelector('.process-header')?.getAttribute('data-grid-alignment')).toBe(
      'process-columns',
    )
    expect(processSection?.querySelector('.process-mark')?.getAttribute('data-position')).toBe('top-right')
    expect(styles).toMatch(/--process-columns:\s*minmax\([^;]+;/)
    expect(styles).toMatch(/\.process-header\s*\{[^}]*grid-template-columns:\s*var\(--process-columns\);/s)
    expect(styles).toMatch(/\.process-grid\s*\{[^}]*grid-template-columns:\s*var\(--process-columns\);/s)
  })

  test('renders as a full-height normal-flow section without scroll pinning', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)
    const processSection = container.querySelector('#manufacturing-process')
    const styles = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')
    const component = readFileSync(
      resolve(process.cwd(), 'src/components/home/HomeProcessSection.tsx'),
      'utf8',
    )

    expect(processSection?.hasAttribute('data-scroll-scene')).toBe(false)
    expect(component).not.toMatch(/ScrollTrigger/)
    expect(component).not.toMatch(/pin:\s*true/)
    expect(styles).toMatch(/\.manufacturing-process\s*\{[^}]*min-height:\s*100svh;/s)
    expect(styles).toMatch(/padding-top:\s*max\(5\.5rem,\s*calc\(\(100svh - 41\.75rem\) \/ 2\)\);/)
    expect(styles).toMatch(/height:\s*min\(34\.25rem,\s*calc\(100svh - 15rem\)\);/)
  })

  test('advances every four seconds, loops, and resumes after hover', async () => {
    render(<HomeBlockRenderer blocks={defaultHomeLayout} />)
    const steps = screen.getAllByRole('button', { name: /process step/i })

    expect(steps[0]?.getAttribute('aria-expanded')).toBe('true')

    await act(() => vi.advanceTimersByTimeAsync(4000))
    expect(steps[1]?.getAttribute('aria-expanded')).toBe('true')

    fireEvent.mouseEnter(steps[4] as HTMLElement)
    expect(steps[4]?.getAttribute('aria-expanded')).toBe('true')

    await act(() => vi.advanceTimersByTimeAsync(8000))
    expect(steps[4]?.getAttribute('aria-expanded')).toBe('true')

    fireEvent.mouseLeave(steps[4] as HTMLElement)
    await act(() => vi.advanceTimersByTimeAsync(4000))
    expect(steps[5]?.getAttribute('aria-expanded')).toBe('true')

    await act(() => vi.advanceTimersByTimeAsync(4000))
    expect(steps[0]?.getAttribute('aria-expanded')).toBe('true')
  })
})
