import type { GlobalConfig } from 'payload'

import { DEFAULT_DAILY_LIMIT } from '../lib/newsletter/config'

/**
 * Switches for the newsletter: whether publishing an article or a product
 * emails subscribers on its own, and how many newsletter emails may go out
 * in a day. Gmail stops accepting mail from an account at about 500 a day,
 * and the enquiry form's emails count towards that too.
 */
export const NewsletterSettings: GlobalConfig = {
  slug: 'newsletter-settings',
  label: 'Newsletter Settings',
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  admin: {
    group: 'Newsletter',
  },
  fields: [
    {
      name: 'autoNotifyArticles',
      type: 'checkbox',
      defaultValue: true,
      label: 'Email subscribers when a new article is published',
    },
    {
      name: 'autoNotifyProducts',
      type: 'checkbox',
      defaultValue: true,
      label: 'Email subscribers when a new product is published',
    },
    {
      name: 'dailyLimit',
      type: 'number',
      defaultValue: DEFAULT_DAILY_LIMIT,
      min: 1,
      max: 2000,
      required: true,
      label: 'Newsletter emails per day',
      admin: {
        description:
          'A campaign that reaches the limit pauses and carries on the next day. Keep this under 450 on a free Gmail account.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'sentToday',
          type: 'number',
          defaultValue: 0,
          label: 'Sent today',
          admin: { readOnly: true, width: '50%' },
        },
        {
          name: 'sentTodayDate',
          type: 'text',
          label: 'Day (UTC)',
          admin: { readOnly: true, width: '50%' },
        },
      ],
    },
  ],
}
