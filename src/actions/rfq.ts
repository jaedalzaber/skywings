'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getPayloadClient } from '@/data/payload'

const rfqSchema = z.object({
  buyerName: z.string().min(2),
  company: z.string().optional(),
  email: z.string().email(),
  message: z.string().min(10),
  phone: z.string().optional(),
  productInterest: z.string().optional(),
  quantity: z.string().optional(),
  sourcePage: z.string().optional(),
})

export async function createRFQ(formData: FormData) {
  const parsed = rfqSchema.parse({
    buyerName: formData.get('buyerName'),
    company: formData.get('company') || undefined,
    email: formData.get('email'),
    message: formData.get('message'),
    phone: formData.get('phone') || undefined,
    productInterest: formData.get('productInterest') || undefined,
    quantity: formData.get('quantity') || undefined,
    sourcePage: formData.get('sourcePage') || undefined,
  })

  const payload = await getPayloadClient()

  await payload.create({
    collection: 'rfqs',
    data: {
      ...parsed,
      quoteReference: `RFQ-${Date.now()}`,
      status: 'new',
    },
  })

  redirect('/contact?submitted=1')
}
