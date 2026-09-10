'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getPayloadClient } from '@/data/payload'

const rfqSchema = z.object({
  buyerName: z.string().trim().min(2),
  company: z.string().optional(),
  email: z.string().email(),
  message: z.string().trim().min(10),
  phone: z.string().optional(),
  productInterest: z.string().optional(),
  quantity: z.string().optional(),
  sourcePage: z.string().optional(),
})

/*
 * Back to the page the form was sent from, with the outcome in the query. Only
 * a same-site path is honoured -- the field is posted by the browser, so it is
 * whatever the sender says it is.
 */
function backTo(sourcePage: FormDataEntryValue | null, outcome: 'error' | 'submitted') {
  const path =
    typeof sourcePage === 'string' && sourcePage.startsWith('/') && !sourcePage.startsWith('//')
      ? sourcePage
      : '/contact'

  return `${path}?${outcome}=1#rfq-form`
}

export async function createRFQ(formData: FormData) {
  // A field no person sees or fills: anything in it is a bot. It is told the
  // message went, so it has no reason to try again, and nothing is stored.
  if (formData.get('website')) {
    redirect(backTo(formData.get('sourcePage'), 'submitted'))
  }

  /*
   * The browser checks the same rules before sending, so this only fails for a
   * request that skipped them. It returns to the form with a message rather
   * than throwing, which would have shown the site's error page.
   */
  const parsed = rfqSchema.safeParse({
    buyerName: formData.get('buyerName'),
    company: formData.get('company') || undefined,
    email: formData.get('email'),
    message: formData.get('message'),
    phone: formData.get('phone') || undefined,
    productInterest: formData.get('productInterest') || undefined,
    quantity: formData.get('quantity') || undefined,
    sourcePage: formData.get('sourcePage') || undefined,
  })

  if (!parsed.success) {
    redirect(backTo(formData.get('sourcePage'), 'error'))
  }

  const payload = await getPayloadClient()

  await payload.create({
    collection: 'rfqs',
    data: {
      ...parsed.data,
      quoteReference: `RFQ-${Date.now()}`,
      status: 'new',
    },
  })

  redirect(backTo(parsed.data.sourcePage ?? null, 'submitted'))
}
