import React from 'react'
import type { Metadata } from 'next'
import { Inter, Roboto } from 'next/font/google'

import { PageScrollbar } from '@/components/layout/PageScrollbar'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SectionSnapController } from '@/components/layout/SectionSnapController'
import { SmoothScroll } from '@/components/layout/SmoothScroll'
import { getSiteFooter, getSiteHeader, getSiteMetadata } from '@/data/site'

import './styles.css'
import './product-detail.css'
import './products-catalog.css'
import './contact.css'
import './industry.css'
import './capabilities.css'
import './resources.css'

const bodyFont = Roboto({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-body',
})

const titleFont = Inter({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-title',
})

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getSiteMetadata()

  return {
    description: metadata.description,
    icons: {
      apple: [{ url: metadata.faviconHref }],
      icon: [{ url: metadata.faviconHref }],
      shortcut: [{ url: metadata.faviconHref }],
    },
    title: metadata.title,
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const [footer, header] = await Promise.all([getSiteFooter(), getSiteHeader()])

  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${titleFont.variable}`} suppressHydrationWarning>
        {/*
         * Entrance motion renders its first frame server-side, so with
         * scripting off there would be nothing to play it back and the page
         * would stay on that frame. This puts every revealed element back to
         * its resting state in that one case, and costs nothing otherwise.
         */}
        <noscript>
          <style>{
            '[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}'
          }</style>
        </noscript>
        <SmoothScroll />
        <SectionSnapController />
        <PageScrollbar />
        <div className="site-shell">
          <SiteHeader header={header} />
          <main>{children}</main>
          <SiteFooter footer={footer} />
        </div>
      </body>
    </html>
  )
}
