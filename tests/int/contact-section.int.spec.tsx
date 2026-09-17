import { cleanup, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'

afterEach(cleanup)

vi.mock('@/actions/rfq', () => ({ submitRFQ: vi.fn() }))

import { ContactSection } from '@/components/contact/ContactSection'
import { HomeLocationsSection } from '@/components/home/HomeLocationsSection'

const block = {
  contactEmail: 'info@skywings.ae',
  contactPhone: '+971 50 538 9979',
  description: 'Share drawings, sizes or just the idea.',
  eyebrow: 'Request a quote',
  heading: 'Tell us what you need to manufacture.',
}
const footer = { emailAddress: 'footer@skywings.ae', phoneNumbers: ['06 883 8036'] }
const pageSource = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/contact/page.tsx'), 'utf8')
const styles = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')

function renderSection(extra: Partial<Parameters<typeof ContactSection>[0]> = {}) {
  return render(<ContactSection block={block} footer={footer} {...extra} />)
}

describe('ContactSection', () => {
  test('sets the page title, the brief from the admin, and the direct lines', () => {
    renderSection()

    expect(screen.getByRole('heading', { level: 1, name: 'Contact' })).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Tell us what you need to manufacture.' }),
    ).toBeTruthy()
    expect(document.querySelector('.contact-eyebrow')?.textContent).toBe('Request a quote')
    for (const link of screen.getAllByRole('link', { name: 'info@skywings.ae' })) {
      expect(link.getAttribute('href')).toBe('mailto:info@skywings.ae')
    }
    expect(screen.getByRole('link', { name: '+971 50 538 9979' }).getAttribute('href')).toBe(
      'tel:+971505389979',
    )
  })

  test('falls back to the footer’s email and first phone', () => {
    renderSection({ block: { heading: 'Tell us' } })

    expect(screen.getAllByRole('link', { name: 'footer@skywings.ae' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: '06 883 8036' })).toBeTruthy()
  })

  test('asks for the project, then the sender, and posts as an RFQ', () => {
    const { container } = renderSection()
    const form = container.querySelector('#rfq-form form') as HTMLFormElement

    expect(within(form).getByRole('group', { name: 'Your project' })).toBeTruthy()
    expect(within(form).getByRole('group', { name: 'Your details' })).toBeTruthy()
    for (const [label, name] of [
      [/What do you need made\?/, 'message'],
      [/Name/, 'buyerName'],
      [/Company/, 'company'],
      [/Email/, 'email'],
    ] as const) {
      expect(within(form).getByLabelText(label).getAttribute('name')).toBe(name)
    }
    // Required fields carry the mark before the word.
    for (const label of ['What do you need made?', 'Name', 'Email']) {
      const span = [...form.querySelectorAll('.rfq-field > span')].find((el) =>
        el.textContent?.includes(label),
      )
      expect(span?.textContent?.trim()).toBe(`* ${label}`)
    }
    // The phone number is typed with a country picker and posts as one field.
    const phone = within(form).getByLabelText('Phone')
    expect(phone.getAttribute('type')).toBe('tel')
    expect(
      form.querySelector('.rfq-phone .react-international-phone-country-selector-button'),
    ).not.toBeNull()
    expect(form.querySelector<HTMLInputElement>('input[type="hidden"][name="phone"]')?.value).toBe('')
    expect(form.querySelector('input[type="hidden"][name="startedAt"]')).not.toBeNull()
    for (const name of ['message', 'buyerName', 'email']) {
      expect(form.querySelector(`[name="${name}"]`)?.hasAttribute('required')).toBe(true)
    }
    expect(within(form).getByRole('button', { name: 'Request a quote' })).toBeTruthy()
    expect(form.querySelector<HTMLInputElement>('[name="sourcePage"]')?.value).toBe('/contact')
    // The bot trap is out of the accessibility tree and the tab order.
    const trap = form.querySelector('input[name="website"]')
    expect(trap?.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(trap?.getAttribute('tabindex')).toBe('-1')
  })

  test('names a linked product and carries it as a hidden field', () => {
    const { container } = renderSection({ productInterest: 'Folding Stand' })
    const field = container.querySelector<HTMLInputElement>('input[name="productInterest"]')

    expect(field?.type).toBe('hidden')
    expect(field?.value).toBe('Folding Stand')
    expect(screen.getByText('Enquiring about')).toBeTruthy()
  })

  test('confirms a sent message, and says when one was refused', () => {
    renderSection({ submitted: true })
    expect(screen.getByRole('status').textContent).toContain('your enquiry is with our team')
    cleanup()

    renderSection({ error: true })
    expect(screen.getByRole('alert').textContent).toContain('was not sent')
  })

  test('is followed by the branches, dark, through to a dark footer', () => {
    const { container } = render(<HomeLocationsSection tone="dark" />)
    const section = container.querySelector('.locations')

    expect(section?.getAttribute('data-tone')).toBe('dark')
    expect(section?.getAttribute('data-nav-surface')).toBe('dark')

    expect(pageSource).toMatch(/data-page-tone="dark"/)
    expect(pageSource).toMatch(/<HomeLocationsSection[^>]*tone="dark"/)
    expect(pageSource).toMatch(/<DarkFooterSurface \/>/)
    expect(styles).toMatch(/body:has\(\[data-page-tone='dark'\]\) footer\.site-footer \{[^}]*background: #161616;/)
  })
})
