import React from 'react'
import type { Metadata } from 'next'
import { Inter, Roboto } from 'next/font/google'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SectionSnapController } from '@/components/layout/SectionSnapController'
import { SmoothScroll } from '@/components/layout/SmoothScroll'
import { getSiteFooter, getSiteHeader, getSiteMetadata } from '@/data/site'

import './styles.css'

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
      <body className={`${bodyFont.variable} ${titleFont.variable}`}>
        <SmoothScroll />
        <SectionSnapController />
        <div className="site-shell">
          <SiteHeader header={header} />
          <main>{children}</main>
          <SiteFooter footer={footer} />
        </div>
      </body>
    </html>
  )
}
