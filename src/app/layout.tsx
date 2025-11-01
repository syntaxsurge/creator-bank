import '@rainbow-me/rainbowkit/styles.css'

import { Inter } from 'next/font/google'

import type { Metadata } from 'next'
import NextTopLoader from 'nextjs-toploader'
import { Toaster } from 'sonner'

import './globals.css'

import { AppNavbar } from '@/components/layout/app-navbar'
import { AppProviders } from '@/providers/app-providers'

const inter = Inter({ subsets: ['latin'], preload: false })

export const metadata: Metadata = {
  title: 'CreatorBank',
  description:
    'Bitcoin-backed memberships, payments, and payouts powered by Mezo.'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <AppProviders>
          <NextTopLoader
            showSpinner={false}
            height={3}
            color='#4f46e5'
            crawl={false}
          />
          <div className='flex min-h-screen flex-col'>
            <AppNavbar />
            <main className='flex-1'>{children}</main>
          </div>
          <Toaster />
        </AppProviders>
      </body>
    </html>
  )
}
