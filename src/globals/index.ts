import type { GlobalConfig } from 'payload'

import { makeGlobalRevalidateHook } from '../collections/hooks/revalidate'
import { TAGS } from '../data/tags'
import { Footer } from './Footer'
import { Header } from './Header'
import { SEODefaults } from './SEODefaults'
import { SiteSettings } from './SiteSettings'
import { SocialLinks } from './SocialLinks'

/*
 * Every global is read through the cache under TAGS.globals (src/data/site.ts),
 * so a save has to clear that tag -- without it an edit to the Footer or the
 * Header saved fine and the site went on showing the old one until the server
 * restarted. Added here once rather than in each config, so a new global
 * cannot be left out.
 */
const withRevalidation = (global: GlobalConfig): GlobalConfig => ({
  ...global,
  hooks: {
    ...global.hooks,
    afterChange: [...(global.hooks?.afterChange ?? []), makeGlobalRevalidateHook([TAGS.globals])],
  },
})

export const globals = [Header, Footer, SiteSettings, SEODefaults, SocialLinks].map(
  withRevalidation,
)
