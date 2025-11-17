import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { Providers } from './providers'
import Navbar from '@/components/Navbar'
import GlobalLoadingOverlay from '@/components/GlobalLoadingOverlay'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ProAI Writer - Advanced AI Content Generation Platform',
  description: 'ProAI Writer crafts SEO-optimized, humanized, and conversion-focused content in seconds. Generate articles, reviews, and affiliate pages with pro-grade workflows.',
  keywords: 'ProAI Writer, AI content generation, SEO optimization, content writing, blog posts, product reviews',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Navbar />
        <GlobalLoadingOverlay />
          <Toaster position="top-right" />
          {children}
        </Providers>
      </body>
    </html>
  )
}


