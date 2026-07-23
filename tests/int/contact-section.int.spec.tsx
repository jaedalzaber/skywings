import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

afterEach(cleanup)

// The RFQ form imports the server action; mock it so the test never touches
// Payload. The form markup itself renders for real.
vi.mock('@/actions/rfq', () => ({ createRFQ: vi.fn() }))

import { ContactSection } from '@/components/contact/ContactSection'
import { defaultFooterData } from '@/data/site'

const copy = {
  description:
    'Supported by modern machinery and experienced technicians, we deliver customized fabrication solutions.',
  eyebrow: 'Contact Us',
  heading: 'Feel Free To Get In Touch With Us.',
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

function renderSection(extra: Partial<Parameters<typeof ContactSection>[0]> = {}) {
  return render(<ContactSection {...copy} footer={defaultFooterData} {...extra} />)
}

describe('ContactSection', () => {
  test('renders the eyebrow and the page h1 heading', () => {
    renderSection()

    expect(screen.getByText(copy.eyebrow)).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: copy.heading })).toBeTruthy()
    expect(screen.getByText(copy.description)).toBeTruthy()
  })

  test('renders real email and phone links from the footer data', () => {
    const { container } = renderSection()
    const mailto = `mailto:${defaultFooterData.emailAddress}`

    expect(container.querySelector(`a[href="${mailto}"]`)).toBeTruthy()
    for (const phone of defaultFooterData.phoneNumbers) {
      expect(container.querySelector(`a[href="${telHref(phone)}"]`)).toBeTruthy()
    }
  })

  test('renders the full RFQ form with the #rfq-form anchor', () => {
    const { container } = renderSection()

    for (const label of [
      'Name',
      'Company',
      'Email',
      'Phone',
      'Product or requirement',
      'Quantity',
      'Message',
    ]) {
      expect(screen.getByLabelText(label)).toBeTruthy()
    }
    expect(screen.getByRole('button', { name: 'Submit RFQ' })).toBeTruthy()
    expect(container.querySelector('#rfq-form')).toBeTruthy()
  })

  test('prefills the product field from productInterest', () => {
    renderSection({ productInterest: 'Aircraft Maintenance Platform' })

    const field = screen.getByLabelText('Product or requirement') as HTMLInputElement
    expect(field.value).toBe('Aircraft Maintenance Platform')
  })

  test('renders a branch card per footer address with title, address, and phone', () => {
    const { container } = renderSection()
    const [first, second] = defaultFooterData.addresses

    expect(screen.getByRole('heading', { level: 3, name: 'Sharjah Branch' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 3, name: 'Thoban Branch' })).toBeTruthy()
    expect(screen.getByText(first.address)).toBeTruthy()
    expect(screen.getByText(second.address)).toBeTruthy()
    for (const branch of [first, second]) {
      if (branch.phone) {
        expect(container.querySelector(`a[href="${telHref(branch.phone)}"]`)).toBeTruthy()
      }
    }
  })
})
