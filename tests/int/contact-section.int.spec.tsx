import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

afterEach(cleanup)

vi.mock('@/actions/rfq', () => ({ createRFQ: vi.fn() }))

import { ContactSection } from '@/components/contact/ContactSection'

function renderSection(extra: Partial<Parameters<typeof ContactSection>[0]> = {}) {
  return render(<ContactSection {...extra} />)
}

describe('ContactSection', () => {
  test('renders the Figma heading, introduction, and CEO portrait details', () => {
    const { container } = renderSection()

    expect(screen.getByRole('heading', { level: 1, name: 'Get In Touch' })).toBeTruthy()
    expect(screen.getByText('Send a direct message to our CEO')).toBeTruthy()
    expect(screen.getByText('Mahfuzur Rahman')).toBeTruthy()
    expect(screen.getByText('Ornate Global Fashion')).toBeTruthy()
    const portrait = screen.getByRole('img', {
      name: 'Mahfuzur Rahman speaking at an industry event',
    })
    const mark = container.querySelector<HTMLImageElement>('.contact-person-mark')

    expect(portrait.getAttribute('src')).toContain('mahfuzur-rahman.png')
    expect(mark?.getAttribute('src')).toContain('ornate-mark.svg')
  })

  test('renders the four-field direct message form', () => {
    const { container } = renderSection()

    for (const label of ['Name', 'Email address', 'Phone (optional)', 'Your message']) {
      expect(screen.getByLabelText(label)).toBeTruthy()
    }
    expect(screen.getByRole('button', { name: 'Send message' })).toBeTruthy()
    expect(screen.getByText('Our CEO will reach out to you very soon.')).toBeTruthy()
    expect(container.querySelector('#rfq-form')).toBeTruthy()
  })

  test('carries product context as a hidden field', () => {
    const { container } = renderSection({ productInterest: 'Aircraft Maintenance Platform' })
    const field = container.querySelector<HTMLInputElement>('input[name="productInterest"]')

    expect(field?.type).toBe('hidden')
    expect(field?.value).toBe('Aircraft Maintenance Platform')
  })

  test('renders the submitted confirmation', () => {
    renderSection({ submitted: true })

    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByText('Message received.')).toBeTruthy()
  })
})
