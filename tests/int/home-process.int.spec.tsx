import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { defaultHomeLayout } from '@/data/home'

const homeProcessModelMock = vi.hoisted(() =>
  vi.fn(
    (props: {
      appearance?: {
        fadeEnd?: number | null
        fadeStart?: number | null
        lineOpacity?: number | null
        lineThickness?: number | null
      } | null
      modelScale?: number | null
      modelUrl?: string | null
    }) => (
      <div
        data-fade-end={props.appearance?.fadeEnd ?? ''}
        data-fade-start={props.appearance?.fadeStart ?? ''}
        data-line-opacity={props.appearance?.lineOpacity ?? ''}
        data-line-thickness={props.appearance?.lineThickness ?? ''}
        data-model-scale={props.modelScale ?? ''}
        data-model-url={props.modelUrl ?? ''}
        data-testid="process-model-canvas"
      />
    ),
  ),
)

vi.mock('@/components/home/HomeProcessModel', () => ({
  HomeProcessModel: homeProcessModelMock,
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
    expect(
      processQueries.getByRole('heading', { level: 2, name: 'Our Manufacturing Process' }),
    ).toBeTruthy()
    expect(processQueries.getAllByRole('button')).toHaveLength(6)
    expect(processQueries.getByTestId('process-model-stage')).toBeTruthy()
    expect(processQueries.getByTestId('process-model-canvas')).toBeTruthy()
  })

  test('renders uploaded process model and step infographic media', () => {
    const blocks = defaultHomeLayout.map((block) => {
      if (block.blockType !== 'homeProcess') return block

      return {
        ...block,
        model3D: {
          alt: 'Process model',
          scale: 0.8,
          url: '/api/three-d-assets/file/process.glb',
        },
        modelAppearance: {
          fadeEnd: 14,
          fadeStart: 6,
          lineOpacity: 0.42,
          lineThickness: 0.5,
        },
        steps: block.steps.map((step, index) =>
          index === 0
            ? {
                ...step,
                infographicImage: {
                  alt: 'Brief infographic',
                  url: '/api/media/file/brief-infographic.png',
                },
              }
            : step,
        ),
      }
    })

    const { container } = render(<HomeBlockRenderer blocks={blocks} />)

    expect(container.querySelector('[aria-label="Rotating process 3D model"]')).toBeTruthy()
    expect(screen.getByAltText('Brief infographic').getAttribute('src')).toBe(
      '/api/media/file/brief-infographic.png',
    )
    expect(screen.getByTestId('process-model-canvas').getAttribute('data-model-url')).toBe(
      '/api/three-d-assets/file/process.glb',
    )
    expect(screen.getByTestId('process-model-canvas').getAttribute('data-model-scale')).toBe('0.8')
    expect(screen.getByTestId('process-model-canvas').getAttribute('data-line-opacity')).toBe(
      '0.42',
    )
    expect(screen.getByTestId('process-model-canvas').getAttribute('data-line-thickness')).toBe(
      '0.5',
    )
    expect(screen.getByTestId('process-model-canvas').getAttribute('data-fade-start')).toBe('6')
    expect(screen.getByTestId('process-model-canvas').getAttribute('data-fade-end')).toBe('14')
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
    expect(
      processSection?.querySelector('.process-header')?.getAttribute('data-grid-alignment'),
    ).toBe('process-columns')
    expect(processSection?.querySelector('.process-mark')?.getAttribute('data-position')).toBe(
      'top-right',
    )
    expect(styles).toMatch(
      /--process-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\) minmax\(0,\s*2fr\);/,
    )
    expect(styles).toMatch(
      /\.process-header\s*\{[^}]*grid-template-columns:\s*var\(--process-columns\);/s,
    )
    expect(styles).toMatch(
      /\.process-grid\s*\{[^}]*grid-template-columns:\s*var\(--process-columns\);/s,
    )
    expect(styles).toMatch(
      /\.process-grid\s*\{[^}]*border-bottom:\s*1px solid var\(--process-line\);/s,
    )
    expect(styles).toMatch(/\.process-column-right\s*\{[^}]*grid-column:\s*2;/s)
    expect(styles).toMatch(/\.process-model-stage\s*\{[^}]*grid-column:\s*3;[^}]*grid-row:\s*1;/s)
    expect(styles).toMatch(
      /\.process-column-left,\s*\.process-column-right\s*\{[^}]*border-right:\s*1px solid var\(--process-line\);/s,
    )
    expect(styles).not.toMatch(
      /\.process-model-stage\s*\{[^}]*border-bottom:\s*1px solid var\(--process-line\);/s,
    )
  })

  test('renders uploaded infographic visuals without the placeholder grid treatment', () => {
    const styles = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')
    const responsiveStyles = readFileSync(
      resolve(process.cwd(), 'src/app/(frontend)/home-responsive.css'),
      'utf8',
    )

    expect(styles).toMatch(
      /\.process-step-visual:has\(\.process-step-infographic\)\s*\{[^}]*background:\s*none;/s,
    )
    expect(styles).toMatch(
      /\.process-step-visual:has\(\.process-step-infographic\)\s*\{[^}]*flex:\s*0 0 auto;/s,
    )
    expect(responsiveStyles).toMatch(
      /@media \(min-width: 48rem\) and \(max-width: 89\.999rem\)[^]*?\.process-step-visual:has\(\.process-step-infographic\)\s*\{[^}]*width:\s*min\(100%,\s*5\.5rem\);/s,
    )
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
    expect(styles).toMatch(
      /--process-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\) minmax\(0,\s*2fr\);/,
    )
    expect(styles).toMatch(/padding-top:\s*max\(5\.5rem,\s*calc\(\(100svh - 41\.75rem\) \/ 2\)\);/)
    expect(styles).toMatch(/height:\s*min\(34\.25rem,\s*calc\(100svh - 15rem\)\);/)
  })

  test('keeps the uploaded process model as a subtle fogged wireframe', () => {
    const component = readFileSync(
      resolve(process.cwd(), 'src/components/home/HomeProcessModel.tsx'),
      'utf8',
    )

    expect(component).toContain('fadeEnd: 12')
    expect(component).toContain('fadeStart: 5.5')
    expect(component).toContain('lineOpacity: 0.3')
    expect(component).toContain('lineThickness: 0.65')
    expect(component).toContain(
      '<fog attach="fog" args={[\'#2948df\', appearance.fadeStart, appearance.fadeEnd]} />',
    )
    expect(component).toMatch(/opacity:\s*appearance\.lineOpacity/)
    expect(component).toMatch(/opacity:\s*solidOpacity/)
    expect(component).toMatch(/mesh\.renderOrder = 3/)
  })

  test('exposes backend controls for process model lines and fade', () => {
    const block = readFileSync(resolve(process.cwd(), 'src/blocks/HomeProcessBlock.ts'), 'utf8')
    const migration = readFileSync(
      resolve(process.cwd(), 'src/migrations/20260723_124000_home_process_appearance_controls.ts'),
      'utf8',
    )

    expect(block).toContain("name: 'modelAppearance'")
    expect(block).toContain("name: 'lineOpacity'")
    expect(block).toContain("name: 'lineThickness'")
    expect(block).toContain("name: 'fadeStart'")
    expect(block).toContain("name: 'fadeEnd'")
    expect(migration).toContain('model_appearance_line_opacity')
    expect(migration).toContain('model_appearance_line_thickness')
    expect(migration).toContain('model_appearance_fade_start')
    expect(migration).toContain('model_appearance_fade_end')
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
