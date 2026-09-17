import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'
import { NEWSLETTER_TOPICS, newToken } from '../lib/newsletter/config'

/**
 * The newsletter list. Everyone who subscribes from the site lands here,
 * first as Pending until they click the link in the confirmation email, then
 * as Active. Only Active subscribers are ever emailed, and only about the
 * topics they have ticked.
 *
 * Nothing here is public: the site writes through server actions, and a
 * subscriber manages their own entry through the private link in every email.
 */
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: {
    singular: 'Subscriber',
    plural: 'Subscribers',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['email', 'status', 'topics', 'confirmedAt', 'createdAt'],
    description:
      'Newsletter list. Pending means the confirmation link has not been clicked yet; only Active subscribers receive emails.',
    group: 'Newsletter',
    listSearchableFields: ['email'],
    useAsTitle: 'email',
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (!data) return data
        // One spelling per address, so the unique index catches duplicates.
        if (typeof data.email === 'string') data.email = data.email.trim().toLowerCase()
        // Someone added by hand in the admin still gets a working private link.
        if (operation === 'create' && !data.token) data.token = newToken()
        return data
      },
    ],
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending confirmation', value: 'pending' },
        { label: 'Active', value: 'active' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'topics',
      type: 'select',
      hasMany: true,
      defaultValue: NEWSLETTER_TOPICS.map((topic) => topic.value),
      options: NEWSLETTER_TOPICS.map(({ label, value }) => ({ label, value })),
      admin: {
        description: 'What this subscriber wants to hear about.',
      },
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        description: 'Where they subscribed, e.g. site-footer.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'confirmedAt',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'unsubscribedAt',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'confirmationSentAt',
      type: 'date',
      admin: { hidden: true },
    },
    {
      /*
       * The private key in every link emailed to this subscriber. Hidden
       * from the admin and never sent to the browser as data: whoever holds
       * it can change this subscription.
       */
      name: 'token',
      type: 'text',
      index: true,
      required: true,
      unique: true,
      admin: { hidden: true },
      access: {
        read: () => false,
        update: () => false,
      },
    },
  ],
}
