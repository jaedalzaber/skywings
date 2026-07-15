'use server'

import { z } from 'zod'

import { getPayloadClient } from '@/data/payload'

export type NewsletterState = {
  message: string
  status: 'idle' | 'error' | 'success'
}

const newsletterSchema = z.object({
  email: z.string().email(),
  website: z.string().max(0),
})

export async function subscribeToNewsletter(
  _previousState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get('email'),
    website: formData.get('website') || '',
  })

  if (!parsed.success) {
    return { message: 'Please enter a valid email address.', status: 'error' }
  }

  try {
    const payload = await getPayloadClient()

    await payload.create({
      collection: 'form-submissions',
      data: {
        data: { email: parsed.data.email },
        email: parsed.data.email,
        formName: 'Footer newsletter',
        source: 'site-footer',
      },
      overrideAccess: false,
    })

    return { message: 'Thanks — you’re subscribed.', status: 'success' }
  } catch (error) {
    console.error('Unable to save newsletter subscription', error)
    return { message: 'Something went wrong. Please try again.', status: 'error' }
  }
}
