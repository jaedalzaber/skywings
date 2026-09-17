import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'
import { NEWSLETTER_TOPICS } from '../lib/newsletter/config'
import { afterCampaignChange, beforeCampaignChange } from '../lib/newsletter/campaignHooks'

/**
 * Emails to the newsletter list. Publishing a new article or product creates
 * one of these on its own (see Newsletter Settings); company news is written
 * here by hand.
 *
 * To send: fill it in, optionally send yourself a test, then set Status to
 * "Send now" and save. It goes to every Active subscriber who ticked its
 * topic, in batches, pausing if the daily limit is reached and carrying on
 * the next day. Progress shows in the sidebar.
 */
export const NewsletterCampaigns: CollectionConfig = {
  slug: 'newsletter-campaigns',
  labels: {
    singular: 'Newsletter Email',
    plural: 'Newsletter Emails',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['subject', 'topic', 'status', 'sentCount', 'updatedAt'],
    description:
      'Set Status to "Send now" and save to email every Active subscriber who follows the topic.',
    group: 'Newsletter',
    useAsTitle: 'subject',
  },
  hooks: {
    afterChange: [afterCampaignChange],
    beforeChange: [beforeCampaignChange],
  },
  fields: [
    {
      name: 'subject',
      type: 'text',
      maxLength: 150,
      required: true,
    },
    {
      name: 'preheader',
      type: 'text',
      maxLength: 200,
      admin: {
        description: 'The grey preview line shown after the subject in most inboxes.',
      },
    },
    {
      name: 'topic',
      type: 'select',
      defaultValue: 'news',
      options: NEWSLETTER_TOPICS.map(({ label, value }) => ({ label, value })),
      required: true,
      admin: {
        description: 'Only subscribers who follow this topic receive it.',
        position: 'sidebar',
      },
    },
    {
      name: 'heading',
      type: 'text',
      admin: { description: 'Large title inside the email. Defaults to the subject.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Plain text. Leave an empty line between paragraphs.',
        rows: 8,
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ctaLabel',
          type: 'text',
          label: 'Button label',
          admin: { width: '40%' },
        },
        {
          name: 'ctaUrl',
          type: 'text',
          label: 'Button link',
          admin: {
            description: 'A page on the site ("/products/…") or a full https:// address.',
            width: '60%',
          },
        },
      ],
    },
    {
      name: 'testRecipient',
      type: 'email',
      label: 'Send a test to',
      admin: {
        description: 'Enter an address and save to send one test copy. Change it to send another.',
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Send now', value: 'queued' },
        { label: 'Sending', value: 'sending' },
        { label: 'Paused (daily limit)', value: 'paused' },
        { label: 'Sent', value: 'sent' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      required: true,
      admin: {
        description:
          'Choose "Send now" and save to start. Choose "Cancelled" to stop one that is sending or paused.',
        position: 'sidebar',
      },
    },
    {
      name: 'source',
      type: 'relationship',
      relationTo: ['blog-posts', 'products'],
      admin: {
        description: 'The article or product this email announces.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      /** "blog-posts:12": one email per published item, however often it is republished. */
      name: 'sourceKey',
      type: 'text',
      index: true,
      admin: { hidden: true },
    },
    {
      type: 'collapsible',
      label: 'Delivery',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'sentCount', type: 'number', defaultValue: 0, label: 'Sent', admin: { readOnly: true } },
        { name: 'failedCount', type: 'number', defaultValue: 0, label: 'Failed', admin: { readOnly: true } },
        { name: 'queuedAt', type: 'date', admin: { readOnly: true } },
        { name: 'finishedAt', type: 'date', admin: { readOnly: true } },
        { name: 'lastError', type: 'textarea', admin: { readOnly: true } },
      ],
    },
    {
      /** Id of the last subscriber reached: sending resumes after it. */
      name: 'cursor',
      type: 'number',
      defaultValue: 0,
      admin: { hidden: true },
    },
    {
      /** Held while a batch is going out, so two senders never overlap. */
      name: 'lockedUntil',
      type: 'date',
      admin: { hidden: true },
    },
  ],
}
